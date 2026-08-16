export const USER_STATUSES = ['ACTIVE', 'UNLINKED', 'INACTIVE'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
