const NS='http://www.w3.org/2000/svg';
const planner=document.getElementById('planner');
const layer=document.getElementById('tablesLayer');
const scaleInput=document.getElementById('scaleInput');
const showNames=document.getElementById('showNames');
const showClearance=document.getElementById('showClearance');
const selectionTitle=document.getElementById('selectionTitle');
const selectionMeta=document.getElementById('selectionMeta');

const SAMPLE_NAMES=['Lucero','Antonio','María','Carlos','Rosa','Jorge','Paola','Diego','Ana','Luis'];
const BASE_TABLE=Object.freeze({
  radiusM:.915,
  clearanceRadiusM:1.70,
  capacity:10
});

let tables=[];
let selectedId='';
let drag=null;

function svgPoint(event){
  const point=planner.createSVGPoint();
  point.x=event.clientX;
  point.y=event.clientY;
  return point.matrixTransform(planner.getScreenCTM().inverse());
}

function tableId(){
  return `table-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
}

function nextPosition(index){
  const column=index%3;
  const row=Math.floor(index/3);
  return {x:340+(column*260),y:280+(row*250)};
}

function createRoundTable(){
  const position=nextPosition(tables.length);
  const table={
    id:tableId(),
    name:`Mesa ${tables.length+1}`,
    x:position.x,
    y:position.y,
    type:'round',
    capacity:BASE_TABLE.capacity,
    radiusM:BASE_TABLE.radiusM,
    clearanceRadiusM:BASE_TABLE.clearanceRadiusM,
    guests:SAMPLE_NAMES.map((name,index)=>({seat:index+1,name}))
  };
  tables.push(table);
  selectedId=table.id;
  render();
}

function element(tag,attrs={}){
  const node=document.createElementNS(NS,tag);
  Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));
  return node;
}

function guestAnchor(angle){
  const c=Math.cos(angle);
  if(c>.28)return 'start';
  if(c<-.28)return 'end';
  return 'middle';
}

function renderTable(table,scale){
  const group=element('g',{
    transform:`translate(${table.x} ${table.y})`,
    class:`table-hit${selectedId===table.id?' table-selected':''}`,
    'data-table-id':table.id
  });

  const tableRadius=table.radiusM*scale;
  const clearanceRadius=table.clearanceRadiusM*scale;
  const chairRadius=Math.max(7,tableRadius*.12);
  const chairDistance=tableRadius*1.58;
  const nameDistance=tableRadius*2.18;

  if(showClearance.checked){
    group.appendChild(element('circle',{r:clearanceRadius,class:'clearance'}));
  }

  table.guests.forEach((guest,index)=>{
    const angle=(-Math.PI/2)+(Math.PI*2*index/table.capacity);
    const chairX=Math.cos(angle)*chairDistance;
    const chairY=Math.sin(angle)*chairDistance;
    group.appendChild(element('circle',{cx:chairX.toFixed(2),cy:chairY.toFixed(2),r:chairRadius.toFixed(2),class:'chair'}));

    if(!showNames.checked)return;
    const labelX=Math.cos(angle)*nameDistance;
    const labelY=Math.sin(angle)*nameDistance;
    const anchor=guestAnchor(angle);
    const width=Math.max(46,guest.name.length*7+18);
    const label=element('g',{class:'guest-tag',transform:`translate(${labelX.toFixed(2)} ${labelY.toFixed(2)})`});
    let rectX=-width/2;
    let textX=0;
    if(anchor==='start'){rectX=0;textX=8;}
    if(anchor==='end'){rectX=-width;textX=-8;}
    label.appendChild(element('rect',{x:rectX,y:-12,width,height:24,rx:8}));
    const text=element('text',{x:textX,y:1,'text-anchor':anchor});
    text.textContent=guest.name;
    label.appendChild(text);
    group.appendChild(label);
  });

  group.appendChild(element('circle',{r:tableRadius,class:'tabletop',filter:'url(#softShadow)'}));
  const title=element('text',{x:0,y:-3,'text-anchor':'middle',class:'table-title'});
  title.textContent=table.name;
  group.appendChild(title);
  const meta=element('text',{x:0,y:15,'text-anchor':'middle',class:'table-meta'});
  meta.textContent=`${table.capacity} personas`;
  group.appendChild(meta);

  group.addEventListener('pointerdown',(event)=>{
    const point=svgPoint(event);
    selectedId=table.id;
    drag={id:table.id,dx:point.x-table.x,dy:point.y-table.y};
    planner.setPointerCapture(event.pointerId);
    render();
  });

  return group;
}

function updateSelection(){
  const table=tables.find(item=>item.id===selectedId) || tables[0];
  if(!table){
    selectionTitle.textContent='Sin mesa seleccionada';
    selectionMeta.textContent='';
    return;
  }
  selectionTitle.textContent=table.name;
  selectionMeta.textContent='Circular · 10 sillas';
}

function render(){
  const scale=Math.max(18,Math.min(50,Number(scaleInput.value)||32));
  while(layer.firstChild)layer.removeChild(layer.firstChild);
  tables.forEach(table=>layer.appendChild(renderTable(table,scale)));
  updateSelection();
}

planner.addEventListener('pointermove',(event)=>{
  if(!drag)return;
  const table=tables.find(item=>item.id===drag.id);
  if(!table)return;
  const point=svgPoint(event);
  table.x=Math.max(90,Math.min(1110,point.x-drag.dx));
  table.y=Math.max(90,Math.min(670,point.y-drag.dy));
  render();
});

function endDrag(){drag=null;}
planner.addEventListener('pointerup',endDrag);
planner.addEventListener('pointercancel',endDrag);

document.getElementById('addRoundTable').addEventListener('click',createRoundTable);
document.getElementById('resetLab').addEventListener('click',()=>{
  tables=[];
  selectedId='';
  createRoundTable();
});
scaleInput.addEventListener('input',render);
showNames.addEventListener('change',render);
showClearance.addEventListener('change',render);

createRoundTable();
