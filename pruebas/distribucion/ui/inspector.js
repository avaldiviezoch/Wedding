(() => {
  function createInspectorUI({ fillProperties, renderSeatEditor }) {
    if (typeof fillProperties !== 'function') throw new TypeError('fillProperties requerido');
    return Object.freeze({
      render: (item) => fillProperties(item),
      renderSeats: (table) => renderSeatEditor?.(table)
    });
  }
  window.MiGranDiaDistributionUIInspector = Object.freeze({ createInspectorUI });
})();
