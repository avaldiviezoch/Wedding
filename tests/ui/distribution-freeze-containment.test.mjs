import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const runtime = readFileSync(
  new URL('../../app_integral/js/modules/invitados/runtime-loader.js', import.meta.url),
  'utf8'
);

test('the emergency containment keeps the new distribution integration disabled', () => {
  assert.match(runtime, /const DISTRIBUTION_TABLE_INTEGRATION_ENABLED = false;/);
  assert.match(runtime, /if \(DISTRIBUTION_TABLE_INTEGRATION_ENABLED\)/);
});

test('the containment itself does not introduce Firebase or destructive remote writes', () => {
  assert.doesNotMatch(runtime, /\b(?:setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/);
  assert.doesNotMatch(runtime, /firebase(?:-firestore)?/i);
});
