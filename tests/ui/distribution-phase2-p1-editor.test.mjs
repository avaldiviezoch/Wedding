import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const host = readFileSync(new URL('../../pruebas/distribucion/phase2-host.js', import.meta.url), 'utf8');
const source = readFileSync(new URL('../../pruebas/distribucion/phase2-p1-editor.js', import.meta.url), 'utf8');
const forbiddenPersistence = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

test('P1 editor se carga después del bloque de interacciones y sigue aislado', () => {
  assert.match(host, /script\.onload\s*=\s*\(\)\s*=>\s*loadP1Editor\(doc\)/);
  assert.match(host, /phase2-p1-editor\.js\?v=20260902-p1b-1/);
  assert.doesNotMatch(`${host}\n${source}`, forbiddenPersistence);
  assert.doesNotThrow(() => new Function(source), 'phase2-p1-editor.js debe tener sintaxis JavaScript válida');
});

test('historial P1 replica el límite productivo de 80 estados', () => {
  assert.match(source, /const HISTORY_LIMIT = 80/);
  assert.match(source, /historyPast\.length > HISTORY_LIMIT/);
  assert.match(source, /historyPast\.shift\(\)/);
  assert.match(source, /historyFuture = \[\]/);
});

test('frente, fondo y alineación protegen elementos bloqueados', () => {
  assert.match(source, /function unlockedSelectedItems\(\)/);
  assert.match(source, /selectedItems\(\)\.filter\(\(item\) => !isItemLocked\(item\)\)/);
  assert.match(source, /elements = \[\.\.\.rest, \.\.\.chosen\]/);
  assert.match(source, /elements = \[\.\.\.chosen, \.\.\.rest\]/);
  assert.match(source, /if \(item\.id === base\.id \|\| isItemLocked\(item\)\) return/);
  assert.match(source, /item\.y = base\.y/);
});

test('duplicar y pegar generan IDs nuevos y nunca clonan asignaciones de mesa', () => {
  assert.match(source, /copy\.id = makeId\(item\.type\)/);
  assert.match(source, /copy\.id = makeId\(sourceItem\.type\)/);
  assert.match(source, /const DUPLICATE_OFFSET = 35/);
  assert.match(source, /const PASTE_OFFSET = 28/);
  assert.match(source, /copy\.seats = Array\.from\(\{ length: capacity \}, \(\) => null\)/);
  assert.match(source, /copy\.x = clampX/);
  assert.match(source, /copy\.y = clampY/);
});

test('eliminar actúa solo sobre seleccionados desbloqueados', () => {
  const start = source.indexOf('function deleteUnlockedSelection');
  const end = source.indexOf('renderLayerList = function', start);
  const fn = source.slice(start, end);
  assert.match(fn, /const unlocked = unlockedSelectedItems\(\)/);
  assert.match(fn, /const ids = new Set\(unlocked\.map/);
  assert.match(fn, /elements = elements\.filter\(\(item\) => !ids\.has\(item\.id\)\)/);
  assert.match(fn, /const survivors = selectedIds\.filter\(\(id\) => getItem\(id\)\)/);
});

test('capas conservan visibilidad, bloqueo y selección coherente', () => {
  assert.match(source, /eye\.dataset\.layerAction = 'toggle-visibility'/);
  assert.match(source, /hiddenLayers\[type\] = !hiddenLayers\[type\]/);
  assert.match(source, /selectedIds\.filter\(\(id\) => getItem\(id\)\?\.type !== type\)/);
  assert.match(source, /lock\.dataset\.layerAction = 'toggle-lock'/);
  assert.match(source, /lockedLayers\[type\] = !lockedLayers\[type\]/);
  assert.match(source, /function showAllLayers\(\)/);
  assert.match(source, /function unlockEverything\(\)/);
});

test('botones del baseline se interceptan en captura para evitar doble mutación', () => {
  for (const id of ['btnBringFront','btnSendBack','btnAlignNow','btnDuplicate','btnDelete','btnShowAllLayers','btnUnlockAllLayers']) {
    assert.match(source, new RegExp(`captureButton\\('${id}'`));
  }
  assert.match(source, /event\.stopImmediatePropagation\(\)/);
  assert.match(source, /}, true\)/);
});
