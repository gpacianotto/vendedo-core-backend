import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Model } from 'mongoose';
import { AppException } from '../../common/errors/app.exception';
import { generateReadableCode } from '../../common/utils/generate-readable-code';
import { isUniqueConstraintViolation } from '../../common/utils/is-unique-constraint-violation';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { AuditAction } from '../audit/audit-action';
import { AuditService } from '../audit/audit.service';
import { DEFAULT_PLAN } from '../billing/default-plan';
import { Subscription } from '../billing/entities/subscription.entity';
import { AuthTokensResponse } from '../auth/jwt-payload';
import { SessionsService } from '../auth/sessions/sessions.service';
import { User } from '../users/entities/user.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantConfigDto } from './dto/update-tenant-config.dto';
import { Tenant } from './entities/tenant.entity';
import { TenantConfig } from './schemas/tenant-config.schema';

const MAX_CODE_GENERATION_ATTEMPTS = 5;

export interface TenantSummary {
  id: string;
  tenantCode: string;
  status: Tenant['status'];
  displayName: string;
  branding: TenantConfig['branding'];
  features: TenantConfig['features'];
  joinPolicy: TenantConfig['joinPolicy'];
  billing: TenantConfig['billing'];
  contact: TenantConfig['contact'];
}

export interface CreateTenantResult {
  tenant: TenantSummary;
  // Sessão anterior (claims desatualizados: tenantId antigo/null, role
  // antiga) é revogada e um novo par de tokens já refletindo o novo tenant
  // é emitido aqui — sem isso, o próximo GET /tenant com o token antigo
  // falharia com "sem tenant vinculado".
  tokens: AuthTokensResponse;
}

@Injectable()
export class TenantsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectModel(TenantConfig.name)
    private readonly tenantConfigModel: Model<TenantConfig>,
    private readonly tenantContextService: TenantContextService,
    private readonly auditService: AuditService,
    private readonly sessionsService: SessionsService,
  ) {}

  async create(dto: CreateTenantDto): Promise<CreateTenantResult> {
    const userId = this.tenantContextService.getUserId();
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado.',
      });
    }
    if (user.tenantId) {
      throw new AppException({
        status: HttpStatus.CONFLICT,
        code: 'ALREADY_LINKED',
        message:
          'Você já está vinculado a um estabelecimento. Desvincule-se antes de criar um novo.',
      });
    }

    const tenant = await this.createTenantWithRetry();

    await this.dataSource.transaction(async (manager) => {
      await manager.insert(Subscription, {
        tenantId: tenant.id,
        plan: DEFAULT_PLAN.plan,
        status: 'ACTIVE',
        maxOwners: DEFAULT_PLAN.maxOwners,
        maxSellers: DEFAULT_PLAN.maxSellers,
      });
      await manager.update(
        User,
        { id: user.id },
        { tenantId: tenant.id, role: 'OWNER', status: 'ACTIVE' },
      );
    });

    const config = await this.tenantConfigModel.create({
      tenantId: tenant.id,
      tenantCode: tenant.tenantCode,
      displayName: dto.displayName,
      status: 'ACTIVE',
    });

    await this.auditService.record({
      action: AuditAction.TENANT_CREATED,
      entity: 'tenant',
      entityId: tenant.id,
      tenantId: tenant.id,
      userId: user.id,
    });

    // O usuário passou de SELLER/UNLINKED para OWNER de um tenant novo — a
    // sessão em uso carrega claims desatualizados. Revoga todas as sessões
    // ativas dele e emite um par de tokens novo já com tenantId/role corretos.
    await this.sessionsService.revokeAllForUser(user.id);
    const tokens = await this.sessionsService.issueTokens({
      id: user.id,
      tenantId: tenant.id,
      role: 'OWNER',
    });

    return { tenant: this.toSummary(tenant, config), tokens };
  }

  async getCurrent(): Promise<TenantSummary> {
    const tenantId = this.tenantContextService.getTenantId();
    const { tenant, config } = await this.loadTenantAndConfig(tenantId);
    return this.toSummary(tenant, config);
  }

  async updateConfig(dto: UpdateTenantConfigDto): Promise<TenantSummary> {
    const tenantId = this.tenantContextService.getTenantId();
    const { tenant } = await this.loadTenantAndConfig(tenantId);

    const update: Record<string, unknown> = {};
    if (dto.displayName !== undefined) update.displayName = dto.displayName;
    if (dto.branding) {
      for (const [key, value] of Object.entries(dto.branding)) {
        if (value !== undefined) update[`branding.${key}`] = value;
      }
    }
    if (dto.joinPolicy) {
      for (const [key, value] of Object.entries(dto.joinPolicy)) {
        if (value !== undefined) update[`joinPolicy.${key}`] = value;
      }
    }
    if (dto.features) {
      for (const [key, value] of Object.entries(dto.features)) {
        if (value !== undefined) update[`features.${key}`] = value;
      }
    }

    const config = await this.tenantConfigModel.findOneAndUpdate(
      { tenantId },
      { $set: update },
      { new: true },
    );
    if (!config) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'TENANT_CONFIG_NOT_FOUND',
        message: 'Configuração do tenant não encontrada.',
      });
    }

    await this.auditService.record({
      action: AuditAction.TENANT_CONFIG_UPDATED,
      entity: 'tenant',
      entityId: tenantId,
      tenantId,
      userId: this.tenantContextService.getUserId(),
      metadata: { fields: Object.keys(update) },
    });

    return this.toSummary(tenant, config);
  }

  async unlinkSelf(): Promise<void> {
    const userId = this.tenantContextService.getUserId();
    const tenantId = this.tenantContextService.getTenantId();

    await this.unlinkUserById(userId, tenantId, {
      voluntary: true,
      unlinkedBy: userId,
    });
  }

  async unlinkUser(targetUserId: string): Promise<void> {
    const ownerTenantId = this.tenantContextService.getTenantId();
    const ownerId = this.tenantContextService.getUserId();

    const target = await this.usersRepository.findOne({
      where: { id: targetUserId, tenantId: ownerTenantId },
    });
    if (!target) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado neste estabelecimento.',
      });
    }

    await this.unlinkUserById(target.id, ownerTenantId, {
      voluntary: false,
      unlinkedBy: ownerId,
    });
  }

  private async unlinkUserById(
    userId: string,
    tenantId: string,
    metadata: { voluntary: boolean; unlinkedBy: string },
  ): Promise<void> {
    await this.usersRepository.update(
      { id: userId },
      { tenantId: null, status: 'UNLINKED' },
    );

    // Revoga imediatamente qualquer sessão ativa — sem isso, um access token
    // emitido antes do unlink continuaria válido (com o tenantId antigo) até
    // expirar, o que violaria BE-TEN-004.
    await this.sessionsService.revokeAllForUser(userId);

    await this.auditService.record({
      action: AuditAction.USER_UNLINKED,
      entity: 'user',
      entityId: userId,
      tenantId,
      userId: metadata.unlinkedBy,
      metadata,
    });
  }

  async isSelfRegistrationAllowed(tenantId: string): Promise<boolean> {
    const config = await this.tenantConfigModel.findOne({ tenantId }).lean();
    return config?.joinPolicy?.allowSelfRegistration ?? true;
  }

  private async loadTenantAndConfig(
    tenantId: string,
  ): Promise<{ tenant: Tenant; config: TenantConfig }> {
    const tenantRepository = this.dataSource.getRepository(Tenant);
    const tenant = await tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'TENANT_NOT_FOUND',
        message: 'Estabelecimento não encontrado.',
      });
    }

    const config = await this.tenantConfigModel.findOne({ tenantId });
    if (!config) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'TENANT_CONFIG_NOT_FOUND',
        message: 'Configuração do tenant não encontrada.',
      });
    }

    return { tenant, config };
  }

  private async createTenantWithRetry(): Promise<Tenant> {
    const tenantRepository = this.dataSource.getRepository(Tenant);

    for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
      const tenant = tenantRepository.create({
        tenantCode: generateReadableCode(),
        status: 'ACTIVE',
      });
      try {
        return await tenantRepository.save(tenant);
      } catch (error) {
        if (
          !isUniqueConstraintViolation(error) ||
          attempt === MAX_CODE_GENERATION_ATTEMPTS - 1
        ) {
          throw error;
        }
      }
    }
    throw new Error('Não foi possível gerar um tenantCode único.');
  }

  private toSummary(tenant: Tenant, config: TenantConfig): TenantSummary {
    return {
      id: tenant.id,
      tenantCode: tenant.tenantCode,
      status: tenant.status,
      displayName: config.displayName,
      branding: config.branding,
      features: config.features,
      joinPolicy: config.joinPolicy,
      billing: config.billing,
      contact: config.contact,
    };
  }
}
