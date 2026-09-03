import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const geometrySource = readFileSync(new URL('engine/geometry.js', root), 'utf8');
const clearanceSource = readFileSync(new URL('engine/clearance.js', root), 'utf8');
const validationSource = readFileSync(new URL('engine/validation.js', root), 'utf8');
const runtimeSource = readFileSync(new URL('phase2-validation.js', root), 'utf8');
const hostSource = readFileSync(new URL('phase2-host.js', root), 'utf8');
const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

function api(){
  const context={window:{},Object,Number,Math,Set,Map,Array};
  vm.createContext(context);
  vm.runInContext(geometrySource,context);
  vm.runInContext(clearanceSource,context);
  vm.runInContext(validationSource,context);
  return context.window.MiGranDiaDistributionEngine.validation;
}

test('Fase H permanece memory-only',()=>{
  assert.doesNotMatch(validationSource+runtimeSource,forbidden);
  assert.ok(runtimeSource.includes('memoryOnly:true'));
});

test('auditoría detecta duplicados, invitados desconocidos y asientos fuera de rango',()=>{
  const validation=api();
  const result=validation.evaluate({
    guests:[{id:'g1'}],
    elements:[{id:'t1',type:'table',capacity:4,seats:['g1',null,null,null,'gX'],widthM:2,heightM:2,x:200,y:200},{id:'t2',type:'table',capacity:4,seats:['g1',null,null,null],widthM:2,heightM:2,x:600,y:200}],
    scale:32
  });
  assert.equal(result.summary.beyondCapacity,1);
  assert.equal(result.summary.unknownGuests,1);
  assert.equal(result.summary.duplicateGuests,1);
  assert.equal(result.valid,false);
});

test('capas ocultas conservan capacidad pero no participan en proximidad visible',()=>{
  const validation=api();
  const result=validation.evaluate({guests:[],hiddenLayers:{table:true},elements:[{id:'t1',type:'table',capacity:10,seats:[],widthM:3.4,heightM:3.4,x:100,y:100},{id:'t2',type:'table',capacity:10,seats:[],widthM:3.4,heightM:3.4,x:110,y:100}],scale:32});
  assert.equal(result.summary.capacity,20);
  assert.equal(result.summary.proximityPairs,0);
  assert.equal(result.summary.hidden,2);
});

test('runtime sustituye mensajes legacy por una sola evaluación final',()=>{
  assert.ok(runtimeSource.includes('validationApi.evaluate'));
  assert.ok(runtimeSource.includes('validationMessages = function phase2FinalValidationMessages'));
  assert.ok(runtimeSource.includes('canvas:{ width:1448, height:1086 }'));
});

test('host carga Fase H después del inspector y antes del fix visual',()=>{
  assert.match(hostSource,/phase2-inspector\.js', \(\) => loadScript\(doc, 'phase2-validation\.js', \(\) => loadScript\(doc, 'phase2-visual-contract-fix\.js'\)/);
});