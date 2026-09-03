import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const seatsSource = readFileSync(new URL('engine/seats.js', root), 'utf8');
const dimensionsSource = readFileSync(new URL('engine/physical-dimensions.js', root), 'utf8');
const runtimeSource = readFileSync(new URL('phase2-capacity.js', root), 'utf8');
const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|storage|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

function load() {
  const context = { window:{}, Object, Number, Math, Error };
  vm.createContext(context);
  vm.runInContext(seatsSource, context);
  vm.runInContext(dimensionsSource, context);
  return context.window.MiGranDiaDistributionEngine;
}

test('matriz física contiene todas las dimensiones aprobadas', () => {
  const { physicalDimensions:d } = load();
  assert.deepEqual(Array.from(d.SUPPORTED_CAPACITIES), [4,6,8,10,12,14,16]);
  assert.deepEqual([4,6,8,10,12,14,16].map(c => d.dimensionsFor('round',c).tabletopWidthM), [.9,1.2,1.5,1.5,1.8,2.1,2.4]);
  assert.deepEqual([4,6,8,10,12,14,16].map(c => d.dimensionsFor('square',c).tabletopWidthM), [.9,1.2,1.5,1.8,2,2.2,2.4]);
  assert.deepEqual([4,6,8,10,12,14,16].map(c => [d.dimensionsFor('rectangular',c).tabletopWidthM,d.dimensionsFor('rectangular',c).tabletopHeightM]), [[1.2,.75],[1.8,.75],[1.8,.75],[2.4,.75],[2.4,1],[3,1],[3.6,1]]);
});

test('clearance permanece separado del tablero con 80 cm por lado', () => {
  const { physicalDimensions:d } = load();
  assert.equal(d.CLEARANCE_MARGIN_M, .8);
  for (const shape of ['round','square','rectangular']) for (const capacity of d.SUPPORTED_CAPACITIES) {
    const m = d.dimensionsFor(shape, capacity);
    assert.equal(m.clearanceWidthM, m.tabletopWidthM + 1.6);
    assert.equal(m.clearanceHeightM, m.tabletopHeightM + 1.6);
  }
});

test('aplicar dimensión actualiza geometría funcional usada por colisiones y límites', () => {
  const { physicalDimensions:d } = load();
  const table = { id:'t1', type:'table', tableShape:'rectangular', capacity:16, shape:'rect', widthM:1, heightM:1 };
  d.applyToTable(table);
  assert.equal(table.id, 't1');
  assert.equal(table.capacity, 16);
  assert.equal(table.shape, 'rect');
  assert.equal(table.widthM, 5.2);
  assert.equal(table.heightM, 2.6);
});

test('redonda 10 usa objetivo físico Ø1.50 sin modificar contrato histórico', () => {
  const { physicalDimensions:d } = load();
  const dims = d.dimensionsFor('round', 10);
  assert.equal(dims.tabletopWidthM, 1.5);
  assert.equal(dims.clearanceWidthM, 3.1);
});

test('runtime usa matriz física para render, sillas, cambio de capacidad, forma e importación', () => {
  for (const token of ['physical.dimensionsAtScale','physical.applyToTable','applyPhysicalGeometry(item)','physicalDimensionsByCapacity:true','phase2PhysicalDimensionAwareSanitizeState']) assert.ok(runtimeSource.includes(token), token);
  assert.doesNotMatch(dimensionsSource + runtimeSource, forbidden);
});
