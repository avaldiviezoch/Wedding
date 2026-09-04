(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};

  function capacitySummary(tables, guestCount) {
    const capacity = (tables || []).reduce((sum, table) => sum + (Number(table.capacity) || 0), 0);
    const guests = Math.max(0, Number(guestCount) || 0);
    return { capacity, guests, sufficient: capacity >= guests };
  }

  function assignmentAudit(guests, tables) {
    const guestIds = new Set((guests || []).map((guest) => guest?.id).filter(Boolean));
    const assigned = new Map();
    const unknown = [];
    const duplicates = [];
    const beyondCapacity = [];
    (tables || []).forEach((table) => {
      const capacity = Math.max(0, Number(table?.capacity) || 0);
      (Array.isArray(table?.seats) ? table.seats : []).forEach((guestId, index) => {
        if (!guestId) return;
        if (index >= capacity) beyondCapacity.push({ tableId:table.id, seatNumber:index + 1, guestId });
        if (!guestIds.has(guestId)) unknown.push({ tableId:table.id, seatNumber:index + 1, guestId });
        if (assigned.has(guestId)) duplicates.push({ guestId, first:assigned.get(guestId), duplicate:{ tableId:table.id, seatNumber:index + 1 } });
        else assigned.set(guestId, { tableId:table.id, seatNumber:index + 1 });
      });
    });
    return { assigned, unknown, duplicates, beyondCapacity };
  }

  function unassignedGuests(guests, tables) {
    const audit = assignmentAudit(guests, tables);
    return (guests || []).filter((guest) => guest?.id && !audit.assigned.has(guest.id));
  }

  function outOfBounds(elements, scale = 32, canvas = { width:1448, height:1086 }) {
    const geometry = root.geometry;
    if (!geometry?.itemHalfExtents) return [];
    return (elements || []).filter((item) => {
      const half = geometry.itemHalfExtents(item, scale);
      const x = Number(item?.x) || 0, y = Number(item?.y) || 0;
      return x - half.x < 0 || y - half.y < 0 || x + half.x > canvas.width || y + half.y > canvas.height;
    }).map((item) => item.id);
  }

  function proximityPairs(tables, scale = 32) {
    const clearance = root.clearance;
    if (!clearance?.isTooClose) return [];
    const pairs = [];
    for (let i = 0; i < tables.length; i += 1) for (let j = i + 1; j < tables.length; j += 1) {
      if (clearance.isTooClose(tables[i], tables[j], scale)) pairs.push([tables[i].id, tables[j].id]);
    }
    return pairs;
  }

  function evaluate({ elements = [], guests = [], hiddenLayers = {}, lockedLayers = {}, conflictIds = [], scale = 32, canvas = { width:1448, height:1086 } } = {}) {
    const tables = elements.filter((item) => item?.type === 'table');
    const visible = elements.filter((item) => !hiddenLayers[item?.type]);
    const visibleTables = visible.filter((item) => item?.type === 'table');
    const conflicts = Array.from(new Set(conflictIds || []));
    const assignments = assignmentAudit(guests, tables);
    const unassigned = guests.filter((guest) => guest?.id && !assignments.assigned.has(guest.id));
    const capacity = capacitySummary(tables, guests.length);
    const proximity = proximityPairs(visibleTables, scale);
    const outside = outOfBounds(visible, scale, canvas);
    const hiddenCount = elements.length - visible.length;
    const lockedCount = elements.filter((item) => item?.locked || lockedLayers[item?.type]).length;

    const messages = [];
    messages.push(conflicts.length ? { type:'bad', code:'overlap', text:`Hay ${conflicts.length} elemento(s) involucrados en superposición.` } : { type:'good', code:'overlap', text:'No se detectaron superposiciones entre mobiliarios.' });
    messages.push(proximity.length ? { type:'warn', code:'proximity', text:`Se detectaron ${proximity.length} pares de mesas con menos de 60 cm libres entre sus áreas de circulación.` } : { type:'good', code:'proximity', text:'Las mesas visibles respetan la separación adicional de 60 cm.' });
    messages.push(unassigned.length ? { type:'warn', code:'unassigned', text:`Quedan ${unassigned.length} invitado(s) sin asignar.` } : { type:'good', code:'unassigned', text:'Todos los invitados están asignados.' });
    messages.push(capacity.sufficient ? { type:'good', code:'capacity', text:`La capacidad total (${capacity.capacity}) es suficiente para ${capacity.guests} invitado(s).` } : { type:'bad', code:'capacity', text:`La capacidad total (${capacity.capacity}) es menor al número de invitados (${capacity.guests}).` });
    if (assignments.beyondCapacity.length) messages.push({ type:'bad', code:'seat-range', text:`Hay ${assignments.beyondCapacity.length} asignación(es) en asientos fuera de la capacidad de su mesa.` });
    if (assignments.unknown.length) messages.push({ type:'bad', code:'unknown-guests', text:`Hay ${assignments.unknown.length} asiento(s) con invitados que no existen en el maestro de la sesión.` });
    if (assignments.duplicates.length) messages.push({ type:'bad', code:'duplicate-guests', text:`Hay ${assignments.duplicates.length} invitado(s) asignados más de una vez.` });
    if (outside.length) messages.push({ type:'bad', code:'bounds', text:`Hay ${outside.length} elemento(s) fuera de los límites del plano.` });
    if (hiddenCount) messages.push({ type:'good', code:'hidden-layers', text:`${hiddenCount} elemento(s) están ocultos visualmente; conservan capacidad/asignaciones y no participan en conflictos visibles.` });
    if (lockedCount) messages.push({ type:'good', code:'locked', text:`${lockedCount} elemento(s) o capa(s) están bloqueados contra edición.` });

    const blockingCodes = new Set(messages.filter((msg) => msg.type === 'bad').map((msg) => msg.code));
    return Object.freeze({
      valid:blockingCodes.size === 0,
      messages:Object.freeze(messages),
      summary:Object.freeze({ conflicts:conflicts.length, proximityPairs:proximity.length, unassigned:unassigned.length, capacity:capacity.capacity, guests:capacity.guests, beyondCapacity:assignments.beyondCapacity.length, unknownGuests:assignments.unknown.length, duplicateGuests:assignments.duplicates.length, outOfBounds:outside.length, hidden:hiddenCount, locked:lockedCount }),
      details:Object.freeze({ conflicts:Object.freeze(conflicts), proximity:Object.freeze(proximity), unassigned:Object.freeze(unassigned.map((g) => g.id)), outOfBounds:Object.freeze(outside) })
    });
  }

  root.validation = Object.freeze({ capacitySummary, assignmentAudit, unassignedGuests, outOfBounds, proximityPairs, evaluate });
})();