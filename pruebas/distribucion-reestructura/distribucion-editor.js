import {
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
}

shape.addEventListener('change',()=>{
  setTableShape(state,selected().id,shape.value);
  sync();
});

capacity.addEventListener('change',()=>{
  const result=setTableCapacity(state,selected().id,Number(capacity.value));
  if(!result.ok) alert('No se puede reducir: hay invitados en asientos que quedarían fuera.');
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
  setViewportZoom(state,Number(zoom.value));
  sync();
});

status.textContent='Estructura limpia activa';
sync();
