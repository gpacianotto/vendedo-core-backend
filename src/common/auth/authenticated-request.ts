import { Request } from 'express';
import { TenantContext } from '../tenant-context/tenant-context';

/**
 * Claims decodificadas do JWT, anexadas ao request pelo JwtAuthGuard.
 * `tenantId` pode ser null (usuário UNLINKED, ex.: antes de criar seu
 * próprio tenant — BE-TEN-001). O TenantContextInterceptor lê isto para
 * popular o TenantContext (ALS) com a mesma forma.
 */
export interface AuthenticatedRequest extends Request {
  authContext?: TenantContext;
}
