import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const seatsSource = readFileSync(new URL('engine/seats.js', root), 'utf8');
const physicalSource = readFileSync(new URL('engine/physical-dimensions.js', root), 'utf8');
const transitionSource = readFileSync(new URL('engine/table-transition.js', root), 'utf8');
const runtimeSource = readFileSync(new URL('phase2-capacity.js', root), 'utf8');
const hostSource = readFileSync(new URL('phase2-host.js', root), 'utf8');
const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|storage|getStorage|uploadBytes|deleteObject|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

function loadEngine() {
  const context = { window:{}, Object, Number, Math, Error, Array, Set };
  vm.createContext(context);
  vm.runInContext(seatsSource, context);
  vm.runInContext(physicalSource, context);
  vm.runInContext(transitionSource, context);
  return context.window.MiGranDiaDistributionEngine;
}

function table(overrides = {}) {
  return {
    id:'table-1', type:'table', tableShape:'round', capacity:10,
    x:724, y:543, rotation:30, label:'Mesa principal', color:'#abcdef', locked:false, layerId:'tables',
    seats:['g1','g2',null,null,null,null,null,null,null,null],
    ...overrides
  };
}

test('Fase F mantiene el engine y runtime aislados de persistencia real', () => {
  assert.doesNotMatch(seatsSource + physicalSource + transitionSource + runtimeSource, forbidden);
  assert.doesNotMatch(transitionSource, /document\.|querySelector|addEventListener/);
});

test('una sola transición cubre todas las combinaciones forma/capacidad', () => {
  const { tableTransition, physicalDimensions } = loadEngine();
  for (const shape of ['round','square','rectangular']) {
    for (const capacity of [4,6,8,10,12,14,16]) {
      const item = table({ seats:Array(16).fill(null) });
      const result = tableTransition.transition(item, { shape, capacity });
      assert.equal(result.ok, true);
      assert.equal(item.id, 'table-1');
      assert.equal(item.x, 724);
      assert.equal(item.y, 543);
      assert.equal(item.rotation, 30);
      assert.equal(item.label, 'Mesa principal');
      assert.equal(item.color, '#abcdef');
      assert.equal(item.tableShape, shape);
      assert.equal(item.capacity, capacity);
      assert.equal(item.seats.length, capacity);
      const defaults = physicalDimensions.DEFAULT_TABLETOP_M[shape];
      assert.ok(Math.abs(item.tabletopWidthM - defaults[0]) < 1e-9);
      assert.ok(Math.abs(item.tabletopHeightM - defaults[1]) < 1e-9);
      assert.ok(Math.abs(item.widthM - (defaults[0] + physicalDimensions.CLEARANCE_MARGIN_M * 2)) < 1e-9);
      assert.ok(Math.abs(item.heightM - (defaults[1] + physicalDimensions.CLEARANCE_MARGIN_M * 2)) < 1e-9);
    }
  }
});

test('plan bloquea reducción ocupada antes de mutar cualquier propiedad', () => {
  const { tableTransition } = loadEngine();
  const item = table({ seats:[null,null,null,null,null,null,null,'g8',null,null] });
  const before = JSON.stringify(item);
  const result = tableTransition.transition(item, { shape:'rectangular', capacity:4 });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'occupied-seats');
  assert.deepEqual(Array.from(result.blocked, (entry) => entry.seatNumber), [8]);
  assert.equal(JSON.stringify(item), before);
});

test('expansión y cambio de forma conservan asignaciones existentes', () => {
  const { tableTransition } = loadEngine();
  const item = table({ capacity:4, seats:['g1',null,'g3',null] });
  const result = tableTransition.transition(item, { shape:'square', capacity:16 });
  assert.equal(result.ok, true);
  assert.equal(item.seats[0], 'g1');
  assert.equal(item.seats[2], 'g3');
  assert.equal(item.seats.length, 16);
  assert.equal(item.tableShape, 'square');
});

test('cambio solo de forma y cambio solo de capacidad usan la misma transición', () => {
  assert.match(runtimeSource, /function transitionTable\(item, request\)/);
  assert.match(runtimeSource, /transitionApi\.transition\(item, request\)/);
  assert.match(runtimeSource, /return transitionTable\(item, \{ capacity:nextCapacity \}\)/);
  assert.match(runtimeSource, /return transitionTable\(item, \{ shape \}\)/);
  assert.match(runtimeSource, /unifiedTransition:true/);
});

test('host carga table-transition después de dimensiones físicas y antes del runtime', () => {
  const physicalIndex = hostSource.indexOf("'engine/physical-dimensions.js'");
  const transitionIndex = hostSource.indexOf("'engine/table-transition.js'");
  const layoutIndex = hostSource.indexOf("'engine/capacity-layout.js'");
  assert.ok(physicalIndex >= 0 && transitionIndex > physicalIndex && transitionIndex < layoutIndex);
});
