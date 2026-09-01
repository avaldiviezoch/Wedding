import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const distribution = readFileSync(
  new URL('../../app_integral/js/modules/distribucion/index.js', import.meta.url),
  'utf8'
);
const runtime = readFileSync(
  new URL('../../app_integral/js/modules/invitados/runtime-loader.js', import.meta.url),
  'utf8'
);

test('the production runtime re-enables Distribución tables after the observer freeze is fixed', () => {
  assert.match(runtime, /const DISTRIBUTION_TABLE_INTEGRATION_ENABLED = true;/);
  assert.match(runtime, /if \(DISTRIBUTION_TABLE_INTEGRATION_ENABLED\)/);
  assert.match(runtime, /distribucion\/index\.js\?v=20260901-distribution-table-geometry2/);
  assert.match(runtime, /table-capacity-actions\.js\?v=20260901-table-capacity-actions1&fix=observer2/);
});

test('the distribution bridge still exposes its existing canonical save path', () => {
  assert.match(distribution, /readState:\s*read/);
  assert.match(distribution, /saveState:\s*save/);
  assert.match(distribution, /syncNow\(\)/);
});

test('the freeze fix does not introduce Firestore or destructive remote writes', () => {
  for (const source of [runtime, distribution]) {
    assert.doesNotMatch(source, /\b(?:setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/);
    assert.doesNotMatch(source, /firebase(?:-firestore)?/i);
  }
});
