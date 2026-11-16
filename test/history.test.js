import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HISTORY_LIMIT, prependEntry } from '../src/core/history.js';

test('conserva solo las últimas 10, la más reciente primero (CA-22)', () => {
  let history = [];
  for (let i = 1; i <= 12; i++) history = prependEntry(history, { path: `/r${i}` });

  assert.equal(history.length, HISTORY_LIMIT);
  assert.equal(history[0].path, '/r12');
  assert.equal(history.at(-1).path, '/r3');
});
