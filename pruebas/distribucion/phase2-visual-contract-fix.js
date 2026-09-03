(() => {
  if (document.documentElement.dataset.phase2VisualContractFix === 'ready') return;

  const capacityApi = window.MiGranDiaDistributionCapacityV1;
  const inspectorApi = window.MiGranDiaDistributionTableInspectorV1;
  if (!capacityApi?.transitionTable || !capacityApi?.applyPhysicalGeometry) {
    throw new Error('Corrección visual requiere capacity runtime');
  }

  function currentTable() {
    const item = typeof selected === 'function' ? selected() : null;
    return item?.type === 'table' ? item : null;
  }

  function forceShapeTransition(shape) {
    const table = currentTable();
    if (!table) return Object.freeze({ ok:false, reason:'missing-table' });

    const result = capacityApi.transitionTable(table, { shape });
    if (!result?.ok) {
      if (typeof toast === 'function' && result?.reason === 'unavailable') {
        toast('Desbloquea la mesa o su capa para cambiar el tipo.', true);
      }
      inspectorApi?.refresh?.();
      return result;
    }

    // La transición ya preserva identidad/asientos. Reaplicamos geometría y
    // repintamos explícitamente para que ningún listener heredado deje la forma anterior en pantalla.
    capacityApi.applyPhysicalGeometry(table);
    render();
    inspectorApi?.refresh?.();
    return result;
  }

  const shapeSelect = document.getElementById('tableInspectorShape');
  if (shapeSelect) {
    shapeSelect.addEventListener('change', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      forceShapeTransition(shapeSelect.value);
    }, true);
  }

  const previousRenderTable = renderTable;
  renderTable = function phase2UprightTextRenderTable(item, scale, conflicts) {
    const group = previousRenderTable(item, scale, conflicts);
    if (!group || item?.type !== 'table') return group;

    const rotation = Number(item.rotation) || 0;
    const counter = -rotation;

    // Los nombres siguen la posición física de su silla, pero sus letras nunca giran.
    group.querySelectorAll?.('.guest-tag').forEach((tag) => {
      const raw = tag.getAttribute('transform') || '';
      const base = raw.replace(/\s*rotate\([^)]*\)\s*$/, '').trim();
      tag.setAttribute('transform', `${base} rotate(${counter})`.trim());
      tag.dataset.uprightText = 'true';
    });

    // Números de silla y nombre central de mesa también permanecen legibles hacia arriba.
    group.querySelectorAll?.('.chair-wrap > text').forEach((text) => {
      text.setAttribute('transform', `rotate(${counter})`);
      text.dataset.uprightText = 'true';
    });
    Array.from(group.children || []).forEach((child) => {
      if (String(child.tagName || '').toLowerCase() !== 'text') return;
      child.setAttribute('transform', `rotate(${counter})`);
      child.dataset.uprightText = 'true';
    });

    return group;
  };

  document.documentElement.dataset.phase2VisualContractFix = 'ready';
  window.MiGranDiaDistributionVisualContractFixV1 = Object.freeze({
    status:'ready',
    forceShapeTransition,
    uprightGuestNames:true,
    uprightChairNumbers:true,
    uprightTableLabel:true,
    memoryOnly:true
  });

  render();
})();