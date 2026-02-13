/**
 * Formato español: decimales con coma (70,5).
 * Usar para mostrar peso (kg), cintura (cm), etc.
 */
export function formatDecimal(
  n: number,
  options?: { maxDecimals?: number; minDecimals?: number }
): string {
  const max = options?.maxDecimals ?? 2;
  const min = options?.minDecimals ?? 0;
  return n.toLocaleString("es-ES", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

/**
 * Parsea un valor introducido por el usuario: acepta coma o punto como decimal.
 * Devuelve null si está vacío o no es un número válido.
 */
export function parseDecimalInput(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const normalized = t.replace(",", ".");
  const num = Number(normalized);
  return Number.isNaN(num) ? null : num;
}
