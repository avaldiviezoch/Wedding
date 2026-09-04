(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  function normalizeMeasurement(item) {
    if (!item) return null;
    if (Number.isFinite(item.x1)) return { id: item.id, start: { x: item.x1, y: item.y1 }, end: { x: item.x2, y: item.y2 } };
    if (item.a && item.b) return { id: item.id, start: item.a, end: item.b };
    if (item.start && item.end) return { id: item.id, start: item.start, end: item.end };
    return null;
  }
  function distancePx(item) {
    const normalized = normalizeMeasurement(item);
    if (!normalized) return 0;
    return Math.hypot(normalized.end.x - normalized.start.x, normalized.end.y - normalized.start.y);
  }
  function distanceM(item, scale) { return distancePx(item) / Math.max(1e-9, Number(scale) || 0); }
  root.measurements = Object.freeze({ normalizeMeasurement, distancePx, distanceM });
})();