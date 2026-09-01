import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const runtime = readFileSync(
  new URL('../../app_integral/js/modules/invitados/runtime-loader.js', import.meta.url),
  'utf8'
);
const distribution = readFileSync(
  new URL('../../app_integral/js/modules/distribucion/index.js', import.meta.url),
  'utf8'
);

test('the distribution integration is re-enabled only with reload-loop containment in place', () => {
  assert.match(runtime, /const DISTRIBUTION_TABLE_INTEGRATION_ENABLED = true;/);
  assert.match(runtime, /if \(DISTRIBUTION_TABLE_INTEGRATION_ENABLED\)/);
  assert.match(distribution, /controller\.lastReloadSig === structureSig/);
  assert.match(distribution, /refreshLiveFrame\(controller, tableSig\(nextRecord\)\)/);
});

test('geometry-only fields cannot participate in the iframe reload signature', () => {
  const signatureBlock = distribution.match(/const tableSig[\s\S]*?\}\)\)\);/)?.[0] || '';
  assert.ok(signatureBlock, 'tableSig must exist');
  assert.doesNotMatch(signatureBlock, /sharedTableType|tabletopWidthM|tabletopHeightM|dimensionsCustom|dimensionShape|widthM|heightM|shape/);
});

test('the safe reactivation does not introduce Firebase or destructive remote writes', () => {
  for (const source of [runtime, distribution]) {
    assert.doesNotMatch(source, /\b(?:setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/);
    assert.doesNotMatch(source, /firebase(?:-firestore)?/i);
  }
});
