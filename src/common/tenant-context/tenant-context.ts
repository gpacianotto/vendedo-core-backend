export const ROLES = ['OWNER', 'SELLER', 'PLATFORM_ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export interface TenantContext {
  userId: string;
  tenantId: string;
  role: Role;
}
