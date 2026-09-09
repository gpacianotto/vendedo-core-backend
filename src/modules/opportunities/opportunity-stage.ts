export const OPPORTUNITY_STAGES = [
  'NOVA',
  'CONTATO',
  'ORCAMENTO_ENVIADO',
  'NEGOCIACAO',
  'GANHA',
  'PERDIDA',
] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

const CLOSED_STAGES: readonly OpportunityStage[] = ['GANHA', 'PERDIDA'];

export function isClosedStage(stage: OpportunityStage): boolean {
  return CLOSED_STAGES.includes(stage);
}
