import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const seatsSource = readFileSync(new URL('engine/seats.js', root), 'utf8');
const layoutSource = readFileSync(new URL('engine/capacity-layout.js', root), 'utf8');
const runtimeSource = readFileSync(new URL('phase2-capacity.js', root), 'utf8');
const inspectorSource = readFileSync(new URL('phase2-inspector.js', root), 'utf8');
const hostSource = readFileSync(new URL('phase2-host.js', root), 'utf8');
const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

function loadEngine() {
  const context = { window:{}, Object, Number, Math, Error };
  vm.createContext(context);
  vm.runInContext(seatsSource, context);
  vm.runInContext(layoutSource, context);
  return context.window.MiGranDiaDistributionEngine;
}

const capacities = [4,6,8,10,12,14,16];
const shapes = ['round','square','rectangular'];
const dimensions = Object.freeze({ tabletopWidthPx:96, tabletopHeightPx:64, chairOffsetPx:12 });

test('las 21 combinaciones forma por capacidad tienen al menos un acomodo explícito válido', () => {
  const { capacityLayout } = loadEngine();
  for (const shape of shapes) {
    for (const capacity of capacities) {
      const variants = capacityLayout.layoutVariants(shape, capacity);
      assert.ok(variants.length >= 1, `${shape}/${capacity}`);
      for (const variant of variants) {
        const positions = capacityLayout.positionsFor(shape, capacity, dimensions, variant.id);
        assert.equal(positions.length, capacity, `${shape}/${capacity}/${variant.id}`);
        assert.equal(new Set(Array.from(positions, (p) => `${p.x.toFixed(5)},${p.y.toFixed(5)}`)).size, capacity, `${shape}/${capacity}/${variant.id} sin duplicados`);
      }
    }
  }
});

test('redondas 4 a 16 conservan reparto radial y ofrecen dos orientaciones', () => {
  const { capacityLayout } = loadEngine();
  for (const capacity of capacities) {
    const variants = capacityLayout.layoutVariants('round', capacity);
    assert.deepEqual(Array.from(variants, (v) => v.id), ['default','offset']);
    const north = capacityLayout.positionsFor('round', capacity, dimensions, 'default');
    const offset = capacityLayout.positionsFor('round', capacity, dimensions, 'offset');
    assert.notEqual(`${north[0].x.toFixed(4)},${north[0].y.toFixed(4)}`, `${offset[0].x.toFixed(4)},${offset[0].y.toFixed(4)}`);
  }
});

test('cuadradas usan patrones simétricos intencionales para 4 6 8 10 12 14 16', () => {
  const { capacityLayout } = loadEngine();
  const expected = {
    4:[[1,1,1,1]],
    6:[[2,1,2,1],[1,2,1,2]],
    8:[[2,2,2,2]],
    10:[[2,3,2,3],[3,2,3,2]],
    12:[[3,3,3,3]],
    14:[[4,3,4,3],[3,4,3,4]],
    16:[[4,4,4,4]]
  };
  for (const capacity of capacities) {
    const actual = Array.from(capacityLayout.layoutVariants('square', capacity), (variant) => Array.from(variant.counts));
    assert.deepEqual(actual, expected[capacity]);
  }
});

test('rectangulares ofrecen extremos ocupados y alternativas de lados largos según capacidad', () => {
  const { capacityLayout } = loadEngine();
  const expected = {
    4:[[2,0,2,0],[1,1,1,1]],
    6:[[2,1,2,1],[3,0,3,0]],
    8:[[3,1,3,1],[4,0,4,0]],
    10:[[4,1,4,1],[5,0,5,0]],
    12:[[5,1,5,1],[4,2,4,2],[6,0,6,0]],
    14:[[6,1,6,1],[5,2,5,2],[7,0,7,0]],
    16:[[7,1,7,1],[6,2,6,2],[8,0,8,0]]
  };
  for (const capacity of capacities) {
    const actual = Array.from(capacityLayout.layoutVariants('rectangular', capacity), (variant) => Array.from(variant.counts));
    assert.deepEqual(actual, expected[capacity]);
  }
});

test('renderer e inspector usan la matriz y exponen selector de acomodo', () => {
  for (const token of ['layout.positionsFor','seatLayoutVariants','setSeatLayoutVariant','explicitSeatLayoutMatrix:true','data-seat-layout']) {
    assert.ok(runtimeSource.includes(token), token);
  }
  assert.ok(inspectorSource.includes('id="tableInspectorSeatLayout"'));
  assert.ok(inspectorSource.includes('Acomodo de sillas'));
  assert.ok(inspectorSource.includes('capacityApi.setSeatLayoutVariant'));
  assert.ok(inspectorSource.includes('explicitSeatLayoutSelector:true'));
  assert.match(hostSource, /20260904-fixedtable1/);
});

test('matriz de acomodos permanece aislada de persistencia real', () => {
  assert.doesNotMatch(layoutSource + runtimeSource + inspectorSource, forbidden);
});