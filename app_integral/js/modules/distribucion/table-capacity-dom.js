export const TABLE_GEOMETRY_HELP_TEXT = 'Máximo 16 sillas. Medidas físicas editables hasta 5 m; la zona punteada muestra sillas y circulación a la escala actual.';

const DIMENSION_INPUT_SELECTOR = [
  '.mgd-table-geometry-panel input[data-mgd-field="width"]',
  '.mgd-table-geometry-panel input[data-mgd-field="height"]',
  '.mgd-table-create-modal input[data-mgd-field="width"]',
  '.mgd-table-create-modal input[data-mgd-field="height"]'
].join(',');

const GEOMETRY_ROOT_SELECTOR = '.mgd-table-geometry-panel,.mgd-table-create-modal';

export function alignGeometryLimits(doc) {
  if (!doc?.querySelectorAll) return false;
  let found = false;

  doc.querySelectorAll(DIMENSION_INPUT_SELECTOR).forEach((input) => {
    found = true;
    if (String(input.max || '') !== '5') input.max = '5';
  });

  doc.querySelectorAll('.mgd-table-geometry-help').forEach((help) => {
    found = true;
    if (help.textContent !== TABLE_GEOMETRY_HELP_TEXT) {
      help.textContent = TABLE_GEOMETRY_HELP_TEXT;
    }
  });

  return found;
}

export function mutationTouchesGeometry(mutations = []) {
  return Array.from(mutations).some((mutation) =>
    Array.from(mutation?.addedNodes || []).some((node) => {
      if (!node || node.nodeType !== 1) return false;
      return Boolean(
        node.matches?.(GEOMETRY_ROOT_SELECTOR) ||
        node.querySelector?.(GEOMETRY_ROOT_SELECTOR)
      );
    })
  );
}
