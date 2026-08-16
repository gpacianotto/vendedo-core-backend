export const TENANT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];
