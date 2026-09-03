(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  function capacitySummary(tables, guestCount) {
    const capacity = (tables || []).reduce((sum, table) => sum + (Number(table.capacity) || 0), 0);
    const guests = Math.max(0, Number(guestCount) || 0);
    return { capacity, guests, sufficient: capacity >= guests };
  }
  function unassignedGuests(guests, tables) {
    const assigned = new Set();
    (tables || []).forEach((table) => (table.seats || []).filter(Boolean).forEach((id) => assigned.add(id)));
    return (guests || []).filter((guest) => guest?.id && !assigned.has(guest.id));
  }
  root.validation = Object.freeze({ capacitySummary, unassignedGuests });
})();