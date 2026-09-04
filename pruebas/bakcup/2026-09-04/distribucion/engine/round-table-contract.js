(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};

  const ROUND_TABLE_CONTRACT = Object.freeze({
    id: 'round-current-v1',
    shape: 'round',
    capacity: 10,
    tabletopRadiusM: 0.915,
    tabletopDiameterM: 1.83,
    clearanceDiameterM: 3.40,
    clearanceRadiusM: 1.70,
    chairOrbitFactor: 1.33,
    labelOrbitFactor: 2.18,
    seatStartAngleRad: -Math.PI / 2,
    chairMinRadiusPx: 7,
    chairRadiusFactor: 0.12,
    labelMaxChars: 18,
    labelFontSizePx: 9.5,
    conflictColor: '#c84242',
    selectedColor: '#d59b3c',
    tabletopStroke: '#755e43',
    chairFill: '#fffdf9',
    chairStroke: '#6d655a'
  });

  function dimensionsAtScale(scale) {
    const s = Number(scale) || 32;
    const tabletopRadiusPx = ROUND_TABLE_CONTRACT.tabletopRadiusM * s;
    return Object.freeze({
      scale: s,
      tabletopRadiusPx,
      tabletopDiameterPx: tabletopRadiusPx * 2,
      clearanceRadiusPx: ROUND_TABLE_CONTRACT.clearanceRadiusM * s,
      chairOrbitPx: tabletopRadiusPx * ROUND_TABLE_CONTRACT.chairOrbitFactor,
      labelOrbitPx: tabletopRadiusPx * ROUND_TABLE_CONTRACT.labelOrbitFactor,
      chairRadiusPx: Math.max(ROUND_TABLE_CONTRACT.chairMinRadiusPx, tabletopRadiusPx * ROUND_TABLE_CONTRACT.chairRadiusFactor)
    });
  }

  function seatAngle(index, capacity = ROUND_TABLE_CONTRACT.capacity) {
    return ROUND_TABLE_CONTRACT.seatStartAngleRad + Math.PI * 2 * Number(index) / Number(capacity || ROUND_TABLE_CONTRACT.capacity);
  }

  function normalizeCurrentRoundTable(table) {
    if (!table) return table;
    table.type = 'table';
    table.shape = 'table';
    table.capacity = ROUND_TABLE_CONTRACT.capacity;
    table.widthM = ROUND_TABLE_CONTRACT.clearanceDiameterM;
    table.heightM = ROUND_TABLE_CONTRACT.clearanceDiameterM;
    return table;
  }

  root.roundTableContract = Object.freeze({ ROUND_TABLE_CONTRACT, dimensionsAtScale, seatAngle, normalizeCurrentRoundTable });
})();