import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { CorrelationIdService } from './correlation-id.service';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'accessToken',
  'refreshToken',
  'refresh_token_hash',
  'authorization',
]);

/**
 * Logger estruturado (JSON) com correlationId anexado automaticamente.
 * Nunca logar senha, token/hash ou conteúdo de mensagens do WhatsApp (LGPD) —
 * `redact` é uma rede de segurança para objetos passados como contexto extra,
 * não substitui a disciplina de não logar esses campos em primeiro lugar.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLoggerService extends ConsoleLogger {
  constructor(private readonly correlationIdService: CorrelationIdService) {
    super();
  }

  private write(
    level: string,
    message: unknown,
    extra?: Record<string, unknown>,
  ): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      correlationId: this.correlationIdService.getId(),
      message,
      ...(extra ? { extra: redact(extra) } : {}),
    };
    process.stdout.write(`${JSON.stringify(entry)}\n`);
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('log', message, extraFrom(optionalParams));
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, extraFrom(optionalParams));
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', message, extraFrom(optionalParams));
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', message, extraFrom(optionalParams));
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('verbose', message, extraFrom(optionalParams));
  }
}

function extraFrom(
  optionalParams: unknown[],
): Record<string, unknown> | undefined {
  if (optionalParams.length === 0) {
    return undefined;
  }
  return { params: optionalParams };
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SENSITIVE_KEYS.has(key) ? '[REDACTED]' : redact(val),
      ]),
    );
  }
  return value;
}
