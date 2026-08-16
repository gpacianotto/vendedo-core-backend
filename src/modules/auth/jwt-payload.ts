import { Role } from '../../common/tenant-context/tenant-context';

export interface JwtPayload {
  sub: string; // userId
  // null quando o usuário está UNLINKED — precisa continuar podendo
  // autenticar para chamar POST /tenant (vendedor independente, BE-TEN-001).
  tenantId: string | null;
  role: Role;
  sid: string; // sessionId — permite invalidar tokens ao revogar a sessão (logout)
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
