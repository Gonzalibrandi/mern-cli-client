import path from 'node:path';
import { readJson, writeJson } from './storage.js';

const CONFIG_FILE = path.resolve('.mern-cli.json');

export const DEFAULT_BASE_URL = 'http://localhost:4000/api';

export function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/** Quita espacios y la `/` final para que `baseUrl + ruta` no produzca `//` (RF-1.6). */
export const normalizeBaseUrl = (url) => url.trim().replace(/\/+$/, '');

/** Devuelve `{ baseUrl, token }`; cada campo es `null` si falta o es inválido. */
export async function loadConfig() {
  const { baseUrl, token } = (await readJson(CONFIG_FILE, {})) ?? {};
  return {
    baseUrl: isHttpUrl(baseUrl) ? normalizeBaseUrl(baseUrl) : null,
    token: typeof token === 'string' ? token : null,
  };
}

export const saveConfig = (config) => writeJson(CONFIG_FILE, config);
