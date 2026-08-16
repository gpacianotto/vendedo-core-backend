import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { TenantContext } from './tenant-context';

/**
 * Fonte única do tenantId/userId/role de uma requisição autenticada.
 * O contexto é populado pelo JwtAuthGuard (módulo 02-identity-auth) logo após
 * validar o token — nenhum outro ponto do código deve aceitar tenantId vindo
 * de body/query/params para fins de autorização ou de filtro de dados.
 */
@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantContext>();

  run<T>(context: TenantContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  getContext(): TenantContext {
    const context = this.storage.getStore();
    if (!context) {
      throw new Error(
        'TenantContext não disponível. Esta chamada precisa ocorrer dentro de uma requisição autenticada, após o JwtAuthGuard popular o contexto.',
      );
    }
    return context;
  }

  tryGetContext(): TenantContext | undefined {
    return this.storage.getStore();
  }

  getTenantId(): string {
    return this.getContext().tenantId;
  }

  getUserId(): string {
    return this.getContext().userId;
  }

  getRole(): TenantContext['role'] {
    return this.getContext().role;
  }
}
