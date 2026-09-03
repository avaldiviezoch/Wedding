(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const seats = root.seats;
  const physical = root.physicalDimensions;
  if (!seats || !physical) throw new Error('table-transition requiere seats y physicalDimensions');

  const SUPPORTED_SHAPES = Object.freeze(['round', 'square', 'rectangular']);

  function normalizeShape(value, fallback = 'round') {
    return SUPPORTED_SHAPES.includes(value) ? value : fallback;
  }

  function snapshot(table) {
    return Object.freeze({
      id: table.id,
      x: table.x,
      y: table.y,
      rotation: table.rotation,
      label: table.label,
      color: table.color,
      locked: table.locked,
      layerId: table.layerId,
      capacity: seats.normalizeCapacity(table.capacity, 10),
      tableShape: normalizeShape(table.tableShape),
      seats: Object.freeze((Array.isArray(table.seats) ? table.seats : []).slice())
    });
  }

  function plan(table, request = {}) {
    if (!table || table.type !== 'table') return Object.freeze({ ok:false, reason:'missing-table' });
    const before = snapshot(table);
    const shape = normalizeShape(request.shape, before.tableShape);
    const capacity = seats.normalizeCapacity(request.capacity, before.capacity);
    const blocked = capacity < before.capacity ? seats.occupiedBeyondCapacity(table, capacity) : [];
    if (blocked.length) return Object.freeze({ ok:false, reason:'occupied-seats', blocked:Object.freeze(Array.from(blocked)), before, shape, capacity });
    const nextSeats = before.seats.slice(0, capacity);
    while (nextSeats.length < capacity) nextSeats.push(null);
    return Object.freeze({ ok:true, before, shape, capacity, seats:Object.freeze(nextSeats) });
  }

  function transition(table, request = {}) {
    const prepared = plan(table, request);
    if (!prepared.ok) return prepared;

    table.tableShape = prepared.shape;
    table.capacity = prepared.capacity;
    table.seats = Array.from(prepared.seats);
    physical.applyToTable(table);

    return Object.freeze({
      ok:true,
      before:prepared.before,
      shape:table.tableShape,
      capacity:table.capacity,
      seats:Object.freeze(table.seats.slice()),
      widthM:table.widthM,
      heightM:table.heightM,
      identityPreserved:table.id === prepared.before.id,
      positionPreserved:table.x === prepared.before.x && table.y === prepared.before.y,
      rotationPreserved:table.rotation === prepared.before.rotation
    });
  }

  root.tableTransition = Object.freeze({ SUPPORTED_SHAPES, normalizeShape, snapshot, plan, transition });
})();