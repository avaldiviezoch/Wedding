import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const base = '../../pruebas/distribucion/';
const files = [
  'engine/geometry.js','engine/collisions.js','engine/clearance.js','engine/tables.js','engine/seats.js','engine/measurements.js','engine/validation.js','state/memory-store.js','adapters/mock-app-lu.js'
];
const sources = Object.fromEntries(files.map((file)=>[file,readFileSync(new URL(base+file,import.meta.url),'utf8')]));
const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

function loadAll(){
  const context={window:{},console,Math,Object,Array,Number,String,Boolean,Set,Map,JSON,Date};
  context.window.window=context.window;
  vm.createContext(context);
  for(const file of files) vm.runInContext(sources[file],context,{filename:file});
  return context.window;
}

test('módulos son puros respecto a persistencia real',()=>{
  for(const [file,source] of Object.entries(sources)) assert.doesNotMatch(source,forbidden,file);
});

test('geometry conserva conversiones y límites oficiales',()=>{
  const api=loadAll().MiGranDiaDistributionEngine.geometry;
  assert.equal(api.CANVAS_W,1448);assert.equal(api.CANVAS_H,1086);
  assert.equal(api.metersToPx(0.915,32),29.28);
  assert.equal(api.pxToMeters(54.4,32),1.7);
  const table={type:'table',shape:'table',x:1,y:1,widthM:3.4,heightM:3.4,rotation:0};
  api.clampItemToCanvas(table,32);
  assert.equal(table.x,54.4);assert.equal(table.y,54.4);
});

test('collisions conserva tolerancias físicas legacy',()=>{
  const api=loadAll().MiGranDiaDistributionEngine.collisions;
  assert.equal(api.TOLERANCES_M.sat,3/32);
  assert.equal(api.TOLERANCES_M.circle,5/32);
  for(const scale of [18,32,50]){
    const a={x:0,y:0,r:1.7*scale};
    const b={x:3.2*scale,y:0,r:1.7*scale};
    assert.equal(api.circleCircleIntersects(a,b,scale),true);
    const c={x:3.6*scale,y:0,r:1.7*scale};
    assert.equal(api.circleCircleIntersects(a,c,scale),false);
  }
});

test('mesa redonda actual queda congelada como contrato de regresión',()=>{
  const api=loadAll().MiGranDiaDistributionEngine.tables;
  assert.equal(api.TABLETOP_RADIUS_M,0.915);
  assert.equal(api.DEFAULT_CLEARANCE_DIAMETER_M,3.4);
  assert.equal(api.CHAIR_ORBIT_FACTOR,1.33);
  assert.equal(api.LABEL_ORBIT_FACTOR,2.18);
  assert.equal(api.DEFAULT_CAPACITY,10);
  assert.equal(api.tabletopRadiusPx(32),29.28);
});

test('seats no elimina ocupantes al evaluar reducción',()=>{
  const api=loadAll().MiGranDiaDistributionEngine.seats;
  const table={capacity:10,seats:['g1','g2','g3',null,null,null,null,null,null,null]};
  assert.equal(api.occupiedSeatCount(table),3);
  assert.equal(api.canReduceCapacity(table,2),false);
  assert.equal(api.canReduceCapacity(table,4),true);
  assert.deepEqual(Array.from(table.seats),['g1','g2','g3',null,null,null,null,null,null,null]);
});

test('measurements y validation son independientes de DOM',()=>{
  const root=loadAll().MiGranDiaDistributionEngine;
  assert.equal(root.measurements.distanceM({x1:0,y1:0,x2:96,y2:0},32),3);
  const tables=[{capacity:10,seats:['g1']},{capacity:10,seats:[]}];
  assert.deepEqual(JSON.parse(JSON.stringify(root.validation.capacitySummary(tables,12))),{capacity:20,guests:12,sufficient:true});
  assert.deepEqual(root.validation.unassignedGuests([{id:'g1'},{id:'g2'}],tables).map((g)=>g.id),['g2']);
});

test('memory-store y adapter mock permanecen solo en memoria',()=>{
  const window=loadAll();
  const store=window.MiGranDiaDistributionState.createMemoryStore({count:1});
  store.update((draft)=>{draft.count=2;});
  assert.equal(store.getState().count,2);
  const adapter=window.MiGranDiaDistributionAdapters.createMockAppLuAdapter({guests:[{id:'g1'}],tables:[{id:'t1',seats:['g1']}]});
  assert.equal(adapter.mode,'memory-only');
  assert.equal(adapter.getGuests()[0].id,'g1');
  assert.equal(adapter.getTables()[0].seats[0],'g1');
});