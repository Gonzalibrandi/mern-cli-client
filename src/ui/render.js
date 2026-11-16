import pc from 'picocolors';
import Table from 'cli-table3';
import { highlight } from 'cli-highlight';

const MAX_CELL_LENGTH = 40;

/** Verde 2xx, amarillo 4xx, rojo 5xx y errores de red, cian el resto (RF-5.3). */
export function statusColor(status) {
  if (status === 'ERR' || status >= 500) return pc.red;
  if (status >= 400) return pc.yellow;
  if (status >= 200 && status < 300) return pc.green;
  return pc.cyan;
}

export const formatStatus = (status, statusText = '') =>
  statusColor(status)(pc.bold(`${status} ${statusText}`.trim()));

export const highlightJson = (value) => highlight(JSON.stringify(value, null, 2), { language: 'json' });

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Un arreglo no vacío donde todos los elementos son objetos se muestra como tabla (RF-5.4). */
export const isTableData = (data) => Array.isArray(data) && data.length > 0 && data.every(isPlainObject);

/** Body de la respuesta: tabla, JSON resaltado, texto plano o "(sin contenido)" (RF-5.4). */
export function formatBody(data) {
  if (data === undefined) return pc.dim('(sin contenido)');
  if (isTableData(data)) return formatTable(data);
  if (typeof data === 'string') return data;
  return highlightJson(data);
}

function formatTable(rows) {
  const columns = [...new Set(rows.flatMap(Object.keys))];
  const table = new Table({ head: columns, style: { head: ['cyan'] } });
  for (const row of rows) table.push(columns.map((column) => formatCell(row[column])));
  return table.toString();
}

function formatCell(value) {
  if (value === undefined) return '';
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > MAX_CELL_LENGTH ? `${text.slice(0, MAX_CELL_LENGTH - 1)}…` : text;
}

/** 3_725_000 → "1h 02m 05s" */
export function formatDuration(ms) {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const units = [
    [Math.floor(totalSeconds / 86_400), 'd'],
    [Math.floor((totalSeconds % 86_400) / 3_600), 'h'],
    [Math.floor((totalSeconds % 3_600) / 60), 'm'],
    [totalSeconds % 60, 's'],
  ];
  const firstNonZero = units.findIndex(([amount]) => amount > 0);
  return units
    .slice(firstNonZero === -1 ? units.length - 1 : firstNonZero)
    .map(([amount, unit], i) => `${i === 0 ? amount : String(amount).padStart(2, '0')}${unit}`)
    .join(' ');
}

/** Una línea del historial: `[fecha] MÉTODO /ruta → estado` (RF-6.4). */
export function formatHistoryEntry({ date, method, path, status }) {
  return `${pc.dim(new Date(date).toLocaleString())}  ${pc.bold(method.padEnd(6))} ${path} → ${formatStatus(status)}`;
}
