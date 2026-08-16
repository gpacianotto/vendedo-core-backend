export const SUBSCRIPTION_STATUSES = [
  'ACTIVE',
  'TRIAL',
  'PAST_DUE',
  'CANCELED',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
