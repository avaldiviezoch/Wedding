import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const paths = [
  'renderer/tables.js','renderer/chairs.js','renderer/labels.js','renderer/tents.js',
  'ui/planner.js','ui/inspector.js','ui/layers.js','ui/risks.js','ui/proposals.js','ui/mobile.js',
  'phase2-renderer-ui-bridge.js'
];
const sources = Object.fromEntries(paths.map((path) => [path, readFileSync(new URL(path, root), 'utf8')]));
const host = readFileSync(new URL('phase2-host.js', root), 'utf8');
const forbiddenPersistence = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

function load(path) {
  const context = { window: {}, Math, Object, Number, String, TypeError };
  vm.createContext(context);
  vm.runInContext(sources[path], context, { filename: path });
  return context.window;
}

test('renderer y UI permanecen sin persistencia ni dependencias de App Lu real', () => {
  for (const path of paths) assert.doesNotMatch(sources[path], forbiddenPersistence, path);
});

test('host carga engine, saneamiento y luego renderer/UI de forma secuencial', () => {
  assert.match(host, /const RENDERER_UI_SCRIPTS = \[/);
  assert.match(host, /'renderer\/tables\.js'/);
  assert.match(host, /'ui\/mobile\.js'/);
  assert.match(host, /loadScript\(doc, 'phase2-sanitize\.js', \(\) => loadRendererUi\(doc\)\)/);
  assert.match(host, /phase2-renderer-ui-bridge\.js/);
});

test('chairs conserva distribución angular oficial de mesa redonda', () => {
  const api = load('renderer/chairs.js').MiGranDiaDistributionRendererChairs;
  const top = api.chairPosition(0, 10, 100);
  assert.ok(Math.abs(top.x) < 1e-9);
  assert.ok(Math.abs(top.y + 100) < 1e-9);
  const opposite = api.chairPosition(5, 10, 100);
  assert.ok(Math.abs(opposite.x) < 1e-9);
  assert.ok(Math.abs(opposite.y - 100) < 1e-9);
});

test('labels conserva truncado y text-anchor legacy', () => {
  const api = load('renderer/labels.js').MiGranDiaDistributionRendererLabels;
  assert.equal(api.guestAnchor(0), 'start');
  assert.equal(api.guestAnchor(Math.PI), 'end');
  assert.equal(api.guestAnchor(Math.PI / 2), 'middle');
  assert.equal(api.compactName('1234567890123456789', 18), '12345678901234567…');
});

test('renderer tables y tents delegan sin transformar argumentos', () => {
  let tableArgs; let tentArg;
  const tables = load('renderer/tables.js').MiGranDiaDistributionRendererTables.createTableRenderer({
    renderTable: (...args) => { tableArgs = args; return 'table-dom'; }
  });
  const tents = load('renderer/tents.js').MiGranDiaDistributionRendererTents.createTentRenderer({
    renderTent: (item) => { tentArg = item; return 'tent-dom'; }
  });
  const conflicts = new Set(['x']);
  const item = { id: 't1' };
  assert.equal(tables.render(item, 32, conflicts), 'table-dom');
  assert.deepEqual(tableArgs, [item, 32, conflicts]);
  assert.equal(tents.render(item), 'tent-dom');
  assert.equal(tentArg, item);
});

test('UI módulos son adaptadores explícitos y no duplican estado', () => {
  const layersWindow = load('ui/layers.js');
  let layerCalls = 0;
  const layers = layersWindow.MiGranDiaDistributionUILayers.createLayersUI({ renderLayerList: () => layerCalls++ });
  layers.render();
  assert.equal(layerCalls, 1);

  const mobileWindow = load('ui/mobile.js');
  let closed = 0;
  const mobile = mobileWindow.MiGranDiaDistributionUIMobile.createMobileUI({ closePanels: () => closed++ });
  mobile.close();
  assert.equal(closed, 1);
});

test('bridge declara modo compatibilidad y delega los puntos de extensión', () => {
  const source = sources['phase2-renderer-ui-bridge.js'];
  assert.match(source, /compatibilityMode: true/);
  assert.match(source, /noVisualChange: true/);
  assert.match(source, /renderTable = \(item, scale, conflicts\) => tables\.render/);
  assert.match(source, /guestAnchor = \(angle\) => labels\.guestAnchor/);
  assert.match(source, /renderLayerList = \(\) => layersUi\.render/);
  assert.match(source, /renderValidation = \(\) => risksUi\.render/);
  assert.match(source, /renderProposalList = \(\) => proposalsUi\.render/);
});
