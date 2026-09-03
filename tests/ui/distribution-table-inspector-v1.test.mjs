import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const uiSource = readFileSync(new URL('ui/inspector.js', root), 'utf8');
const runtimeSource = readFileSync(new URL('phase2-inspector.js', root), 'utf8');
const hostSource = readFileSync(new URL('phase2-host.js', root), 'utf8');
const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

test('Fase G permanece aislada de persistencia real', () => {
  assert.doesNotMatch(uiSource + runtimeSource, forbidden);
  assert.ok(runtimeSource.includes('memoryOnly:true'));
});

test('modelo del inspector resume forma capacidad bloqueo y asientos', () => {
  const context = { window:{}, Object, Number, String, Boolean, Math, TypeError };
  vm.createContext(context);
  vm.runInContext(uiSource, context);
  const api = context.window.MiGranDiaDistributionUIInspector;
  const model = api.tableInspectorModel({ type:'table', id:'t1', tableShape:'rectangular', capacity:6, seats:['g1',null,'g3',null,null,null], label:'Mesa A', color:'#ffffff', rotation:30, locked:true });
  assert.equal(model.shape, 'rectangular');
  assert.equal(model.capacity, 6);
  assert.equal(model.locked, true);
  assert.deepEqual({ ...model.seats }, { capacity:6, occupied:2, free:4 });
});

test('inspector definitivo expone forma capacidad nombre color rotación bloqueo y estado de asientos', () => {
  for (const token of ['tableInspectorShape','tableInspectorCapacity','selLabel','selColor','selRot','btnToggleLock','tableInspectorOccupied','tableInspectorFree']) {
    assert.ok(runtimeSource.includes(token), token);
  }
});

test('forma y capacidad delegan únicamente a transición unificada', () => {
  assert.ok(runtimeSource.includes('capacityApi.transitionTable(table, request)'));
  assert.ok(runtimeSource.includes("applyTransition({ shape: shapeSelect.value })"));
  assert.ok(runtimeSource.includes('applyTransition({ capacity: Number(capacitySelect.value) })'));
  assert.doesNotMatch(runtimeSource, /table\.tableShape\s*=/);
  assert.doesNotMatch(runtimeSource, /table\.capacity\s*=/);
});

test('no usa MutationObserver y refresca desde el ciclo render existente', () => {
  assert.doesNotMatch(runtimeSource, /MutationObserver/);
  assert.ok(runtimeSource.includes('const legacyRender = render'));
  assert.ok(runtimeSource.includes('refresh();'));
});

test('host carga inspector después de capacity runtime', () => {
  assert.match(hostSource, /phase2-capacity\.js', \(\) => loadScript\(doc, 'phase2-inspector\.js'\)/);
});
