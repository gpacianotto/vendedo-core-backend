import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantContextInterceptor } from '../../common/auth/tenant-context.interceptor';
import { AuditModule } from '../audit/audit.module';
import { BillingModule } from '../billing/billing.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MeController } from './me.controller';
import { SessionsModule } from './sessions/sessions.module';

@Module({
  imports: [
    SessionsModule,
    UsersModule,
    TenantsModule,
    BillingModule,
    AuditModule,
  ],
  controllers: [AuthController, MeController],
  providers: [
    AuthService,
    // Ordem importa: JwtAuthGuard precisa rodar antes do RolesGuard (que lê
    // request.authContext) e antes do TenantContextInterceptor (que só roda
    // depois dos guards, mas depende do mesmo request.authContext).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AuthModule {}
