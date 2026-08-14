(() => {
  'use strict';

  const STORAGE_KEY = 'planificador_bodas_invitados_v1';

  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!Array.isArray(data.tables) || !Array.isArray(data.guests)) return;

    let changed = false;

    data.tables = data.tables.map((table, index) => {
      const next = { ...table };
      const id = next.id;
      if (!id) return next;

      const assigned = data.guests.filter((guest) => String(guest.tableId || '') === String(id)).length;
      const currentSeats = Array.isArray(next.seats) ? [...next.seats] : [];
      const storedCapacity = Number(next.capacity || currentSeats.length || 10) || 10;
      const safeCapacity = Math.max(storedCapacity, assigned);

      if (!next.type && !next.shape) {
        next.type = 'round';
        changed = true;
      }

      if (Number(next.capacity) !== safeCapacity) {
        next.capacity = safeCapacity;
        changed = true;
      }

      if (currentSeats.length < safeCapacity) {
        for (let seat = currentSeats.length; seat < safeCapacity; seat += 1) {
          currentSeats.push({
            id: `${id}_seat_${seat + 1}`,
            index: seat
          });
        }
        next.seats = currentSeats;
        changed = true;
      }

      if (!next.name) {
        next.name = `Mesa ${index + 1}`;
        changed = true;
      }

      return next;
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('migrandia:datachange', {
        detail: { source: 'tables-compatibility' }
      }));
    }
  } catch (error) {
    console.warn('No se pudo validar la compatibilidad de mesas:', error);
  }
})();
