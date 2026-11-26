/**
 * Origens permitidas para CORS (HTTP e WebSocket).
 *
 * Fonte única: lê CORS_ORIGINS (lista separada por vírgula) e aceita
 * CORS_ORIGIN (singular) como fallback, que era o nome usado pelo gateway.
 */
export function getAllowedOrigins(
  env: Record<string, string | undefined> = process.env,
): string[] {
  const raw = env.CORS_ORIGINS ?? env.CORS_ORIGIN ?? '';

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
