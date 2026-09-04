(() => {
  function guestAnchor(angle) {
    const cosine = Math.cos(angle);
    if (cosine > .28) return 'start';
    if (cosine < -.28) return 'end';
    return 'middle';
  }
  function compactName(name, max = 18) {
    const value = String(name || '').trim();
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
  }
  window.MiGranDiaDistributionRendererLabels = Object.freeze({ guestAnchor, compactName });
})();
