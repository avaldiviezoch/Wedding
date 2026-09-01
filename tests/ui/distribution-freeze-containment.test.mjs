import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const runtime = readFileSync(
  new URL('../../app_integral/js/modules/invitados/runtime-loader.js', import.meta.url),
  'utf8'
);

test('the distribution table integration is re-enabled with the observer-safe capacity runtime', () => {
  assert.match(runtime, /const DISTRIBUTION_TABLE_INTEGRATION_ENABLED = true;/);
  assert.match(runtime, /if \(DISTRIBUTION_TABLE_INTEGRATION_ENABLED\)/);
  assert.match(runtime, /table-capacity-actions\.js\?v=20260901-table-capacity-actions1&fix=observer2/);
});

test('re-enabling the integration does not add Firebase or destructive remote writes to the loader', () => {
  assert.doesNotMatch(runtime, /\b(?:setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/);
  assert.doesNotMatch(runtime, /firebase(?:-firestore)?/i);
});
