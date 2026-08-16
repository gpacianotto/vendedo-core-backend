import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';

/**
 * Módulo mínimo (bootstrap): só registra `Subscription` para o registro
 * (02-identity-auth.md) e a criação de tenant (03-tenants.md) poderem checar
 * limite de assentos. Consulta de billing/preço completa em 10-billing.md.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Subscription])],
  exports: [TypeOrmModule],
})
export class BillingModule {}
