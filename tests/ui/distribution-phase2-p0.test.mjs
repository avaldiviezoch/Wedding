import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../pruebas/distribucion/phase2.html', import.meta.url), 'utf8');
const host = readFileSync(new URL('../../pruebas/distribucion/phase2-host.js', import.meta.url), 'utf8');
const source = readFileSync(new URL('../../pruebas/distribucion/phase2-p0.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../pruebas/distribucion/phase2-p0.css', import.meta.url), 'utf8');

function makeSvgNode(tag, attrs = {}) {
  return {
    tag,
    attrs: { ...attrs },
    children: [],
    textContent: '',
    appendChild(child) { this.children.push(child); return child; },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    querySelector() { return null; }
  };
}

function runtimeContext() {
  const floor = makeSvgNode('rect');
  const planner = makeSvgNode('svg');
  planner.dataset = {};
  planner.querySelector = (selector) => selector === '.floor' ? floor : null;
  const bgImage = makeSvgNode('rect');
  const gridLayer = makeSvgNode('rect');
  const centerButton = { addEventListener() {} };

  const context = {
    console,
    Math,
    Set,
    Map,
    Object,
    Array,
    Number,
    String,
    Boolean,
    JSON,
    Date,
    window: {},
    document: {
      documentElement: { dataset: {} },
      getElementById(id) { return id === 'btnCenter' ? centerButton : null; },
      createElement() { return makeSvgNode('div'); }
    },
    planner,
    bgImage,
    gridLayer,
    guideLayer: makeSvgNode('g'),
    validationBox: { before() {}, innerHTML: '' },
    elements: [],
    measurements: [],
    proposals: [],
    nextPosition() {},
    initialState() {},
    applySmartGuides() {},
    renderGuideLayer() {},
    renderTable() {},
    polygonIntersectsPolygon() {},
    renderValidation() {},
    validationMessages() { return []; },
    conflictIds() { return new Set(); },
    getVisibleElements() { return []; },
    currentScale() { return 32; },
    render() {},
    updateSelected() {},
    seedGuests() {},
    addElement() { return { id: 'table-1' }; },
    setSelection() {},
    hiddenLayers: {},
    lockedLayers: {},
    measurementUid: 1,
    scaleInput: { value: 32 },
    showGrid: { checked: true },
    showClearance: { checked: true },
    showLabels: { checked: true },
    showNames: { checked: true },
    bgVisible: true,
    zoom: 1,
    setZoom() {},
    historyPast: [],
    historyFuture: [],
    pushHistory() {},
    svgEl: makeSvgNode,
    ensureTableSeats() {},
    isSelected() { return false; },
    guestById() { return null; },
    compactName(value, max = 18) { return String(value).slice(0, max); },
    appendRotateHandle() {},
    guestUid: 1
  };

  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'phase2-p0.js' });
  return { context, planner, floor, bgImage, gridLayer };
}

test('Fase 2 se mantiene aislada y carga el baseline en una vista separada', () => {
  assert.match(html, /id="phase2Frame"/);
  assert.match(html, /src="index\.html\?phase=2-p0&v=20260903-runtime-scope1"/);
  assert.match(host, /phase2-p0\.js/);
  assert.match(host, /phase2-p0\.css/);

  const isolated = `${html}\n${host}\n${source}\n${css}`;
  assert.doesNotMatch(isolated, /\blocalStorage\b/);
  assert.doesNotMatch(isolated, /\bsessionStorage\b/);
  assert.doesNotMatch(isolated, /\bindexedDB\b/);
  assert.doesNotMatch(isolated, /\b(?:firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i);
});

test('canvas P0 usa exactamente 1448 × 1086 y centro 724 / 543', () => {
  const { context, planner, floor, bgImage, gridLayer } = runtimeContext();
  const contract = context.window.MiGranDiaDistributionPhase2P0;

  assert.equal(contract.canvas.width, 1448);
  assert.equal(contract.canvas.height, 1086);
  assert.equal(contract.canvas.centerX, 724);
  assert.equal(contract.canvas.centerY, 543);
  assert.equal(planner.attrs.viewBox, '0 0 1448 1086');
  for (const node of [floor, bgImage, gridLayer]) {
    assert.equal(node.attrs.width, '1448');
    assert.equal(node.attrs.height, '1086');
  }

  const snapped = context.applySmartGuides(720, 540, []);
  assert.deepEqual({ x: snapped.x, y: snapped.y }, { x: 724, y: 543 });
});

test('mesa circular mantiene tablero físico fijo y clearance independiente', () => {
  const { context } = runtimeContext();
  const contract = context.window.MiGranDiaDistributionPhase2P0.table;
  assert.equal(contract.tabletopRadiusM, 0.915);
  assert.equal(contract.clearanceDiameterM, 3.4);
  assert.equal(contract.chairOrbitFactor, 1.33);
  assert.equal(contract.labelOrbitFactor, 2.18);
  assert.equal(contract.clearanceMarginM, 0.60);

  const item = {
    id: 'table-1', type: 'table', widthM: 3.4, heightM: 3.4,
    x: 724, y: 543, rotation: 0, capacity: 10, color: '#d9b978',
    label: 'Mesa 1', seats: Array(10).fill(null)
  };
  const groupA = context.renderTable(item, 32, new Set());
  const clearanceA = groupA.children.find((node) => node.attrs?.class === 'clearance');
  const tabletopA = groupA.children.find((node) => node.attrs?.class === 'tabletop');
  const chairsA = groupA.children.filter((node) => node.attrs?.class === 'chair-wrap');

  assert.equal(Number(clearanceA.attrs.r), 54.4);
  assert.equal(Number(tabletopA.attrs.r), 29.28);
  assert.equal(chairsA.length, 10);
  assert.match(chairsA[0].attrs.transform, /translate\(0\.0 -38\.9/);

  item.widthM = 5;
  item.heightM = 5;
  const groupB = context.renderTable(item, 32, new Set());
  const clearanceB = groupB.children.find((node) => node.attrs?.class === 'clearance');
  const tabletopB = groupB.children.find((node) => node.attrs?.class === 'tabletop');

  assert.equal(Number(clearanceB.attrs.r), 80);
  assert.equal(Number(tabletopB.attrs.r), 29.28, 'el tablero no debe crecer al cambiar el área funcional');
});

test('colisión rectangular usa SAT con tolerancia legacy de 3 px', () => {
  const { context } = runtimeContext();
  const square = (x0, y0, size) => [
    { x: x0, y: y0 },
    { x: x0 + size, y: y0 },
    { x: x0 + size, y: y0 + size },
    { x: x0, y: y0 + size }
  ];

  assert.equal(context.polygonIntersectsPolygon(square(0, 0, 20), square(15, 0, 20)), true);
  assert.equal(context.polygonIntersectsPolygon(square(0, 0, 20), square(30, 0, 20)), false);
  assert.match(source, /RECT_SAT_TOLERANCE_PX = 3/);
  assert.match(source, /axesForPhase2/);
  assert.match(source, /projectPhase2/);
});

test('P0 conserva la regla adicional de 60 cm y el rojo de conflicto', () => {
  assert.match(source, /TABLE_CLEARANCE_MARGIN_M = 0\.60/);
  assert.match(source, /menos de 60 cm libres entre sus áreas de circulación/);
  assert.match(source, /'#c84242'/);
  assert.match(source, /invaden áreas funcionales/);
});

test('P0 oculta el CRUD maestro de invitados pero conserva el editor de asientos del baseline', () => {
  assert.match(css, /\.guest-manager-section > \.field/);
  assert.match(css, /\.guest-manager-section \.guest-list/);
  assert.match(css, /\.guest-manager-section \.guest-add-row/);
  assert.match(css, /\.guest-manager-section \.bulk-box/);

  const baseline = readFileSync(new URL('../../pruebas/distribucion/index.html', import.meta.url), 'utf8');
  assert.match(baseline, /id="seatEditor"/);
  assert.match(baseline, /id="seatEditorWrap"/);
  assert.match(baseline, /id="btnAssignSequential"/);
  assert.match(baseline, /id="btnClearAssignments"/);
});
