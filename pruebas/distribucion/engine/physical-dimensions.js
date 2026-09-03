(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const SUPPORTED_CAPACITIES = Object.freeze([4, 6, 8, 10, 12, 14, 16]);
  const CLEARANCE_MARGIN_M = 0.80;
  const CHAIR_OFFSET_M = 0.38;
  const LABEL_OFFSET_M = 0.72;

  const ROUND_DIAMETER_M = Object.freeze({ 4:0.90, 6:1.20, 8:1.50, 10:1.50, 12:1.80, 14:2.10, 16:2.40 });
  const SQUARE_SIDE_M = Object.freeze({ 4:0.90, 6:1.20, 8:1.50, 10:1.80, 12:2.00, 14:2.20, 16:2.40 });
  const RECTANGULAR_M = Object.freeze({
    4:Object.freeze([1.20,0.75]), 6:Object.freeze([1.80,0.75]), 8:Object.freeze([1.80,0.75]),
    10:Object.freeze([2.40,0.75]), 12:Object.freeze([2.40,1.00]), 14:Object.freeze([3.00,1.00]), 16:Object.freeze([3.60,1.00])
  });

  function capacity(value) {
    const numeric = Number(value);
    if (!SUPPORTED_CAPACITIES.includes(numeric)) throw new Error(`Capacidad física no soportada: ${value}`);
    return numeric;
  }

  function normalizeShape(value) {
    return value === 'square' || value === 'rectangular' ? value : 'round';
  }

  function dimensionsFor(shapeValue, capacityValue) {
    const shape = normalizeShape(shapeValue);
    const seats = capacity(capacityValue);
    let tabletopWidthM, tabletopHeightM;
    if (shape === 'round') tabletopWidthM = tabletopHeightM = ROUND_DIAMETER_M[seats];
    else if (shape === 'square') tabletopWidthM = tabletopHeightM = SQUARE_SIDE_M[seats];
    else [tabletopWidthM, tabletopHeightM] = RECTANGULAR_M[seats];
    const clearanceWidthM = tabletopWidthM + CLEARANCE_MARGIN_M * 2;
    const clearanceHeightM = tabletopHeightM + CLEARANCE_MARGIN_M * 2;
    return Object.freeze({ shape, capacity:seats, tabletopWidthM, tabletopHeightM, clearanceWidthM, clearanceHeightM, chairOffsetM:CHAIR_OFFSET_M, labelOffsetM:LABEL_OFFSET_M });
  }

  function dimensionsAtScale(shape, seats, scale = 32) {
    const meters = dimensionsFor(shape, seats);
    const s = Number(scale) || 32;
    return Object.freeze({ ...meters, scale:s, tabletopWidthPx:meters.tabletopWidthM*s, tabletopHeightPx:meters.tabletopHeightM*s, clearanceWidthPx:meters.clearanceWidthM*s, clearanceHeightPx:meters.clearanceHeightM*s, chairOffsetPx:CHAIR_OFFSET_M*s, labelOffsetPx:LABEL_OFFSET_M*s });
  }

  function applyToTable(table) {
    if (!table || table.type !== 'table') return table;
    const shape = normalizeShape(table.tableShape);
    const seats = root.seats?.normalizeCapacity ? root.seats.normalizeCapacity(table.capacity, 10) : (SUPPORTED_CAPACITIES.includes(Number(table.capacity)) ? Number(table.capacity) : 10);
    const dims = dimensionsFor(shape, seats);
    table.tableShape = shape;
    table.capacity = seats;
    table.shape = shape === 'round' ? 'table' : 'rect';
    table.widthM = dims.clearanceWidthM;
    table.heightM = dims.clearanceHeightM;
    return table;
  }

  root.physicalDimensions = Object.freeze({ SUPPORTED_CAPACITIES, CLEARANCE_MARGIN_M, CHAIR_OFFSET_M, LABEL_OFFSET_M, ROUND_DIAMETER_M, SQUARE_SIDE_M, RECTANGULAR_M, dimensionsFor, dimensionsAtScale, applyToTable });
})();