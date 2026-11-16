import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { describeNetworkError, normalizePath, send } from '../src/core/http.js';

let server;
let baseUrl;
let lastRequest;

before(async () => {
  server = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      lastRequest = { method: req.method, url: req.url, headers: req.headers, body: raw };
      if (req.url === '/api/empty') return res.writeHead(204).end();
      if (req.url === '/api/text') return res.writeHead(200, { 'Content-Type': 'text/plain' }).end('hola');
      res.writeHead(201, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true }));
    });
  });
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}/api`;
});

after(() => server.close());

test('normalizePath antepone / y quita espacios (CA-12)', () => {
  assert.equal(normalizePath('productos'), '/productos');
  assert.equal(normalizePath('  /usuarios/1 '), '/usuarios/1');
});

test('send adjunta Bearer, body JSON y mide el tiempo (CA-08, CA-12)', async () => {
  const response = await send({ baseUrl, token: 'abc' }, { method: 'POST', path: '/productos', body: { nombre: 'x' } });

  assert.equal(lastRequest.method, 'POST');
  assert.equal(lastRequest.url, '/api/productos');
  assert.equal(lastRequest.headers.authorization, 'Bearer abc');
  assert.equal(lastRequest.headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(lastRequest.body), { nombre: 'x' });
  assert.equal(response.status, 201);
  assert.deepEqual(response.data, { ok: true });
  assert.equal(typeof response.durationMs, 'number');
});

test('send sin token ni body no manda esos headers (RF-4.4, RF-4.6)', async () => {
  await send({ baseUrl, token: null }, { method: 'GET', path: '/productos' });
  assert.equal(lastRequest.headers.authorization, undefined);
  assert.equal(lastRequest.headers['content-type'], undefined);
});

test('send devuelve undefined para body vacío y texto para no-JSON (RF-5.4)', async () => {
  const empty = await send({ baseUrl }, { method: 'DELETE', path: '/empty' });
  assert.equal(empty.status, 204);
  assert.equal(empty.data, undefined);

  const text = await send({ baseUrl }, { method: 'GET', path: '/text' });
  assert.equal(text.data, 'hola');
});

test('servidor caído produce un error de red legible (CA-18)', async () => {
  // Abre y cierra un servidor para obtener un puerto libre donde nadie escucha.
  const closed = createServer();
  await new Promise((resolve) => closed.listen(0, resolve));
  const { port } = closed.address();
  await new Promise((resolve) => closed.close(resolve));

  const err = await send({ baseUrl: `http://127.0.0.1:${port}` }, { method: 'GET', path: '/' }).catch((e) => e);
  assert.match(describeNetworkError(err), /ECONNREFUSED/);
});
