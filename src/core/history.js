import path from 'node:path';
import { readJson, writeJson } from './storage.js';

const HISTORY_FILE = path.resolve('.mern-cli-history.json');

export const HISTORY_LIMIT = 10;

/** Historial de más reciente a más antigua; vacío si el archivo falta o está corrupto (RF-6.7). */
export async function loadHistory() {
  const history = await readJson(HISTORY_FILE, []);
  return Array.isArray(history) ? history : [];
}

/** Agrega `entry` al principio y conserva solo las últimas `HISTORY_LIMIT` (RF-6.3). */
export const prependEntry = (history, entry) => [entry, ...history].slice(0, HISTORY_LIMIT);

export async function addToHistory(entry) {
  await writeJson(HISTORY_FILE, prependEntry(await loadHistory(), entry));
}
