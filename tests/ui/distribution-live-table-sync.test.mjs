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

test('Mesas refreshes the live Distribución iframe only after an external structural table push', () => {
  assert.match(distribution, /const tableSig\s*=/);
  assert.match(distribution, /id:\s*element\.id/);
  assert.match(distribution, /label:\s*element\.label/);
  assert.match(distribution, /capacity:\s*element\.capacity/);
  assert.match(distribution, /sharedTableId:\s*element\.sharedTableId/);
  const signatureBlock = distribution.match(/const tableSig[\s\S]*?\}\)\)\);/)?.[0] || '';
  assert.doesNotMatch(signatureBlock, /sharedTableType|tabletopWidthM|tabletopHeightM|dimensionsCustom|dimensionShape|widthM|heightM|shape/);
  assert.match(distribution, /beforeTables\s*=\s*tableSig\(storage\.r\)/);
  assert.match(distribution, /tablesChanged\s*=\s*beforeTables\s*!==\s*tableSig\(nextRecord\)/);
  assert.match(distribution, /refreshLiveFrame\(controller, tableSig\(nextRecord\)\)/);
  assert.match(runtime, /const DISTRIBUTION_TABLE_INTEGRATION_ENABLED = true;/);
  assert.match(runtime, /distribucion\/index\.js\?v=20260901-distribution-table-geometry2/);
  assert.match(runtime, /distribucion\/table-geometry\.js\?v=20260901-table-geometry1/);
});

test('the live refresh is deduplicated across iframe reloads and respects autosave', () => {
  assert.match(distribution, /function plannerSaveState\(controller\)/);
  assert.match(distribution, /if \(state === 'saving'\) return deferPush\(controller\)/);
  assert.match(distribution, /if \(state === 'error'\)/);
  assert.match(distribution, /function refreshLiveFrame\(controller, structureSig\)/);
  assert.match(distribution, /if \(state === 'saving'\) return refreshLiveFrame\(controller, structureSig\)/);
  assert.match(distribution, /controller\.lastReloadSig === structureSig/);
  assert.match(distribution, /controller\.lastReloadSig = structureSig/);
  assert.match(distribution, /lastReloadSig:\s*''/);
  assert.match(distribution, /contentWindow\.location\.reload\(\)/);
  assert.match(distribution, /se evitó refrescar porque hay cambios sin guardar/);
});

test('the distribution bridge exposes its canonical save path to the geometry UI', () => {
  assert.match(distribution, /readState:\s*read/);
  assert.match(distribution, /saveState:\s*save/);
  assert.match(distribution, /syncNow\(\)/);
});

test('the table integration does not introduce Firestore or destructive remote writes', () => {
  assert.doesNotMatch(distribution, /\b(?:setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/);
  assert.doesNotMatch(distribution, /firebase(?:-firestore)?/i);
  assert.doesNotMatch(runtime, /\b(?:setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/);
  assert.doesNotMatch(runtime, /firebase(?:-firestore)?/i);
});
