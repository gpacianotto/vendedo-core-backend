import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { CorrelationIdService } from './correlation-id.service';
import { StructuredLoggerService } from './structured-logger.service';

@Global()
@Module({
  providers: [CorrelationIdService, StructuredLoggerService],
  exports: [CorrelationIdService, StructuredLoggerService],
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
