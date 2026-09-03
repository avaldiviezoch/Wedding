(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};

  const RECTANGULAR_TABLE_CONTRACT = Object.freeze({
    id: 'rectangular-v1-cap10',
    shape: 'rectangular',
    capacity: 10,
    tabletopWidthM: 2.40,
    tabletopHeightM: 0.75,
    clearanceWidthM: 4.00,
    clearanceHeightM: 2.35,
    chairOffsetM: 0.38,
    labelOffsetM: 0.72,
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

  function dimensionsAtScale(scale = 32) {
    const s = Number(scale) || 32;
    const tabletopWidthPx = RECTANGULAR_TABLE_CONTRACT.tabletopWidthM * s;
    const tabletopHeightPx = RECTANGULAR_TABLE_CONTRACT.tabletopHeightM * s;
    return Object.freeze({
      scale: s,
      tabletopWidthPx,
      tabletopHeightPx,
      tabletopHalfWidthPx: tabletopWidthPx / 2,
      tabletopHalfHeightPx: tabletopHeightPx / 2,
      clearanceWidthPx: RECTANGULAR_TABLE_CONTRACT.clearanceWidthM * s,
      clearanceHeightPx: RECTANGULAR_TABLE_CONTRACT.clearanceHeightM * s,
      chairRadiusPx: Math.max(RECTANGULAR_TABLE_CONTRACT.chairMinRadiusPx, tabletopHeightPx * RECTANGULAR_TABLE_CONTRACT.chairRadiusFactor)
    });
  }

  function perimeterSeatPosition(index, scale = 32) {
    const s = Number(scale) || 32;
    const halfW = RECTANGULAR_TABLE_CONTRACT.tabletopWidthM * s / 2;
    const halfH = RECTANGULAR_TABLE_CONTRACT.tabletopHeightM * s / 2;
    const xOrbit = halfW + RECTANGULAR_TABLE_CONTRACT.chairOffsetM * s;
    const yOrbit = halfH + RECTANGULAR_TABLE_CONTRACT.chairOffsetM * s;
    const x1 = halfW * 0.72;
    const x2 = halfW * 0.24;
    const positions = [
      { x: -x1, y: -yOrbit, side: 'top' },
      { x: -x2, y: -yOrbit, side: 'top' },
      { x:  x2, y: -yOrbit, side: 'top' },
      { x:  x1, y: -yOrbit, side: 'top' },
      { x:  xOrbit, y: 0, side: 'right' },
      { x:  x1, y: yOrbit, side: 'bottom' },
      { x:  x2, y: yOrbit, side: 'bottom' },
      { x: -x2, y: yOrbit, side: 'bottom' },
      { x: -x1, y: yOrbit, side: 'bottom' },
      { x: -xOrbit, y: 0, side: 'left' }
    ];
    return Object.freeze({ ...positions[Math.max(0, Math.min(9, Number(index) || 0))] });
  }

  function labelPosition(index, scale = 32) {
    const seat = perimeterSeatPosition(index, scale);
    const extra = RECTANGULAR_TABLE_CONTRACT.labelOffsetM * (Number(scale) || 32);
    if (seat.side === 'top') return Object.freeze({ x: seat.x, y: seat.y - extra, anchor: 'middle' });
    if (seat.side === 'bottom') return Object.freeze({ x: seat.x, y: seat.y + extra, anchor: 'middle' });
    if (seat.side === 'right') return Object.freeze({ x: seat.x + extra, y: seat.y, anchor: 'start' });
    return Object.freeze({ x: seat.x - extra, y: seat.y, anchor: 'end' });
  }

  function normalizeRectangularTable(table) {
    if (!table) return table;
    table.type = 'table';
    table.tableShape = 'rectangular';
    table.shape = 'rect';
    table.capacity = RECTANGULAR_TABLE_CONTRACT.capacity;
    table.widthM = RECTANGULAR_TABLE_CONTRACT.clearanceWidthM;
    table.heightM = RECTANGULAR_TABLE_CONTRACT.clearanceHeightM;
    return table;
  }

  root.rectangularTableContract = Object.freeze({ RECTANGULAR_TABLE_CONTRACT, dimensionsAtScale, perimeterSeatPosition, labelPosition, normalizeRectangularTable });
})();