(() => {
  function chairPosition(index, capacity, distance) {
    const count = Math.max(1, Number(capacity) || 1);
    const angle = -Math.PI / 2 + Math.PI * 2 * Number(index || 0) / count;
    return Object.freeze({ angle, x: Math.cos(angle) * distance, y: Math.sin(angle) * distance });
  }
  window.MiGranDiaDistributionRendererChairs = Object.freeze({ chairPosition });
})();
