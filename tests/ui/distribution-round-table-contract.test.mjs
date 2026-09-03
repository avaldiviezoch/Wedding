import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const source = readFileSync(new URL('engine/round-table-contract.js', root), 'utf8');
const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

function api() {
  const context = { window: {}, Math, Object, Number };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'round-table-contract.js' });
  return context.window.MiGranDiaDistributionEngine.roundTableContract;
}

test('baseline redondo permanece aislado de persistencia', () => {
  assert.doesNotMatch(source, forbidden);
});

test('baseline redondo congela medidas y estética oficial', () => {
  const contract = api().ROUND_TABLE_CONTRACT;
  assert.deepEqual(JSON.parse(JSON.stringify({
    id: contract.id,
    shape: contract.shape,
    capacity: contract.capacity,
    tabletopRadiusM: contract.tabletopRadiusM,
    tabletopDiameterM: contract.tabletopDiameterM,
    clearanceRadiusM: contract.clearanceRadiusM,
    clearanceDiameterM: contract.clearanceDiameterM,
    chairOrbitFactor: contract.chairOrbitFactor,
    labelOrbitFactor: contract.labelOrbitFactor,
    conflictColor: contract.conflictColor,
    selectedColor: contract.selectedColor
  })), {
    id: 'round-current-v1', shape: 'round', capacity: 10,
    tabletopRadiusM: 0.915, tabletopDiameterM: 1.83,
    clearanceRadiusM: 1.7, clearanceDiameterM: 3.4,
    chairOrbitFactor: 1.33, labelOrbitFactor: 2.18,
    conflictColor: '#c84242', selectedColor: '#d59b3c'
  });
});

test('baseline redondo conserva independencia tablero vs clearance', () => {
  const round = api();
  const d = round.dimensionsAtScale(32);
  assert.equal(d.tabletopRadiusPx, 29.28);
  assert.equal(d.clearanceRadiusPx, 54.4);
  assert.notEqual(d.tabletopRadiusPx, d.clearanceRadiusPx);
});