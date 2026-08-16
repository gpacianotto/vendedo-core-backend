import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthenticatedRequest } from './authenticated-request';
import { TenantContextService } from '../tenant-context/tenant-context.service';

/**
 * Popula o TenantContext (AsyncLocalStorage) a partir de `request.authContext`
 * (anexado pelo JwtAuthGuard). Isso precisa ser um Interceptor, não parte do
 * guard: `AsyncLocalStorage.run()` só propaga contexto para código disparado
 * de dentro do seu próprio callback, e um guard apenas retorna true/false —
 * ele não envolve a execução do handler. Interceptors, por outro lado, têm
 * `next.handle()`, que dispara pipes+handler no momento do `subscribe()` —
 * por isso o `run()` aqui embrulha exatamente essa chamada.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContextService: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authContext = request.authContext;

    // Sem authContext = rota pública, nada a popular. Usuário UNLINKED
    // (tenantId null) ainda populada o contexto — getUserId()/getRole()
    // continuam funcionando; só getTenantId() lança 403 nesse caso.
    if (!authContext) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      this.tenantContextService.run(authContext, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
