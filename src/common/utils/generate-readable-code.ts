import { randomInt } from 'node:crypto';

// Sem 0/O/1/I para evitar confusão ao ser digitado/lido em voz alta pelo vendedor.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReadableCode(length = 8): string {
  return Array.from(
    { length },
    () => ALPHABET[randomInt(ALPHABET.length)],
  ).join('');
}
