(() => {
  const TABLE_SHAPES = Object.freeze(['round','square','rectangular']);
  const TABLE_CAPACITIES = Object.freeze([4,6,8,10,12,14,16]);

  function tableShape(table) {
    return TABLE_SHAPES.includes(table?.tableShape) ? table.tableShape : 'round';
  }

  function tableCapacity(table) {
    const value = Number(table?.capacity);
    return TABLE_CAPACITIES.includes(value) ? value : 10;
  }

  function tableSeatSummary(table) {
    const capacity = tableCapacity(table);
    const seats = Array.isArray(table?.seats) ? table.seats.slice(0, capacity) : [];
    const occupied = seats.filter(Boolean).length;
    return Object.freeze({ capacity, occupied, free: Math.max(0, capacity - occupied) });
  }

  function tableInspectorModel(table) {
    if (!table || table.type !== 'table') return null;
    const seats = tableSeatSummary(table);
    return Object.freeze({
      id: table.id,
      shape: tableShape(table),
      capacity: tableCapacity(table),
      label: String(table.label || ''),
      color: table.color || '#d8c9a6',
      rotation: Number(table.rotation) || 0,
      locked: Boolean(table.locked),
      seats
    });
  }

  function createInspectorUI({ fillProperties, renderSeatEditor }) {
    if (typeof fillProperties !== 'function') throw new TypeError('fillProperties requerido');
    return Object.freeze({
      render: (item) => fillProperties(item),
      renderSeats: (table) => renderSeatEditor?.(table),
      tableModel: tableInspectorModel
    });
  }

  window.MiGranDiaDistributionUIInspector = Object.freeze({
    TABLE_SHAPES,
    TABLE_CAPACITIES,
    tableShape,
    tableCapacity,
    tableSeatSummary,
    tableInspectorModel,
    createInspectorUI
  });
})();
