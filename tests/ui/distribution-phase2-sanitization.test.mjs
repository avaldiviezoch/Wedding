import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../pruebas/distribucion/${path}`, import.meta.url), 'utf8');
const geometrySource = read('engine/geometry.js');
const collisionsSource = read('engine/collisions.js');
const clearanceSource = read('engine/clearance.js');
const source = read('phase2-sanitize.js');
const host = read('phase2-host.js');
const forbiddenPersistence = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

function makeNode() {
  return { listeners:{}, scrollLeft:0, scrollTop:0, dataset:{}, addEventListener(type, fn){(this.listeners[type] ||= []).push(fn);}, replaceChildren(){}, getBoundingClientRect(){return {left:0,top:0,width:390,height:640};} };
}

function runtime() {
  const planner = makeNode(), canvasWrap = makeNode(), drawLayer = makeNode(), guideLayer = makeNode();
  const context = {
    console, Math, Object, Array, Number, String, Boolean, Set, Map, JSON, Date,
    document:{documentElement:{dataset:{}},getElementById(id){return id==='canvasWrap'?canvasWrap:null;}},
    window:{}, requestAnimationFrame(fn){fn();}, scale:32, currentScale(){return context.scale;},
    planner, canvasWrap, drawLayer, guideLayer, elements:[], selectedIds:[], selectedId:'', hiddenLayers:{},
    measureDraft:null, drawingTent:false, tentDraft:[], tentHoverPoint:null, guideLines:{vertical:null,horizontal:null}, zoom:1,
    render(){}, getItem(id){return context.elements.find((item)=>item.id===id)||null;}, commitMutation(){},
    restoreState(state){context.elements=JSON.parse(JSON.stringify(state.elements||[]));context.selectedIds=[...(state.selectedIds||[])];context.selectedId=state.selectedId||'';context.hiddenLayers={...(state.hiddenLayers||{})};},
    pointInPolygon(point, poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a.y>point.y)!==(b.y>point.y))&&(point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y||1e-9)+a.x))inside=!inside;}return inside;},
    pointSegmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;if(!len)return Math.hypot(p.x-a.x,p.y-a.y);const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len));return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));},
    rectPolygon(item){const s=context.scale,hw=item.widthM*s/2,hh=item.heightM*s/2,a=(item.rotation||0)*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([x,y])=>({x:item.x+x*c-y*sn,y:item.y+x*sn+y*c}));},
    circleGeom(item){return{x:item.x,y:item.y,r:item.widthM*context.scale/2};}, polygonIntersectsPolygon(){return false;}, intersects(){return false;}
  };
  context.window.window = context.window;
  vm.createContext(context);
  for (const [name, code] of [['geometry.js',geometrySource],['collisions.js',collisionsSource],['clearance.js',clearanceSource],['phase2-sanitize.js',source]]) vm.runInContext(code, context, {filename:name});
  return {context, api:context.window.MiGranDiaDistributionSanitization, canvasWrap};
}

function squareMeters(cx,cy,size,scale){const h=size*scale/2,x=cx*scale,y=cy*scale;return[{x:x-h,y:y-h},{x:x+h,y:y-h},{x:x+h,y:y+h},{x:x-h,y:y+h}];}

test('engine modular carga antes del saneamiento y sigue memory-only',()=>{
  assert.match(host,/engine\/geometry\.js/);
  assert.match(host,/engine\/collisions\.js/);
  assert.match(host,/engine\/clearance\.js/);
  assert.match(host,/loadEngine\(doc, \(\) => loadScript\(doc, 'phase2-sanitize\.js'/);
  assert.doesNotMatch([geometrySource,collisionsSource,clearanceSource,source].join('\n'),forbiddenPersistence);
});

test('saneamiento delega colisiones y límites al engine modular',()=>{
  const {api}=runtime();
  assert.equal(api.engineModular,true);
  assert.equal(api.tolerancesMeters.sat,3/32);
  for(const scale of [18,32,50]){
    assert.equal(api.metersToPx(api.tolerancesMeters.sat,scale),scale*3/32);
    assert.equal(api.satIntersects(squareMeters(2,2,1,scale),squareMeters(2.8,2,1,scale),scale),true);
    assert.equal(api.satIntersects(squareMeters(2,2,1,scale),squareMeters(3.2,2,1,scale),scale),false);
  }
});

test('política de capas ocultas se conserva',()=>{
  const {api}=runtime();
  assert.deepEqual(JSON.parse(JSON.stringify(api.hiddenLayerPolicy)),{visualOnly:true,keepsCapacity:true,keepsAssignments:true,participatesInConflicts:false,participatesInProximity:false});
});

test('límites conservan geometría completa',()=>{
  const {api}=runtime();
  const rect={type:'bar',shape:'rect',x:1440,y:1078,widthM:4,heightM:1.2,rotation:45};
  assert.equal(api.clampItemToCanvas(rect,32),true);
  const half=api.itemHalfExtents(rect,32);
  assert.ok(rect.x<=1448-half.x+1e-9);
  assert.ok(rect.y<=1086-half.y+1e-9);
});

test('restore limpia referencias y transitorios',()=>{
  const {context}=runtime();
  context.measureDraft={};context.drawingTent=true;context.tentDraft=[{x:1,y:1}];context.tentHoverPoint={x:2,y:2};context.guideLines={vertical:10,horizontal:20};
  context.restoreState({elements:[{id:'ok',type:'bar',shape:'rect',x:200,y:200,widthM:1,heightM:1}],selectedIds:['missing','ok'],selectedId:'missing',hiddenLayers:{}});
  assert.deepEqual(Array.from(context.selectedIds),['ok']);assert.equal(context.selectedId,'ok');assert.equal(context.measureDraft,null);assert.equal(context.drawingTent,false);assert.deepEqual(Array.from(context.tentDraft),[]);
});

test('pinch conserva ancla visual',()=>{
  const {api,canvasWrap}=runtime();
  assert.equal(api.touchFocusPreserved,true);
  assert.ok(Array.isArray(canvasWrap.listeners.pointerdown));
  assert.ok(Array.isArray(canvasWrap.listeners.pointermove));
  assert.ok(Array.isArray(canvasWrap.listeners.pointercancel));
});