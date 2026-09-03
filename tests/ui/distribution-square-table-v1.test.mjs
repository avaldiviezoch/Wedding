import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const contractSource = readFileSync(new URL('engine/square-table-contract.js', root), 'utf8');
const roundSource = readFileSync(new URL('engine/round-table-contract.js', root), 'utf8');
const runtimeSource = readFileSync(new URL('phase2-square.js', root), 'utf8');
const hostSource = readFileSync(new URL('phase2-host.js', root), 'utf8');
const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

function loadContract(source) {
  const context = { window: {}, Math, Object, Number };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.window.MiGranDiaDistributionEngine;
}

test('mesa cuadrada v1 queda aislada y con capacidad fija 10', () => {
  assert.doesNotMatch(contractSource + runtimeSource, forbidden);
  const api = loadContract(contractSource).squareTableContract;
  assert.equal(api.SQUARE_TABLE_CONTRACT.id, 'square-v1-cap10');
  assert.equal(api.SQUARE_TABLE_CONTRACT.capacity, 10);
  assert.equal(api.SQUARE_TABLE_CONTRACT.tabletopSideM, 1.80);
  assert.equal(api.SQUARE_TABLE_CONTRACT.clearanceWidthM, 3.40);
  assert.equal(api.SQUARE_TABLE_CONTRACT.clearanceHeightM, 3.40);
});

test('tablero y clearance cuadrado permanecen físicamente separados', () => {
  const api = loadContract(contractSource).squareTableContract;
  for (const scale of [18, 32, 50]) {
    const dims = api.dimensionsAtScale(scale);
    assert.equal(dims.tabletopSidePx, 1.8 * scale);
    assert.equal(dims.clearanceWidthPx, 3.4 * scale);
    assert.equal(dims.clearanceHeightPx, 3.4 * scale);
    assert.ok(dims.clearanceWidthPx > dims.tabletopSidePx);
  }
});

test('10 sillas se distribuyen alrededor de los cuatro lados sin duplicar posiciones', () => {
  const api = loadContract(contractSource).squareTableContract;
  const positions = Array.from({ length: 10 }, (_, index) => api.perimeterSeatPosition(index, 32));
  assert.equal(new Set(positions.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`)).size, 10);
  assert.deepEqual(positions.map((p) => p.side), ['top','top','right','right','right','bottom','bottom','left','left','left']);
  assert.equal(positions[0].y, positions[1].y);
  assert.equal(positions[3].x, positions[4].x);
});

test('nombres siguen el lado de la silla y mantienen anclaje legible', () => {
  const api = loadContract(contractSource).squareTableContract;
  assert.equal(api.labelPosition(0, 32).anchor, 'middle');
  assert.equal(api.labelPosition(3, 32).anchor, 'start');
  assert.equal(api.labelPosition(6, 32).anchor, 'middle');
  assert.equal(api.labelPosition(8, 32).anchor, 'end');
});

test('normalizar cuadrada conserva identidad y usa rect para SAT', () => {
  const api = loadContract(contractSource).squareTableContract;
  const table = { id:'table-abc', type:'table', shape:'table', x:724, y:543, rotation:45, seats:['g1','g2',null,null,null,null,null,null,null,null] };
  const id = table.id, seats = table.seats;
  api.normalizeSquareTable(table);
  assert.equal(table.id, id);
  assert.equal(table.seats, seats);
  assert.equal(table.tableShape, 'square');
  assert.equal(table.shape, 'rect');
  assert.equal(table.capacity, 10);
});

test('runtime preserva id, posición, rotación, asientos, etiqueta y color al cambiar forma', () => {
  for (const token of ['id: item.id','x: item.x','y: item.y','rotation: item.rotation','seats: item.seats.slice()','label: item.label','color: item.color']) {
    assert.ok(runtimeSource.includes(token), token);
  }
  assert.match(runtimeSource, /contractApi\.normalizeSquareTable\(item\)/);
  assert.match(runtimeSource, /round\.normalizeCurrentRoundTable\(item\)/);
  assert.match(runtimeSource, /item\.id = identity\.id/);
  assert.match(runtimeSource, /item\.seats = identity\.seats/);
});

test('render cuadrado reutiliza estética oficial de sillas y nombres', () => {
  assert.match(runtimeSource, /class: 'chair'/);
  assert.match(runtimeSource, /fill: C\.chairFill/);
  assert.match(runtimeSource, /stroke: C\.chairStroke/);
  assert.match(runtimeSource, /compactName\(guestName, C\.labelMaxChars\)/);
  assert.match(runtimeSource, /rotate\(\$\{\-\(Number\(rotation\) \|\| 0\)\}\)/);
});

test('host carga contrato cuadrado antes del runtime y después bridge', () => {
  const contractIndex = hostSource.indexOf("'engine/square-table-contract.js'");
  const tablesIndex = hostSource.indexOf("'engine/tables.js'");
  assert.ok(contractIndex >= 0 && contractIndex < tablesIndex);
  assert.match(hostSource, /phase2-renderer-ui-bridge\.js', \(\) => loadScript\(doc, 'phase2-square\.js'\)/);
});

test('round-current-v1 permanece congelado durante Fase B', () => {
  const api = loadContract(roundSource).roundTableContract;
  assert.equal(api.ROUND_TABLE_CONTRACT.id, 'round-current-v1');
  assert.equal(api.ROUND_TABLE_CONTRACT.tabletopRadiusM, 0.915);
  assert.equal(api.ROUND_TABLE_CONTRACT.capacity, 10);
  assert.equal(api.ROUND_TABLE_CONTRACT.chairOrbitFactor, 1.33);
  assert.equal(api.ROUND_TABLE_CONTRACT.labelOrbitFactor, 2.18);
});
