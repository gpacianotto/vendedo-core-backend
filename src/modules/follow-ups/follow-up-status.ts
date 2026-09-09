export const FOLLOW_UP_STATUSES = ['PENDING', 'COMPLETED', 'CANCELED'] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];
