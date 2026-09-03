import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const base = '../../pruebas/distribucion/';
const files = [
  'engine/geometry.js','engine/collisions.js','engine/clearance.js','engine/round-table-contract.js','engine/tables.js','engine/seats.js','engine/measurements.js','engine/validation.js','state/memory-store.js','adapters/mock-app-lu.js'
];
const sources = Object.fromEntries(files.map((file)=>[file,readFileSync(new URL(base+file,import.meta.url),'utf8')]));
const phase2P0 = readFileSync(new URL(base+'phase2-p0.js',import.meta.url),'utf8');
const host = readFileSync(new URL(base+'phase2-host.js',import.meta.url),'utf8');
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

test('contrato round-current-v1 congela la mesa redonda oficial',()=>{
  const root=loadAll().MiGranDiaDistributionEngine;
  const contract=root.roundTableContract.ROUND_TABLE_CONTRACT;
  assert.equal(contract.id,'round-current-v1');
  assert.equal(contract.shape,'round');
  assert.equal(contract.capacity,10);
  assert.equal(contract.tabletopRadiusM,0.915);
  assert.equal(contract.tabletopDiameterM,1.83);
  assert.equal(contract.clearanceRadiusM,1.70);
  assert.equal(contract.clearanceDiameterM,3.40);
  assert.equal(contract.chairOrbitFactor,1.33);
  assert.equal(contract.labelOrbitFactor,2.18);
  assert.equal(contract.seatStartAngleRad,-Math.PI/2);
  assert.equal(contract.conflictColor,'#c84242');
  assert.equal(contract.selectedColor,'#d59b3c');
});

test('dimensiones visuales redondas permanecen invariantes en 18, 32 y 50 px/m',()=>{
  const api=loadAll().MiGranDiaDistributionEngine.roundTableContract;
  for(const scale of [18,32,50]){
    const d=api.dimensionsAtScale(scale);
    assert.equal(d.tabletopRadiusPx,0.915*scale);
    assert.equal(d.clearanceRadiusPx,1.70*scale);
    assert.equal(d.chairOrbitPx,0.915*scale*1.33);
    assert.equal(d.labelOrbitPx,0.915*scale*2.18);
    assert.equal(d.chairRadiusPx,Math.max(7,0.915*scale*0.12));
  }
});

test('asientos redondos empiezan arriba y mantienen reparto uniforme de 10',()=>{
  const api=loadAll().MiGranDiaDistributionEngine.roundTableContract;
  assert.equal(api.seatAngle(0),-Math.PI/2);
  assert.ok(Math.abs(api.seatAngle(5)-Math.PI/2)<1e-12);
  const angles=Array.from({length:10},(_,i)=>api.seatAngle(i));
  for(let i=1;i<angles.length;i++) assert.ok(Math.abs((angles[i]-angles[i-1])-Math.PI/5)<1e-12);
});

test('engine tables delega al contrato redondo sin duplicar valores',()=>{
  const root=loadAll().MiGranDiaDistributionEngine;
  const api=root.tables;
  const contract=root.roundTableContract.ROUND_TABLE_CONTRACT;
  assert.equal(api.contract,contract);
  assert.equal(api.TABLETOP_RADIUS_M,contract.tabletopRadiusM);
  assert.equal(api.DEFAULT_CLEARANCE_DIAMETER_M,contract.clearanceDiameterM);
  assert.equal(api.CHAIR_ORBIT_FACTOR,contract.chairOrbitFactor);
  assert.equal(api.LABEL_ORBIT_FACTOR,contract.labelOrbitFactor);
  assert.equal(api.DEFAULT_CAPACITY,contract.capacity);
  assert.equal(api.tabletopRadiusPx(32),29.28);
  assert.equal(api.chairOrbitPx(32),29.28*1.33);
  assert.equal(api.labelOrbitPx(32),29.28*2.18);
});

test('normalización de mesa actual conserva exactamente el contrato vigente',()=>{
  const api=loadAll().MiGranDiaDistributionEngine.tables;
  const table={id:'t1',type:'table',shape:'rect',capacity:16,widthM:9,heightM:2,x:100,y:100,rotation:45,seats:Array(16).fill(null)};
  api.normalizeTable(table);
  assert.equal(table.id,'t1');
  assert.equal(table.type,'table');
  assert.equal(table.shape,'table');
  assert.equal(table.capacity,10);
  assert.equal(table.widthM,3.4);
  assert.equal(table.heightM,3.4);
  assert.equal(table.x,100);
  assert.equal(table.y,100);
  assert.equal(table.rotation,45);
});

test('P0 sigue coincidiendo con el contrato congelado antes de introducir geometrías nuevas',()=>{
  assert.match(phase2P0,/const TABLETOP_RADIUS_M = 0\.915;/);
  assert.match(phase2P0,/const CHAIR_ORBIT_FACTOR = 1\.33;/);
  assert.match(phase2P0,/const LABEL_ORBIT_FACTOR = 2\.18;/);
  assert.match(phase2P0,/for \(let index = 0; index < 10; index\+\+\)/);
  assert.match(phase2P0,/#c84242/);
  assert.match(phase2P0,/#d59b3c/);
  assert.match(host,/engine\/round-table-contract\.js/);
  assert.ok(host.indexOf("'engine/round-table-contract.js'") < host.indexOf("'engine/tables.js'"));
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