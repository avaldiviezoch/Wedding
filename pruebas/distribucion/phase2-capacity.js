(() => {
  if (document.documentElement.dataset.phase2Capacity === 'ready') return;
  const engine = window.MiGranDiaDistributionEngine || {};
  const seatsApi = engine.seats;
  const layout = engine.capacityLayout;
  const physical = engine.physicalDimensions;
  const transitionApi = engine.tableTransition;
  const round = engine.roundTableContract;
  const square = engine.squareTableContract;
  const rectangular = engine.rectangularTableContract;
  if (!seatsApi || !layout || !physical || !transitionApi || !round || !square || !rectangular) throw new Error('Motor de capacidad/transición incompleto');

  const legacySanitizeState = typeof sanitizeState === 'function' ? sanitizeState : null;
  const capacities = seatsApi.SUPPORTED_CAPACITIES;

  function tableShape(item) {
    return transitionApi.normalizeShape(item?.tableShape, 'round');
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

  function normalizeSeatLayout(item) {
    if (!item || item.type !== 'table') return 'default';
    item.seatLayoutVariant = layout.normalizeVariant(tableShape(item), seatsApi.normalizeCapacity(item.capacity, 10), item.seatLayoutVariant);
    return item.seatLayoutVariant;
  }

  function seatLayoutVariants(item) {
    if (!item || item.type !== 'table') return Object.freeze([]);
    return layout.layoutVariants(tableShape(item), seatsApi.normalizeCapacity(item.capacity, 10));
  }

  function seatPositions(item, scale) {
    const shape = tableShape(item);
    const capacity = seatsApi.normalizeCapacity(item.capacity, 10);
    const dims = physicalAtScale(item, scale);
    const variant = normalizeSeatLayout(item);
    const positions = layout.positionsFor(shape, capacity, dims, variant);
    if (positions.length !== capacity) throw new Error(`Layout inválido: capacidad ${capacity}, sillas ${positions.length}`);
    return positions;
  }

  function uprightAnchor(item, x, y) {
    const angle = (Number(item?.rotation) || 0) * Math.PI / 180;
    const worldX = x * Math.cos(angle) - y * Math.sin(angle);
    if (worldX > 8) return 'start';
    if (worldX < -8) return 'end';
    return 'middle';
  }

  function renderGuestLabel(group, item, seat, guestName, seatNumber, scale) {
    if (!showNames.checked || !guestName) return;
    const C = styleContract(tableShape(item));
    const local = layout.labelFromSeat(seat, physicalAtScale(item, scale).labelOffsetPx);
    const rotation = Number(item.rotation) || 0;
    const anchor = uprightAnchor(item, local.x, local.y);
    const wrapper = svgEl('g', {
      transform:`translate(${local.x.toFixed(1)} ${local.y.toFixed(1)}) rotate(${-rotation})`,
      class:'guest-tag',
      'data-upright-text':'true',
      'pointer-events':'none'
    });
    const title = svgEl('title');
    title.textContent = `Asiento ${seatNumber}: ${guestName}`;
    wrapper.appendChild(title);
    const text = svgEl('text', {
      x:anchor==='start'?4:anchor==='end'?-4:0,
      y:3,
      'text-anchor':anchor,
      'font-size':C.labelFontSizePx||9.5,
      'font-weight':800,
      fill:'#2d2924',
      stroke:'#ffffff',
      'stroke-width':4,
      'paint-order':'stroke'
    });
    text.textContent = compactName(guestName, C.labelMaxChars || 18);
    wrapper.appendChild(text);
    group.appendChild(wrapper);
  }

  function appendTabletop(group, item, shape, C, d, danger) {
    if (shape === 'round') {
      group.appendChild(svgEl('circle', {
        r:d.tabletopWidthPx/2,
        class:'tabletop',
        fill:item.color,
        stroke:danger?C.conflictColor:C.tabletopStroke,
        'stroke-width':danger?5:3,
        filter:'url(#softShadow)'
      }));
      group.appendChild(svgEl('circle', {
        r:d.tabletopWidthPx*.275,
        fill:'none', stroke:'#fff', 'stroke-opacity':.55, 'stroke-width':2,
        'pointer-events':'none'
      }));
      return;
    }
    group.appendChild(svgEl('rect', {
      x:-d.tabletopWidthPx/2,
      y:-d.tabletopHeightPx/2,
      width:d.tabletopWidthPx,
      height:d.tabletopHeightPx,
      rx:shape==='square'?5:4,
      class:'tabletop',
      fill:item.color,
      stroke:danger?C.conflictColor:C.tabletopStroke,
      'stroke-width':danger?5:3,
      filter:'url(#softShadow)'
    }));
    group.appendChild(svgEl('rect', {
      x:-d.tabletopWidthPx*.275,
      y:-d.tabletopHeightPx*.275,
      width:d.tabletopWidthPx*.55,
      height:d.tabletopHeightPx*.55,
      rx:3,
      fill:'none', stroke:'#fff', 'stroke-opacity':.55, 'stroke-width':2,
      'pointer-events':'none'
    }));
  }

  function appendTableLabels(group, item, capacity) {
    if (!showLabels.checked) return;
    const rotation = Number(item.rotation) || 0;
    const title = svgEl('text', {
      x:0, y:-3, 'text-anchor':'middle', class:'table-title',
      'font-size':12, 'font-weight':900, fill:'#473d31',
      transform:`rotate(${-rotation})`, 'data-upright-text':'true', 'pointer-events':'none'
    });
    title.textContent = item.label;
    group.appendChild(title);
    const meta = svgEl('text', {
      x:0, y:12, 'text-anchor':'middle', class:'table-meta',
      'font-size':8.5, 'font-weight':700, fill:'#5b5145',
      transform:`rotate(${-rotation})`, 'data-upright-text':'true', 'pointer-events':'none'
    });
    meta.textContent = `${capacity} personas`;
    group.appendChild(meta);
  }

  function appendChair(group, item, position, seatNumber, chairRadius, C, rotation) {
    const chair = svgEl('g', {
      transform:`translate(${position.x.toFixed(1)} ${position.y.toFixed(1)})`,
      class:'chair-wrap', 'data-seat-number':String(seatNumber)
    });
    chair.appendChild(svgEl('circle', {
      r:chairRadius.toFixed(2), class:'chair', fill:C.chairFill,
      stroke:C.chairStroke, 'stroke-width':1.5
    }));
    const number = svgEl('text', {
      x:0, y:3.2, 'text-anchor':'middle',
      'font-size':Math.max(7,chairRadius*.88).toFixed(1),
      'font-weight':800, fill:'#5b554d',
      transform:`rotate(${-rotation})`, 'data-upright-text':'true', 'pointer-events':'none'
    });
    number.textContent = String(seatNumber);
    chair.appendChild(number);
    group.appendChild(chair);
  }

  function renderDynamicTable(item, scale, conflicts) {
    applyPhysicalGeometry(item);
    normalizeSeatLayout(item);
    const shape = tableShape(item);
    const C = styleContract(shape);
    const capacity = seatsApi.normalizeCapacity(item.capacity, 10);
    const d = physicalAtScale(item, scale);
    seatsApi.ensureSeatArray(item, capacity);
    const positions = seatPositions(item, scale);
    const danger = conflicts.has(item.id);
    const selectedState = isSelected(item.id);
    const stroke = danger ? C.conflictColor : selectedState ? C.selectedColor : item.color;
    const strokeW = danger || selectedState ? 5 : 2;
    const rotation = Number(item.rotation) || 0;
    const group = svgEl('g', {
      transform:`translate(${item.x} ${item.y}) rotate(${rotation})`,
      class:`draggable table-hit${selectedState?' table-selected':''}${danger?' has-conflict':''}`,
      'data-id':item.id,
      'data-table-shape':shape,
      'data-capacity':String(capacity),
      'data-chair-count':String(positions.length),
      'data-seat-layout':item.seatLayoutVariant
    });
    const chairRadius = Math.max(7, Math.min(d.tabletopWidthPx, d.tabletopHeightPx) * 0.06);

    if (showClearance.checked) {
      if (shape === 'round') {
        group.appendChild(svgEl('circle', {
          r:d.clearanceWidthPx/2, fill:item.color, 'fill-opacity':.16, stroke,
          'stroke-width':strokeW, 'stroke-dasharray':'9 7', class:'clearance'
        }));
      } else {
        group.appendChild(svgEl('rect', {
          x:-d.clearanceWidthPx/2, y:-d.clearanceHeightPx/2,
          width:d.clearanceWidthPx, height:d.clearanceHeightPx, rx:8,
          fill:item.color, 'fill-opacity':.16, stroke,
          'stroke-width':strokeW, 'stroke-dasharray':'9 7', class:'clearance'
        }));
      }
    }

    positions.forEach((pos, index) => {
      appendChair(group, item, pos, index + 1, chairRadius, C, rotation);
      const guest = guestById(item.seats[index]);
      if (guest) renderGuestLabel(group, item, pos, guest.name, index + 1, scale);
    });

    appendTabletop(group, item, shape, C, d, danger);
    appendTableLabels(group, item, capacity);
    appendRotateHandle(group, item);
    return group;
  }

  renderTable = function phase2PhysicalDimensionAwareRenderTable(item, scale, conflicts) {
    return item?.type === 'table' ? renderDynamicTable(item, scale, conflicts) : null;
  };

  function blockedSeatsForCapacity(item, nextCapacity) {
    if (!item || item.type !== 'table') return [];
    const next = seatsApi.normalizeCapacity(nextCapacity, item.capacity || 10);
    return next < Number(item.capacity || 10) ? Array.from(seatsApi.occupiedBeyondCapacity(item, next)) : [];
  }

  function transitionTable(item, request) {
    if (!item || item.type !== 'table' || isItemLocked(item)) return Object.freeze({ ok:false, reason:'unavailable' });
    const result = transitionApi.transition(item, request);
    if (!result.ok) {
      if (result.reason === 'occupied-seats') {
        const blockedSeats = result.blocked.map((entry) => entry.seatNumber).join(', ');
        if (typeof toast === 'function') toast(`No se puede reducir: mueve o libera los asientos ${blockedSeats}.`, true);
      }
      return result;
    }
    applyPhysicalGeometry(item);
    normalizeSeatLayout(item);
    commitMutation();
    return result;
  }

  function setCapacity(item, nextCapacity) {
    return transitionTable(item, { capacity:nextCapacity });
  }

  function convertShapePreservingCapacity(item, shape) {
    return transitionTable(item, { shape });
  }

  function setSeatLayoutVariant(item, variant) {
    if (!item || item.type !== 'table' || isItemLocked(item)) return Object.freeze({ ok:false, reason:'unavailable' });
    const next = layout.normalizeVariant(tableShape(item), seatsApi.normalizeCapacity(item.capacity, 10), variant);
    const previous = normalizeSeatLayout(item);
    if (previous === next) return Object.freeze({ ok:true, changed:false, variant:next });
    item.seatLayoutVariant = next;
    commitMutation();
    return Object.freeze({ ok:true, changed:true, variant:next });
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
      button.type = 'button';
      button.dataset.capacity = String(capacity);
      button.textContent = `${capacity} personas`;
      button.addEventListener('click', (event) => {
        event.preventDefault(); event.stopImmediatePropagation();
        setCapacity(selected(), capacity);
      }, true);
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
        item.tableShape = transitionApi.normalizeShape(raw.tableShape, 'round');
        const capacity = seatsApi.normalizeCapacity(raw.capacity, 10);
        item.capacity = capacity;
        const rawSeats = Array.isArray(raw.seats) ? raw.seats : [];
        item.seats = rawSeats.slice(0, capacity).map((guestId) => {
          if (!guestId) return null;
          const safeId = String(guestId).slice(0,160);
          return guestIds.has(safeId) ? safeId : null;
        });
        while (item.seats.length < capacity) item.seats.push(null);
        item.seatLayoutVariant = layout.normalizeVariant(item.tableShape, capacity, raw.seatLayoutVariant);
        applyPhysicalGeometry(item);
      });
      return safe;
    };
  }

  elements.filter((item) => item.type === 'table').forEach((item) => { applyPhysicalGeometry(item); normalizeSeatLayout(item); });
  installCapacityControls();
  document.documentElement.dataset.phase2Capacity = 'ready';
  window.MiGranDiaDistributionCapacityV1 = Object.freeze({
    status:'ready', capacities, transitionTable, setCapacity, convertShapePreservingCapacity,
    setSeatLayoutVariant, seatLayoutVariants, normalizeSeatLayout,
    seatPositions, renderDynamicTable, applyPhysicalGeometry, blockedSeatsForCapacity,
    protectsOccupiedSeats:true, dimensionsStillFixed:false, physicalDimensionsByCapacity:true,
    unifiedTransition:true, jsonSupports16:true, uprightTextNative:true,
    rotationHandleNative:true, authoritativeTableRenderer:true, exactChairCountInvariant:true,
    chairsIndependentFromClearance:true, explicitSeatLayoutMatrix:true
  });
  render();
})();