import ms, { StringValue } from 'ms';

/** Converte strings de duração ('15m', '30d', ...) em milissegundos. */
export function parseDurationMs(value: string): number {
  return ms(value as StringValue);
}
