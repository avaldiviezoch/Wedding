export const TABLE_TYPES = Object.freeze(['round', 'square', 'rectangular']);
export const TABLE_CAPACITY_OPTIONS = Object.freeze([4, 6, 8, 10, 12, 14, 16]);
export const MAX_TABLE_CAPACITY = 16;
export const MIN_TABLE_CAPACITY = 4;
export const MAX_TABLETOP_M = 5;
export const TABLE_CLEARANCE_M = 0.76;
export const CHAIR_CENTER_OFFSET_M = 0.34;

const STANDARD_TABLETOPS = Object.freeze({
  round: Object.freeze({
    4: [0.90, 0.90],
    6: [1.20, 1.20],
    8: [1.50, 1.50],
    10: [1.50, 1.50],
    12: [1.80, 1.80],
    14: [2.10, 2.10],
    16: [2.40, 2.40]
  }),
  square: Object.freeze({
    4: [0.90, 0.90],
    6: [1.20, 1.20],
    8: [1.50, 1.50],
    10: [1.80, 1.80],
    12: [2.00, 2.00],
    14: [2.20, 2.20],
    16: [2.40, 2.40]
  }),
  rectangular: Object.freeze({
    4: [1.20, 0.75],
    6: [1.80, 0.75],
    8: [1.80, 0.75],
    10: [2.40, 0.75],
    12: [2.40, 1.00],
    14: [3.00, 1.00],
    16: [3.60, 1.00]
  })
});

const dimensionOr = (value, fallback) => {
  const number = Number(value);
  const resolved = Number.isFinite(number) && number > 0 ? number : fallback;
  return Math.max(0.5, Math.min(MAX_TABLETOP_M, resolved));
};

export function normalizeTableType(value) {
  const clean = String(value || '').trim().toLowerCase();
  if (['rect', 'rectangle', 'rectangular'].includes(clean)) return 'rectangular';
  if (['square', 'cuadrada', 'cuadrado'].includes(clean)) return 'square';
  return 'round';
}

export function normalizeTableCapacity(value, fallback = 10) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return Math.max(MIN_TABLE_CAPACITY, Math.min(MAX_TABLE_CAPACITY, fallback));
  return Math.max(MIN_TABLE_CAPACITY, Math.min(MAX_TABLE_CAPACITY, number));
}

function presetCapacity(capacity) {
  const normalized = normalizeTableCapacity(capacity);
  return TABLE_CAPACITY_OPTIONS.find((value) => value >= normalized) || MAX_TABLE_CAPACITY;
}

export function standardTabletop(type, capacity) {
  const normalizedType = normalizeTableType(type);
  const key = presetCapacity(capacity);
  const [widthM, heightM] = STANDARD_TABLETOPS[normalizedType][key];
  return { type: normalizedType, capacity: normalizeTableCapacity(capacity), widthM, heightM, presetCapacity: key };
}

export function resolveTableGeometry(table = {}) {
  const type = normalizeTableType(table.type || table.sharedTableType);
  const capacity = normalizeTableCapacity(table.capacity || table.seats?.length || 10);
  const standard = standardTabletop(type, capacity);
  const sameShape = !table.dimensionShape || normalizeTableType(table.dimensionShape) === type;
  let tabletopWidthM = sameShape ? dimensionOr(table.tabletopWidthM, standard.widthM) : standard.widthM;
  let tabletopHeightM = sameShape ? dimensionOr(table.tabletopHeightM, standard.heightM) : standard.heightM;

  if (type === 'round' || type === 'square') {
    const size = dimensionOr(tabletopWidthM, standard.widthM);
    tabletopWidthM = size;
    tabletopHeightM = size;
  }

  const footprintWidthM = tabletopWidthM + (TABLE_CLEARANCE_M * 2);
  const footprintHeightM = tabletopHeightM + (TABLE_CLEARANCE_M * 2);

  return {
    type,
    capacity,
    tabletopWidthM,
    tabletopHeightM,
    footprintWidthM,
    footprintHeightM,
    plannerShape: type === 'round' ? 'table' : 'rect',
    dimensionsCustom: Boolean(table.dimensionsCustom && sameShape),
    dimensionShape: type
  };
}

export function geometryPatch(table = {}, overrides = {}) {
  const type = normalizeTableType(overrides.type ?? table.type);
  const capacity = normalizeTableCapacity(overrides.capacity ?? table.capacity ?? table.seats?.length ?? 10);
  const standard = standardTabletop(type, capacity);
  const widthM = dimensionOr(overrides.tabletopWidthM, standard.widthM);
  let heightM = dimensionOr(overrides.tabletopHeightM, standard.heightM);

  if (type === 'round' || type === 'square') heightM = widthM;

  const custom = Math.abs(widthM - standard.widthM) > 0.001 || Math.abs(heightM - standard.heightM) > 0.001;
  return {
    type,
    capacity,
    tabletopWidthM: Math.round(widthM * 100) / 100,
    tabletopHeightM: Math.round(heightM * 100) / 100,
    dimensionsCustom: custom,
    dimensionShape: type
  };
}

export function legacyGeometryPatch(table = {}) {
  const geometry = resolveTableGeometry(table);
  return {
    shape: geometry.plannerShape,
    widthM: geometry.tabletopWidthM,
    heightM: geometry.tabletopHeightM,
    sharedTableType: geometry.type,
    tabletopWidthM: geometry.tabletopWidthM,
    tabletopHeightM: geometry.tabletopHeightM,
    dimensionsCustom: geometry.dimensionsCustom,
    dimensionShape: geometry.dimensionShape,
    capacity: geometry.capacity
  };
}

export function seatPositions(type, capacity, tabletopWidthM, tabletopHeightM) {
  const normalizedType = normalizeTableType(type);
  const count = normalizeTableCapacity(capacity);
  const widthM = Math.max(0.4, Number(tabletopWidthM) || 1.5);
  const heightM = normalizedType === 'round' || normalizedType === 'square'
    ? widthM
    : Math.max(0.4, Number(tabletopHeightM) || 0.75);

  if (normalizedType === 'round') {
    const radius = (widthM / 2) + CHAIR_CENTER_OFFSET_M;
    return Array.from({ length: count }, (_, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index / count);
      return { xM: Math.cos(angle) * radius, yM: Math.sin(angle) * radius, angleRad: angle };
    });
  }

  const outerW = widthM + (CHAIR_CENTER_OFFSET_M * 2);
  const outerH = heightM + (CHAIR_CENTER_OFFSET_M * 2);
  const perimeter = 2 * (outerW + outerH);
  const left = -outerW / 2;
  const top = -outerH / 2;

  return Array.from({ length: count }, (_, index) => {
    let distance = (perimeter * (index + 0.5) / count) % perimeter;
    if (distance < outerW) return { xM: left + distance, yM: top, angleRad: -Math.PI / 2 };
    distance -= outerW;
    if (distance < outerH) return { xM: left + outerW, yM: top + distance, angleRad: 0 };
    distance -= outerH;
    if (distance < outerW) return { xM: left + outerW - distance, yM: top + outerH, angleRad: Math.PI / 2 };
    distance -= outerW;
    return { xM: left, yM: top + outerH - distance, angleRad: Math.PI };
  });
}
