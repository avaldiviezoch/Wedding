export function createMemoryAdapter(initialData={}) {
  let data=structuredClone(initialData);
  const listeners=new Set();
  return Object.freeze({
    getGuests:()=>structuredClone(data.guests||[]),
    getTables:()=>structuredClone(data.tables||[]),
    getDistribution:()=>structuredClone(data.distribution||{}),
    updateTableGeometry:(tableId,geometry)=>{
      data.distribution ||= {};
      data.distribution[tableId]={...(data.distribution[tableId]||{}),...structuredClone(geometry)};
      listeners.forEach((fn)=>fn());
    },
    updateTableCapacity:(tableId,capacity)=>{
      const table=(data.tables||[]).find((entry)=>entry.id===tableId);
      if(table) table.capacity=capacity;
      listeners.forEach((fn)=>fn());
    },
    updateSeatAssignment:(tableId,seatNumber,guestId)=>{
      const table=(data.tables||[]).find((entry)=>entry.id===tableId);
      if(!table) return;
      table.seats ||= [];
      table.seats[seatNumber-1]=guestId||null;
      listeners.forEach((fn)=>fn());
    },
    subscribe:(fn)=>{listeners.add(fn);return()=>listeners.delete(fn);}
  });
}
