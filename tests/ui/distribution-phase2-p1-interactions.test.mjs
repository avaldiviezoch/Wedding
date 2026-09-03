import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const host = readFileSync(new URL('../../pruebas/distribucion/phase2-host.js', import.meta.url), 'utf8');
const source = readFileSync(new URL('../../pruebas/distribucion/phase2-p1.js', import.meta.url), 'utf8');

const forbiddenPersistence = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

test('P1 se carga después de P0 y sigue aislado de persistencia', () => {
  assert.match(host, /script\.onload\s*=\s*\(\)\s*=>\s*loadP1\(doc\)/);
  assert.match(host, /phase2-p1\.js\?v=20260902-p1-1/);
  assert.doesNotMatch(`${host}\n${source}`, forbiddenPersistence);
  assert.doesNotThrow(() => new Function(source), 'phase2-p1.js debe tener sintaxis JavaScript válida');
});

test('drag P1 usa los límites productivos 1448 × 1086', () => {
  assert.match(source, /const CANVAS_W = 1448/);
  assert.match(source, /const CANVAS_H = 1086/);
  assert.match(source, /const clampX = \(value\) => Math\.max\(0, Math\.min\(CANVAS_W, value\)\)/);
  assert.match(source, /const clampY = \(value\) => Math\.max\(0, Math\.min\(CANVAS_H, value\)\)/);
  assert.doesNotMatch(source, /Math\.min\(1180/);
  assert.doesNotMatch(source, /Math\.min\(740/);
});

test('multiselección conserva Ctrl/Cmd y arrastre de grupo', () => {
  assert.match(source, /event\.ctrlKey \|\| event\.metaKey/);
  assert.match(source, /setSelection\(\[\.\.\.selectedIds, item\.id\], item\.id\)/);
  assert.match(source, /const group = movableSelection\(item\)\.map/);
  assert.match(source, /p1Drag\.group\.forEach/);
  assert.match(source, /applySmartGuides\(intendedX, intendedY, p1Drag\.group\.map/);
});

test('rotación P1 soporta handle, 15 grados y snap con Shift', () => {
  assert.match(source, /const ROTATION_STEP = 15/);
  assert.match(source, /pointerRotateItem/);
  assert.match(source, /if \(event\.shiftKey\) rotation = snapRotation\(rotation\)/);
  assert.match(source, /event\.key\.toLowerCase\(\) === 'r'/);
  assert.match(source, /rotateSelectedByKeyboard/);
});

test('bloqueo se valida antes de mover por puntero o teclado', () => {
  assert.match(source, /if \(!item \|\| isItemLocked\(item\) \|\| measureMode \|\| drawingTent\) return false/);
  assert.match(source, /if \(isItemLocked\(item\)\) \{/);
  assert.match(source, /selectedItems\(\)\.filter\(\(item\) => !isItemLocked\(item\)\)/);
  assert.match(source, /if \(!current \|\| isItemLocked\(current\)\) return/);

  const keyboardFn = source.slice(source.indexOf('function moveSelectedByKeyboard'), source.indexOf('function rotateSelectedByKeyboard'));
  assert.match(keyboardFn, /filter\(\(item\) => !isItemLocked\(item\)\)/);
  assert.ok(keyboardFn.indexOf('filter((item) => !isItemLocked(item))') < keyboardFn.indexOf('item.y ='), 'el filtro de bloqueo debe ocurrir antes de modificar Y');
});

test('P1 intercepta el baseline en captura para evitar doble drag', () => {
  assert.match(source, /planner\.addEventListener\('pointerdown', onPointerDown, true\)/);
  assert.match(source, /planner\.addEventListener\('pointermove', onPointerMove, true\)/);
  assert.match(source, /planner\.addEventListener\('pointerup', endPointerInteraction, true\)/);
  assert.match(source, /event\.stopImmediatePropagation\(\)/);
});
