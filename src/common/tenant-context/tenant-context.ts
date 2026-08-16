export type Role = 'OWNER' | 'SELLER' | 'PLATFORM_ADMIN';

export interface TenantContext {
  userId: string;
  tenantId: string;
  role: Role;
}
