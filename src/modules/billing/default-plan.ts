/**
 * Plano padrão atribuído à criação de um tenant. Valores provisórios —
 * o modelo de precificação/planos "mais detalhado e robusto" fica para
 * 10-billing.md; por ora, só o suficiente para o tenant nascer utilizável.
 */
export const DEFAULT_PLAN = {
  plan: 'FREE',
  maxOwners: 1,
  maxSellers: 3,
} as const;
