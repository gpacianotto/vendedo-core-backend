interface PostgresDriverError {
  code?: string;
}

/**
 * Postgres error code 23505 = unique_violation. Usado como rede de
 * segurança para condições de corrida que passam pela checagem prévia de
 * unicidade mas colidem no momento do INSERT.
 */
export function isUniqueConstraintViolation(error: unknown): boolean {
  const driverError = (error as { driverError?: PostgresDriverError })
    ?.driverError;
  return (
    driverError?.code === '23505' ||
    (error as PostgresDriverError)?.code === '23505'
  );
}
