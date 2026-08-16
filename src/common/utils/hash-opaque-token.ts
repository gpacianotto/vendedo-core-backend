import { createHash } from 'node:crypto';

/**
 * Hash para tokens opacos de alta entropia (refresh token), não para senhas.
 * bcrypt é desnecessário/inadequado aqui (é lento de propósito para segredos
 * de baixa entropia digitados por humanos); SHA-256 é o padrão para tokens
 * aleatórios longos — mesmo critério já usado no ms-auth-saas para API keys.
 */
export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
