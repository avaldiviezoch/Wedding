(() => {
  function createTentRenderer({ renderTent }) {
    if (typeof renderTent !== 'function') throw new TypeError('renderTent requerido');
    return Object.freeze({ render: (item) => renderTent(item) });
  }
  window.MiGranDiaDistributionRendererTents = Object.freeze({ createTentRenderer });
})();
