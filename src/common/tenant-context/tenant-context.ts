export const ROLES = ['OWNER', 'SELLER', 'PLATFORM_ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export interface TenantContext {
  userId: string;
  // null quando o usuário está UNLINKED (sem estabelecimento) — getTenantId()
  // lança um erro claro nesse caso; getUserId()/getRole() continuam funcionando.
  tenantId: string | null;
  role: Role;
}
