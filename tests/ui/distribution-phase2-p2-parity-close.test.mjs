import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const p2Source = readFileSync(new URL('../../pruebas/distribucion/phase2-p2.js', import.meta.url), 'utf8');
const closeSource = readFileSync(new URL('../../pruebas/distribucion/phase2-p2-close.js', import.meta.url), 'utf8');
const closeCss = readFileSync(new URL('../../pruebas/distribucion/phase2-p2-close.css', import.meta.url), 'utf8');

const forbiddenPersistence = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

test('P2.1 permanece completamente aislado de persistencia real', () => {
  assert.doesNotMatch(`${closeSource}\n${closeCss}`, forbiddenPersistence);
  assert.doesNotThrow(() => new Function(closeSource));
});

test('saneamiento JSON ejecutable conserva estado válido y elimina referencias inválidas', () => {
  const instrumented = p2Source.replace(
    '  buildDesktopActions();',
    '  globalThis.__p2Test = { sanitizeState };\n  return;\n\n  buildDesktopActions();'
  );
  assert.notEqual(instrumented, p2Source, 'debe poder instrumentarse sanitizeState');

  const context = {
    document: { documentElement: { dataset: {} } },
    console
  };
  vm.createContext(context);
  vm.runInContext(instrumented, context, { filename: 'phase2-p2.js' });

  const raw = {
    elements: [
      {
        id: 'table-1', type: 'table', shape: 'table', label: 'Mesa 1',
        x: 99999, y: -20, widthM: 3.4, heightM: 3.4, rotation: 15,
        color: '#d9b978', seats: ['guest-1', 'guest-missing']
      },
      { id: 'bad-1', type: 'script', x: 1, y: 1 }
    ],
    guests: [{ id: 'guest-1', name: 'Lucero' }],
    selectedIds: ['table-1', 'bad-1'],
    selectedId: 'table-1',
    scale: 32,
    measurements: [{ id: 1, x1: 10, y1: 20, x2: 30, y2: 40 }],
    hiddenLayers: { table: false, script: true },
    lockedLayers: { table: true },
    bgVisible: true,
    settings: { grid: true, clearance: true, labels: true, names: true }
  };

  const once = context.__p2Test.sanitizeState(raw);
  const roundTrip = context.__p2Test.sanitizeState(JSON.parse(JSON.stringify(once)));

  assert.equal(once.elements.length, 1);
  assert.equal(once.elements[0].type, 'table');
  assert.equal(once.elements[0].x, 1448);
  assert.equal(once.elements[0].y, 0);
  assert.equal(once.elements[0].capacity, 10);
  assert.equal(once.elements[0].seats.length, 10);
  assert.equal(once.elements[0].seats[0], 'guest-1');
  assert.equal(once.elements[0].seats[1], null);
  assert.deepEqual(Array.from(once.selectedIds), ['table-1']);
  assert.equal(once.hiddenLayers.script, undefined);
  assert.equal(JSON.stringify(roundTrip), JSON.stringify(once), 'exportar/importar el estado saneado debe ser estable');
});

test('motor de posición del FAB reproduce apertura arriba/abajo según espacio', () => {
  const context = {
    document: {
      documentElement: { dataset: {} },
      readyState: 'loading',
      addEventListener() {},
      getElementById() { return null; },
      querySelector() { return null; }
    },
    window: { innerHeight: 800, addEventListener() {}, setTimeout() {} },
    requestAnimationFrame() {},
    console
  };
  vm.createContext(context);
  vm.runInContext(closeSource, context, { filename: 'phase2-p2-close.js' });

  const api = context.window.MiGranDiaDistributionPhase2P2Parity;
  assert.equal(api.computeFabMenuDirection({ fabTop: 100, fabBottom: 156, menuHeight: 300, viewportHeight: 800 }), 'down');
  assert.equal(api.computeFabMenuDirection({ fabTop: 600, fabBottom: 656, menuHeight: 240, viewportHeight: 800 }), 'up');
  assert.equal(api.computeFabBottomForPanel({ panelTop: 500, viewportHeight: 800, buttonHeight: 56 }), 310);
  assert.equal(api.computeFabBottomForPanel({ panelTop: 50, viewportHeight: 800, buttonHeight: 56 }), 656);
});

test('P2.1 incorpora Escape y seguimiento del FAB sobre sheets', () => {
  assert.match(closeSource, /event\.key !== 'Escape'/);
  assert.match(closeSource, /positionFabAboveOpenSheet/);
  assert.match(closeSource, /computeFabBottomForPanel/);
  assert.match(closeSource, /computeFabMenuDirection/);
  assert.match(closeSource, /orientationchange/);
  assert.match(closeCss, /data-menu-direction/);
  assert.match(closeCss, /menu-down/);
  assert.match(closeCss, /menu-up/);
});