export const OPPORTUNITY_STATUSES = ['ABERTA', 'FECHADA'] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];
