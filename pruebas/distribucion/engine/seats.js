(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  function ensureSeatArray(table, capacity = 10) {
    const current = Array.isArray(table?.seats) ? table.seats.slice(0, capacity) : [];
    while (current.length < capacity) current.push(null);
    if (table) table.seats = current;
    return current;
  }
  function occupiedSeatCount(table) { return ensureSeatArray(table, Number(table?.capacity) || 10).filter(Boolean).length; }
  function canReduceCapacity(table, nextCapacity) { return Number(nextCapacity) >= occupiedSeatCount(table); }
  root.seats = Object.freeze({ ensureSeatArray, occupiedSeatCount, canReduceCapacity });
})();