import {
  CANVAS,
  createInitialState,
  setTableCapacity,
  setTableShape,
  setTabletopSize,
  setViewportZoom,
  snapshot
} from './distribucion-engine.js';
import { render } from './distribucion-renderer.js';

const planner=document.getElementById('planner');
const itemsLayer=document.getElementById('itemsLayer');
const shape=document.getElementById('shape');
const capacity=document.getElementById('capacity');
const widthM=document.getElementById('widthM');
const heightM=document.getElementById('heightM');
const zoom=document.getElementById('zoom');
const debug=document.getElementById('debug');
const status=document.getElementById('status');

const state=createInitialState();

function selected(){return state.tables.find((table)=>table.id===state.selectedTableId)||state.tables[0];}

function applyViewport(){
  const z=state.viewport.zoom;
  planner.style.width=`${CANVAS.width*z}px`;
  planner.style.height=`${CANVAS.height*z}px`;
  planner.dataset.zoom=String(z);
}

function sync(){
  const table=selected();
  shape.value=table.shape;
  capacity.value=String(table.capacity);
  widthM.value=table.tabletop.widthM;
  heightM.value=table.tabletop.heightM;
  heightM.disabled=table.shape!=='rectangular';
  zoom.value=String(state.viewport.zoom);
  debug.textContent=JSON.stringify(snapshot(state),null,2);
  render(state,{planner,itemsLayer});
  applyViewport();
}

shape.addEventListener('change',()=>{
  setTableShape(state,selected().id,shape.value);
  sync();
});

capacity.addEventListener('change',()=>{
  const table=selected();
  const before={
    widthM:table.tabletop.widthM,
    heightM:table.tabletop.heightM
  };
  const result=setTableCapacity(state,table.id,Number(capacity.value));
  if(!result.ok) alert('No se puede reducir: hay invitados en asientos que quedarían fuera.');
  if(result.ok && (table.tabletop.widthM!==before.widthM || table.tabletop.heightM!==before.heightM)){
    throw new Error('Contrato roto: cambiar sillas modificó el tamaño físico de la mesa.');
  }
  sync();
});

widthM.addEventListener('change',()=>{
  setTabletopSize(state,selected().id,Number(widthM.value),Number(heightM.value));
  sync();
});

heightM.addEventListener('change',()=>{
  setTabletopSize(state,selected().id,Number(widthM.value),Number(heightM.value));
  sync();
});

zoom.addEventListener('input',()=>{
  const table=selected();
  const before={
    tabletop:structuredClone(table.tabletop),
    capacity:table.capacity,
    seats:structuredClone(table.seats)
  };
  setViewportZoom(state,Number(zoom.value));
  if(
    table.tabletop.widthM!==before.tabletop.widthM ||
    table.tabletop.heightM!==before.tabletop.heightM ||
    table.capacity!==before.capacity ||
    JSON.stringify(table.seats)!==JSON.stringify(before.seats)
  ){
    throw new Error('Contrato roto: el zoom modificó geometría o sillas.');
  }
  sync();
});

document.querySelector('.canvas-wrap')?.addEventListener('wheel',(event)=>{
  if(!event.ctrlKey && !event.metaKey) return;
  event.preventDefault();
  const factor=event.deltaY<0?1.10:0.90;
  setViewportZoom(state,state.viewport.zoom*factor);
  sync();
},{passive:false});

status.textContent='Estructura limpia activa';
sync();
