import ora from 'ora';
import pc from 'picocolors';
import { send, describeNetworkError } from '../core/http.js';
import { addToHistory } from '../core/history.js';
import { formatBody, formatStatus, statusColor } from './render.js';

/**
 * Envía la petición mostrando un spinner y luego imprime estado, tiempo y body (RF-5).
 * Devuelve la respuesta, o `null` si hubo un error de red (que ya se mostró).
 */
export async function execute(config, request) {
  const label = `${request.method} ${request.path}`;
  // discardStdin: false evita que ora interfiera con el stdin de los prompts siguientes.
  const spinner = ora({ text: label, discardStdin: false }).start();

  try {
    const response = await send(config, request);
    spinner.stopAndPersist({
      symbol: statusColor(response.status)('●'),
      text: `${label}  ${formatStatus(response.status, response.statusText)} ${pc.dim(`· ${response.durationMs} ms`)}`,
    });
    console.log(`\n${formatBody(response.data)}\n`);
    return response;
  } catch (err) {
    spinner.fail(`${label}  ${pc.red(describeNetworkError(err))}\n`);
    return null;
  }
}

/** Ejecuta la petición y la registra en el historial, con estado "ERR" si falló la red (RF-4.7, RF-6). */
export async function executeAndRecord(config, { method, path, body }) {
  const response = await execute(config, { method, path, body });
  await addToHistory({
    method,
    path,
    status: response?.status ?? 'ERR',
    date: new Date().toISOString(),
    durationMs: response?.durationMs,
    body,
  });
}
