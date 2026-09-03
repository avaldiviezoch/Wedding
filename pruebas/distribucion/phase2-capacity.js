(() => {
  if (document.documentElement.dataset.phase2Capacity === 'ready') return;
  const engine = window.MiGranDiaDistributionEngine || {};
  const seatsApi = engine.seats;
  const layout = engine.capacityLayout;
  const physical = engine.physicalDimensions;
  const round = engine.roundTableContract;
  const square = engine.squareTableContract;
  const rectangular = engine.rectangularTableContract;
  if (!seatsApi || !layout || !physical || !round || !square || !rectangular) throw new Error('Motor de capacidad/dimensiones incompleto');

  const legacySanitizeState = typeof sanitizeState === 'function' ? sanitizeState : null;
  const capacities = seatsApi.SUPPORTED_CAPACITIES;

  function tableShape(item) {
    if (item?.tableShape === 'rectangular') return 'rectangular';
    if (item?.tableShape === 'square') return 'square';
    return 'round';
  }

  function styleContract(shape) {
    if (shape === 'square') return square.SQUARE_TABLE_CONTRACT;
    if (shape === 'rectangular') return rectangular.RECTANGULAR_TABLE_CONTRACT;
    return round.ROUND_TABLE_CONTRACT;
  }

  function physicalAtScale(item, scale) {
    return physical.dimensionsAtScale(tableShape(item), seatsApi.normalizeCapacity(item?.capacity, 10), scale);
  }

  function applyPhysicalGeometry(item) {
    physical.applyToTable(item);
    return item;
  }

  function seatPositions(item, scale) {
    const shape = tableShape(item);
    const capacity = seatsApi.normalizeCapacity(item.capacity, 10);
    const dims = physicalAtScale(item, scale);
    if (shape === 'round') return layout.roundPositions(capacity, dims.tabletopWidthPx / 2 + dims.chairOffsetPx);
    return layout.rectPositions(capacity, dims.tabletopWidthPx, dims.tabletopHeightPx, dims.chairOffsetPx, shape === 'rectangular');
  }

  function renderGuestLabel(group, item, seat, guestName, seatNumber, scale) {
    if (!showNames.checked || !guestName) return;
    const C = styleContract(tableShape(item));
    const pos = layout.labelFromSeat(seat, physicalAtScale(item, scale).labelOffsetPx);
    const wrapper = svgEl('g', { transform:`translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)}) rotate(${-(Number(item.rotation) || 0)})`, class:'guest-tag', 'pointer-events':'none' });
    const title = svgEl('title');
    title.textContent = `Asiento ${seatNumber}: ${guestName}`;
    wrapper.appendChild(title);
    const text = svgEl('text', { x:pos.anchor==='start'?4:pos.anchor==='end'?-4:0, y:3, 'text-anchor':pos.anchor, 'font-size':C.labelFontSizePx||9.5, 'font-weight':800, fill:'#2d2924', stroke:'#ffffff', 'stroke-width':4, 'paint-order':'stroke' });
    text.textContent = compactName(guestName, C.labelMaxChars || 18);
    wrapper.appendChild(text);
    group.appendChild(wrapper);
  }

  function renderDynamicTable(item, scale, conflicts) {
    applyPhysicalGeometry(item);
    const shape = tableShape(item);
    const C = styleContract(shape);
    const capacity = seatsApi.normalizeCapacity(item.capacity, 10);
    const d = physicalAtScale(item, scale);
    seatsApi.ensureSeatArray(item, capacity);
    const danger = conflicts.has(item.id);
    const selectedState = isSelected(item.id);
    const stroke = danger ? C.conflictColor : selectedState ? C.selectedColor : item.color;
    const strokeW = danger || selectedState ? 5 : 2;
    const group = svgEl('g', { transform:`translate(${item.x} ${item.y}) rotate(${item.rotation || 0})`, class:`draggable table-hit${selectedState?' table-selected':''}${danger?' has-conflict':''}`, 'data-id':item.id, 'data-table-shape':shape, 'data-capacity':String(capacity) });
    const chairRadius = Math.max(7, Math.min(d.tabletopWidthPx, d.tabletopHeightPx) * 0.06);

    if (shape === 'round') {
      group.appendChild(svgEl('circle', { r:d.clearanceWidthPx/2, fill:item.color, 'fill-opacity':.16, stroke, 'stroke-width':strokeW, 'stroke-dasharray':showClearance.checked?'9 7':'0', class:'clearance' }));
      group.appendChild(svgEl('circle', { r:d.tabletopWidthPx/2, class:'tabletop', fill:item.color, stroke:danger?C.conflictColor:C.tabletopStroke, 'stroke-width':danger?5:3, filter:'url(#softShadow)' }));
    } else {
      group.appendChild(svgEl('rect', { x:-d.clearanceWidthPx/2, y:-d.clearanceHeightPx/2, width:d.clearanceWidthPx, height:d.clearanceHeightPx, rx:8, fill:item.color, 'fill-opacity':.16, stroke, 'stroke-width':strokeW, 'stroke-dasharray':showClearance.checked?'9 7':'0', class:'clearance' }));
      group.appendChild(svgEl('rect', { x:-d.tabletopWidthPx/2, y:-d.tabletopHeightPx/2, width:d.tabletopWidthPx, height:d.tabletopHeightPx, rx:shape==='square'?5:4, class:'tabletop', fill:item.color, stroke:danger?C.conflictColor:C.tabletopStroke, 'stroke-width':danger?5:3, filter:'url(#softShadow)' }));
    }

    seatPositions(item, scale).forEach((pos, index) => {
      if (showClearance.checked) {
        const chair = svgEl('g', { transform:`translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)})`, class:'chair-wrap' });
        chair.appendChild(svgEl('circle', { r:chairRadius.toFixed(2), class:'chair', fill:C.chairFill, stroke:C.chairStroke, 'stroke-width':1.5 }));
        const number = svgEl('text', { x:0, y:3.2, 'text-anchor':'middle', 'font-size':Math.max(7,chairRadius*.88).toFixed(1), 'font-weight':800, fill:'#5b554d', 'pointer-events':'none' });
        number.textContent = String(index + 1);
        chair.appendChild(number);
        group.appendChild(chair);
      }
      const guest = guestById(item.seats[index]);
      if (guest) renderGuestLabel(group, item, pos, guest.name, index + 1, scale);
    });

    if (showLabels.checked) {
      const title = svgEl('text', { x:0, y:4, 'text-anchor':'middle', 'font-size':11, 'font-weight':900, fill:'#473d31', 'pointer-events':'none' });
      title.textContent = item.label;
      group.appendChild(title);
    }
    return group;
  }

  renderTable = function phase2PhysicalDimensionAwareRenderTable(item, scale, conflicts) {
    return item?.type === 'table' ? renderDynamicTable(item, scale, conflicts) : null;
  };

  function setCapacity(item, nextCapacity) {
    if (!item || item.type !== 'table' || isItemLocked(item)) return Object.freeze({ ok:false, reason:'unavailable' });
    const result = seatsApi.resizeCapacity(item, nextCapacity);
    if (!result.ok) {
      const blockedSeats = result.blocked.map((entry) => entry.seatNumber).join(', ');
      if (typeof toast === 'function') toast(`No se puede reducir: hay invitados en los asientos ${blockedSeats}.`, true);
      return result;
    }
    applyPhysicalGeometry(item);
    commitMutation();
    return result;
  }

  function convertShapePreservingCapacity(item, shape) {
    if (!item || item.type !== 'table' || isItemLocked(item)) return false;
    const capacity = seatsApi.normalizeCapacity(item.capacity, 10);
    const identity = { id:item.id, x:item.x, y:item.y, rotation:item.rotation, seats:Array.isArray(item.seats)?item.seats.slice():[], label:item.label, color:item.color };
    item.tableShape = shape === 'square' || shape === 'rectangular' ? shape : 'round';
    item.capacity = capacity;
    item.id = identity.id; item.x = identity.x; item.y = identity.y; item.rotation = identity.rotation; item.label = identity.label; item.color = identity.color;
    item.seats = identity.seats.slice(0, capacity);
    while (item.seats.length < capacity) item.seats.push(null);
    applyPhysicalGeometry(item);
    commitMutation();
    return true;
  }

  function installCapacityControls() {
    if (document.getElementById('phase2CapacityControls')) return;
    const shapeControls = document.getElementById('phase2TableShapeControls');
    if (!shapeControls) return;
    const wrap = document.createElement('div');
    wrap.id = 'phase2CapacityControls';
    wrap.className = 'action-grid';
    capacities.forEach((capacity) => {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.capacity = String(capacity); button.textContent = `${capacity} personas`;
      button.addEventListener('click', (event) => { event.preventDefault(); event.stopImmediatePropagation(); setCapacity(selected(), capacity); }, true);
      wrap.appendChild(button);
    });
    shapeControls.insertAdjacentElement('afterend', wrap);
    shapeControls.addEventListener('click', (event) => {
      const button = event.target.closest('[data-shape]');
      if (!button) return;
      event.preventDefault(); event.stopImmediatePropagation();
      convertShapePreservingCapacity(selected(), button.dataset.shape);
    }, true);
  }

  if (legacySanitizeState) {
    sanitizeState = function phase2PhysicalDimensionAwareSanitizeState(input) {
      const safe = legacySanitizeState(input);
      const rawElements = Array.isArray(input?.elements) ? input.elements : [];
      const guestIds = new Set((safe.guests || []).map((guest) => guest.id));
      safe.elements.forEach((item, index) => {
        if (item.type !== 'table') return;
        const raw = rawElements.find((entry) => String(entry?.id || '') === item.id) || rawElements[index] || {};
        item.tableShape = raw.tableShape === 'square' || raw.tableShape === 'rectangular' ? raw.tableShape : 'round';
        const capacity = seatsApi.normalizeCapacity(raw.capacity, 10);
        item.capacity = capacity;
        const rawSeats = Array.isArray(raw.seats) ? raw.seats : [];
        item.seats = rawSeats.slice(0, capacity).map((guestId) => {
          if (!guestId) return null;
          const safeId = String(guestId).slice(0,160);
          return guestIds.has(safeId) ? safeId : null;
        });
        while (item.seats.length < capacity) item.seats.push(null);
        applyPhysicalGeometry(item);
      });
      return safe;
    };
  }

  elements.filter((item) => item.type === 'table').forEach(applyPhysicalGeometry);
  installCapacityControls();
  document.documentElement.dataset.phase2Capacity = 'ready';
  window.MiGranDiaDistributionCapacityV1 = Object.freeze({ status:'ready', capacities, setCapacity, convertShapePreservingCapacity, seatPositions, renderDynamicTable, applyPhysicalGeometry, protectsOccupiedSeats:true, dimensionsStillFixed:false, physicalDimensionsByCapacity:true, jsonSupports16:true });
  render();
})();