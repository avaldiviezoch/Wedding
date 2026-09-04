export const CANVAS = Object.freeze({ width:1448, height:1086 });
export const SUPPORTED_CAPACITIES = Object.freeze([4,6,8,10,12,14,16]);
export const DEFAULT_TABLETOP = Object.freeze({
  round:Object.freeze({ widthM:1.50, heightM:1.50 }),
  square:Object.freeze({ widthM:1.80, heightM:1.80 }),
  rectangular:Object.freeze({ widthM:2.40, heightM:0.75 })
});

const clone = (value) => structuredClone(value);
const clamp = (value,min,max) => Math.max(min,Math.min(max,Number(value)||0));

export function createTable(overrides={}) {
  const shape = overrides.shape || 'round';
  const defaults = DEFAULT_TABLETOP[shape] || DEFAULT_TABLETOP.round;
  const capacity = SUPPORTED_CAPACITIES.includes(Number(overrides.capacity)) ? Number(overrides.capacity) : 10;
  return {
    id:overrides.id || 'table-1',
    type:'table',
    shape,
    tabletop:{
      widthM:Number(overrides.tabletop?.widthM ?? defaults.widthM),
      heightM:Number(overrides.tabletop?.heightM ?? defaults.heightM)
    },
    capacity,
    seatLayout:overrides.seatLayout || 'default',
    seats:Array.from({length:capacity},(_,i)=>overrides.seats?.[i] ?? null),
    x:Number(overrides.x ?? CANVAS.width/2),
    y:Number(overrides.y ?? CANVAS.height/2),
    rotation:Number(overrides.rotation ?? 0),
    locked:Boolean(overrides.locked)
  };
}

export function createInitialState() {
  return {
    version:1,
    viewport:{ zoom:1 },
    selectedTableId:'table-1',
    tables:[createTable()]
  };
}

function tableById(state,id){
  const table=state.tables.find((entry)=>entry.id===id);
  if(!table) throw new Error('Mesa no encontrada: '+id);
  return table;
}

export function setTableCapacity(state,id,nextCapacity){
  const capacity=Number(nextCapacity);
  if(!SUPPORTED_CAPACITIES.includes(capacity)) throw new Error('Capacidad no soportada');
  const table=tableById(state,id);
  const blocked=table.seats.slice(capacity).map((guestId,index)=>guestId?{seatNumber:capacity+index+1,guestId}:null).filter(Boolean);
  if(blocked.length) return {ok:false,reason:'occupied-seats',blocked};
  table.capacity=capacity;
  table.seats=table.seats.slice(0,capacity);
  while(table.seats.length<capacity) table.seats.push(null);
  return {ok:true};
}

export function setTableShape(state,id,nextShape){
  if(!DEFAULT_TABLETOP[nextShape]) throw new Error('Forma no soportada');
  const table=tableById(state,id);
  if(table.shape===nextShape) return {ok:true,changed:false};
  table.shape=nextShape;
  table.tabletop=clone(DEFAULT_TABLETOP[nextShape]);
  table.seatLayout='default';
  return {ok:true,changed:true};
}

export function setTabletopSize(state,id,widthM,heightM=widthM){
  const table=tableById(state,id);
  const width=clamp(widthM,.2,20);
  const height=clamp(heightM,.2,20);
  if(table.shape==='round'||table.shape==='square'){
    table.tabletop.widthM=width;
    table.tabletop.heightM=width;
  }else{
    table.tabletop.widthM=width;
    table.tabletop.heightM=height;
  }
  return {ok:true};
}

export function setViewportZoom(state,nextZoom){
  state.viewport.zoom=clamp(nextZoom,.65,1.8);
  return {ok:true};
}

export function snapshot(state){ return clone(state); }
