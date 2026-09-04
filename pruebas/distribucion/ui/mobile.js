(() => {
  function createMobileUI({ closePanels, repositionFab, updateMenuDirection }) {
    return Object.freeze({
      close: () => closePanels?.(),
      repositionFab: (panel) => repositionFab?.(panel),
      updateMenuDirection: () => updateMenuDirection?.()
    });
  }
  window.MiGranDiaDistributionUIMobile = Object.freeze({ createMobileUI });
})();
