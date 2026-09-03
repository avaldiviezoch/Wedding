import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const capacity = readFileSync(new URL('phase2-capacity.js', root), 'utf8');
const visual = readFileSync(new URL('phase2-visual-contract-fix.js', root), 'utf8');

const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

test('renderer dinámico conserva el handle real de rotación', () => {
  assert.match(capacity, /appendRotateHandle\(group,\s*item\);\s*return group;/);
});

test('selector definitivo de capacidad fuerza transición y repaint del canvas', () => {
  assert.ok(visual.includes("capacitySelect.addEventListener('change'"));
  assert.ok(visual.includes('event.stopImmediatePropagation()'));
  assert.ok(visual.includes('capacityApi.transitionTable(table, { capacity })'));
  assert.match(visual, /applyPhysicalGeometry\(table\);\s*render\(\);\s*inspectorApi\?\.refresh\?\.\(\)/);
});

test('fix de capacidad y rotación permanece memory-only', () => {
  assert.doesNotMatch(`${capacity}\n${visual}`, forbidden);
});
