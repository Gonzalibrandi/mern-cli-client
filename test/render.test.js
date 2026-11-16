import { test } from 'node:test';
import assert from 'node:assert/strict';
import pc from 'picocolors';
import { formatBody, formatDuration, isTableData, statusColor } from '../src/ui/render.js';

test('colores de estado (CA-15)', () => {
  assert.equal(statusColor(200), pc.green);
  assert.equal(statusColor(201), pc.green);
  assert.equal(statusColor(404), pc.yellow);
  assert.equal(statusColor(500), pc.red);
  assert.equal(statusColor('ERR'), pc.red);
  assert.equal(statusColor(302), pc.cyan);
});

test('solo los arreglos de objetos van a tabla (CA-16)', () => {
  assert.equal(isTableData([{ id: 1 }, { id: 2 }]), true);
  assert.equal(isTableData([]), false);
  assert.equal(isTableData([1, 2]), false);
  assert.equal(isTableData([{ id: 1 }, [1]]), false);
  assert.equal(isTableData({ id: 1 }), false);
});

test('la tabla tiene una columna por clave (CA-16)', () => {
  const output = formatBody([{ id: 1, nombre: 'A' }, { id: 2, precio: 10 }]);
  for (const column of ['id', 'nombre', 'precio', 'A']) assert.ok(output.includes(column), column);
});

test('body vacío y texto plano (RF-5.4)', () => {
  assert.match(formatBody(undefined), /sin contenido/);
  assert.equal(formatBody('hola'), 'hola');
});

test('formatDuration', () => {
  assert.equal(formatDuration(0), '0s');
  assert.equal(formatDuration(5_000), '5s');
  assert.equal(formatDuration(3_725_000), '1h 02m 05s');
  assert.equal(formatDuration(-90_000), '1m 30s');
  assert.equal(formatDuration(90_061_000), '1d 01h 01m 01s');
});
