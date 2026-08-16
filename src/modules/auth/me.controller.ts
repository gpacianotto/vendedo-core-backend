import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantsService } from '../tenants/tenants.service';
import { User } from '../users/entities/user.entity';

export interface MeResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: User['role'];
    status: User['status'];
    lastLoginAt: Date | null;
  };
  // Resumo mínimo (Postgres). Branding/config rica (Mongo tenant_configs)
  // é adicionada em 03-tenants.md.
  tenant: { id: string; tenantCode: string; status: Tenant['status'] } | null;
}

@Controller()
export class MeController {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantsService: TenantsService,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
  ) {}

  @Get('me')
  async getMe(): Promise<MeResponse> {
    const userId = this.tenantContextService.getUserId();
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const tenant = user.tenantId
      ? await this.tenantsRepository.findOne({ where: { id: user.tenantId } })
      : null;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
      tenant: tenant
        ? {
            id: tenant.id,
            tenantCode: tenant.tenantCode,
            status: tenant.status,
          }
        : null,
    };
  }

  @Post('me/unlink')
  @HttpCode(HttpStatus.NO_CONTENT)
  unlinkSelf(): Promise<void> {
    return this.tenantsService.unlinkSelf();
  }
}
