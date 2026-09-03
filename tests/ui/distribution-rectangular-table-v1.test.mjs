import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const contractSource = readFileSync(new URL('engine/rectangular-table-contract.js', root), 'utf8');
const squareSource = readFileSync(new URL('engine/square-table-contract.js', root), 'utf8');
const roundSource = readFileSync(new URL('engine/round-table-contract.js', root), 'utf8');
const runtimeSource = readFileSync(new URL('phase2-rectangular.js', root), 'utf8');
const squareRuntimeSource = readFileSync(new URL('phase2-square.js', root), 'utf8');
const hostSource = readFileSync(new URL('phase2-host.js', root), 'utf8');
const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

function loadContract(source) {
  const context = { window: {}, Math, Object, Number };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.window.MiGranDiaDistributionEngine;
}

test('mesa rectangular v1 queda aislada y con capacidad fija 10', () => {
  assert.doesNotMatch(contractSource + runtimeSource, forbidden);
  const api = loadContract(contractSource).rectangularTableContract;
  assert.equal(api.RECTANGULAR_TABLE_CONTRACT.id, 'rectangular-v1-cap10');
  assert.equal(api.RECTANGULAR_TABLE_CONTRACT.capacity, 10);
  assert.equal(api.RECTANGULAR_TABLE_CONTRACT.tabletopWidthM, 2.40);
  assert.equal(api.RECTANGULAR_TABLE_CONTRACT.tabletopHeightM, 0.75);
  assert.equal(api.RECTANGULAR_TABLE_CONTRACT.clearanceWidthM, 4.00);
  assert.equal(api.RECTANGULAR_TABLE_CONTRACT.clearanceHeightM, 2.35);
});

test('tablero y clearance rectangular permanecen físicamente separados a todas las escalas', () => {
  const api = loadContract(contractSource).rectangularTableContract;
  for (const scale of [18, 32, 50]) {
    const dims = api.dimensionsAtScale(scale);
    assert.equal(dims.tabletopWidthPx, 2.4 * scale);
    assert.equal(dims.tabletopHeightPx, 0.75 * scale);
    assert.equal(dims.clearanceWidthPx, 4 * scale);
    assert.equal(dims.clearanceHeightPx, 2.35 * scale);
    assert.ok(dims.clearanceWidthPx > dims.tabletopWidthPx);
    assert.ok(dims.clearanceHeightPx > dims.tabletopHeightPx);
  }
});

test('10 sillas rectangulares usan patrón 4 + 1 + 4 + 1 sin duplicados', () => {
  const api = loadContract(contractSource).rectangularTableContract;
  const positions = Array.from({ length: 10 }, (_, index) => api.perimeterSeatPosition(index, 32));
  assert.equal(new Set(positions.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`)).size, 10);
  assert.deepEqual(positions.map((p) => p.side), ['top','top','top','top','right','bottom','bottom','bottom','bottom','left']);
});

test('nombres rectangulares siguen el lado y anclaje de cada silla', () => {
  const api = loadContract(contractSource).rectangularTableContract;
  assert.equal(api.labelPosition(0, 32).anchor, 'middle');
  assert.equal(api.labelPosition(4, 32).anchor, 'start');
  assert.equal(api.labelPosition(6, 32).anchor, 'middle');
  assert.equal(api.labelPosition(9, 32).anchor, 'end');
});

test('normalizar rectangular preserva identidad y usa rect para SAT', () => {
  const api = loadContract(contractSource).rectangularTableContract;
  const table = { id:'table-abc', type:'table', tableShape:'square', shape:'rect', x:724, y:543, rotation:30, seats:['g1','g2',null,null,null,null,null,null,null,null] };
  const id = table.id, seats = table.seats;
  api.normalizeRectangularTable(table);
  assert.equal(table.id, id);
  assert.equal(table.seats, seats);
  assert.equal(table.tableShape, 'rectangular');
  assert.equal(table.shape, 'rect');
  assert.equal(table.capacity, 10);
  assert.equal(table.widthM, 4.00);
  assert.equal(table.heightM, 2.35);
});

test('runtime preserva id, posición, rotación, asientos, etiqueta y color entre tres formas', () => {
  for (const token of ['id: item.id','x: item.x','y: item.y','rotation: item.rotation','seats: item.seats.slice()','label: item.label','color: item.color']) {
    assert.ok(runtimeSource.includes(token), token);
  }
  assert.match(runtimeSource, /normalizeRectangularTable\(item\)/);
  assert.match(runtimeSource, /normalizeSquareTable\(item\)/);
  assert.match(runtimeSource, /normalizeCurrentRoundTable\(item\)/);
  assert.match(runtimeSource, /item\.id = identity\.id/);
  assert.match(runtimeSource, /item\.seats = identity\.seats/);
});

test('cuadrada ya no confunde una rectangular explícita con square', () => {
  assert.match(squareRuntimeSource, /item\.tableShape === 'square'/);
  assert.match(squareRuntimeSource, /!item\.tableShape && item\.shape === 'rect'/);
});

test('runtime rectangular conserva tableShape durante saneamiento JSON', () => {
  assert.match(runtimeSource, /phase2ShapeAwareSanitizeState/);
  assert.match(runtimeSource, /requested === 'rectangular'/);
  assert.match(runtimeSource, /requested === 'square'/);
  assert.match(runtimeSource, /item\.tableShape = 'round'/);
});

test('host carga contrato rectangular antes de tables y runtime después de square', () => {
  const rectContract = hostSource.indexOf("'engine/rectangular-table-contract.js'");
  const tables = hostSource.indexOf("'engine/tables.js'");
  assert.ok(rectContract >= 0 && rectContract < tables);
  const squareRuntime = hostSource.indexOf("'phase2-square.js'");
  const rectangularRuntime = hostSource.indexOf("'phase2-rectangular.js'");
  assert.ok(squareRuntime >= 0 && rectangularRuntime > squareRuntime);
});

test('contratos redondo y cuadrado permanecen congelados durante Fase C', () => {
  const round = loadContract(roundSource).roundTableContract.ROUND_TABLE_CONTRACT;
  const square = loadContract(squareSource).squareTableContract.SQUARE_TABLE_CONTRACT;
  assert.equal(round.id, 'round-current-v1');
  assert.equal(round.tabletopRadiusM, 0.915);
  assert.equal(square.id, 'square-v1-cap10');
  assert.equal(square.tabletopSideM, 1.80);
  assert.equal(square.capacity, 10);
});
