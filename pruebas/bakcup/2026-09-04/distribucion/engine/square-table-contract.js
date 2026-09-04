(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};

  const SQUARE_TABLE_CONTRACT = Object.freeze({
    id: 'square-v1-cap10',
    shape: 'square',
    capacity: 10,
    tabletopSideM: 1.80,
    clearanceWidthM: 3.40,
    clearanceHeightM: 3.40,
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
    const tabletopSidePx = SQUARE_TABLE_CONTRACT.tabletopSideM * s;
    return Object.freeze({
      scale: s,
      tabletopSidePx,
      tabletopHalfPx: tabletopSidePx / 2,
      clearanceWidthPx: SQUARE_TABLE_CONTRACT.clearanceWidthM * s,
      clearanceHeightPx: SQUARE_TABLE_CONTRACT.clearanceHeightM * s,
      chairRadiusPx: Math.max(SQUARE_TABLE_CONTRACT.chairMinRadiusPx, tabletopSidePx * SQUARE_TABLE_CONTRACT.chairRadiusFactor / 2)
    });
  }

  function perimeterSeatPosition(index, scale = 32) {
    const s = Number(scale) || 32;
    const half = SQUARE_TABLE_CONTRACT.tabletopSideM * s / 2;
    const orbit = half + SQUARE_TABLE_CONTRACT.chairOffsetM * s;
    const positions = [
      { x: -orbit * 0.5, y: -orbit, side: 'top' },
      { x:  orbit * 0.5, y: -orbit, side: 'top' },
      { x:  orbit, y: -orbit * 0.5, side: 'right' },
      { x:  orbit, y: 0, side: 'right' },
      { x:  orbit, y: orbit * 0.5, side: 'right' },
      { x:  orbit * 0.5, y: orbit, side: 'bottom' },
      { x: -orbit * 0.5, y: orbit, side: 'bottom' },
      { x: -orbit, y: orbit * 0.5, side: 'left' },
      { x: -orbit, y: 0, side: 'left' },
      { x: -orbit, y: -orbit * 0.5, side: 'left' }
    ];
    return Object.freeze({ ...positions[Math.max(0, Math.min(9, Number(index) || 0))] });
  }

  function labelPosition(index, scale = 32) {
    const seat = perimeterSeatPosition(index, scale);
    const extra = SQUARE_TABLE_CONTRACT.labelOffsetM * (Number(scale) || 32);
    if (seat.side === 'top') return Object.freeze({ x: seat.x, y: seat.y - extra, anchor: 'middle' });
    if (seat.side === 'bottom') return Object.freeze({ x: seat.x, y: seat.y + extra, anchor: 'middle' });
    if (seat.side === 'right') return Object.freeze({ x: seat.x + extra, y: seat.y, anchor: 'start' });
    return Object.freeze({ x: seat.x - extra, y: seat.y, anchor: 'end' });
  }

  function normalizeSquareTable(table) {
    if (!table) return table;
    table.type = 'table';
    table.tableShape = 'square';
    table.shape = 'rect';
    table.capacity = SQUARE_TABLE_CONTRACT.capacity;
    table.widthM = SQUARE_TABLE_CONTRACT.clearanceWidthM;
    table.heightM = SQUARE_TABLE_CONTRACT.clearanceHeightM;
    return table;
  }

  root.squareTableContract = Object.freeze({ SQUARE_TABLE_CONTRACT, dimensionsAtScale, perimeterSeatPosition, labelPosition, normalizeSquareTable });
})();