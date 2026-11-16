import { select } from '@inquirer/prompts';
import boxen from 'boxen';
import pc from 'picocolors';
import { saveConfig } from '../core/config.js';
import { inspectToken } from '../core/jwt.js';
import { formatDuration, highlightJson } from '../ui/render.js';
import { selectTheme } from '../ui/theme.js';

const WARNING_THRESHOLD_MS = 5 * 60_000;

/** RF-7: muestra el JWT decodificado y su tiempo restante; permite cerrar sesión. */
export async function tokenScreen(config) {
  if (!config.token) {
    console.log(pc.dim('No hay sesión activa. Iniciá sesión desde el menú.\n'));
    return;
  }

  const info = inspectToken(config.token);
  console.log(info ? renderToken(info) : pc.red('✖ El token guardado no es un JWT válido.\n'));

  const action = await select({
    message: 'Token',
    choices: [
      { name: 'Volver', value: null },
      { name: 'Cerrar sesión (borrar token)', value: 'logout' },
    ],
    theme: selectTheme,
  });

  if (action === 'logout') {
    config.token = null;
    await saveConfig(config);
    console.log(pc.green('✔ Sesión cerrada.\n'));
  }
}

function renderToken({ header, payload, issuedAt, expiresAt, remainingMs }) {
  const lines = [
    pc.bold('Header'),
    highlightJson(header),
    '',
    pc.bold('Payload'),
    highlightJson(payload),
    '',
  ];
  if (issuedAt) lines.push(`${pc.bold('Emitido:')} ${issuedAt.toLocaleString()}`);
  if (expiresAt) lines.push(`${pc.bold('Expira:')}  ${expiresAt.toLocaleString()}`);
  lines.push(`${pc.bold('Estado:')}  ${describeExpiration(remainingMs)}`);

  return boxen(lines.join('\n'), {
    title: 'Token JWT',
    padding: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
  });
}

/** Verde si está vigente, amarillo si quedan ≤ 5 min, rojo si expiró (RF-7.2). */
function describeExpiration(remainingMs) {
  if (remainingMs === null) return pc.yellow('El token no tiene fecha de expiración');
  if (remainingMs <= 0) {
    return pc.red(`Expirado hace ${formatDuration(remainingMs)}. Volvé a iniciar sesión.`);
  }
  const color = remainingMs <= WARNING_THRESHOLD_MS ? pc.yellow : pc.green;
  return color(`Vigente · quedan ${formatDuration(remainingMs)}`);
}
