import { jwtDecode } from 'jwt-decode';

const toDate = (seconds) => (typeof seconds === 'number' ? new Date(seconds * 1000) : null);

/**
 * Decodifica un JWT localmente, sin verificar la firma (RF-7.1).
 * Devuelve `null` si el token no es un JWT decodificable (RF-7.4).
 * `remainingMs` es negativo si expiró y `null` si no tiene claim `exp`.
 */
export function inspectToken(token, now = Date.now()) {
  let header;
  let payload;
  try {
    header = jwtDecode(token, { header: true });
    payload = jwtDecode(token);
  } catch {
    return null;
  }

  const expiresAt = toDate(payload.exp);
  return {
    header,
    payload,
    issuedAt: toDate(payload.iat),
    expiresAt,
    remainingMs: expiresAt ? expiresAt.getTime() - now : null,
  };
}
