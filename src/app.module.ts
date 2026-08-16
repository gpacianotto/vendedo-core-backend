import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from './config/env.validation';
import { MongoModule } from './common/database/mongo/mongo.module';
import { PostgresModule } from './common/database/postgres/postgres.module';
import { GlobalExceptionFilter } from './common/errors/global-exception.filter';
import { LoggingModule } from './common/logging/logging.module';
import { TenantContextModule } from './common/tenant-context/tenant-context.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    LoggingModule,
    TenantContextModule,
    PostgresModule,
    MongoModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
