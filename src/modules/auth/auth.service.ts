import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { AppException } from '../../common/errors/app.exception';
import { normalizeEmail } from '../../common/utils/normalize-email';
import { isUniqueConstraintViolation } from '../../common/utils/is-unique-constraint-violation';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-action';
import { Subscription } from '../billing/entities/subscription.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantsService } from '../tenants/tenants.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthTokensResponse } from './jwt-payload';
import { SessionsService } from './sessions/sessions.service';
import { TokenService } from './token.service';

const BCRYPT_COST = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly sessionsService: SessionsService,
    private readonly auditService: AuditService,
    private readonly tenantsService: TenantsService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokensResponse> {
    return this.dataSource.transaction(async (manager) => {
      const email = normalizeEmail(dto.email);

      const existingUser = await manager.findOne(User, { where: { email } });
      if (existingUser) {
        throw new AppException({
          status: HttpStatus.CONFLICT,
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Este e-mail já está cadastrado.',
        });
      }

      const tenant = await manager.findOne(Tenant, {
        where: { tenantCode: dto.tenantCode },
      });
      if (!tenant) {
        throw new AppException({
          status: HttpStatus.NOT_FOUND,
          code: 'TENANT_NOT_FOUND',
          message:
            'Estabelecimento não encontrado. Verifique o código informado.',
        });
      }
      if (tenant.status !== 'ACTIVE') {
        throw new AppException({
          status: HttpStatus.FORBIDDEN,
          code: 'TENANT_INACTIVE',
          message:
            'Este estabelecimento não está aceitando novos vendedores no momento.',
        });
      }

      const allowSelfRegistration =
        await this.tenantsService.isSelfRegistrationAllowed(tenant.id);
      if (!allowSelfRegistration) {
        throw new AppException({
          status: HttpStatus.FORBIDDEN,
          code: 'TENANT_SELF_REGISTRATION_DISABLED',
          message:
            'Este estabelecimento não aceita autocadastro. Peça um convite ao responsável.',
        });
      }

      // Lock pessimista na subscription: serializa registros concorrentes no
      // mesmo tenant para a contagem de assentos abaixo ser atômica (BE-BILL-001).
      const subscription = await manager.findOne(Subscription, {
        where: { tenantId: tenant.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (subscription) {
        const activeSellerCount = await manager.count(User, {
          where: { tenantId: tenant.id, role: 'SELLER', status: 'ACTIVE' },
        });
        if (activeSellerCount >= subscription.maxSellers) {
          throw new AppException({
            status: HttpStatus.CONFLICT,
            code: 'SEAT_LIMIT_REACHED',
            message:
              'Este estabelecimento atingiu o limite de vendedores do plano contratado.',
          });
        }
      }

      const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

      const user = manager.create(User, {
        name: dto.name,
        email,
        passwordHash,
        tenantId: tenant.id,
        role: 'SELLER',
        status: 'ACTIVE',
      });

      try {
        await manager.save(user);
      } catch (error) {
        if (isUniqueConstraintViolation(error)) {
          throw new AppException({
            status: HttpStatus.CONFLICT,
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'Este e-mail já está cadastrado.',
          });
        }
        throw error;
      }

      await this.auditService.record(
        {
          action: AuditAction.USER_REGISTERED,
          entity: 'user',
          entityId: user.id,
          tenantId: tenant.id,
          userId: user.id,
        },
        manager,
      );

      return this.sessionsService.issueTokens(user, manager);
    });
  }

  async login(dto: LoginDto): Promise<AuthTokensResponse> {
    const email = normalizeEmail(dto.email);
    const user = await this.usersRepository.findOne({ where: { email } });

    const invalidCredentials = () =>
      new AppException({
        status: HttpStatus.UNAUTHORIZED,
        code: 'INVALID_CREDENTIALS',
        message: 'E-mail ou senha inválidos.',
      });

    if (!user) {
      throw invalidCredentials();
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw invalidCredentials();
    }

    // UNLINKED pode logar normalmente (token com tenantId null) — é assim
    // que o vendedor independente se autentica para chamar POST /tenant e
    // criar seu próprio estabelecimento (BE-TEN-001). GET /me já retorna
    // tenant: null nesse caso, para o frontend mostrar a tela adequada.
    if (user.status === 'INACTIVE') {
      throw new AppException({
        status: HttpStatus.FORBIDDEN,
        code: 'ACCOUNT_INACTIVE',
        message:
          'Sua conta está inativa. Entre em contato com o estabelecimento.',
      });
    }

    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    await this.auditService.record({
      action: AuditAction.LOGIN,
      entity: 'user',
      entityId: user.id,
      tenantId: user.tenantId,
      userId: user.id,
    });

    return this.sessionsService.issueTokens(user);
  }

  async refresh(dto: RefreshDto): Promise<AuthTokensResponse> {
    const tokenHash = this.tokenService.hashRefreshToken(dto.refreshToken);
    const session =
      await this.sessionsService.findByRefreshTokenHash(tokenHash);

    const invalidRefreshToken = () =>
      new AppException({
        status: HttpStatus.UNAUTHORIZED,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Sessão inválida ou expirada. Faça login novamente.',
      });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw invalidRefreshToken();
    }

    const user = await this.usersRepository.findOne({
      where: { id: session.userId },
    });
    // UNLINKED pode renovar sessão (mesmo raciocínio do login); só INACTIVE bloqueia.
    if (!user || user.status === 'INACTIVE') {
      throw invalidRefreshToken();
    }

    // Rotação: a sessão usada é revogada e uma nova é emitida — um refresh
    // token só pode ser usado uma vez.
    await this.sessionsService.revoke(session);

    return this.sessionsService.issueTokens(user);
  }

  async logout(userId: string, dto: RefreshDto): Promise<void> {
    const tokenHash = this.tokenService.hashRefreshToken(dto.refreshToken);
    const session =
      await this.sessionsService.findByRefreshTokenHash(tokenHash);

    // Idempotente: sessão já revogada/inexistente/de outro usuário não é erro.
    if (session && session.userId === userId && !session.revokedAt) {
      await this.sessionsService.revoke(session);
    }
  }
}
