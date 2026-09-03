(() => {
  if (document.documentElement.dataset.phase2Capacity === 'ready') return;
  const engine = window.MiGranDiaDistributionEngine || {};
  const seatsApi = engine.seats;
  const layout = engine.capacityLayout;
  const round = engine.roundTableContract;
  const square = engine.squareTableContract;
  const rectangular = engine.rectangularTableContract;
  if (!seatsApi || !layout || !round || !square || !rectangular) throw new Error('Motor de capacidad incompleto');

  const legacyRenderTable = renderTable;
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

  function seatPositions(item, scale) {
    const shape = tableShape(item);
    const capacity = seatsApi.normalizeCapacity(item.capacity, 10);
    if (shape === 'round') {
      const dims = round.dimensionsAtScale(scale);
      return layout.roundPositions(capacity, dims.chairOrbitPx);
    }
    if (shape === 'square') {
      const dims = square.dimensionsAtScale(scale);
      return layout.rectPositions(capacity, dims.tabletopSidePx, dims.tabletopSidePx, square.SQUARE_TABLE_CONTRACT.chairOffsetM * scale, false);
    }
    const dims = rectangular.dimensionsAtScale(scale);
    return layout.rectPositions(capacity, dims.tabletopWidthPx, dims.tabletopHeightPx, rectangular.RECTANGULAR_TABLE_CONTRACT.chairOffsetM * scale, true);
  }

  function renderGuestLabel(group, item, seat, guestName, seatNumber, scale) {
    if (!showNames.checked || !guestName) return;
    const shape = tableShape(item);
    const C = styleContract(shape);
    const extra = (C.labelOffsetM || 0.72) * scale;
    const pos = layout.labelFromSeat(seat, extra);
    const wrapper = svgEl('g', {
      transform: `translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)}) rotate(${-(Number(item.rotation) || 0)})`,
      class: 'guest-tag', 'pointer-events': 'none'
    });
    const title = svgEl('title');
    title.textContent = `Asiento ${seatNumber}: ${guestName}`;
    wrapper.appendChild(title);
    const text = svgEl('text', {
      x: pos.anchor === 'start' ? 4 : pos.anchor === 'end' ? -4 : 0,
      y: 3, 'text-anchor': pos.anchor, 'font-size': C.labelFontSizePx || 9.5,
      'font-weight': 800, fill: '#2d2924', stroke: '#ffffff', 'stroke-width': 4, 'paint-order': 'stroke'
    });
    text.textContent = compactName(guestName, C.labelMaxChars || 18);
    wrapper.appendChild(text);
    group.appendChild(wrapper);
  }

  function renderDynamicTable(item, scale, conflicts) {
    const shape = tableShape(item);
    const C = styleContract(shape);
    const capacity = seatsApi.normalizeCapacity(item.capacity, 10);
    seatsApi.ensureSeatArray(item, capacity);
    const danger = conflicts.has(item.id);
    const selectedState = isSelected(item.id);
    const stroke = danger ? C.conflictColor : selectedState ? C.selectedColor : item.color;
    const strokeW = danger || selectedState ? 5 : 2;
    const group = svgEl('g', {
      transform: `translate(${item.x} ${item.y}) rotate(${item.rotation || 0})`,
      class: `draggable table-hit${selectedState ? ' table-selected' : ''}${danger ? ' has-conflict' : ''}`,
      'data-id': item.id, 'data-table-shape': shape, 'data-capacity': String(capacity)
    });

    let chairRadius = 7;
    if (shape === 'round') {
      const d = round.dimensionsAtScale(scale);
      chairRadius = d.chairRadiusPx;
      group.appendChild(svgEl('circle', { r:d.clearanceRadiusPx, fill:item.color, 'fill-opacity':.16, stroke, 'stroke-width':strokeW, 'stroke-dasharray':showClearance.checked?'9 7':'0', class:'clearance' }));
      group.appendChild(svgEl('circle', { r:d.tabletopRadiusPx, class:'tabletop', fill:item.color, stroke:danger?C.conflictColor:C.tabletopStroke, 'stroke-width':danger?5:3, filter:'url(#softShadow)' }));
    } else {
      const d = shape === 'square' ? square.dimensionsAtScale(scale) : rectangular.dimensionsAtScale(scale);
      const clearanceW = d.clearanceWidthPx, clearanceH = d.clearanceHeightPx;
      const tabletopW = shape === 'square' ? d.tabletopSidePx : d.tabletopWidthPx;
      const tabletopH = shape === 'square' ? d.tabletopSidePx : d.tabletopHeightPx;
      chairRadius = d.chairRadiusPx;
      group.appendChild(svgEl('rect', { x:-clearanceW/2, y:-clearanceH/2, width:clearanceW, height:clearanceH, rx:8, fill:item.color, 'fill-opacity':.16, stroke, 'stroke-width':strokeW, 'stroke-dasharray':showClearance.checked?'9 7':'0', class:'clearance' }));
      group.appendChild(svgEl('rect', { x:-tabletopW/2, y:-tabletopH/2, width:tabletopW, height:tabletopH, rx:shape==='square'?5:4, class:'tabletop', fill:item.color, stroke:danger?C.conflictColor:C.tabletopStroke, 'stroke-width':danger?5:3, filter:'url(#softShadow)' }));
    }

    const positions = seatPositions(item, scale);
    positions.forEach((pos, index) => {
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

  renderTable = function phase2CapacityAwareRenderTable(item, scale, conflicts) {
    const capacity = seatsApi.normalizeCapacity(item?.capacity, 10);
    return item?.type === 'table' && capacity !== 10 ? renderDynamicTable(item, scale, conflicts) : legacyRenderTable(item, scale, conflicts);
  };

  function setCapacity(item, nextCapacity) {
    if (!item || item.type !== 'table' || isItemLocked(item)) return Object.freeze({ ok:false, reason:'unavailable' });
    const result = seatsApi.resizeCapacity(item, nextCapacity);
    if (!result.ok) {
      const seats = result.blocked.map((entry) => entry.seatNumber).join(', ');
      toast?.(`No se puede reducir: hay invitados en los asientos ${seats}.`, true);
      return result;
    }
    commitMutation();
    return result;
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
  }

  installCapacityControls();
  document.documentElement.dataset.phase2Capacity = 'ready';
  window.MiGranDiaDistributionCapacityV1 = Object.freeze({ status:'ready', capacities, setCapacity, seatPositions, renderDynamicTable, protectsOccupiedSeats:true, dimensionsStillFixed:true });
  render();
})();