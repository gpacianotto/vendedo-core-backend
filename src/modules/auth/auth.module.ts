import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantContextInterceptor } from '../../common/auth/tenant-context.interceptor';
import { AuditModule } from '../audit/audit.module';
import { BillingModule } from '../billing/billing.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Session } from './entities/session.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MeController } from './me.controller';
import { TokenService } from './token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session]),
    UsersModule,
    TenantsModule,
    BillingModule,
    AuditModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN') as StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController, MeController],
  providers: [
    AuthService,
    TokenService,
    // Ordem importa: JwtAuthGuard precisa rodar antes do RolesGuard (que lê
    // request.authContext) e antes do TenantContextInterceptor (que só roda
    // depois dos guards, mas depende do mesmo request.authContext).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AuthModule {}
