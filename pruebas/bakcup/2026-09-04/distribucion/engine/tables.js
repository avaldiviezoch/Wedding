(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const round = root.roundTableContract;
  if (!round) throw new Error('round-table-contract.js debe cargar antes de tables.js');

  const contract = round.ROUND_TABLE_CONTRACT;
  const TABLETOP_RADIUS_M = contract.tabletopRadiusM;
  const DEFAULT_CLEARANCE_DIAMETER_M = contract.clearanceDiameterM;
  const CHAIR_ORBIT_FACTOR = contract.chairOrbitFactor;
  const LABEL_ORBIT_FACTOR = contract.labelOrbitFactor;
  const DEFAULT_CAPACITY = contract.capacity;

  function normalizeTable(table) {
    return round.normalizeCurrentRoundTable(table);
  }

  function tabletopRadiusPx(scale) { return round.dimensionsAtScale(scale).tabletopRadiusPx; }
  function chairOrbitPx(scale) { return round.dimensionsAtScale(scale).chairOrbitPx; }
  function labelOrbitPx(scale) { return round.dimensionsAtScale(scale).labelOrbitPx; }

  root.tables = Object.freeze({
    TABLETOP_RADIUS_M,
    DEFAULT_CLEARANCE_DIAMETER_M,
    CHAIR_ORBIT_FACTOR,
    LABEL_ORBIT_FACTOR,
    DEFAULT_CAPACITY,
    contract,
    normalizeTable,
    tabletopRadiusPx,
    chairOrbitPx,
    labelOrbitPx,
    seatAngle: round.seatAngle
  });
})();