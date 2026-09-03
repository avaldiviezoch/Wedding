import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const seatsSource = readFileSync(new URL('engine/seats.js', root), 'utf8');
const layoutSource = readFileSync(new URL('engine/capacity-layout.js', root), 'utf8');
const transitionSource = readFileSync(new URL('engine/table-transition.js', root), 'utf8');
const runtimeSource = readFileSync(new URL('phase2-capacity.js', root), 'utf8');
const hostSource = readFileSync(new URL('phase2-host.js', root), 'utf8');
const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

function loadEngine() {
  const context = { window:{}, Object, Number, Math, Error };
  vm.createContext(context);
  vm.runInContext(seatsSource, context);
  vm.runInContext(layoutSource, context);
  return context.window.MiGranDiaDistributionEngine;
}

test('Fase D solo admite capacidades pares aprobadas de 4 a 16', () => {
  const { seats } = loadEngine();
  assert.deepEqual(Array.from(seats.SUPPORTED_CAPACITIES), [4,6,8,10,12,14,16]);
  for (const capacity of seats.SUPPORTED_CAPACITIES) assert.equal(seats.normalizeCapacity(capacity), capacity);
  assert.equal(seats.normalizeCapacity(5), 10);
  assert.doesNotMatch(seatsSource + layoutSource + transitionSource + runtimeSource, forbidden);
});

test('reducción bloquea cualquier invitado que quede fuera del nuevo rango', () => {
  const { seats } = loadEngine();
  const table = { capacity:10, seats:[null,null,null,null,null,null,null,'g8',null,null] };
  const result = seats.resizeCapacity(table, 4);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'occupied-seats');
  assert.deepEqual(Array.from(result.blocked, (entry) => entry.seatNumber), [8]);
  assert.equal(table.capacity, 10);
  assert.equal(table.seats[7], 'g8');
});

test('reducción segura recorta solo asientos vacíos y expansión conserva asignaciones', () => {
  const { seats } = loadEngine();
  const table = { capacity:10, seats:['g1','g2',null,null,null,null,null,null,null,null] };
  assert.equal(seats.resizeCapacity(table, 4).ok, true);
  assert.equal(table.capacity, 4);
  assert.deepEqual(table.seats, ['g1','g2',null,null]);
  assert.equal(seats.resizeCapacity(table, 16).ok, true);
  assert.equal(table.capacity, 16);
  assert.equal(table.seats[0], 'g1');
  assert.equal(table.seats[1], 'g2');
  assert.equal(table.seats.length, 16);
});

test('layout genera exactamente N posiciones únicas para todas las capacidades', () => {
  const { capacityLayout } = loadEngine();
  for (const capacity of [4,6,8,10,12,14,16]) {
    const round = capacityLayout.roundPositions(capacity, 40);
    const square = capacityLayout.rectPositions(capacity, 60, 60, 12, false);
    const rect = capacityLayout.rectPositions(capacity, 80, 30, 12, true);
    for (const positions of [round,square,rect]) {
      assert.equal(positions.length, capacity);
      assert.equal(new Set(positions.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`)).size, capacity);
    }
  }
});

test('capacidad 10 conserva patrones cuadrado y rectangular congelados', () => {
  const { capacityLayout } = loadEngine();
  assert.deepEqual(Array.from(capacityLayout.balancedSideCounts(10, false)), [2,3,2,3]);
  assert.deepEqual(Array.from(capacityLayout.balancedSideCounts(10, true)), [4,1,4,1]);
});

test('runtime Fase E/F mantiene protecciones y delega preservación de asientos al engine', () => {
  for (const token of ['dimensionsStillFixed:false','physicalDimensionsByCapacity:true','protectsOccupiedSeats:true','jsonSupports16:true','convertShapePreservingCapacity','unifiedTransition:true']) {
    assert.ok(runtimeSource.includes(token), token);
  }
  assert.match(runtimeSource, /transitionApi\.transition\(item, request\)/);
  assert.match(transitionSource, /before\.seats\.slice\(0, capacity\)/);
  assert.match(runtimeSource, /item\?\.type === 'table' \? renderDynamicTable/);
  assert.match(runtimeSource, /rawSeats\.slice\(0, capacity\)/);
});

test('host carga dimensiones físicas y transición antes de capacity-layout', () => {
  const seatsIndex = hostSource.indexOf("'engine/seats.js'");
  const physicalIndex = hostSource.indexOf("'engine/physical-dimensions.js'");
  const transitionIndex = hostSource.indexOf("'engine/table-transition.js'");
  const layoutIndex = hostSource.indexOf("'engine/capacity-layout.js'");
  assert.ok(seatsIndex >= 0 && physicalIndex > seatsIndex && transitionIndex > physicalIndex && layoutIndex > transitionIndex);
  assert.match(hostSource, /phase2-rectangular\.js', \(\) => loadScript\(doc, 'phase2-capacity\.js', \(\) => loadScript\(doc, 'phase2-inspector\.js', \(\) => loadScript\(doc, 'phase2-validation\.js'\)/);
});