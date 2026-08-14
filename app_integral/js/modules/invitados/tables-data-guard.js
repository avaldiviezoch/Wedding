const STORAGE_KEY = 'planificador_bodas_invitados_v1';

function makeSeatId() {
  return `seat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const data = JSON.parse(raw);
    const guests = Array.isArray(data?.guests) ? data.guests : [];
    const tables = Array.isArray(data?.tables) ? data.tables : [];
    const tableMap = new Map(tables.map((table) => [String(table.id), table]));
    const assignedByTable = new Map();
    let changed = false;

    guests.forEach((guest) => {
      if (!guest?.tableId) return;
      const key = String(guest.tableId);
      if (!assignedByTable.has(key)) assignedByTable.set(key, []);
      assignedByTable.get(key).push(guest);
    });

    assignedByTable.forEach((assigned, tableId) => {
      let table = tableMap.get(tableId);

      // Protección de compatibilidad: si existe una asignación antigua cuyo objeto
      // de mesa no está presente, recuperamos la mesa en vez de borrar al invitado.
      if (!table) {
        table = {
          id: tableId,
          name: `Mesa recuperada`,
          type: 'round',
          capacity: Math.max(10, assigned.length),
          seats: []
        };
        tables.push(table);
        tableMap.set(tableId, table);
        changed = true;
      }

      const highestSeat = assigned.reduce((max, guest) => {
        const value = Number(guest.seatNumber || 0);
        return Number.isFinite(value) ? Math.max(max, value) : max;
      }, 0);
      const currentCapacity = Math.max(1, Number(table.capacity || 0), Array.isArray(table.seats) ? table.seats.length : 0);
      const safeCapacity = Math.max(currentCapacity, assigned.length, highestSeat, 1);

      if (Number(table.capacity) !== safeCapacity) {
        table.capacity = safeCapacity;
        changed = true;
      }
      if (!table.type) {
        table.type = 'round';
        changed = true;
      }
      if (!Array.isArray(table.seats)) {
        table.seats = [];
        changed = true;
      }
      if (table.seats.length < safeCapacity) {
        for (let index = table.seats.length; index < safeCapacity; index++) {
          table.seats.push({ id: makeSeatId(), index });
        }
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, guests, tables }));
    }
  }
} catch (error) {
  console.warn('No se pudo ejecutar la protección de compatibilidad de mesas:', error);
}
