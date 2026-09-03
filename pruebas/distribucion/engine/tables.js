(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const TABLETOP_RADIUS_M = 0.915;
  const DEFAULT_CLEARANCE_DIAMETER_M = 3.4;
  const CHAIR_ORBIT_FACTOR = 1.33;
  const LABEL_ORBIT_FACTOR = 2.18;
  const DEFAULT_CAPACITY = 10;

  function normalizeTable(table) {
    if (!table) return table;
    table.capacity = DEFAULT_CAPACITY;
    table.widthM = Math.max(0.2, Number(table.widthM) || DEFAULT_CLEARANCE_DIAMETER_M);
    table.heightM = table.widthM;
    table.shape = 'table';
    return table;
  }

  function tabletopRadiusPx(scale) { return TABLETOP_RADIUS_M * scale; }
  function chairOrbitPx(scale) { return tabletopRadiusPx(scale) * CHAIR_ORBIT_FACTOR; }
  function labelOrbitPx(scale) { return tabletopRadiusPx(scale) * LABEL_ORBIT_FACTOR; }

  root.tables = Object.freeze({ TABLETOP_RADIUS_M, DEFAULT_CLEARANCE_DIAMETER_M, CHAIR_ORBIT_FACTOR, LABEL_ORBIT_FACTOR, DEFAULT_CAPACITY, normalizeTable, tabletopRadiusPx, chairOrbitPx, labelOrbitPx });
})();