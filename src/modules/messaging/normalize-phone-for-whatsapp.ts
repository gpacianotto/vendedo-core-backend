import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';

const BRAZIL_COUNTRY_CODE = '55';
const MIN_DIGITS_WITH_COUNTRY_CODE = 12; // 55 + DDD (2) + número (8 ou 9)
const MAX_DIGITS_WITH_COUNTRY_CODE = 13;

/**
 * Normaliza um telefone para o formato exigido por wa.me: só dígitos, com
 * código do país. Assume Brasil (55) quando o número não já vem com um —
 * único mercado do MVP (specs em português, sem menção a outro país).
 */
export function normalizePhoneForWhatsApp(rawPhone: string): string {
  const digitsOnly = rawPhone.replace(/\D/g, '');
  const withCountryCode = digitsOnly.startsWith(BRAZIL_COUNTRY_CODE)
    ? digitsOnly
    : `${BRAZIL_COUNTRY_CODE}${digitsOnly}`;

  if (
    withCountryCode.length < MIN_DIGITS_WITH_COUNTRY_CODE ||
    withCountryCode.length > MAX_DIGITS_WITH_COUNTRY_CODE
  ) {
    throw new AppException({
      status: HttpStatus.BAD_REQUEST,
      code: 'INVALID_PHONE',
      message: 'Telefone inválido para geração de link do WhatsApp.',
    });
  }

  return withCountryCode;
}
