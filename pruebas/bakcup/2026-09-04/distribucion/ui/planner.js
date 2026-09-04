(() => {
  function createPlannerUI({ render, setSelection, clearSelection }) {
    if (typeof render !== 'function') throw new TypeError('render requerido');
    return Object.freeze({
      render: () => render(),
      select: (ids, primary) => setSelection?.(ids, primary),
      clearSelection: () => clearSelection?.()
    });
  }
  window.MiGranDiaDistributionUIPlanner = Object.freeze({ createPlannerUI });
})();
