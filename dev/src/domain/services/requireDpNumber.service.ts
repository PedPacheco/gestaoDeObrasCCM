/** Documento esperado no campo numDp consoante o tipo de serviço. */
export type DocumentRule = 'DP' | 'BRA' | 'DP_OR_BRA';

/** Tipos de serviço que exigem DP e/ou BRA. */
const SERVICE_TYPES_REQUIRING_DOCUMENT = [
  'dp',
  'lv',
  'regularização',
  'desativação rd',
  'lv + obra livre',
  'dp + lv',
];

/** Normaliza o tipo de serviço (minúsculas, sem espaços extra). */
export function normalizeServiceType(serviceType?: string): string | null {
  const type = serviceType?.trim().toLowerCase().replace(/\s+/g, ' ');
  return type || null;
}

/**
 * - contém "dp" e "lv" → DP ou BRA
 * - contém "lv"        → BRA
 * - restantes da lista → DP
 * - fora da lista      → null (nada é obrigatório)
 */
export function getDocumentRule(serviceType?: string): DocumentRule | null {
  const type = normalizeServiceType(serviceType);
  if (!type || !SERVICE_TYPES_REQUIRING_DOCUMENT.includes(type)) return null;

  const hasDp = type.includes('dp');
  const hasLv = type.includes('lv');

  if (hasDp && hasLv) return 'DP_OR_BRA';
  if (hasLv) return 'BRA';
  if (hasDp) return 'DP';

  return null;
}

/** Indica se o número (DP/BRA) é obrigatório e está em falta. */
export function isDocumentMissing(
  numDp?: string,
  serviceType?: string,
): boolean {
  if (!getDocumentRule(serviceType)) return false;

  const value = numDp?.trim();
  return !value || value === '0';
}
