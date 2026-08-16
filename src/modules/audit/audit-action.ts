/**
 * Ações mínimas exigidas por BE-AUD-001: login, registro, criação de tenant,
 * mudança de configuração de tenant e unlink (voluntário ou pelo OWNER).
 * Módulos futuros podem estender esta lista conforme novas ações críticas
 * surgirem — mantê-la como union type evita strings soltas nos services.
 */
export const AuditAction = {
  USER_REGISTERED: 'USER_REGISTERED',
  LOGIN: 'LOGIN',
  TENANT_CREATED: 'TENANT_CREATED',
  TENANT_CONFIG_UPDATED: 'TENANT_CONFIG_UPDATED',
  USER_UNLINKED: 'USER_UNLINKED',
  USER_TEAM_MEMBER_UPDATED: 'USER_TEAM_MEMBER_UPDATED',
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
