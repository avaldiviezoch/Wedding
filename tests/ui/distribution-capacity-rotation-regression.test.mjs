import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const capacity = readFileSync(new URL('phase2-capacity.js', root), 'utf8');
const inspector = readFileSync(new URL('phase2-inspector.js', root), 'utf8');
const p1 = readFileSync(new URL('phase2-p1.js', root), 'utf8');
const host = readFileSync(new URL('phase2-host.js', root), 'utf8');
const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

test('renderer autoritativo mantiene forma capacidad sillas etiquetas y handle de rotación juntos', () => {
  for (const token of [
    'authoritativeTableRenderer:true',
    'rotationHandleNative:true',
    'uprightTextNative:true',
    'seatPositions(item, scale).forEach',
    'seatsApi.ensureSeatArray(item, capacity)',
    'appendTabletop(group, item, shape, C, d, danger)',
    'appendTableLabels(group, item, capacity)',
    'appendRotateHandle(group, item)'
  ]) assert.ok(capacity.includes(token), token);
});

test('inspector captura forma y capacidad una sola vez y explica reducciones bloqueadas', () => {
  assert.match(inspector, /shapeSelect\.addEventListener\('change',[\s\S]*stopImmediatePropagation\(\)[\s\S]*}, true\)/);
  assert.match(inspector, /capacitySelect\.addEventListener\('change',[\s\S]*stopImmediatePropagation\(\)[\s\S]*}, true\)/);
  assert.ok(inspector.includes('capacityApi.blockedSeatsForCapacity'));
  assert.ok(inspector.includes('option.disabled = blocked.length > 0'));
});

test('rotación por puntero y teclado siguen usando el mismo item.rotation consumido por renderer', () => {
  assert.ok(p1.includes("mode: 'rotate'"));
  assert.ok(p1.includes('item.rotation = normalizeRotation(rotation)'));
  assert.ok(p1.includes('rotateSelectedByKeyboard'));
  assert.match(capacity, /rotate\(\$\{rotation\}\)/);
  assert.match(capacity, /rotate\(\$\{-rotation\}\)/);
});

test('no queda una capa visual posterior que vuelva a envolver renderer o selectores', () => {
  assert.doesNotMatch(host, /phase2-visual-contract-fix\.js/);
  assert.match(host, /phase2-capacity\.js', \(\) => loadScript\(doc, 'phase2-inspector\.js', \(\) => loadScript\(doc, 'phase2-validation\.js'\)\)\)/);
});

test('estabilización sigue aislada de persistencia real', () => {
  assert.doesNotMatch(capacity + inspector + p1, forbidden);
});
