export const TIMEOUT_MS = 15_000;

export const isSuccess = (status) => status >= 200 && status < 300;

/** Antepone `/` si falta (RF-4.2). */
export function normalizePath(path) {
  const trimmed = path.trim();
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/**
 * Envía una petición a la API adjuntando el JWT si existe (RF-3.6, RF-4.5)
 * y mide el tiempo hasta recibir el body completo (RF-5.2).
 *
 * `data` es el body parseado como JSON, el texto crudo si no es JSON,
 * o `undefined` si la respuesta vino vacía.
 * Lanza si hay un error de red o timeout (ver `describeNetworkError`).
 */
export async function send({ baseUrl, token }, { method, path, body }) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const start = performance.now();
  const res = await fetch(baseUrl + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();

  return {
    status: res.status,
    statusText: res.statusText,
    data: parseBody(text),
    durationMs: Math.round(performance.now() - start),
  };
}

function parseBody(text) {
  if (text === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Traduce un error de `fetch` a un mensaje legible (RF-5.5). */
export function describeNetworkError(err) {
  if (err.name === 'TimeoutError') return `Tiempo de espera agotado (${TIMEOUT_MS / 1000} s)`;
  const code = err.cause?.code;
  if (code) return `${code}: no se pudo conectar con el servidor`;
  return err.cause?.message ?? err.message;
}
