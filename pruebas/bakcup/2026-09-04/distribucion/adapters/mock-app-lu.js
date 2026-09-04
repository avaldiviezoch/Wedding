(() => {
  const root = window.MiGranDiaDistributionAdapters ||= {};
  function createMockAppLuAdapter(seed = {}) {
    const guests = Array.isArray(seed.guests) ? seed.guests.map((item) => ({ ...item })) : [];
    const tables = Array.isArray(seed.tables) ? seed.tables.map((item) => ({ ...item, seats: Array.isArray(item.seats) ? [...item.seats] : [] })) : [];
    return Object.freeze({
      getGuests() { return guests.map((item) => ({ ...item })); },
      getTables() { return tables.map((item) => ({ ...item, seats: [...item.seats] })); },
      mode: 'memory-only'
    });
  }
  root.createMockAppLuAdapter = createMockAppLuAdapter;
})();