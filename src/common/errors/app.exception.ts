import { HttpException, HttpStatus } from '@nestjs/common';

export interface AppExceptionParams {
  status: HttpStatus;
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Exceção base do domínio. Services devem lançar `AppException` (ou uma
 * subclasse) em vez de `HttpException` genérica, para que o envelope de
 * erro sempre tenha um `code` estável e legível por máquina, independente
 * da mensagem (que pode mudar).
 */
export class AppException extends HttpException {
  readonly code: string;
  readonly details?: unknown;

  constructor({ status, code, message, details }: AppExceptionParams) {
    super({ code, message, details }, status);
    this.code = code;
    this.details = details;
  }
}
