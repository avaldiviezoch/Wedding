import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../pruebas/distribucion/phase2-sanitize.js', import.meta.url), 'utf8');
const host = readFileSync(new URL('../../pruebas/distribucion/phase2-host.js', import.meta.url), 'utf8');
const forbiddenPersistence = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

class ClassList {
  constructor(...values) { this.values = new Set(values); }
  add(...values) { values.forEach((value) => this.values.add(value)); }
  remove(...values) { values.forEach((value) => this.values.delete(value)); }
  contains(value) { return this.values.has(value); }
}

function makeNode() {
  return {
    classList: new ClassList(), listeners: {}, scrollLeft: 0, scrollTop: 0, dataset: {},
    addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); },
    replaceChildren() {},
    getBoundingClientRect() { return { left: 0, top: 0, right: 390, bottom: 640, width: 390, height: 640 }; }
  };
}

function runtime() {
  const planner = makeNode();
  const canvasWrap = makeNode();
  const drawLayer = makeNode();
  const guideLayer = makeNode();
  const context = {
    console, Math, Object, Array, Number, String, Boolean, Set, Map, JSON, Date,
    document: { documentElement: { dataset: {} }, getElementById(id) { return id === 'canvasWrap' ? canvasWrap : null; } },
    window: {}, requestAnimationFrame(fn) { fn(); }, currentScale() { return context.scale; }, scale: 32,
    planner, drawLayer, guideLayer, elements: [], selectedIds: [], selectedId: '', hiddenLayers: {},
    measureDraft: null, drawingTent: false, tentDraft: [], tentHoverPoint: null,
    guideLines: { vertical: null, horizontal: null }, zoom: 1, renderCount: 0,
    render() { context.renderCount += 1; },
    getItem(id) { return context.elements.find((item) => item.id === id) || null; },
    commitMutation() {},
    restoreState(state) {
      context.elements = JSON.parse(JSON.stringify(state.elements || []));
      context.selectedIds = [...(state.selectedIds || [])];
      context.selectedId = state.selectedId || '';
      context.hiddenLayers = { ...(state.hiddenLayers || {}) };
    },
    pointInPolygon(point, poly) {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i], b = poly[j];
        if (((a.y > point.y) !== (b.y > point.y)) && (point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y || 1e-9) + a.x)) inside = !inside;
      }
      return inside;
    },
    pointSegmentDistance(p, a, b) {
      const dx = b.x - a.x, dy = b.y - a.y, len = dx * dx + dy * dy;
      if (!len) return Math.hypot(p.x - a.x, p.y - a.y);
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len));
      return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
    },
    rectPolygon(item) {
      const s = context.scale, hw = item.widthM * s / 2, hh = item.heightM * s / 2;
      const angle = (item.rotation || 0) * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
      return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([x,y]) => ({ x: item.x + x*cos - y*sin, y: item.y + x*sin + y*cos }));
    },
    circleGeom(item) { return { x: item.x, y: item.y, r: item.widthM * context.scale / 2 }; },
    polygonIntersectsPolygon() { return false; }, intersects() { return false; }
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'phase2-sanitize.js' });
  return { context, api: context.window.MiGranDiaDistributionSanitization, canvasWrap };
}

function squareMeters(centerXM, centerYM, sizeM, scale) {
  const h = sizeM * scale / 2, x = centerXM * scale, y = centerYM * scale;
  return [{x:x-h,y:y-h},{x:x+h,y:y-h},{x:x+h,y:y+h},{x:x-h,y:y+h}];
}

function rotatedRect(cx, cy, width, height, angleDeg) {
  const a = angleDeg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), hw = width/2, hh = height/2;
  return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([x,y]) => ({x:cx+x*c-y*s,y:cy+x*s+y*c}));
}

test('saneamiento carga al final y permanece memory-only', () => {
  assert.match(host, /script\.onload\s*=\s*\(\)\s*=>\s*loadSanitize\(doc\)/);
  assert.match(host, /phase2-sanitize\.js\?v=20260903-sanitize-1/);
  assert.doesNotMatch(source, forbiddenPersistence);
  assert.doesNotThrow(() => new Function(source));
});

test('tolerancias son físicas en escalas 18, 32 y 50 px\/m', () => {
  const { api } = runtime();
  assert.equal(api.tolerancesMeters.sat, 3 / 32);
  assert.equal(api.tolerancesMeters.circle, 5 / 32);
  for (const scale of [18, 32, 50]) {
    assert.equal(api.metersToPx(api.tolerancesMeters.sat, scale), scale * 3 / 32);
    assert.equal(api.satIntersects(squareMeters(2,2,1,scale), squareMeters(2.8,2,1,scale), scale), true);
    assert.equal(api.satIntersects(squareMeters(2,2,1,scale), squareMeters(3.2,2,1,scale), scale), false);
  }
});

test('SAT mantiene resultados con rectángulos rotados', () => {
  const { api } = runtime();
  for (const scale of [18, 32, 50]) {
    const a = rotatedRect(300, 300, 3 * scale, 1.2 * scale, 37);
    const b = rotatedRect(330, 310, 2 * scale, 1 * scale, -28);
    const c = rotatedRect(700, 700, 2 * scale, 1 * scale, -28);
    assert.equal(api.satIntersects(a, b, scale), true);
    assert.equal(api.satIntersects(a, c, scale), false);
  }
});

test('capas ocultas son visuales y no destructivas', () => {
  const { api } = runtime();
  assert.deepEqual(JSON.parse(JSON.stringify(api.hiddenLayerPolicy)), {
    visualOnly: true, keepsCapacity: true, keepsAssignments: true,
    participatesInConflicts: false, participatesInProximity: false
  });
});

test('límites usan geometría completa, incluida rotación', () => {
  const { api } = runtime();
  const rect = { id:'r1', type:'bar', shape:'rect', x:1440, y:1078, widthM:4, heightM:1.2, rotation:45 };
  assert.equal(api.clampItemToCanvas(rect, 32), true);
  const half = api.itemHalfExtents(rect, 32);
  assert.ok(rect.x <= 1448 - half.x + 1e-9);
  assert.ok(rect.y <= 1086 - half.y + 1e-9);
  const table = { id:'t1', type:'table', shape:'table', x:2, y:2, widthM:3.4, heightM:3.4, rotation:0 };
  api.clampItemToCanvas(table, 32);
  assert.equal(table.x, 54.4);
  assert.equal(table.y, 54.4);
});

test('restore limpia selección inválida y estados transitorios', () => {
  const { context } = runtime();
  context.measureDraft = { start:{x:1,y:1}, end:{x:2,y:2} };
  context.drawingTent = true; context.tentDraft = [{x:1,y:1}]; context.tentHoverPoint = {x:2,y:2};
  context.guideLines = { vertical: 100, horizontal: 200 };
  context.restoreState({ elements: [{ id:'visible', type:'bar', shape:'rect', x:200, y:200, widthM:1, heightM:1 }], selectedIds: ['missing','visible'], selectedId: 'missing', hiddenLayers: {} });
  assert.deepEqual(Array.from(context.selectedIds), ['visible']);
  assert.equal(context.selectedId, 'visible');
  assert.equal(context.measureDraft, null);
  assert.equal(context.drawingTent, false);
  assert.deepEqual(Array.from(context.tentDraft), []);
  assert.equal(context.tentHoverPoint, null);
  assert.equal(context.guideLines.vertical, null);
  assert.equal(context.guideLines.horizontal, null);
});

test('touch conserva ancla de viewport durante pinch', () => {
  const { api, canvasWrap } = runtime();
  assert.equal(api.touchFocusPreserved, true);
  assert.match(source, /contentX: \(canvasWrap\.scrollLeft \+ midpoint\.x - rect\.left\) \/ \(Number\(zoom\) \|\| 1\)/);
  assert.match(source, /canvasWrap\.scrollLeft = Math\.max\(0, pinchViewport\.contentX \* nextZoom - pinchViewport\.localX\)/);
  assert.ok(Array.isArray(canvasWrap.listeners.pointerdown));
  assert.ok(Array.isArray(canvasWrap.listeners.pointermove));
  assert.ok(Array.isArray(canvasWrap.listeners.pointercancel));
});
