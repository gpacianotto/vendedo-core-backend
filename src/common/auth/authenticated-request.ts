import { Request } from 'express';
import { TenantContext } from '../tenant-context/tenant-context';

/**
 * Claims cruas decodificadas do JWT, anexadas ao request pelo JwtAuthGuard.
 * O TenantContextInterceptor lê isto para popular o TenantContext (ALS) —
 * ver esse arquivo para o porquê da separação guard/interceptor.
 */
export interface AuthenticatedRequest extends Request {
  authContext?: TenantContext;
}
