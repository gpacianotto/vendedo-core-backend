import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { BillingModule } from '../billing/billing.module';
import { SessionsModule } from '../auth/sessions/sessions.module';
import { UsersModule } from '../users/users.module';
import { Tenant } from './entities/tenant.entity';
import {
  TenantConfig,
  TenantConfigSchema,
} from './schemas/tenant-config.schema';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant]),
    MongooseModule.forFeature([
      { name: TenantConfig.name, schema: TenantConfigSchema },
    ]),
    UsersModule,
    BillingModule,
    AuditModule,
    SessionsModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TypeOrmModule, TenantsService],
})
export class TenantsModule {}
