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

test('Mesas refreshes the live Distribución iframe after an external table-structure push', () => {
  assert.match(distribution, /const tableSig\s*=/);
  assert.match(distribution, /beforeTables\s*=\s*tableSig\(storage\.r\)/);
  assert.match(distribution, /tablesChanged\s*=\s*beforeTables\s*!==\s*tableSig\(nextRecord\)/);
  assert.match(distribution, /if \(written && tablesChanged\) refreshLiveFrame\(controller\)/);
  assert.match(distribution, /contentWindow\.location\.reload\(\)/);
  assert.match(runtime, /distribucion\/index\.js\?v=20260901-distribution-table-geometry1/);
  assert.match(runtime, /distribucion\/table-geometry\.js\?v=20260901-table-geometry1/);
});

test('the live refresh waits for Distribución autosave and refuses to reload on save error', () => {
  assert.match(distribution, /function plannerSaveState\(controller\)/);
  assert.match(distribution, /if \(state === 'saving'\) return deferPush\(controller\)/);
  assert.match(distribution, /if \(state === 'error'\)/);
  assert.match(distribution, /if \(state === 'saving'\) return refreshLiveFrame\(controller\)/);
  assert.match(distribution, /se evitó refrescar porque hay cambios sin guardar/);
});

test('the distribution bridge exposes its existing canonical save path to the geometry UI', () => {
  assert.match(distribution, /readState:\s*read/);
  assert.match(distribution, /saveState:\s*save/);
  assert.match(distribution, /syncNow\(\)/);
});

test('the live table refresh does not introduce Firestore or destructive remote writes', () => {
  assert.doesNotMatch(distribution, /\b(?:setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/);
  assert.doesNotMatch(distribution, /firebase(?:-firestore)?/i);
});
