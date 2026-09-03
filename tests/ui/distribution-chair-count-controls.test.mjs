import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const seatsSource = readFileSync(new URL('engine/seats.js', root), 'utf8');
const layoutSource = readFileSync(new URL('engine/capacity-layout.js', root), 'utf8');
const runtimeSource = readFileSync(new URL('phase2-capacity.js', root), 'utf8');
const inspectorSource = readFileSync(new URL('phase2-inspector.js', root), 'utf8');
const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

function engine() {
  const context = { window:{}, Object, Number, Math, Error, Array };
  vm.createContext(context);
  vm.runInContext(seatsSource, context);
  vm.runInContext(layoutSource, context);
  return context.window.MiGranDiaDistributionEngine;
}

test('mesa redonda puede ampliar de 10 a 12, 14 y 16 sillas sin perder las diez existentes', () => {
  const { seats, capacityLayout } = engine();
  const table = { capacity:10, seats:Array.from({ length:10 }, (_, i) => `g${i + 1}`) };
  for (const capacity of [12,14,16]) {
    const result = seats.resizeCapacity(table, capacity);
    assert.equal(result.ok, true);
    assert.equal(table.capacity, capacity);
    assert.equal(table.seats.length, capacity);
    assert.deepEqual(table.seats.slice(0, 10), Array.from({ length:10 }, (_, i) => `g${i + 1}`));
    assert.equal(capacityLayout.roundPositions(capacity, 50).length, capacity);
  }
});

test('renderer exige que capacidad y cantidad real de sillas coincidan', () => {
  assert.ok(runtimeSource.includes('if (positions.length !== capacity) throw new Error'));
  assert.ok(runtimeSource.includes("'data-chair-count':String(positions.length)"));
  assert.match(runtimeSource, /positions\.forEach\(\(pos, index\) => \{\s*appendChair/);
  assert.ok(runtimeSource.includes('exactChairCountInvariant:true'));
});

test('sillas se dibujan aunque la holgura esté oculta', () => {
  const clearanceGuard = runtimeSource.indexOf('if (showClearance.checked)');
  const chairLoop = runtimeSource.indexOf('positions.forEach((pos, index) =>');
  assert.ok(clearanceGuard >= 0 && chairLoop > clearanceGuard);
  assert.ok(runtimeSource.includes('chairsIndependentFromClearance:true'));
  assert.doesNotMatch(runtimeSource, /positions\.forEach[\s\S]{0,120}if \(showClearance\.checked\)[\s\S]{0,180}appendChair/);
});

test('inspector expone control explícito menos/contador/más sillas', () => {
  for (const token of ['tableInspectorSeatMinus','tableInspectorSeatCount','tableInspectorSeatPlus','stepSeats','explicitChairStepper:true']) {
    assert.ok(inspectorSource.includes(token), token);
  }
  assert.ok(inspectorSource.includes("stepSeats(-1)"));
  assert.ok(inspectorSource.includes("stepSeats(1)"));
  assert.ok(inspectorSource.includes('`${model.capacity} sillas`'));
});

test('cambio de sillas permanece memory-only', () => {
  assert.doesNotMatch(runtimeSource + inspectorSource + seatsSource + layoutSource, forbidden);
});
