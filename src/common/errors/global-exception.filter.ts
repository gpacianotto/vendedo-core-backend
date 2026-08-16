import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { CorrelationIdService } from '../logging/correlation-id.service';
import { StructuredLoggerService } from '../logging/structured-logger.service';
import { AppException } from './app.exception';

interface ErrorEnvelope {
  code: string;
  message: string;
  details?: unknown;
  correlationId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly correlationIdService: CorrelationIdService,
    private readonly logger: StructuredLoggerService,
  ) {
    this.logger.setContext(GlobalExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const correlationId = this.correlationIdService.getId();

    const { status, envelope } = this.buildEnvelope(exception, correlationId);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        envelope.message,
        exception instanceof Error ? exception.stack : exception,
      );
    }

    response.status(status).json(envelope);
  }

  private buildEnvelope(
    exception: unknown,
    correlationId: string | undefined,
  ): { status: HttpStatus; envelope: ErrorEnvelope } {
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        envelope: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
          correlationId,
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const responseObject =
        typeof response === 'object' && response !== null
          ? (response as Record<string, unknown>)
          : undefined;

      // Convenção do Nest: `message` numa HttpException é sempre string ou string[].
      const rawMessage = (responseObject?.message ?? exception.message) as
        string | string[];
      const message = Array.isArray(rawMessage)
        ? rawMessage.join('; ')
        : rawMessage;

      return {
        status,
        envelope: {
          code: HttpStatus[status] ?? 'HTTP_ERROR',
          message,
          details: responseObject?.details,
          correlationId,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      envelope: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ocorreu um erro inesperado.',
        correlationId,
      },
    };
  }
}
