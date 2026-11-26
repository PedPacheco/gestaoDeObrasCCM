import { Socket } from 'socket.io';

/** Lê o JWT do handshake: auth.token (preferido) ou header Authorization. */
export function extractTokenFromSocket(client: Socket): string | undefined {
  const raw =
    client.handshake?.auth?.token ?? client.handshake?.headers?.authorization;
  if (typeof raw !== 'string') return undefined;

  const token = raw.replace(/^Bearer\s+/i, '').trim();
  return token || undefined;
}

/** O socket mantém-se ligado depois de o JWT expirar, por isso verificamos o exp */
export function isPayloadExpired(
  payload: { exp?: number } | undefined,
): boolean {
  return typeof payload?.exp === 'number' && payload.exp * 1000 <= Date.now();
}
