const NS='http://www.w3.org/2000/svg';
const planner=document.getElementById('planner');
const itemsLayer=document.getElementById('itemsLayer');
const measureLayer=document.getElementById('measureLayer');
const gridLayer=document.getElementById('gridLayer');
const scaleInput=document.getElementById('scaleInput');
const showGrid=document.getElementById('showGrid');
const showClearance=document.getElementById('showClearance');
const showLabels=document.getElementById('showLabels');
const showNames=document.getElementById('showNames');
const layerList=document.getElementById('layerList');
const elementCount=document.getElementById('elementCount');
const selectionForm=document.getElementById('selectionForm');
const selectionEmpty=document.getElementById('selectionEmpty');
const selectionTag=document.getElementById('selectionTag');
const seatEditorWrap=document.getElementById('seatEditorWrap');
const seatEditor=document.getElementById('seatEditor');
const guestSearch=document.getElementById('guestSearch');
const seatCount=document.getElementById('seatCount');
const selLabel=document.getElementById('selLabel');
const selX=document.getElementById('selX');
const selY=document.getElementById('selY');
const selW=document.getElementById('selW');
const selH=document.getElementById('selH');
const selRot=document.getElementById('selRot');
const selColor=document.getElementById('selColor');
const summaryTables=document.getElementById('summaryTables');
const summarySeats=document.getElementById('summarySeats');
const summaryElements=document.getElementById('summaryElements');
const zoomLabel=document.getElementById('zoomLabel');
const cursorCoords=document.getElementById('cursorCoords');
const measureNote=document.getElementById('measureNote');
const presentationOverlay=document.getElementById('presentationOverlay');
const presentationMount=document.getElementById('presentationMount');

const SAMPLE_NAMES=['Lucero','Antonio','María','Carlos','Rosa','Jorge','Paola','Diego','Ana','Luis'];
const BASE_TABLE=Object.freeze({
  widthM:3.4,
  heightM:3.4,
  radiusM:.915,
  clearanceRadiusM:1.70,
  capacity:10,
  color:'#d9b978'
});
const TYPE_DEFAULTS=Object.freeze({
  table:{label:'Mesa 1',widthM:BASE_TABLE.widthM,heightM:BASE_TABLE.heightM,color:BASE_TABLE.color,shape:'table'},
  dance:{label:'Pista de baile',widthM:5,heightM:5,color:'#8f6642',shape:'rect'},
  couple:{label:'Mesa de novios',widthM:3,heightM:1.2,color:'#d79aa7',shape:'rect'},
  bar:{label:'Barra',widthM:4,heightM:1.2,color:'#7a9e87',shape:'rect'},
  dj:{label:'DJ / sonido',widthM:3,heightM:2,color:'#7e7f9a',shape:'rect'},
  altar:{label:'Altar',widthM:4,heightM:2,color:'#e3d3ae',shape:'rect'},
  cake:{label:'Mesa de torta',widthM:1.8,heightM:1.8,color:'#cfa9c7',shape:'circle'},
  photo:{label:'Photobooth',widthM:3,heightM:2,color:'#6f95aa',shape:'rect'},
  mirror:{label:'Espejo',widthM:1,heightM:.2,color:'#dfeaf0',shape:'rect'}
});
const TYPE_NAMES=Object.freeze({table:'Mesa',dance:'Pista',couple:'Novios',bar:'Barra',dj:'DJ',altar:'Altar',cake:'Torta',photo:'Photobooth',mirror:'Espejo'});

let elements=[];
let selectedId='';
let drag=null;
let zoom=1;
let measureMode=false;
let measureStart=null;
let measurement=null;
let historyPast=[];
let historyFuture=[];
let restoringHistory=false;

function clone(value){return JSON.parse(JSON.stringify(value));}
function currentScale(){return Math.max(18,Math.min(50,Number(scaleInput.value)||32));}
function makeId(prefix='item'){return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;}
function element(tag,attrs={}){
  const node=document.createElementNS(NS,tag);
  Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));
  return node;
}
function svgPoint(event){
  const point=planner.createSVGPoint();
  point.x=event.clientX;
  point.y=event.clientY;
  return point.matrixTransform(planner.getScreenCTM().inverse());
}
function nextPosition(index){
  const column=index%3;
  const row=Math.floor(index/3);
  return {x:310+(column*265),y:230+(row*220)};
}
function guestAnchor(angle){
  const c=Math.cos(angle);
  if(c>.28)return 'start';
  if(c<-.28)return 'end';
  return 'middle';
}
function snapshot(){return {elements:clone(elements),selectedId,scale:scaleInput.value,settings:{grid:showGrid.checked,clearance:showClearance.checked,labels:showLabels.checked,names:showNames.checked}};}
function pushHistory(){
  if(restoringHistory)return;
  historyPast.push(snapshot());
  if(historyPast.length>40)historyPast.shift();
  historyFuture=[];
  updateHistoryButtons();
}
function restore(state){
  if(!state)return;
  restoringHistory=true;
  elements=clone(state.elements);
  selectedId=state.selectedId;
  scaleInput.value=state.scale;
  showGrid.checked=state.settings.grid;
  showClearance.checked=state.settings.clearance;
  showLabels.checked=state.settings.labels;
  showNames.checked=state.settings.names;
  restoringHistory=false;
  render();
}
function updateHistoryButtons(){
  document.getElementById('btnUndo').disabled=historyPast.length<=1;
  document.getElementById('btnRedo').disabled=historyFuture.length===0;
}
function addElement(type,{record=true}={}){
  const base=TYPE_DEFAULTS[type];
  if(!base)return;
  const position=nextPosition(elements.length);
  const tableIndex=elements.filter(item=>item.type==='table').length+1;
  const item={
    id:makeId(type),type,shape:base.shape,label:type==='table'?`Mesa ${tableIndex}`:base.label,
    x:position.x,y:position.y,widthM:base.widthM,heightM:base.heightM,rotation:0,color:base.color,visible:true
  };
  if(type==='table'){
    item.capacity=BASE_TABLE.capacity;
    item.guests=SAMPLE_NAMES.map((name,index)=>({seat:index+1,name}));
  }
  elements.push(item);
  selectedId=item.id;
  if(record)pushHistory();
  render();
}
function selected(){return elements.find(item=>item.id===selectedId)||null;}

function renderGuestLabel(group,guest,angle,tableRadius){
  if(!showNames.checked || !guest.name)return;
  const distance=tableRadius*2.18;
  const x=Math.cos(angle)*distance;
  const y=Math.sin(angle)*distance;
  const anchor=guestAnchor(angle);
  const width=Math.max(46,guest.name.length*7+18);
  const label=element('g',{class:'guest-tag',transform:`translate(${x.toFixed(2)} ${y.toFixed(2)})`});
  let rectX=-width/2;
  let textX=0;
  if(anchor==='start'){rectX=0;textX=8;}
  if(anchor==='end'){rectX=-width;textX=-8;}
  label.appendChild(element('rect',{x:rectX,y:-12,width,height:24,rx:8}));
  const text=element('text',{x:textX,y:1,'text-anchor':anchor});
  text.textContent=guest.name;
  label.appendChild(text);
  group.appendChild(label);
}
function bindDrag(group,item){
  group.addEventListener('pointerdown',event=>{
    if(measureMode)return;
    const point=svgPoint(event);
    selectedId=item.id;
    drag={id:item.id,dx:point.x-item.x,dy:point.y-item.y,started:false,startX:item.x,startY:item.y};
    planner.setPointerCapture(event.pointerId);
    render();
  });
}
function renderTable(item,scale){
  const group=element('g',{transform:`translate(${item.x} ${item.y}) rotate(${item.rotation||0})`,class:`draggable table-hit${selectedId===item.id?' table-selected':''}`,'data-id':item.id});
  const sizeFactor=Math.max(.35,item.widthM/BASE_TABLE.widthM);
  const tableRadius=BASE_TABLE.radiusM*scale*sizeFactor;
  const clearanceRadius=(item.widthM/2)*scale;
  const chairRadius=Math.max(7,tableRadius*.12);
  const chairDistance=tableRadius*1.58;
  if(showClearance.checked)group.appendChild(element('circle',{r:clearanceRadius,class:'clearance'}));
  item.guests.forEach((guest,index)=>{
    const angle=(-Math.PI/2)+(Math.PI*2*index/item.capacity);
    const chairX=Math.cos(angle)*chairDistance;
    const chairY=Math.sin(angle)*chairDistance;
    group.appendChild(element('circle',{cx:chairX.toFixed(2),cy:chairY.toFixed(2),r:chairRadius.toFixed(2),class:'chair'}));
    renderGuestLabel(group,guest,angle,tableRadius);
  });
  group.appendChild(element('circle',{r:tableRadius,class:'tabletop',fill:item.color,filter:'url(#softShadow)'}));
  if(showLabels.checked){
    const title=element('text',{x:0,y:-3,'text-anchor':'middle',class:'table-title'});title.textContent=item.label;group.appendChild(title);
    const meta=element('text',{x:0,y:15,'text-anchor':'middle',class:'table-meta'});meta.textContent=`${item.capacity} personas`;group.appendChild(meta);
  }
  bindDrag(group,item);
  return group;
}
function renderObject(item,scale){
  const width=item.widthM*scale;
  const height=item.heightM*scale;
  const group=element('g',{transform:`translate(${item.x} ${item.y}) rotate(${item.rotation||0})`,class:`draggable item-hit${selectedId===item.id?' item-selected':''}`,'data-id':item.id});
  let shape;
  if(item.shape==='circle')shape=element('ellipse',{cx:0,cy:0,rx:width/2,ry:height/2,fill:item.color,class:'object-shape',stroke:'#725f68'});
  else shape=element('rect',{x:-width/2,y:-height/2,width,height,rx:Math.min(12,height*.12),fill:item.color,class:'object-shape',stroke:'#665f58'});
  group.appendChild(shape);
  if(selectedId===item.id)group.insertBefore(element('rect',{x:-width/2-7,y:-height/2-7,width:width+14,height:height+14,rx:10,class:'selection-halo'}),shape);
  if(showLabels.checked){
    const title=element('text',{x:0,y:-2,'text-anchor':'middle',class:'object-title'});title.textContent=item.label;group.appendChild(title);
    const meta=element('text',{x:0,y:14,'text-anchor':'middle',class:'object-meta'});meta.textContent=`${item.widthM.toFixed(1)} × ${item.heightM.toFixed(1)} m`;group.appendChild(meta);
  }
  bindDrag(group,item);
  return group;
}
function renderMeasurements(scale){
  while(measureLayer.firstChild)measureLayer.removeChild(measureLayer.firstChild);
  if(!measurement)return;
  const {a,b}=measurement;
  measureLayer.appendChild(element('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'measure-line'}));
  measureLayer.appendChild(element('circle',{cx:a.x,cy:a.y,r:5,class:'measure-point'}));
  measureLayer.appendChild(element('circle',{cx:b.x,cy:b.y,r:5,class:'measure-point'}));
  const distance=Math.hypot(b.x-a.x,b.y-a.y)/scale;
  const text=element('text',{x:(a.x+b.x)/2,y:(a.y+b.y)/2-8,'text-anchor':'middle',class:'measure-label'});text.textContent=`${distance.toFixed(2)} m`;measureLayer.appendChild(text);
}
function renderLayerList(){
  layerList.innerHTML='';
  [...elements].reverse().forEach(item=>{
    const row=document.createElement('div');row.className='layer-row';
    const eye=document.createElement('button');eye.type='button';eye.className='layer-eye';eye.textContent=item.visible?'●':'○';eye.title=item.visible?'Ocultar':'Mostrar';
    eye.addEventListener('click',()=>{item.visible=!item.visible;render();});
    const text=document.createElement('div');const strong=document.createElement('strong');strong.textContent=item.label;const small=document.createElement('small');small.textContent=TYPE_NAMES[item.type]||item.type;text.append(strong,small);
    const selectButton=document.createElement('button');selectButton.type='button';selectButton.textContent='›';selectButton.addEventListener('click',()=>{selectedId=item.id;render();});
    row.append(eye,text,selectButton);layerList.appendChild(row);
  });
}
function renderSeatEditor(item){
  seatEditor.innerHTML='';
  if(!item || item.type!=='table'){seatEditorWrap.hidden=true;return;}
  seatEditorWrap.hidden=false;
  seatCount.textContent=String(item.capacity);
  const query=guestSearch.value.trim().toLowerCase();
  item.guests.forEach((guest,index)=>{
    if(query && !guest.name.toLowerCase().includes(query) && !String(index+1).includes(query))return;
    const row=document.createElement('label');row.className='seat-row';
    const number=document.createElement('span');number.className='seat-number';number.textContent=String(index+1);
    const input=document.createElement('input');input.type='text';input.value=guest.name;input.placeholder=`Asiento ${index+1}`;
    input.addEventListener('change',()=>{guest.name=input.value.trim();pushHistory();render();});
    row.append(number,input);seatEditor.appendChild(row);
  });
}
function fillProperties(item){
  const empty=!item;
  selectionEmpty.hidden=!empty;
  selectionForm.hidden=empty;
  selectionTag.hidden=empty;
  if(empty)return;
  selectionTag.textContent=TYPE_NAMES[item.type]||'Elemento';
  const scale=currentScale();
  selLabel.value=item.label;
  selX.value=(item.x/scale).toFixed(1);
  selY.value=(item.y/scale).toFixed(1);
  selW.value=item.widthM.toFixed(1);
  selH.value=item.heightM.toFixed(1);
  selRot.value=String(item.rotation||0);
  selColor.value=item.color;
  renderSeatEditor(item);
}
function renderSummary(){
  const tables=elements.filter(item=>item.type==='table');
  const seats=tables.reduce((sum,item)=>sum+(item.capacity||0),0);
  summaryTables.textContent=String(tables.length);
  summarySeats.textContent=String(seats);
  summaryElements.textContent=String(elements.length);
  elementCount.textContent=`${elements.length} ${elements.length===1?'elemento':'elementos'}`;
}
function render(){
  const scale=currentScale();
  gridLayer.style.display=showGrid.checked?'':'none';
  while(itemsLayer.firstChild)itemsLayer.removeChild(itemsLayer.firstChild);
  elements.filter(item=>item.visible!==false).forEach(item=>itemsLayer.appendChild(item.type==='table'?renderTable(item,scale):renderObject(item,scale)));
  renderMeasurements(scale);
  renderLayerList();
  fillProperties(selected());
  renderSummary();
  updateHistoryButtons();
}

planner.addEventListener('pointermove',event=>{
  const point=svgPoint(event);
  const scale=currentScale();
  cursorCoords.textContent=`x ${(point.x/scale).toFixed(2)} m · y ${(point.y/scale).toFixed(2)} m`;
  if(!drag)return;
  const item=elements.find(candidate=>candidate.id===drag.id);
  if(!item)return;
  item.x=Math.max(40,Math.min(1160,point.x-drag.dx));
  item.y=Math.max(40,Math.min(720,point.y-drag.dy));
  drag.started=true;
  render();
});
function endDrag(){
  if(drag?.started)pushHistory();
  drag=null;
}
planner.addEventListener('pointerup',endDrag);
planner.addEventListener('pointercancel',endDrag);
planner.addEventListener('click',event=>{
  if(!measureMode)return;
  const point=svgPoint(event);
  if(!measureStart){measureStart=point;measurement=null;render();return;}
  measurement={a:{x:measureStart.x,y:measureStart.y},b:{x:point.x,y:point.y}};
  measureStart=null;
  measureMode=false;
  measureNote.hidden=true;
  document.getElementById('btnMeasure').classList.remove('active');
  render();
});

function updateSelected(mutator,{record=true}={}){
  const item=selected();if(!item)return;
  mutator(item);
  if(record)pushHistory();
  render();
}
selLabel.addEventListener('change',()=>updateSelected(item=>{item.label=selLabel.value.trim()||item.label;}));
selX.addEventListener('change',()=>updateSelected(item=>{item.x=Math.max(20,Number(selX.value||0)*currentScale());}));
selY.addEventListener('change',()=>updateSelected(item=>{item.y=Math.max(20,Number(selY.value||0)*currentScale());}));
selW.addEventListener('change',()=>updateSelected(item=>{item.widthM=Math.max(.2,Math.min(12,Number(selW.value)||item.widthM));if(item.type==='table')item.heightM=item.widthM;}));
selH.addEventListener('change',()=>updateSelected(item=>{item.heightM=Math.max(.2,Math.min(12,Number(selH.value)||item.heightM));if(item.type==='table')item.widthM=item.heightM;}));
selRot.addEventListener('change',()=>updateSelected(item=>{item.rotation=Math.max(-180,Math.min(180,Number(selRot.value)||0));}));
selColor.addEventListener('change',()=>updateSelected(item=>{item.color=selColor.value;}));

document.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>addElement(button.dataset.add)));
document.getElementById('btnDelete').addEventListener('click',()=>{
  const index=elements.findIndex(item=>item.id===selectedId);if(index<0)return;
  elements.splice(index,1);selectedId=elements.at(-1)?.id||'';pushHistory();render();
});
document.getElementById('btnDuplicate').addEventListener('click',()=>{
  const item=selected();if(!item)return;
  const copy=clone(item);copy.id=makeId(item.type);copy.x+=36;copy.y+=36;copy.label=`${item.label} copia`;elements.push(copy);selectedId=copy.id;pushHistory();render();
});
document.getElementById('btnBringFront').addEventListener('click',()=>{
  const index=elements.findIndex(item=>item.id===selectedId);if(index<0)return;
  const [item]=elements.splice(index,1);elements.push(item);pushHistory();render();
});
document.getElementById('btnCenter').addEventListener('click',()=>updateSelected(item=>{item.x=600;item.y=380;}));
document.getElementById('btnRotateLeft').addEventListener('click',()=>updateSelected(item=>{item.rotation=(item.rotation||0)-15;}));
document.getElementById('btnRotateRight').addEventListener('click',()=>updateSelected(item=>{item.rotation=(item.rotation||0)+15;}));
document.getElementById('btnClearSeats').addEventListener('click',()=>updateSelected(item=>{if(item.type==='table')item.guests=item.guests.map((guest,index)=>({seat:index+1,name:''}));}));

guestSearch.addEventListener('input',()=>renderSeatEditor(selected()));
scaleInput.addEventListener('change',()=>{pushHistory();render();});
showGrid.addEventListener('change',()=>{pushHistory();render();});
showClearance.addEventListener('change',()=>{pushHistory();render();});
showLabels.addEventListener('change',()=>{pushHistory();render();});
showNames.addEventListener('change',()=>{pushHistory();render();});
document.getElementById('btnDefaultView').addEventListener('click',()=>{scaleInput.value=32;showGrid.checked=true;showClearance.checked=true;showLabels.checked=true;showNames.checked=true;zoom=1;updateZoom();pushHistory();render();});
document.getElementById('btnShowAllLayers').addEventListener('click',()=>{elements.forEach(item=>item.visible=true);render();});

function updateZoom(){planner.style.width=`${zoom*100}%`;zoomLabel.textContent=`${Math.round(zoom*100)}%`;}
document.getElementById('btnZoomIn').addEventListener('click',()=>{zoom=Math.min(1.6,zoom+.1);updateZoom();});
document.getElementById('btnZoomOut').addEventListener('click',()=>{zoom=Math.max(.6,zoom-.1);updateZoom();});
document.getElementById('btnFit').addEventListener('click',()=>{zoom=1;updateZoom();document.getElementById('canvasWrap').scrollTo({top:0,left:0,behavior:'smooth'});});
document.getElementById('btnMeasure').addEventListener('click',event=>{measureMode=!measureMode;measureStart=null;if(!measureMode)measurement=null;measureNote.hidden=!measureMode;event.currentTarget.classList.toggle('active',measureMode);render();});

document.getElementById('btnUndo').addEventListener('click',()=>{
  if(historyPast.length<=1)return;
  historyFuture.push(historyPast.pop());
  restore(historyPast.at(-1));
  updateHistoryButtons();
});
document.getElementById('btnRedo').addEventListener('click',()=>{
  const state=historyFuture.pop();if(!state)return;
  historyPast.push(clone(state));restore(state);updateHistoryButtons();
});

document.getElementById('btnPresentation').addEventListener('click',()=>{
  presentationMount.innerHTML='';
  const cloneSvg=planner.cloneNode(true);cloneSvg.removeAttribute('style');presentationMount.appendChild(cloneSvg);presentationOverlay.hidden=false;
});
document.getElementById('closePresentation').addEventListener('click',()=>{presentationOverlay.hidden=true;presentationMount.innerHTML='';});
presentationOverlay.addEventListener('click',event=>{if(event.target===presentationOverlay)document.getElementById('closePresentation').click();});

document.getElementById('resetLab').addEventListener('click',()=>{
  elements=[];selectedId='';historyPast=[];historyFuture=[];measurement=null;measureMode=false;measureStart=null;scaleInput.value=32;showGrid.checked=true;showClearance.checked=true;showLabels.checked=true;showNames.checked=true;guestSearch.value='';zoom=1;updateZoom();addElement('table',{record:false});pushHistory();render();
});

addElement('table',{record:false});
pushHistory();
updateZoom();
render();
