(() => {
  function createLayersUI({ renderLayerList }) {
    if (typeof renderLayerList !== 'function') throw new TypeError('renderLayerList requerido');
    return Object.freeze({ render: () => renderLayerList() });
  }
  window.MiGranDiaDistributionUILayers = Object.freeze({ createLayersUI });
})();
