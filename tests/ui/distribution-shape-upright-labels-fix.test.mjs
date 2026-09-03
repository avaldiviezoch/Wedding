import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const capacity = readFileSync(new URL('phase2-capacity.js', root), 'utf8');
const inspector = readFileSync(new URL('phase2-inspector.js', root), 'utf8');
const host = readFileSync(new URL('phase2-host.js', root), 'utf8');
const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

test('estabilización permanece memory-only', () => {
  assert.doesNotMatch(capacity + inspector, forbidden);
  assert.ok(capacity.includes('authoritativeTableRenderer:true'));
  assert.ok(inspector.includes('memoryOnly:true'));
});

test('cambio de tipo y capacidad tienen un solo dueño de eventos', () => {
  assert.match(inspector, /shapeSelect\.addEventListener\('change',[\s\S]*event\.stopImmediatePropagation\(\)[\s\S]*applyTransition\(\{ shape: shapeSelect\.value \}\)[\s\S]*}, true\)/);
  assert.match(inspector, /capacitySelect\.addEventListener\('change',[\s\S]*event\.stopImmediatePropagation\(\)[\s\S]*applyTransition\(\{ capacity: Number\(capacitySelect\.value\) \}\)[\s\S]*}, true\)/);
  assert.doesNotMatch(host, /phase2-visual-contract-fix\.js/);
});

test('nombres, números de silla y nombre de mesa se contrarrotan nativamente', () => {
  assert.ok(capacity.includes("class:'guest-tag'"));
  assert.match(capacity, /transform:`translate\(\$\{local\.x\.toFixed\(1\)\} \$\{local\.y\.toFixed\(1\)\}\) rotate\(\$\{-rotation\}\)`/);
  assert.match(capacity, /class:'chair-wrap'[\s\S]*transform:`rotate\(\$\{-rotation\}\)`/);
  assert.match(capacity, /class:'table-title'[\s\S]*transform:`rotate\(\$\{-rotation\}\)`/);
  assert.match(capacity, /class:'table-meta'[\s\S]*transform:`rotate\(\$\{-rotation\}\)`/);
});

test('rotación, sillas y etiquetas viven en el mismo renderer final', () => {
  assert.match(capacity, /seatPositions\(item, scale\)\.forEach/);
  assert.match(capacity, /seatsApi\.ensureSeatArray\(item, capacity\)/);
  assert.match(capacity, /appendTabletop\(group, item, shape, C, d, danger\)/);
  assert.match(capacity, /appendTableLabels\(group, item, capacity\)/);
  assert.match(capacity, /appendRotateHandle\(group, item\)/);
});

test('capacidad bloqueada por invitados se explica y no se confunde con un bug', () => {
  assert.ok(capacity.includes('blockedSeatsForCapacity'));
  assert.ok(inspector.includes('option.disabled = blocked.length > 0'));
  assert.ok(inspector.includes('mueve o libera primero los asientos'));
});