export const CUSTOMER_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
