/* Distribución · adapter de laboratorio
   REGLA PRINCIPAL: STORAGE NO SE TOCA.
   Esta frontera es exclusivamente memory-only. */
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

window.MiGranDiaDistributionAdapter = Object.freeze({
  mode:'memory-only',
  storageWrites:false,
  firebase:false,
  firestore:false,
  readGuests(){
    return typeof guests !== 'undefined' ? structuredClone(guests) : [];
  },
  readTables(){
    return typeof elements !== 'undefined'
      ? structuredClone(elements.filter((item)=>item?.type === 'table'))
      : [];
  }
});
