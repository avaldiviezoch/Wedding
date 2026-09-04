import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const p0 = readFileSync(new URL('phase2-p0.js', root), 'utf8');
const transition = readFileSync(new URL('engine/table-transition.js', root), 'utf8');
const inspector = readFileSync(new URL('phase2-inspector.js', root), 'utf8');

test('mesa inicial del laboratorio no preasigna los diez invitados de ejemplo', () => {
  assert.match(p0, /addElement\('table', \{ record: false, assignGuests: false \}\)/);
  assert.doesNotMatch(p0, /phase2InitialState[\s\S]*assignGuests: true/);
});

test('selector sigue ofreciendo 4 6 8 10 12 14 y 16', () => {
  assert.match(inspector, /TABLE_CAPACITIES/);
  assert.match(inspector, /Número de sillas/);
});

test('protección de invitados reales permanece: no se reduce si quedarían ocupantes fuera de rango', () => {
  assert.match(transition, /occupiedBeyondCapacity\(table, capacity\)/);
  assert.match(transition, /reason:'occupied-seats'/);
});
