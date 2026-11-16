#!/usr/bin/env node
import { input, select } from '@inquirer/prompts';
import boxen from 'boxen';
import pc from 'picocolors';
import { DEFAULT_BASE_URL, isHttpUrl, loadConfig, normalizeBaseUrl, saveConfig } from './core/config.js';
import { authScreen } from './screens/auth.js';
import { historyScreen } from './screens/history.js';
import { requestScreen } from './screens/request.js';
import { tokenScreen } from './screens/token.js';
import { selectTheme } from './ui/theme.js';

// RF-2.1: opciones del menú principal, en el orden de la consigna.
const MENU = [
  { name: 'Iniciar sesión / Registrar usuario', value: authScreen },
  { name: 'Ejecutar petición personalizada (GET, POST, PUT, DELETE)', value: requestScreen },
  { name: 'Ver historial de peticiones recientes', value: historyScreen },
  { name: 'Ver estado del Token JWT actual (decodificado y tiempo restante)', value: tokenScreen },
  { name: 'Salir', value: null },
];

/** Inquirer lanza este error cuando el usuario presiona Ctrl+C. */
const isPromptCancel = (err) => err?.name === 'ExitPromptError';

const sessionBadge = ({ token }) => (token ? pc.green('● Autenticado') : pc.dim('○ Sin sesión'));

/** RF-1.3: pide la URL base y la guarda en .mern-cli.json. */
async function askBaseUrl(config) {
  const url = await input({
    message: 'URL base de la API:',
    default: DEFAULT_BASE_URL,
    validate: (value) => isHttpUrl(value.trim()) || 'Ingresá una URL válida que empiece con http:// o https://',
  });
  config.baseUrl = normalizeBaseUrl(url);
  await saveConfig(config);
}

async function main() {
  const config = await loadConfig();
  if (!config.baseUrl) await askBaseUrl(config);

  console.log(
    boxen(`${pc.bold('MERN-CLI-Client')}  ${pc.dim('Cliente REST en terminal')}\n\n${pc.dim('API:')} ${config.baseUrl}`, {
      padding: { top: 0, bottom: 0, left: 2, right: 2 },
      borderStyle: 'round',
      borderColor: 'cyan',
    }),
  );

  while (true) {
    const screen = await select({
      message: `Menú principal  ${sessionBadge(config)}`,
      choices: MENU,
      pageSize: MENU.length,
      theme: selectTheme,
    });
    if (!screen) return;

    // RF-2.4: Ctrl+C dentro de una pantalla vuelve al menú; en el menú, cierra la app.
    try {
      await screen(config);
    } catch (err) {
      if (!isPromptCancel(err)) throw err;
      console.log(pc.dim('Cancelado.\n'));
    }
  }
}

try {
  await main();
} catch (err) {
  if (!isPromptCancel(err)) throw err;
}
console.log(pc.dim('¡Hasta luego!'));
