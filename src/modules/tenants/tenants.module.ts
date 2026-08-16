import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';

/**
 * Módulo mínimo (bootstrap): só registra a entidade `Tenant` para outros
 * módulos (auth) poderem resolver tenantCode. CRUD/branding/unlink completo
 * chega em 03-tenants.md.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  exports: [TypeOrmModule],
})
export class TenantsModule {}
