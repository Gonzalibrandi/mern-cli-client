import { editor, input, select } from '@inquirer/prompts';
import pc from 'picocolors';
import { normalizePath } from '../core/http.js';
import { executeAndRecord } from '../ui/execute.js';
import { selectTheme } from '../ui/theme.js';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
const METHODS_WITH_BODY = new Set(['POST', 'PUT']);

/** RF-4: elegir método, ruta y (para POST/PUT) un body JSON validado antes de enviar. */
export async function requestScreen(config) {
  const method = await select({
    message: 'Método HTTP',
    choices: METHODS.map((m) => ({ name: m, value: m })),
    theme: selectTheme,
  });

  const path = normalizePath(
    await input({
      message: 'Ruta relativa (ej. /productos):',
      validate: (value) => value.trim() !== '' || 'La ruta no puede estar vacía',
    }),
  );

  const body = METHODS_WITH_BODY.has(method) ? await askJsonBody() : undefined;

  if (!config.token) console.log(pc.yellow('⚠ Enviando sin token (no hay sesión activa).'));
  await executeAndRecord(config, { method, path, body });
}

async function askJsonBody() {
  const text = await editor({
    message: 'Body JSON (se abre tu editor: escribí, guardá y cerrá)',
    default: '{\n  \n}\n',
    postfix: '.json',
    validate: validateJsonBody,
  });
  return JSON.parse(text);
}

/** Valida con JSON.parse() antes de enviar (RF-4.3); si falla, el editor se vuelve a abrir. */
function validateJsonBody(text) {
  try {
    const value = JSON.parse(text);
    return (typeof value === 'object' && value !== null) || 'El body debe ser un objeto o arreglo JSON';
  } catch (err) {
    return `JSON inválido: ${err.message}`;
  }
}
