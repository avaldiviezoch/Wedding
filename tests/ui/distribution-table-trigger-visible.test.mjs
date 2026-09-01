import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const desktop = readFileSync(
  new URL('../../app_integral/appludesktop.html', import.meta.url),
  'utf8'
);
const compat = readFileSync(
  new URL('../../app_integral/js/modules/distribucion/table-trigger-compat.js', import.meta.url),
  'utf8'
);
const runtime = readFileSync(
  new URL('../../app_integral/js/modules/invitados/runtime-loader.js', import.meta.url),
  'utf8'
);

test('the real Distribución table control is identified by data-add instead of fragile copy', () => {
  assert.match(desktop, /data-add="table"/);
  assert.match(desktop, /Mesa circular<br>10 personas/);
  assert.match(compat, /querySelector\('button\[data-add="table"\]'\)/);
  assert.match(compat, /marker\.textContent = 'Mesa 10 personas'/);
});

test('table trigger compatibility loads before the geometry runtime', () => {
  const compatIndex = runtime.indexOf('table-trigger-compat.js');
  const geometryIndex = runtime.indexOf('table-geometry.js');
  assert.ok(compatIndex >= 0);
  assert.ok(geometryIndex > compatIndex);
  assert.match(runtime, /distribution-table-trigger-visible1/);
});

test('the visibility fix is DOM-only and has no persistence or Firebase operations', () => {
  assert.doesNotMatch(compat, /localStorage|indexedDB|sessionStorage/);
  assert.doesNotMatch(compat, /\b(?:setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/);
  assert.doesNotMatch(compat, /firebase(?:-firestore)?/i);
});
