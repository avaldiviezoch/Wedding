(() => {
  function createTableRenderer({ renderTable }) {
    if (typeof renderTable !== 'function') throw new TypeError('renderTable requerido');
    return Object.freeze({ render: (item, scale, conflicts) => renderTable(item, scale, conflicts) });
  }
  window.MiGranDiaDistributionRendererTables = Object.freeze({ createTableRenderer });
})();
