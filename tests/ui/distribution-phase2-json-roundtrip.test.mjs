import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../pruebas/distribucion/phase2-p2.js', import.meta.url), 'utf8');

function loadSanitizer() {
  const instrumented = source.replace(
    '  buildDesktopActions();',
    '  globalThis.__phase2JsonTest = { sanitizeState };\n  return;\n\n  buildDesktopActions();'
  );
  assert.notEqual(instrumented, source, 'sanitizeState debe poder instrumentarse para prueba ejecutable');

  const context = {
    document: { documentElement: { dataset: {} } },
    console
  };
  vm.createContext(context);
  vm.runInContext(instrumented, context, { filename: 'phase2-p2.js' });
  return context.__phase2JsonTest.sanitizeState;
}

test('round-trip JSON conserva el estado válido y limpia referencias inválidas', () => {
  const sanitizeState = loadSanitizer();
  const raw = {
    elements: [
      {
        id: 'table-1', type: 'table', shape: 'table', label: 'Mesa 1',
        x: 99999, y: -20, widthM: 3.4, heightM: 3.4, rotation: 15,
        color: '#d9b978', seats: ['guest-1', 'guest-missing']
      },
      { id: 'invalid-1', type: 'script', x: 10, y: 10 }
    ],
    guests: [{ id: 'guest-1', name: 'Lucero' }],
    selectedIds: ['table-1', 'invalid-1'],
    selectedId: 'table-1',
    scale: 32,
    hiddenLayers: { table: false, script: true },
    lockedLayers: { table: true },
    measurements: [{ id: 1, x1: 10, y1: 20, x2: 30, y2: 40 }],
    measurementUid: 2,
    bgVisible: true,
    settings: { grid: true, clearance: true, labels: true, names: true }
  };

  const first = sanitizeState(raw);
  const serialized = JSON.stringify(first);
  const second = sanitizeState(JSON.parse(serialized));

  assert.equal(first.elements.length, 1);
  assert.equal(first.elements[0].type, 'table');
  assert.equal(first.elements[0].x, 1448);
  assert.equal(first.elements[0].y, 0);
  assert.equal(first.elements[0].capacity, 10);
  assert.equal(first.elements[0].seats.length, 10);
  assert.equal(first.elements[0].seats[0], 'guest-1');
  assert.equal(first.elements[0].seats[1], null);
  assert.deepEqual(Array.from(first.selectedIds), ['table-1']);
  assert.equal(first.hiddenLayers.script, undefined);
  assert.equal(first.lockedLayers.table, true);
  assert.equal(JSON.stringify(second), serialized, 'el estado saneado debe ser estable tras exportar/importar');
});

test('round-trip mantiene medidas, opciones de vista y límites canónicos', () => {
  const sanitizeState = loadSanitizer();
  const state = sanitizeState({
    elements: [],
    guests: [],
    scale: 100,
    measurements: [{ id: 7, x1: -5, y1: 50, x2: 2000, y2: 1500 }],
    bgVisible: false,
    settings: { grid: false, clearance: false, labels: false, names: false }
  });

  assert.equal(state.scale, 50);
  assert.equal(state.measurements[0].x1, 0);
  assert.equal(state.measurements[0].x2, 1448);
  assert.equal(state.measurements[0].y2, 1086);
  assert.equal(state.bgVisible, false);
  assert.deepEqual(
    JSON.parse(JSON.stringify(state.settings)),
    { grid: false, clearance: false, labels: false, names: false }
  );
});