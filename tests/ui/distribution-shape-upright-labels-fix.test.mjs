import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const source = readFileSync(new URL('phase2-visual-contract-fix.js', root), 'utf8');
const host = readFileSync(new URL('phase2-host.js', root), 'utf8');
const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

test('corrección permanece memory-only', () => {
  assert.doesNotMatch(source, forbidden);
  assert.ok(source.includes('memoryOnly:true'));
});

test('cambio de tipo intercepta el selector y fuerza transición + geometría + repaint', () => {
  assert.ok(source.includes("shapeSelect.addEventListener('change'"));
  assert.ok(source.includes('event.stopImmediatePropagation()'));
  assert.ok(source.includes('capacityApi.transitionTable(table, { shape })'));
  assert.ok(source.includes('capacityApi.applyPhysicalGeometry(table)'));
  assert.match(source, /applyPhysicalGeometry\(table\);\s*render\(\);\s*inspectorApi\?\.refresh\?\.\(\)/);
});

test('nombres, números de silla y nombre de mesa contrarrotan para mantenerse hacia arriba', () => {
  assert.ok(source.includes("group.querySelectorAll?.('.guest-tag')"));
  assert.ok(source.includes("group.querySelectorAll?.('.chair-wrap > text')"));
  assert.ok(source.includes('const counter = -rotation'));
  assert.ok(source.includes("tag.dataset.uprightText = 'true'"));
  assert.ok(source.includes('uprightGuestNames:true'));
  assert.ok(source.includes('uprightChairNumbers:true'));
  assert.ok(source.includes('uprightTableLabel:true'));
});

test('host carga la corrección después de la validación final', () => {
  assert.match(host, /phase2-validation\.js', \(\) => loadScript\(doc, 'phase2-visual-contract-fix\.js'\)/);
});