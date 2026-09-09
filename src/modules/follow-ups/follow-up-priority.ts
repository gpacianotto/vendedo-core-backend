export const FOLLOW_UP_PRIORITIES = ['LOW', 'NORMAL', 'HIGH'] as const;
export type FollowUpPriority = (typeof FOLLOW_UP_PRIORITIES)[number];
