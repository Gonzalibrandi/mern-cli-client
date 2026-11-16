import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';

/**
 * Lee un archivo JSON. Si no existe devuelve `fallback`; si está corrupto
 * avisa y también devuelve `fallback` (SPEC RF-1.5, RF-6.7).
 */
export async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(pc.yellow(`⚠ ${path.basename(file)} no es un JSON válido y se ignora.`));
    }
    return fallback;
  }
}

export async function writeJson(file, data) {
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}
