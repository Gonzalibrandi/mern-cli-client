import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectToken } from '../src/core/jwt.js';

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const makeToken = (payload) => `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.firma`;

const NOW = Date.UTC(2026, 10, 16, 12, 0, 0);
const nowSeconds = NOW / 1000;

test('decodifica header, payload y tiempo restante (CA-19)', () => {
  const info = inspectToken(makeToken({ sub: '42', iat: nowSeconds, exp: nowSeconds + 3600 }), NOW);
  assert.deepEqual(info.header, { alg: 'HS256', typ: 'JWT' });
  assert.equal(info.payload.sub, '42');
  assert.equal(info.issuedAt.getTime(), NOW);
  assert.equal(info.remainingMs, 3_600_000);
});

test('token expirado tiene tiempo restante negativo (CA-20)', () => {
  const info = inspectToken(makeToken({ exp: nowSeconds - 60 }), NOW);
  assert.equal(info.remainingMs, -60_000);
});

test('token sin exp', () => {
  const info = inspectToken(makeToken({ sub: '1' }), NOW);
  assert.equal(info.expiresAt, null);
  assert.equal(info.remainingMs, null);
});

test('token inválido devuelve null (RF-7.4)', () => {
  assert.equal(inspectToken('no-es-un-jwt'), null);
});
