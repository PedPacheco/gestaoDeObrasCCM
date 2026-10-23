/**
 * Tolerância numérica para comparações de percentuais/quantidades.
 * Os percentuais são arredondados em 4 casas, então comparar com `===`
 * contra 100 (ou entre somas de float) pode falhar por erro de arredondamento.
 */
export const PROGRESS_EPSILON = 0.0001;

/** a >= b, tolerando erro de ponto flutuante. */
export function isAtLeast(a: number, b: number): boolean {
  return a >= b - PROGRESS_EPSILON;
}

/** Percentual (value/total*100) com 4 casas; 0 quando total <= 0. */
export function toPercentage(value: number, total: number): number {
  if (total <= 0) return 0;

  return Number(((value / total) * 100).toFixed(4));
}
