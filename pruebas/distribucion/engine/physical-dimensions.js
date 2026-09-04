(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const SUPPORTED_CAPACITIES = Object.freeze([4, 6, 8, 10, 12, 14, 16]);
  const CLEARANCE_MARGIN_M = 0.80;
  const CHAIR_OFFSET_M = 0.38;
  const LABEL_OFFSET_M = 0.72;

  // Estos valores son SOLO sugerencias de tamaño inicial. Nunca vuelven a
  // recalcular el tablero cuando cambia la cantidad de sillas.
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

  function suggestedDimensionsFor(shapeValue, capacityValue) {
    const shape = normalizeShape(shapeValue);
    const seats = capacity(capacityValue);
    let tabletopWidthM, tabletopHeightM;
    if (shape === 'round') tabletopWidthM = tabletopHeightM = ROUND_DIAMETER_M[seats];
    else if (shape === 'square') tabletopWidthM = tabletopHeightM = SQUARE_SIDE_M[seats];
    else [tabletopWidthM, tabletopHeightM] = RECTANGULAR_M[seats];
    return Object.freeze({ shape, capacity:seats, tabletopWidthM, tabletopHeightM });
  }

  function clampTabletop(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(0.20, Math.min(20, numeric)) : fallback;
  }

  function ensureTabletopDimensions(table) {
    if (!table || table.type !== 'table') return null;
    const shape = normalizeShape(table.tableShape);
    const seats = root.seats?.normalizeCapacity
      ? root.seats.normalizeCapacity(table.capacity, 10)
      : (SUPPORTED_CAPACITIES.includes(Number(table.capacity)) ? Number(table.capacity) : 10);

    const suggested = suggestedDimensionsFor(shape, seats);
    let tabletopWidthM = clampTabletop(table.tabletopWidthM, suggested.tabletopWidthM);
    let tabletopHeightM = clampTabletop(table.tabletopHeightM, suggested.tabletopHeightM);

    // Redonda y cuadrada conservan una sola medida física.
    if (shape === 'round' || shape === 'square') {
      const canonical = clampTabletop(table.tabletopWidthM ?? table.tabletopHeightM, suggested.tabletopWidthM);
      tabletopWidthM = canonical;
      tabletopHeightM = canonical;
    }

    table.tabletopWidthM = tabletopWidthM;
    table.tabletopHeightM = tabletopHeightM;
    return Object.freeze({ shape, capacity:seats, tabletopWidthM, tabletopHeightM });
  }

  // Compatibilidad: dimensionsFor sigue devolviendo la sugerencia histórica,
  // pero ya no debe usarse como fuente de verdad para una mesa existente.
  function dimensionsFor(shapeValue, capacityValue) {
    const base = suggestedDimensionsFor(shapeValue, capacityValue);
    const clearanceWidthM = base.tabletopWidthM + CLEARANCE_MARGIN_M * 2;
    const clearanceHeightM = base.tabletopHeightM + CLEARANCE_MARGIN_M * 2;
    return Object.freeze({
      ...base,
      clearanceWidthM,
      clearanceHeightM,
      chairOffsetM:CHAIR_OFFSET_M,
      labelOffsetM:LABEL_OFFSET_M
    });
  }

  function dimensionsForTable(table) {
    const base = ensureTabletopDimensions(table);
    if (!base) return null;
    const clearanceWidthM = base.tabletopWidthM + CLEARANCE_MARGIN_M * 2;
    const clearanceHeightM = base.tabletopHeightM + CLEARANCE_MARGIN_M * 2;
    return Object.freeze({
      ...base,
      clearanceWidthM,
      clearanceHeightM,
      chairOffsetM:CHAIR_OFFSET_M,
      labelOffsetM:LABEL_OFFSET_M
    });
  }

  function dimensionsAtScale(shape, seats, scale = 32) {
    const meters = dimensionsFor(shape, seats);
    const s = Number(scale) || 32;
    return Object.freeze({
      ...meters,
      scale:s,
      tabletopWidthPx:meters.tabletopWidthM*s,
      tabletopHeightPx:meters.tabletopHeightM*s,
      clearanceWidthPx:meters.clearanceWidthM*s,
      clearanceHeightPx:meters.clearanceHeightM*s,
      chairOffsetPx:CHAIR_OFFSET_M*s,
      labelOffsetPx:LABEL_OFFSET_M*s
    });
  }

  function dimensionsAtScaleForTable(table, scale = 32) {
    const meters = dimensionsForTable(table);
    if (!meters) return null;
    const s = Number(scale) || 32;
    return Object.freeze({
      ...meters,
      scale:s,
      tabletopWidthPx:meters.tabletopWidthM*s,
      tabletopHeightPx:meters.tabletopHeightM*s,
      clearanceWidthPx:meters.clearanceWidthM*s,
      clearanceHeightPx:meters.clearanceHeightM*s,
      chairOffsetPx:CHAIR_OFFSET_M*s,
      labelOffsetPx:LABEL_OFFSET_M*s
    });
  }

  function setTabletopDimensions(table, widthM, heightM = widthM) {
    if (!table || table.type !== 'table') return table;
    const shape = normalizeShape(table.tableShape);
    const current = ensureTabletopDimensions(table);
    let width = clampTabletop(widthM, current.tabletopWidthM);
    let height = clampTabletop(heightM, current.tabletopHeightM);
    if (shape === 'round' || shape === 'square') height = width;
    table.tabletopWidthM = width;
    table.tabletopHeightM = height;
    return applyToTable(table);
  }

  function applyToTable(table) {
    if (!table || table.type !== 'table') return table;
    const dims = dimensionsForTable(table);
    table.tableShape = dims.shape;
    table.capacity = dims.capacity;
    table.shape = dims.shape === 'round' ? 'table' : 'rect';

    // widthM/heightM siguen representando geometría funcional para límites y
    // colisiones; el tablero real vive en tabletopWidthM/tabletopHeightM.
    table.widthM = dims.clearanceWidthM;
    table.heightM = dims.clearanceHeightM;
    return table;
  }

  root.physicalDimensions = Object.freeze({
    SUPPORTED_CAPACITIES,
    CLEARANCE_MARGIN_M,
    CHAIR_OFFSET_M,
    LABEL_OFFSET_M,
    ROUND_DIAMETER_M,
    SQUARE_SIDE_M,
    RECTANGULAR_M,
    suggestedDimensionsFor,
    dimensionsFor,
    dimensionsForTable,
    dimensionsAtScale,
    dimensionsAtScaleForTable,
    ensureTabletopDimensions,
    setTabletopDimensions,
    applyToTable
  });
})();