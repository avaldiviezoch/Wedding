const NS='http://www.w3.org/2000/svg';
const planner=document.getElementById('planner');
const itemsLayer=document.getElementById('itemsLayer');
const drawLayer=document.getElementById('drawLayer');
const measureLayer=document.getElementById('measureLayer');
const guideLayer=document.getElementById('guideLayer');
const gridLayer=document.getElementById('gridLayer');
const bgImage=document.getElementById('bgImage');
const scaleInput=document.getElementById('scaleInput');
const showGrid=document.getElementById('showGrid');
const showClearance=document.getElementById('showClearance');
const showLabels=document.getElementById('showLabels');
const showNames=document.getElementById('showNames');
const layerList=document.getElementById('layerList');
const validationBox=document.getElementById('validationBox');
const elementCount=document.getElementById('elementCount');
const selectionForm=document.getElementById('selectionForm');
const selectionEmpty=document.getElementById('selectionEmpty');
const selectionTag=document.getElementById('selectionTag');
const lockedNote=document.getElementById('lockedNote');
const dimensionLimitNote=document.getElementById('dimensionLimitNote');
const tentStyleFields=document.getElementById('tentStyleFields');
const tentFillColor=document.getElementById('tentFillColor');
const tentTransparencyRange=document.getElementById('tentTransparencyRange');
const tentTransparencyNumber=document.getElementById('tentTransparencyNumber');
const seatEditorWrap=document.getElementById('seatEditorWrap');
const seatEditor=document.getElementById('seatEditor');
const seatCount=document.getElementById('seatCount');
const guestList=document.getElementById('guestList');
const guestSearch=document.getElementById('guestSearch');
const newGuestName=document.getElementById('newGuestName');
const bulkGuests=document.getElementById('bulkGuests');
const selLabel=document.getElementById('selLabel');
const selX=document.getElementById('selX');
const selY=document.getElementById('selY');
const selW=document.getElementById('selW');
const selH=document.getElementById('selH');
const selRot=document.getElementById('selRot');
const selColor=document.getElementById('selColor');
const summaryTables=document.getElementById('summaryTables');
const summarySeats=document.getElementById('summarySeats');
const summaryAssigned=document.getElementById('summaryAssigned');
const summaryElements=document.getElementById('summaryElements');
const cursorCoords=document.getElementById('cursorCoords');
const measureNote=document.getElementById('measureNote');
const multiToolbarChip=document.getElementById('multiToolbarChip');
const measureToolbarChip=document.getElementById('measureToolbarChip');
const tentDrawHint=document.getElementById('tentDrawHint');
const presentationOverlay=document.getElementById('presentationOverlay');
const presentationMount=document.getElementById('presentationMount');
const proposalModal=document.getElementById('proposalModal');
const proposalList=document.getElementById('proposalList');
const proposalNameTop=document.getElementById('proposalNameTop');
const proposalNameCanvas=document.getElementById('proposalNameCanvas');

const SAMPLE_NAMES=['Lucero','Antonio','María','Carlos','Rosa','Jorge','Paola','Diego','Ana','Luis'];
const BASE_TABLE=Object.freeze({widthM:3.4,heightM:3.4,radiusM:.915,capacity:10,color:'#d9b978'});
const TYPE_DEFAULTS=Object.freeze({
  table:{label:'Mesa 10 personas',widthM:3.4,heightM:3.4,capacity:10,color:'#d9b978',shape:'table'},
  dance:{label:'Pista de baile 5 × 5 m',widthM:5,heightM:5,color:'#8f6642',shape:'rect'},
  couple:{label:'Mesa de novios',widthM:3,heightM:1.2,color:'#d79aa7',shape:'rect'},
  bar:{label:'Barra',widthM:4,heightM:1.2,color:'#7a9e87',shape:'rect'},
  dj:{label:'DJ / sonido',widthM:3,heightM:2,color:'#7e7f9a',shape:'rect'},
  altar:{label:'Altar',widthM:4,heightM:2,color:'#e3d3ae',shape:'rect'},
  cake:{label:'Mesa de torta',widthM:1.8,heightM:1.8,color:'#cfa9c7',shape:'circle'},
  photo:{label:'Photobooth',widthM:3,heightM:2,color:'#6f95aa',shape:'rect'},
  mirror:{label:'Espejo',widthM:1,heightM:.2,color:'#dfeaf0',shape:'rect'},
  tent:{label:'Toldo',widthM:5,heightM:4,color:'#d8c9a6',shape:'polygon'}
});
const LAYERS=Object.freeze({
  table:'Mesas',dance:'Pistas',couple:'Mesa de novios',bar:'Barras',dj:'DJ / sonido',altar:'Altares',cake:'Mesa de torta',photo:'Photobooth',mirror:'Espejos',tent:'Toldos'
});

let elements=[];
let guests=[];
let guestUid=1;
let selectedIds=[];
let selectedId='';
let drag=null;
let zoom=1;
let bgVisible=true;
let measureMode=false;
let measureDraft=null;
let measurements=[];
let measurementUid=1;
let drawingTent=false;
let tentDraft=[];
let tentHoverPoint=null;
let hiddenLayers={};
let lockedLayers={};
let guideLines={vertical:null,horizontal:null};
let historyPast=[];
let historyFuture=[];
let restoringHistory=false;
let copiedPlannerItems=[];
let pasteSequence=0;
let proposals=[];
let currentProposalId='';

const clone=value=>JSON.parse(JSON.stringify(value));
const currentScale=()=>Math.max(18,Math.min(50,Number(scaleInput.value)||32));
const makeId=(prefix='item')=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const getItem=id=>elements.find(item=>item.id===id)||null;
const selectedItems=()=>selectedIds.map(getItem).filter(Boolean);
const isSelected=id=>selectedIds.includes(id);
const getVisibleElements=()=>elements.filter(item=>!hiddenLayers[item.type]);
const isItemLocked=item=>Boolean(item&&(item.locked||lockedLayers[item.type]));

function svgEl(tag,attrs={}){
  const node=document.createElementNS(NS,tag);
  Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));
  return node;
}
function svgPoint(event){
  const point=planner.createSVGPoint();
  point.x=event.clientX;point.y=event.clientY;
  return point.matrixTransform(planner.getScreenCTM().inverse());
}
function nextPosition(index){
  const column=index%3,row=Math.floor(index/3);
  return {x:310+column*265,y:230+(row%3)*220};
}
function setSelection(ids=[],primary=''){
  const valid=[...new Set(ids.filter(id=>getItem(id)&&!hiddenLayers[getItem(id).type]))];
  selectedIds=valid;
  selectedId=primary&&valid.includes(primary)?primary:(valid[0]||'');
}
function clearSelection(){selectedIds=[];selectedId='';}
function selected(){return getItem(selectedId);}
function ensureTableSeats(table){
  if(!table||table.type!=='table')return;
  const seats=Array.isArray(table.seats)?table.seats.slice(0,table.capacity):[];
  while(seats.length<table.capacity)seats.push(null);
  table.seats=seats;
}
function guestById(id){return guests.find(guest=>guest.id===id)||null;}
function guestAssignmentMap(){
  const map=new Map();
  elements.filter(item=>item.type==='table').forEach(table=>{
    ensureTableSeats(table);
    table.seats.forEach((guestId,index)=>{
      if(guestId)map.set(guestId,{tableId:table.id,tableLabel:table.label,seatIndex:index,seatNumber:index+1});
    });
  });
  return map;
}
function clearGuestFromOtherSeats(guestId,exceptTableId='',exceptSeat=-1){
  if(!guestId)return;
  elements.filter(item=>item.type==='table').forEach(table=>{
    ensureTableSeats(table);
    table.seats=table.seats.map((value,index)=>value===guestId&&!(table.id===exceptTableId&&index===exceptSeat)?null:value);
  });
}

function stateSnapshot(){
  return {
    elements:clone(elements),guests:clone(guests),guestUid,selectedIds:clone(selectedIds),selectedId,
    scale:scaleInput.value,hiddenLayers:clone(hiddenLayers),lockedLayers:clone(lockedLayers),
    measurements:clone(measurements),measurementUid,bgVisible,
    settings:{grid:showGrid.checked,clearance:showClearance.checked,labels:showLabels.checked,names:showNames.checked}
  };
}
function restoreState(state){
  if(!state)return;
  restoringHistory=true;
  elements=clone(state.elements||[]);guests=clone(state.guests||[]);guestUid=state.guestUid||1;
  selectedIds=clone(state.selectedIds||[]);selectedId=state.selectedId||'';
  scaleInput.value=state.scale||32;hiddenLayers=clone(state.hiddenLayers||{});lockedLayers=clone(state.lockedLayers||{});
  measurements=clone(state.measurements||[]);measurementUid=state.measurementUid||1;bgVisible=state.bgVisible!==false;
  showGrid.checked=state.settings?.grid!==false;showClearance.checked=state.settings?.clearance!==false;
  showLabels.checked=state.settings?.labels!==false;showNames.checked=state.settings?.names!==false;
  restoringHistory=false;render();
}
function pushHistory(){
  if(restoringHistory)return;
  const raw=JSON.stringify(stateSnapshot());
  if(historyPast.at(-1)===raw)return;
  historyPast.push(raw);if(historyPast.length>60)historyPast.shift();historyFuture=[];updateHistoryButtons();
}
function updateHistoryButtons(){
  document.getElementById('btnUndo').disabled=historyPast.length<=1;
  document.getElementById('btnRedo').disabled=historyFuture.length===0;
}
function undoHistory(){
  if(historyPast.length<=1)return;
  historyFuture.push(historyPast.pop());restoreState(JSON.parse(historyPast.at(-1)));updateHistoryButtons();
}
function redoHistory(){
  if(!historyFuture.length)return;
  const raw=historyFuture.pop();historyPast.push(raw);restoreState(JSON.parse(raw));updateHistoryButtons();
}
function commitMutation(){pushHistory();render();saveCurrentProposalSnapshot();}

function seedGuests(){
  guests=SAMPLE_NAMES.map(name=>({id:`guest-${guestUid++}`,name}));
}
function makeTableSeats(assign=false){return Array.from({length:BASE_TABLE.capacity},(_,index)=>assign?(guests[index]?.id||null):null);}
function addElement(type,{record=true,assignGuests=false}={}){
  const base=TYPE_DEFAULTS[type];if(!base)return null;
  const position=nextPosition(elements.length);
  const number=elements.filter(item=>item.type===type).length+1;
  const item={id:makeId(type),type,shape:base.shape,label:type==='table'?`Mesa ${elements.filter(x=>x.type==='table').length+1}`:(number>1?`${base.label} ${number}`:base.label),x:position.x,y:position.y,widthM:base.widthM,heightM:base.heightM,rotation:0,color:base.color,locked:false};
  if(type==='table'){item.capacity=BASE_TABLE.capacity;item.seats=makeTableSeats(assignGuests);}
  elements.push(item);setSelection([item.id],item.id);if(record)pushHistory();render();return item;
}

function itemBounds(item){
  const scale=currentScale(),w=item.widthM*scale,h=item.heightM*scale;
  return {x:item.x-w/2,y:item.y-h/2,w,h,cx:item.x,cy:item.y,r:Math.max(w,h)/2};
}
function rectPolygon(item){
  const scale=currentScale(),hw=item.widthM*scale/2,hh=item.heightM*scale/2,angle=(item.rotation||0)*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
  return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([x,y])=>({x:item.x+x*cos-y*sin,y:item.y+x*sin+y*cos}));
}
function segmentsIntersect(a,b,c,d){
  const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
  const d1=cross(a,b,c),d2=cross(a,b,d),d3=cross(c,d,a),d4=cross(c,d,b);
  return ((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0));
}
function pointInPolygon(point,poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    if(((a.y>point.y)!==(b.y>point.y))&&(point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y||1e-9)+a.x))inside=!inside;
  }
  return inside;
}
function polygonIntersectsPolygon(a,b){
  for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)if(segmentsIntersect(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]))return true;
  return pointInPolygon(a[0],b)||pointInPolygon(b[0],a);
}
function pointSegmentDistance(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;
  if(!len)return Math.hypot(p.x-a.x,p.y-a.y);
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len));
  return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
}
function circleIntersectsPolygon(circle,poly){
  if(pointInPolygon(circle,poly))return true;
  for(let i=0;i<poly.length;i++)if(pointSegmentDistance(circle,poly[i],poly[(i+1)%poly.length])<circle.r-3)return true;
  return false;
}
function circleGeom(item){const b=itemBounds(item);return{x:item.x,y:item.y,r:b.r};}
function intersects(a,b){
  const aCircle=a.shape==='table'||a.shape==='circle',bCircle=b.shape==='table'||b.shape==='circle';
  if(aCircle&&bCircle){const A=circleGeom(a),B=circleGeom(b);return Math.hypot(A.x-B.x,A.y-B.y)<A.r+B.r-5;}
  if(!aCircle&&!bCircle)return polygonIntersectsPolygon(rectPolygon(a),rectPolygon(b));
  const circle=aCircle?circleGeom(a):circleGeom(b),poly=aCircle?rectPolygon(b):rectPolygon(a);
  return circleIntersectsPolygon(circle,poly);
}
function conflictIds(){
  const ids=new Set(),visible=getVisibleElements();
  for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){
    if(visible[i].type==='tent'||visible[j].type==='tent')continue;
    if(intersects(visible[i],visible[j])){ids.add(visible[i].id);ids.add(visible[j].id);}
  }
  return ids;
}
function validationMessages(conflicts=conflictIds()){
  const messages=[];
  const capacity=elements.reduce((sum,item)=>sum+(item.capacity||0),0);
  const assigned=guestAssignmentMap().size;
  const unassigned=Math.max(0,guests.length-assigned);
  if(conflicts.size)messages.push({type:'bad',text:`Hay ${conflicts.size} elemento(s) involucrados en superposición.`});
  else messages.push({type:'good',text:'No se detectaron superposiciones entre mobiliarios.'});
  if(unassigned>0)messages.push({type:'warn',text:`Quedan ${unassigned} invitado(s) sin asignar.`});
  else if(guests.length)messages.push({type:'good',text:'Todos los invitados ya tienen asignación o están listos para asignarse.'});
  if(guests.length>capacity)messages.push({type:'bad',text:`La capacidad total (${capacity}) es menor al número de invitados (${guests.length}).`});
  else messages.push({type:'good',text:`La capacidad total (${capacity}) es suficiente para ${guests.length} invitado(s).`});
  const tableItems=getVisibleElements().filter(item=>item.type==='table');
  const tableClearanceMarginM=.60;let closeTables=0;
  for(let i=0;i<tableItems.length;i++)for(let j=i+1;j<tableItems.length;j++){
    const A=tableItems[i],B=tableItems[j];
    const minimumCenterDistance=(((A.widthM+B.widthM)/2)+tableClearanceMarginM)*currentScale();
    const actualCenterDistance=Math.hypot(A.x-B.x,A.y-B.y);
    if(actualCenterDistance<minimumCenterDistance&&actualCenterDistance>5)closeTables++;
  }
  if(closeTables)messages.push({type:'warn',text:`Se detectaron ${closeTables} pares de mesas con menos de 60 cm libres entre sus áreas de circulación.`});
  return messages;
}

function guestAnchor(angle){const c=Math.cos(angle);if(c>.28)return'start';if(c<-.28)return'end';return'middle';}
function compactName(name,max=18){const value=String(name||'').trim();return value.length>max?value.slice(0,max-1)+'…':value;}
function renderGuestLabel(group,guestName,angle,tableRadius){
  if(!showNames.checked||!guestName)return;
  const distance=tableRadius*2.18,x=Math.cos(angle)*distance,y=Math.sin(angle)*distance,anchor=guestAnchor(angle),name=compactName(guestName),width=Math.max(46,name.length*7+18);
  const label=svgEl('g',{class:'guest-tag',transform:`translate(${x.toFixed(2)} ${y.toFixed(2)})`});
  let rectX=-width/2,textX=0;if(anchor==='start'){rectX=0;textX=8;}if(anchor==='end'){rectX=-width;textX=-8;}
  label.appendChild(svgEl('rect',{x:rectX,y:-12,width,height:24,rx:8}));
  const text=svgEl('text',{x:textX,y:1,'text-anchor':anchor});text.textContent=name;label.appendChild(text);group.appendChild(label);
}
function appendRotateHandle(group,item){
  if(selectedId!==item.id||selectedIds.length!==1||isItemLocked(item))return;
  const b=itemBounds(item),offset=Math.max(44,b.h/2+28);
  group.appendChild(svgEl('line',{x1:0,y1:-b.h/2,y2:-offset,x2:0,class:'rotate-stem'}));
  group.appendChild(svgEl('circle',{cx:0,cy:-offset,r:9,class:'rotate-handle','data-rotate-id':item.id}));
}
function renderTable(item,scale,conflicts){
  ensureTableSeats(item);
  const danger=conflicts.has(item.id),selectedState=isSelected(item.id),group=svgEl('g',{transform:`translate(${item.x} ${item.y}) rotate(${item.rotation||0})`,class:`draggable table-hit${selectedState?' table-selected':''}${danger?' has-conflict':''}`,'data-id':item.id});
  const sizeFactor=Math.max(.35,item.widthM/BASE_TABLE.widthM),tableRadius=BASE_TABLE.radiusM*scale*sizeFactor,clearanceRadius=item.widthM*scale/2,chairRadius=Math.max(7,tableRadius*.12),chairDistance=tableRadius*1.58;
  if(showClearance.checked)group.appendChild(svgEl('circle',{r:clearanceRadius,class:'clearance',fill:item.color,stroke:danger?'#c84242':item.color}));
  item.seats.forEach((guestId,index)=>{
    const angle=-Math.PI/2+Math.PI*2*index/item.capacity,chairX=Math.cos(angle)*chairDistance,chairY=Math.sin(angle)*chairDistance;
    group.appendChild(svgEl('circle',{cx:chairX.toFixed(2),cy:chairY.toFixed(2),r:chairRadius.toFixed(2),class:'chair'}));
    renderGuestLabel(group,guestById(guestId)?.name||'',angle,tableRadius);
  });
  group.appendChild(svgEl('circle',{r:tableRadius,class:'tabletop',fill:item.color,stroke:danger?'#c84242':selectedState?'#d59b3c':'#3d3a35','stroke-width':danger||selectedState?5:3,filter:'url(#softShadow)'}));
  if(showLabels.checked){const title=svgEl('text',{x:0,y:-3,'text-anchor':'middle',class:'table-title'});title.textContent=item.label;group.appendChild(title);const meta=svgEl('text',{x:0,y:15,'text-anchor':'middle',class:'table-meta'});meta.textContent=`${item.capacity} personas`;group.appendChild(meta);}
  appendRotateHandle(group,item);return group;
}
function renderObject(item,scale,conflicts){
  const danger=conflicts.has(item.id),selectedState=isSelected(item.id),width=item.widthM*scale,height=item.heightM*scale,group=svgEl('g',{transform:`translate(${item.x} ${item.y}) rotate(${item.rotation||0})`,class:`draggable item-hit${selectedState?' item-selected':''}${danger?' has-conflict':''}`,'data-id':item.id});
  const stroke=danger?'#c84242':selectedState?'#d59b3c':'#3d3a35';
  const shape=item.shape==='circle'?svgEl('ellipse',{cx:0,cy:0,rx:width/2,ry:height/2,fill:item.color,class:'object-shape',stroke,'stroke-width':danger||selectedState?5:3}):svgEl('rect',{x:-width/2,y:-height/2,width,height,rx:Math.min(12,height*.12),fill:item.color,class:'object-shape',stroke,'stroke-width':danger||selectedState?5:3});
  group.appendChild(shape);
  if(showLabels.checked){const title=svgEl('text',{x:0,y:-2,'text-anchor':'middle',class:'object-title'});title.textContent=item.label;group.appendChild(title);const meta=svgEl('text',{x:0,y:14,'text-anchor':'middle',class:'object-meta'});meta.textContent=`${item.widthM.toFixed(1)} × ${item.heightM.toFixed(1)} m`;group.appendChild(meta);}
  appendRotateHandle(group,item);return group;
}
function renderTent(item){
  const selectedState=isSelected(item.id),points=(item.points||[]).map(p=>`${p.x},${p.y}`).join(' '),group=svgEl('g',{transform:`translate(${item.x} ${item.y}) rotate(${item.rotation||0})`,class:`draggable tent-hit${selectedState?' item-selected':''}`,'data-id':item.id});
  group.appendChild(svgEl('polygon',{points,fill:item.fillColor||item.color,'fill-opacity':1-(Number(item.transparency)||0)/100,stroke:selectedState?'#d59b3c':'#6f6654','stroke-width':selectedState?5:3,class:'object-shape'}));
  if(showLabels.checked){const text=svgEl('text',{x:0,y:0,'text-anchor':'middle',class:'object-title'});text.textContent=item.label;group.appendChild(text);}
  appendRotateHandle(group,item);return group;
}
function renderMeasureLayer(){
  measureLayer.replaceChildren();
  const scale=currentScale();
  const all=[...measurements];if(measureDraft?.a&&measureDraft?.b)all.push({...measureDraft,id:'draft'});
  all.forEach(measure=>{
    measureLayer.appendChild(svgEl('line',{x1:measure.a.x,y1:measure.a.y,x2:measure.b.x,y2:measure.b.y,class:'measure-line'}));
    measureLayer.appendChild(svgEl('circle',{cx:measure.a.x,cy:measure.a.y,r:5,class:'measure-point'}));
    measureLayer.appendChild(svgEl('circle',{cx:measure.b.x,cy:measure.b.y,r:5,class:'measure-point'}));
    const distance=Math.hypot(measure.b.x-measure.a.x,measure.b.y-measure.a.y)/scale,text=svgEl('text',{x:(measure.a.x+measure.b.x)/2,y:(measure.a.y+measure.b.y)/2-8,'text-anchor':'middle',class:'measure-label'});text.textContent=`${distance.toFixed(2)} m`;measureLayer.appendChild(text);
  });
}
function renderGuideLayer(){
  guideLayer.replaceChildren();
  if(guideLines.vertical!==null)guideLayer.appendChild(svgEl('line',{x1:guideLines.vertical,x2:guideLines.vertical,y1:0,y2:760,class:'guide-line'}));
  if(guideLines.horizontal!==null)guideLayer.appendChild(svgEl('line',{x1:0,x2:1200,y1:guideLines.horizontal,y2:guideLines.horizontal,class:'guide-line'}));
}
function renderDrawLayer(){
  drawLayer.replaceChildren();if(!drawingTent||!tentDraft.length)return;
  const points=[...tentDraft,...(tentHoverPoint?[tentHoverPoint]:[])];
  drawLayer.appendChild(svgEl('polyline',{points:points.map(p=>`${p.x},${p.y}`).join(' '),class:'tent-draft'}));
  tentDraft.forEach(point=>drawLayer.appendChild(svgEl('circle',{cx:point.x,cy:point.y,r:5,class:'tent-point'})));
}
function applySmartGuides(targetX,targetY,ignoreIds=[]){
  const ignore=new Set(ignoreIds),threshold=9;let nextX=targetX,nextY=targetY;guideLines={vertical:null,horizontal:null};
  const xCandidates=[600,...getVisibleElements().filter(item=>!ignore.has(item.id)).map(item=>item.x)],yCandidates=[380,...getVisibleElements().filter(item=>!ignore.has(item.id)).map(item=>item.y)];
  let bestX=null,bestY=null;xCandidates.forEach(value=>{const diff=Math.abs(targetX-value);if(diff<=threshold&&(!bestX||diff<bestX.diff))bestX={value,diff};});yCandidates.forEach(value=>{const diff=Math.abs(targetY-value);if(diff<=threshold&&(!bestY||diff<bestY.diff))bestY={value,diff};});
  if(bestX){nextX=bestX.value;guideLines.vertical=bestX.value;}if(bestY){nextY=bestY.value;guideLines.horizontal=bestY.value;}return{x:nextX,y:nextY};
}

function renderLayerList(){
  layerList.replaceChildren();
  const types=Object.keys(LAYERS).filter(type=>elements.some(item=>item.type===type));
  if(!types.length){const empty=document.createElement('div');empty.className='validation-item';empty.textContent='Todavía no hay elementos en el plano.';layerList.appendChild(empty);return;}
  types.forEach(type=>{
    const row=document.createElement('div');row.className='layer-row';
    const eye=document.createElement('button');eye.type='button';eye.className='layer-eye';eye.textContent=hiddenLayers[type]?'○':'●';eye.title=hiddenLayers[type]?'Mostrar capa':'Ocultar capa';eye.addEventListener('click',()=>{hiddenLayers[type]=!hiddenLayers[type];setSelection(selectedIds.filter(id=>!hiddenLayers[getItem(id)?.type]),selectedId);commitMutation();});
    const text=document.createElement('div');const strong=document.createElement('strong');strong.textContent=LAYERS[type];const small=document.createElement('small');small.textContent=`${elements.filter(item=>item.type===type).length} elemento(s)`;text.append(strong,small);
    const lock=document.createElement('button');lock.type='button';lock.className='layer-lock';lock.textContent=lockedLayers[type]?'🔒':'🔓';lock.title=lockedLayers[type]?'Desbloquear capa':'Bloquear capa';lock.addEventListener('click',()=>{lockedLayers[type]=!lockedLayers[type];render();pushHistory();});
    row.append(eye,text,lock);layerList.appendChild(row);
  });
}
function renderValidation(){
  validationBox.innerHTML=validationMessages().map(msg=>`<div class="validation-item ${msg.type}">${msg.text}</div>`).join('');
}
function renderGuestManager(){
  const assignments=guestAssignmentMap(),query=(guestSearch.value||'').trim().toLocaleLowerCase('es'),filtered=guests.filter(g=>g.name.toLocaleLowerCase('es').includes(query));
  document.getElementById('guestCountText').textContent=`${guests.length} invitados`;
  document.getElementById('guestPendingText').textContent=`${Math.max(0,guests.length-assignments.size)} sin asignar`;
  guestList.replaceChildren();
  filtered.forEach(guest=>{
    const row=document.createElement('div');row.className='guest-row';
    const info=document.createElement('div');const strong=document.createElement('strong');strong.textContent=guest.name;const small=document.createElement('small');const location=assignments.get(guest.id);small.textContent=location?`${location.tableLabel} · Asiento ${location.seatNumber}`:'Sin asignar';info.append(strong,small);
    const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.title='Quitar invitado';remove.addEventListener('click',()=>{clearGuestFromOtherSeats(guest.id);guests=guests.filter(item=>item.id!==guest.id);commitMutation();});
    row.append(info,remove);guestList.appendChild(row);
  });
}
function renderSeatEditor(table){
  seatEditor.replaceChildren();
  if(!table||table.type!=='table'){seatEditorWrap.hidden=true;return;}
  seatEditorWrap.hidden=false;ensureTableSeats(table);seatCount.textContent=String(table.capacity);
  const assignments=guestAssignmentMap();
  table.seats.forEach((guestId,index)=>{
    const row=document.createElement('div');row.className='seat-row';const number=document.createElement('span');number.className='seat-number';number.textContent=String(index+1);
    const select=document.createElement('select');const blank=document.createElement('option');blank.value='';blank.textContent='— Sin asignar —';select.appendChild(blank);
    guests.forEach(guest=>{const option=document.createElement('option');option.value=guest.id;option.textContent=guest.name;const location=assignments.get(guest.id);if(location&&!(location.tableId===table.id&&location.seatIndex===index))option.disabled=true;if(guestId===guest.id)option.selected=true;select.appendChild(option);});
    select.addEventListener('change',()=>{const next=select.value||null;if(next)clearGuestFromOtherSeats(next,table.id,index);table.seats[index]=next;commitMutation();});row.append(number,select);seatEditor.appendChild(row);
  });
}
function fillProperties(item){
  const empty=!item;selectionEmpty.hidden=!empty;selectionForm.hidden=empty;selectionTag.hidden=selectedIds.length===0;
  if(selectedIds.length>1){selectionTag.textContent=`${selectedIds.length} elementos`;multiToolbarChip.hidden=false;multiToolbarChip.textContent=`${selectedIds.length} elementos seleccionados`;}
  else if(item){selectionTag.textContent=LAYERS[item.type]||'Elemento';multiToolbarChip.hidden=true;}else multiToolbarChip.hidden=true;
  if(empty)return;
  const locked=isItemLocked(item),scale=currentScale();lockedNote.hidden=!locked;
  selLabel.value=item.label;selX.value=(item.x/scale).toFixed(1);selY.value=(item.y/scale).toFixed(1);selW.value=item.widthM.toFixed(1);selH.value=item.heightM.toFixed(1);selRot.value=String(item.rotation||0);selColor.value=item.fillColor||item.color||'#d9b978';
  const unlimited=item.type==='tent'||item.type==='dance';if(unlimited){selW.removeAttribute('max');selH.removeAttribute('max');dimensionLimitNote.textContent='Sin límite de 5 m para este elemento.';}else{selW.max='5';selH.max='5';dimensionLimitNote.textContent='Máximo permitido para este elemento: 5 m por lado.';}
  tentStyleFields.hidden=item.type!=='tent';if(item.type==='tent'){tentFillColor.value=item.fillColor||item.color;tentTransparencyRange.value=String(item.transparency||0);tentTransparencyNumber.value=String(item.transparency||0);}
  [selLabel,selX,selY,selW,selH,selRot,selColor,document.getElementById('btnBringFront'),document.getElementById('btnSendBack'),document.getElementById('btnAlignNow'),document.getElementById('btnDelete'),document.getElementById('btnDuplicate')].forEach(control=>control.disabled=locked);
  document.getElementById('btnToggleLock').textContent=locked?'🔓 Desbloquear':'🔒 Bloquear';renderSeatEditor(item);
}
function renderSummary(){
  const tables=elements.filter(item=>item.type==='table'),seats=tables.reduce((sum,item)=>sum+(item.capacity||0),0),assigned=guestAssignmentMap().size;
  summaryTables.textContent=String(tables.length);summarySeats.textContent=String(seats);summaryAssigned.textContent=String(assigned);summaryElements.textContent=String(elements.length);elementCount.textContent=`${elements.length} ${elements.length===1?'elemento':'elementos'}`;
}
function render(){
  const scale=currentScale(),conflicts=conflictIds();gridLayer.style.display=showGrid.checked?'':'none';bgImage.style.display=bgVisible?'':'none';itemsLayer.replaceChildren();
  getVisibleElements().forEach(item=>itemsLayer.appendChild(item.type==='table'?renderTable(item,scale,conflicts):item.type==='tent'?renderTent(item):renderObject(item,scale,conflicts)));
  renderGuideLayer();renderDrawLayer();renderMeasureLayer();renderLayerList();renderValidation();renderGuestManager();fillProperties(selected());renderSummary();updateHistoryButtons();
}

function beginItemDrag(event,item){
  if(measureMode||drawingTent||isItemLocked(item))return;
  const point=svgPoint(event);if(event.ctrlKey||event.metaKey){if(isSelected(item.id))setSelection(selectedIds.filter(id=>id!==item.id),selectedIds.find(id=>id!==item.id)||'');else setSelection([...selectedIds,item.id],item.id);render();return;}
  if(!isSelected(item.id))setSelection([item.id],item.id);
  const starts=selectedItems().map(entry=>({id:entry.id,x:entry.x,y:entry.y}));drag={mode:'move',id:item.id,pointerId:event.pointerId,dx:point.x-item.x,dy:point.y-item.y,starts,moved:false};planner.setPointerCapture(event.pointerId);render();
}
planner.addEventListener('pointerdown',event=>{
  const rotate=event.target.closest?.('[data-rotate-id]');if(rotate){const item=getItem(rotate.getAttribute('data-rotate-id'));if(!item||isItemLocked(item))return;event.preventDefault();const p=svgPoint(event);setSelection([item.id],item.id);drag={mode:'rotate',id:item.id,pointerId:event.pointerId,startAngle:Math.atan2(p.y-item.y,p.x-item.x),startRotation:item.rotation||0,moved:false};planner.setPointerCapture(event.pointerId);return;}
  const group=event.target.closest?.('[data-id]');if(group){const item=getItem(group.getAttribute('data-id'));if(item)beginItemDrag(event,item);return;}
  if(!measureMode&&!drawingTent){clearSelection();render();}
});
planner.addEventListener('pointermove',event=>{
  const point=svgPoint(event),scale=currentScale();cursorCoords.textContent=`x ${(point.x/scale).toFixed(2)} m · y ${(point.y/scale).toFixed(2)} m`;
  if(drawingTent){tentHoverPoint={x:point.x,y:point.y};renderDrawLayer();return;}
  if(!drag||event.pointerId!==drag.pointerId)return;
  const item=getItem(drag.id);if(!item)return;
  if(drag.mode==='rotate'){item.rotation=drag.startRotation+(Math.atan2(point.y-item.y,point.x-item.x)-drag.startAngle)*180/Math.PI;drag.moved=true;render();return;}
  const guides=applySmartGuides(point.x-drag.dx,point.y-drag.dy,selectedIds),primaryStart=drag.starts.find(start=>start.id===drag.id),deltaX=guides.x-primaryStart.x,deltaY=guides.y-primaryStart.y;
  drag.starts.forEach(start=>{const target=getItem(start.id);if(target&&!isItemLocked(target)){target.x=Math.max(20,Math.min(1180,start.x+deltaX));target.y=Math.max(20,Math.min(740,start.y+deltaY));}});drag.moved=true;render();
});
function endDrag(event){if(!drag||event.pointerId!==drag.pointerId)return;try{planner.releasePointerCapture(event.pointerId);}catch{}const moved=drag.moved;drag=null;guideLines={vertical:null,horizontal:null};if(moved)pushHistory();render();}
planner.addEventListener('pointerup',endDrag);planner.addEventListener('pointercancel',endDrag);

function toggleMeasureMode(){measureMode=!measureMode;drawingTent=false;tentDraft=[];tentHoverPoint=null;measureDraft=null;measureNote.hidden=!measureMode;measureToolbarChip.hidden=!measureMode;document.getElementById('btnMeasure').classList.toggle('active',measureMode);render();}
planner.addEventListener('click',event=>{
  if(drawingTent){const p=svgPoint(event);tentDraft.push({x:p.x,y:p.y});tentHoverPoint=null;renderDrawLayer();return;}
  if(!measureMode)return;const p=svgPoint(event);if(!measureDraft){measureDraft={a:{x:p.x,y:p.y},b:{x:p.x,y:p.y}};}else{measureDraft.b={x:p.x,y:p.y};measurements.push({id:measurementUid++,a:measureDraft.a,b:measureDraft.b});measureDraft=null;pushHistory();}render();
});
planner.addEventListener('dblclick',event=>{if(drawingTent){event.preventDefault();finishTent();}});

function startTent(){drawingTent=!drawingTent;measureMode=false;measureDraft=null;tentDraft=[];tentHoverPoint=null;tentDrawHint.hidden=!drawingTent;document.getElementById('btnDrawTent').classList.toggle('active',drawingTent);measureNote.hidden=true;measureToolbarChip.hidden=true;render();}
function finishTent(){
  if(tentDraft.length<3){drawingTent=false;tentDraft=[];tentHoverPoint=null;tentDrawHint.hidden=true;render();return;}
  const center={x:tentDraft.reduce((sum,p)=>sum+p.x,0)/tentDraft.length,y:tentDraft.reduce((sum,p)=>sum+p.y,0)/tentDraft.length},relative=tentDraft.map(p=>({x:p.x-center.x,y:p.y-center.y})),xs=relative.map(p=>p.x),ys=relative.map(p=>p.y),scale=currentScale();
  const item={id:makeId('tent'),type:'tent',shape:'polygon',label:`Toldo ${elements.filter(x=>x.type==='tent').length+1}`,x:center.x,y:center.y,widthM:(Math.max(...xs)-Math.min(...xs))/scale,heightM:(Math.max(...ys)-Math.min(...ys))/scale,rotation:0,color:'#d8c9a6',fillColor:'#d8c9a6',transparency:45,points:relative,locked:false};elements.push(item);drawingTent=false;tentDraft=[];tentHoverPoint=null;tentDrawHint.hidden=true;document.getElementById('btnDrawTent').classList.remove('active');setSelection([item.id],item.id);commitMutation();
}
function cancelModes(){if(drawingTent){drawingTent=false;tentDraft=[];tentHoverPoint=null;tentDrawHint.hidden=true;document.getElementById('btnDrawTent').classList.remove('active');}if(measureMode){measureMode=false;measureDraft=null;measureNote.hidden=true;measureToolbarChip.hidden=true;document.getElementById('btnMeasure').classList.remove('active');}render();}

function updateSelected(mutator,{record=true}={}){const item=selected();if(!item||isItemLocked(item))return;mutator(item);if(record)pushHistory();render();saveCurrentProposalSnapshot();}
function liveColor(value){const item=selected();if(!item||isItemLocked(item))return;if(item.type==='tent'){item.fillColor=value;item.color=value;tentFillColor.value=value;}else item.color=value;render();}
function resizeTent(item,nextW,nextH){const oldW=item.widthM||1,oldH=item.heightM||1,sx=nextW/oldW,sy=nextH/oldH;item.points=(item.points||[]).map(p=>({x:p.x*sx,y:p.y*sy}));item.widthM=nextW;item.heightM=nextH;}
selLabel.addEventListener('change',()=>updateSelected(item=>{item.label=selLabel.value.trim()||item.label;}));
selX.addEventListener('change',()=>updateSelected(item=>{item.x=Math.max(20,Number(selX.value||0)*currentScale());}));
selY.addEventListener('change',()=>updateSelected(item=>{item.y=Math.max(20,Number(selY.value||0)*currentScale());}));
selW.addEventListener('change',()=>updateSelected(item=>{const limit=item.type==='tent'||item.type==='dance'?50:5,next=Math.max(.2,Math.min(limit,Number(selW.value)||item.widthM));if(item.type==='tent')resizeTent(item,next,item.heightM);else{item.widthM=next;if(item.type==='table')item.heightM=next;}}));
selH.addEventListener('change',()=>updateSelected(item=>{const limit=item.type==='tent'||item.type==='dance'?50:5,next=Math.max(.2,Math.min(limit,Number(selH.value)||item.heightM));if(item.type==='tent')resizeTent(item,item.widthM,next);else{item.heightM=next;if(item.type==='table')item.widthM=next;}}));
selRot.addEventListener('change',()=>updateSelected(item=>{item.rotation=Math.max(-180,Math.min(180,Number(selRot.value)||0));}));
selColor.addEventListener('input',()=>liveColor(selColor.value));
selColor.addEventListener('change',()=>{pushHistory();saveCurrentProposalSnapshot();});
tentFillColor.addEventListener('input',()=>liveColor(tentFillColor.value));
tentFillColor.addEventListener('change',()=>{pushHistory();saveCurrentProposalSnapshot();});
function setTentTransparency(value,{record=false}={}){const item=selected();if(!item||item.type!=='tent'||isItemLocked(item))return;const next=Math.max(0,Math.min(90,Number(value)||0));item.transparency=next;tentTransparencyRange.value=String(next);tentTransparencyNumber.value=String(next);render();if(record)pushHistory();}
tentTransparencyRange.addEventListener('input',()=>setTentTransparency(tentTransparencyRange.value));tentTransparencyRange.addEventListener('change',()=>setTentTransparency(tentTransparencyRange.value,{record:true}));tentTransparencyNumber.addEventListener('input',()=>setTentTransparency(tentTransparencyNumber.value));tentTransparencyNumber.addEventListener('change',()=>setTentTransparency(tentTransparencyNumber.value,{record:true}));

document.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>{addElement(button.dataset.add);saveCurrentProposalSnapshot();}));
document.getElementById('btnDrawTent').addEventListener('click',startTent);
document.getElementById('btnDelete').addEventListener('click',()=>{const ids=new Set(selectedIds);if(!ids.size)return;elements=elements.filter(item=>!ids.has(item.id)||isItemLocked(item));clearSelection();commitMutation();});
document.getElementById('btnDuplicate').addEventListener('click',()=>{const items=selectedItems().filter(item=>!isItemLocked(item));if(!items.length)return;const copies=items.map(item=>{const copy=clone(item);copy.id=makeId(item.type);copy.x+=34;copy.y+=34;copy.label=`${item.label} copia`;copy.locked=false;return copy;});elements.push(...copies);setSelection(copies.map(item=>item.id),copies[0].id);commitMutation();});
document.getElementById('btnBringFront').addEventListener('click',()=>{const ids=new Set(selectedIds),chosen=elements.filter(item=>ids.has(item.id)),rest=elements.filter(item=>!ids.has(item.id));elements=[...rest,...chosen];commitMutation();});
document.getElementById('btnSendBack').addEventListener('click',()=>{const ids=new Set(selectedIds),chosen=elements.filter(item=>ids.has(item.id)),rest=elements.filter(item=>!ids.has(item.id));elements=[...chosen,...rest];commitMutation();});
document.getElementById('btnToggleLock').addEventListener('click',()=>{const items=selectedItems();if(!items.length)return;const next=!items.every(item=>item.locked);items.forEach(item=>item.locked=next);commitMutation();});
document.getElementById('btnAlignNow').addEventListener('click',()=>{const items=selectedItems();if(items.length<2)return;const base=selected()||items[0];items.forEach(item=>{if(item.id!==base.id&&!isItemLocked(item))item.y=base.y;});commitMutation();});
document.getElementById('btnCenter').addEventListener('click',()=>updateSelected(item=>{item.x=600;item.y=380;}));
document.getElementById('btnRotateLeft').addEventListener('click',()=>updateSelected(item=>{item.rotation=(item.rotation||0)-15;}));
document.getElementById('btnRotateRight').addEventListener('click',()=>updateSelected(item=>{item.rotation=(item.rotation||0)+15;}));
document.getElementById('btnClearSeats').addEventListener('click',()=>{const item=selected();if(!item||item.type!=='table'||isItemLocked(item))return;ensureTableSeats(item);item.seats=item.seats.map(()=>null);commitMutation();});

function addGuestNames(names){const clean=names.map(name=>String(name||'').trim()).filter(Boolean);if(!clean.length)return;clean.forEach(name=>guests.push({id:`guest-${guestUid++}`,name}));commitMutation();}
document.getElementById('btnAddGuest').addEventListener('click',()=>{addGuestNames([newGuestName.value]);newGuestName.value='';newGuestName.focus();});
newGuestName.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();document.getElementById('btnAddGuest').click();}});
document.getElementById('btnAddBulkGuests').addEventListener('click',()=>{addGuestNames(bulkGuests.value.split(/\r?\n|,/));bulkGuests.value='';});guestSearch.addEventListener('input',renderGuestManager);
document.getElementById('btnAssignSequential').addEventListener('click',()=>{elements.filter(item=>item.type==='table').forEach(table=>{ensureTableSeats(table);table.seats=table.seats.map(()=>null);});let index=0;for(const table of elements.filter(item=>item.type==='table'))for(let seat=0;seat<table.capacity&&index<guests.length;seat++,index++)table.seats[seat]=guests[index].id;commitMutation();});
document.getElementById('btnClearAssignments').addEventListener('click',()=>{elements.filter(item=>item.type==='table').forEach(table=>{ensureTableSeats(table);table.seats=table.seats.map(()=>null);});commitMutation();});

scaleInput.addEventListener('input',render);scaleInput.addEventListener('change',pushHistory);[showGrid,showClearance,showLabels,showNames].forEach(control=>{control.addEventListener('change',()=>{pushHistory();render();});});
document.getElementById('toggleBg').addEventListener('click',event=>{bgVisible=!bgVisible;event.currentTarget.textContent=bgVisible?'Ocultar plano':'Mostrar plano';pushHistory();render();});
document.getElementById('btnDefaultView').addEventListener('click',()=>{scaleInput.value=32;showGrid.checked=true;showClearance.checked=true;showLabels.checked=true;showNames.checked=true;bgVisible=true;document.getElementById('toggleBg').textContent='Ocultar plano';pushHistory();render();});
document.getElementById('btnShowAllLayers').addEventListener('click',()=>{Object.keys(hiddenLayers).forEach(type=>hiddenLayers[type]=false);pushHistory();render();});
document.getElementById('btnUnlockAllLayers').addEventListener('click',()=>{Object.keys(lockedLayers).forEach(type=>lockedLayers[type]=false);elements.forEach(item=>item.locked=false);pushHistory();render();});

document.getElementById('btnMeasure').addEventListener('click',toggleMeasureMode);document.getElementById('btnClearMeasures').addEventListener('click',()=>{measurements=[];measureDraft=null;pushHistory();render();});
function setZoom(next){zoom=Math.max(.65,Math.min(1.8,next));planner.style.width=`${zoom*100}%`;document.getElementById('zoomReset').textContent=`${Math.round(zoom*100)}%`;}
document.getElementById('btnZoomOut').addEventListener('click',()=>setZoom(zoom-.1));document.getElementById('btnZoomIn').addEventListener('click',()=>setZoom(zoom+.1));document.getElementById('zoomReset').addEventListener('click',()=>setZoom(1));document.getElementById('btnFit').addEventListener('click',()=>setZoom(1));
document.getElementById('btnUndo').addEventListener('click',undoHistory);document.getElementById('btnRedo').addEventListener('click',redoHistory);
document.getElementById('btnPresentation').addEventListener('click',()=>{presentationMount.innerHTML='';const cloneSvg=planner.cloneNode(true);cloneSvg.style.width='100%';presentationMount.appendChild(cloneSvg);presentationOverlay.hidden=false;});document.getElementById('closePresentation').addEventListener('click',()=>presentationOverlay.hidden=true);

function copySelectedPlannerItems(){const items=selectedItems();if(!items.length)return false;copiedPlannerItems=clone(items);pasteSequence=0;return true;}
function pastePlannerItems(){if(!copiedPlannerItems.length)return false;pasteSequence++;const copies=copiedPlannerItems.map(item=>{const copy=clone(item);copy.id=makeId(item.type);copy.x+=28*pasteSequence;copy.y+=28*pasteSequence;copy.locked=false;copy.label=`${item.label} copia`;return copy;});elements.push(...copies);setSelection(copies.map(item=>item.id),copies[0].id);commitMutation();return true;}

document.addEventListener('keydown',event=>{
  const tag=(document.activeElement?.tagName||'').toLowerCase(),editing=['input','select','textarea'].includes(tag);
  if(event.key==='Escape'){cancelModes();return;}if(drawingTent&&event.key==='Enter'){event.preventDefault();finishTent();return;}
  if(editing)return;
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!event.shiftKey){event.preventDefault();undoHistory();return;}
  if((event.ctrlKey||event.metaKey)&&((event.key.toLowerCase()==='y')||(event.key.toLowerCase()==='z'&&event.shiftKey))){event.preventDefault();redoHistory();return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='c'){if(copySelectedPlannerItems())event.preventDefault();return;}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='v'){if(pastePlannerItems())event.preventDefault();return;}
  if((event.key==='Delete'||event.key==='Backspace')&&selectedIds.length){event.preventDefault();document.getElementById('btnDelete').click();}
});

function proposalSnapshot(){return stateSnapshot();}
function saveCurrentProposalSnapshot(){const proposal=proposals.find(item=>item.id===currentProposalId);if(proposal)proposal.state=clone(proposalSnapshot());}
function switchProposal(id){saveCurrentProposalSnapshot();const proposal=proposals.find(item=>item.id===id);if(!proposal)return;currentProposalId=id;proposalNameTop.textContent=proposal.name;proposalNameCanvas.textContent=`${proposal.name} · laboratorio`;historyPast=[];historyFuture=[];restoreState(clone(proposal.state));pushHistory();renderProposalList();}
function createProposal(name='Nueva propuesta',copyCurrent=false){saveCurrentProposalSnapshot();const state=copyCurrent?proposalSnapshot():blankState();const proposal={id:makeId('proposal'),name,state:clone(state)};proposals.push(proposal);switchProposal(proposal.id);}
function blankState(){const old=stateSnapshot();return{...old,elements:[],selectedIds:[],selectedId:'',measurements:[],hiddenLayers:{},lockedLayers:{}};}
function renderProposalList(){proposalList.replaceChildren();proposals.forEach(proposal=>{const row=document.createElement('div');row.className=`proposal-row${proposal.id===currentProposalId?' active':''}`;const info=document.createElement('button');info.type='button';info.className='proposal-open';const strong=document.createElement('strong');strong.textContent=proposal.name;const small=document.createElement('small');small.textContent=proposal.id===currentProposalId?'Actual':'Abrir propuesta';info.append(strong,small);info.addEventListener('click',()=>switchProposal(proposal.id));const rename=document.createElement('button');rename.type='button';rename.textContent='✎';rename.title='Renombrar';rename.addEventListener('click',()=>{const next=prompt('Nombre de la propuesta',proposal.name);if(next?.trim()){proposal.name=next.trim();if(proposal.id===currentProposalId){proposalNameTop.textContent=proposal.name;proposalNameCanvas.textContent=`${proposal.name} · laboratorio`;}renderProposalList();}});const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.title='Eliminar';remove.disabled=proposals.length===1;remove.addEventListener('click',()=>{if(proposals.length===1)return;const index=proposals.findIndex(item=>item.id===proposal.id);proposals.splice(index,1);if(currentProposalId===proposal.id)switchProposal(proposals[Math.max(0,index-1)].id);else renderProposalList();});row.append(info,rename,remove);proposalList.appendChild(row);});}
document.getElementById('btnProposals').addEventListener('click',()=>{renderProposalList();proposalModal.hidden=false;});document.getElementById('closeProposalModal').addEventListener('click',()=>proposalModal.hidden=true);document.getElementById('btnNewProposal').addEventListener('click',()=>createProposal(`Propuesta ${proposals.length+1}`));document.getElementById('btnDuplicateProposal').addEventListener('click',()=>createProposal(`${proposals.find(item=>item.id===currentProposalId)?.name||'Propuesta'} copia`,true));proposalModal.addEventListener('click',event=>{if(event.target===proposalModal)proposalModal.hidden=true;});

function initialState(){
  seedGuests();elements=[];const table=addElement('table',{record:false,assignGuests:true});table.x=600;table.y=380;setSelection([table.id],table.id);hiddenLayers={};lockedLayers={};measurements=[];measurementUid=1;scaleInput.value=32;showGrid.checked=true;showClearance.checked=true;showLabels.checked=true;showNames.checked=true;bgVisible=true;zoom=1;setZoom(1);historyPast=[];historyFuture=[];pushHistory();render();
}
function resetCurrent(){initialState();saveCurrentProposalSnapshot();}
document.getElementById('resetLab').addEventListener('click',resetCurrent);

initialState();
proposals=[{id:makeId('proposal'),name:'Propuesta principal',state:clone(proposalSnapshot())}];currentProposalId=proposals[0].id;proposalNameTop.textContent=proposals[0].name;proposalNameCanvas.textContent=`${proposals[0].name} · laboratorio`;renderProposalList();saveCurrentProposalSnapshot();
