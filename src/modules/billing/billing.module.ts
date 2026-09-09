import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TenantConfig,
  TenantConfigSchema,
} from '../tenants/schemas/tenant-config.schema';
import { UsersModule } from '../users/users.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { Subscription } from './entities/subscription.entity';

// Registra o schema Mongoose diretamente (em vez de importar TenantsModule):
// TenantsModule já importa BillingModule, então importá-lo de volta criaria
// um ciclo. Registro duplicado do mesmo schema em módulos diferentes é
// suportado pelo Mongoose/Nest sem problema.
@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    MongooseModule.forFeature([
      { name: TenantConfig.name, schema: TenantConfigSchema },
    ]),
    UsersModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [TypeOrmModule],
})
export class BillingModule {}
