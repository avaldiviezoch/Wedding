(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const SUPPORTED_CAPACITIES = Object.freeze([4, 6, 8, 10, 12, 14, 16]);

  function normalizeCapacity(value, fallback = 10) {
    const numeric = Number(value);
    return SUPPORTED_CAPACITIES.includes(numeric) ? numeric : fallback;
  }

  function ensureSeatArray(table, capacity = Number(table?.capacity) || 10) {
    const target = normalizeCapacity(capacity, 10);
    const source = Array.isArray(table?.seats) ? table.seats : [];
    const current = source.slice(0, target);
    while (current.length < target) current.push(null);
    if (table) {
      table.capacity = target;
      table.seats = current;
    }
    return current;
  }

  function occupiedSeatCount(table) {
    const source = Array.isArray(table?.seats) ? table.seats : [];
    return source.filter(Boolean).length;
  }

  function occupiedBeyondCapacity(table, nextCapacity) {
    const target = normalizeCapacity(nextCapacity, Number(table?.capacity) || 10);
    const source = Array.isArray(table?.seats) ? table.seats : [];
    return source.slice(target).map((guestId, offset) => guestId ? Object.freeze({ seatNumber: target + offset + 1, guestId }) : null).filter(Boolean);
  }

  function canReduceCapacity(table, nextCapacity) {
    const target = normalizeCapacity(nextCapacity, Number(table?.capacity) || 10);
    const current = normalizeCapacity(table?.capacity, 10);
    if (target >= current) return true;
    return occupiedBeyondCapacity(table, target).length === 0;
  }

  function resizeCapacity(table, nextCapacity) {
    if (!table) return Object.freeze({ ok: false, reason: 'missing-table' });
    const target = normalizeCapacity(nextCapacity, Number(table.capacity) || 10);
    const blocked = occupiedBeyondCapacity(table, target);
    if (blocked.length) return Object.freeze({ ok: false, reason: 'occupied-seats', blocked });
    const previousCapacity = normalizeCapacity(table.capacity, 10);
    ensureSeatArray(table, target);
    return Object.freeze({ ok: true, previousCapacity, capacity: target, blocked: Object.freeze([]) });
  }

  root.seats = Object.freeze({ SUPPORTED_CAPACITIES, normalizeCapacity, ensureSeatArray, occupiedSeatCount, occupiedBeyondCapacity, canReduceCapacity, resizeCapacity });
})();