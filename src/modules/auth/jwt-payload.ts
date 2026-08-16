import { Role } from '../../common/tenant-context/tenant-context';

export interface JwtPayload {
  sub: string; // userId
  tenantId: string;
  role: Role;
  sid: string; // sessionId — permite invalidar tokens ao revogar a sessão (logout)
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
