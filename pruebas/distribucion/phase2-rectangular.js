(() => {
  if (document.documentElement.dataset.phase2Rectangular === 'ready') return;
  const contractApi = window.MiGranDiaDistributionEngine?.rectangularTableContract;
  if (!contractApi) throw new Error('Contrato de mesa rectangular no disponible');
  const C = contractApi.RECTANGULAR_TABLE_CONTRACT;
  const legacyRenderTable = renderTable;
  const legacySanitizeState = typeof sanitizeState === 'function' ? sanitizeState : null;

  function isRectangularTable(item) {
    return Boolean(item && item.type === 'table' && item.tableShape === 'rectangular');
  }

  function renderRectangularGuestLabel(group, guestName, seatNumber, index, scale, rotation) {
    if (!showNames.checked || !guestName) return;
    const pos = contractApi.labelPosition(index, scale);
    const wrapper = svgEl('g', {
      transform: `translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)}) rotate(${-(Number(rotation) || 0)})`,
      class: 'guest-tag',
      'pointer-events': 'none'
    });
    const title = svgEl('title');
    title.textContent = `Asiento ${seatNumber}: ${guestName}`;
    wrapper.appendChild(title);
    const text = svgEl('text', {
      x: pos.anchor === 'start' ? 4 : pos.anchor === 'end' ? -4 : 0,
      y: 3,
      'text-anchor': pos.anchor,
      'font-size': C.labelFontSizePx,
      'font-weight': 800,
      fill: '#2d2924',
      stroke: '#ffffff',
      'stroke-width': 4,
      'paint-order': 'stroke'
    });
    text.textContent = compactName(guestName, C.labelMaxChars);
    wrapper.appendChild(text);
    group.appendChild(wrapper);
  }

  function renderRectangularTable(item, scale, conflicts) {
    ensureTableSeats(item);
    const dims = contractApi.dimensionsAtScale(scale);
    const danger = conflicts.has(item.id);
    const selectedState = isSelected(item.id);
    const stroke = danger ? C.conflictColor : selectedState ? C.selectedColor : item.color;
    const strokeW = danger || selectedState ? 5 : 2;
    const group = svgEl('g', {
      transform: `translate(${item.x} ${item.y}) rotate(${item.rotation || 0})`,
      class: `draggable table-hit${selectedState ? ' table-selected' : ''}${danger ? ' has-conflict' : ''}`,
      'data-id': item.id,
      'data-table-shape': 'rectangular'
    });

    group.appendChild(svgEl('rect', {
      x: -dims.clearanceWidthPx / 2,
      y: -dims.clearanceHeightPx / 2,
      width: dims.clearanceWidthPx,
      height: dims.clearanceHeightPx,
      rx: 8,
      fill: item.color,
      'fill-opacity': 0.16,
      stroke,
      'stroke-width': strokeW,
      'stroke-dasharray': showClearance.checked ? '9 7' : '0',
      class: 'clearance'
    }));

    for (let index = 0; index < C.capacity; index++) {
      const pos = contractApi.perimeterSeatPosition(index, scale);
      if (showClearance.checked) {
        const chair = svgEl('g', { transform: `translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)})`, class: 'chair-wrap' });
        chair.appendChild(svgEl('circle', {
          r: dims.chairRadiusPx.toFixed(2),
          class: 'chair',
          fill: C.chairFill,
          stroke: C.chairStroke,
          'stroke-width': 1.5
        }));
        const number = svgEl('text', {
          x: 0,
          y: 3.2,
          'text-anchor': 'middle',
          'font-size': Math.max(7, dims.chairRadiusPx * 0.88).toFixed(1),
          'font-weight': 800,
          fill: '#5b554d',
          'pointer-events': 'none'
        });
        number.textContent = String(index + 1);
        chair.appendChild(number);
        group.appendChild(chair);
      }
      const guest = guestById(item.seats[index]);
      if (guest) renderRectangularGuestLabel(group, guest.name, index + 1, index, scale, item.rotation || 0);
    }

    group.appendChild(svgEl('rect', {
      x: -dims.tabletopHalfWidthPx,
      y: -dims.tabletopHalfHeightPx,
      width: dims.tabletopWidthPx,
      height: dims.tabletopHeightPx,
      rx: 4,
      class: 'tabletop',
      fill: item.color,
      stroke: danger ? C.conflictColor : C.tabletopStroke,
      'stroke-width': danger ? 5 : 3,
      filter: 'url(#softShadow)'
    }));
    group.appendChild(svgEl('rect', {
      x: -dims.tabletopWidthPx * 0.275,
      y: -dims.tabletopHeightPx * 0.275,
      width: dims.tabletopWidthPx * 0.55,
      height: dims.tabletopHeightPx * 0.55,
      rx: 2,
      fill: 'none',
      stroke: '#fff',
      'stroke-opacity': 0.55,
      'stroke-width': 2,
      'pointer-events': 'none'
    }));

    if (showLabels.checked) {
      const title = svgEl('text', { x: 0, y: 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 900, fill: '#473d31', 'pointer-events': 'none' });
      title.textContent = item.label;
      group.appendChild(title);
    }
    return group;
  }

  renderTable = function phase2RectangularAwareRenderTable(item, scale, conflicts) {
    return isRectangularTable(item) ? renderRectangularTable(item, scale, conflicts) : legacyRenderTable(item, scale, conflicts);
  };

  function convertTable(item, shape) {
    if (!item || item.type !== 'table' || isItemLocked(item)) return false;
    const identity = { id: item.id, x: item.x, y: item.y, rotation: item.rotation, seats: item.seats.slice(), label: item.label, color: item.color };
    if (shape === 'rectangular') contractApi.normalizeRectangularTable(item);
    else if (shape === 'square') {
      const square = window.MiGranDiaDistributionEngine?.squareTableContract;
      if (!square) return false;
      square.normalizeSquareTable(item);
    } else {
      const round = window.MiGranDiaDistributionEngine?.roundTableContract;
      if (!round) return false;
      round.normalizeCurrentRoundTable(item);
      item.tableShape = 'round';
    }
    item.id = identity.id;
    item.x = identity.x;
    item.y = identity.y;
    item.rotation = identity.rotation;
    item.seats = identity.seats;
    item.label = identity.label;
    item.color = identity.color;
    commitMutation();
    return true;
  }

  function addRectangularTable() {
    const item = addElement('table', { record: false, assignGuests: false });
    if (!item) return null;
    contractApi.normalizeRectangularTable(item);
    item.label = `Mesa rectangular ${elements.filter((entry) => entry.type === 'table' && isRectangularTable(entry)).length}`;
    commitMutation();
    return item;
  }

  function installToolButton() {
    const square = document.getElementById('btnAddSquareTable');
    const circular = document.querySelector('[data-add="table"]');
    const anchor = square || circular;
    if (!anchor || document.getElementById('btnAddRectangularTable')) return;
    const button = anchor.cloneNode(true);
    button.id = 'btnAddRectangularTable';
    button.removeAttribute('data-add');
    button.querySelector('strong').textContent = '▭';
    button.querySelector('span').innerHTML = 'Mesa rectangular<small>10 personas · 2.40 × 0.75 m</small>';
    button.addEventListener('click', (event) => { event.preventDefault(); event.stopImmediatePropagation(); addRectangularTable(); }, true);
    anchor.insertAdjacentElement('afterend', button);
  }

  function installShapeControl() {
    const wrap = document.getElementById('phase2TableShapeControls');
    if (!wrap || wrap.querySelector('[data-shape="rectangular"]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.shape = 'rectangular';
    button.textContent = 'Mesa rectangular';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      convertTable(selected(), 'rectangular');
    }, true);
    wrap.appendChild(button);
  }

  // P2 sanea el estado antes de restaurarlo. Conservamos tableShape explícito para
  // diferenciar cuadrada y rectangular, que comparten shape='rect' para SAT.
  if (legacySanitizeState) {
    sanitizeState = function phase2ShapeAwareSanitizeState(input) {
      const safe = legacySanitizeState(input);
      const rawElements = Array.isArray(input?.elements) ? input.elements : [];
      safe.elements.forEach((item, index) => {
        if (item.type !== 'table') return;
        const raw = rawElements[index] || rawElements.find((entry) => String(entry?.id || '') === item.id);
        const requested = raw?.tableShape;
        if (requested === 'rectangular') {
          contractApi.normalizeRectangularTable(item);
        } else if (requested === 'square') {
          window.MiGranDiaDistributionEngine?.squareTableContract?.normalizeSquareTable(item);
        } else {
          window.MiGranDiaDistributionEngine?.roundTableContract?.normalizeCurrentRoundTable(item);
          item.tableShape = 'round';
        }
      });
      return safe;
    };
  }

  installToolButton();
  installShapeControl();
  document.documentElement.dataset.phase2Rectangular = 'ready';
  window.MiGranDiaDistributionRectangularV1 = Object.freeze({
    status: 'ready',
    capacity: C.capacity,
    tabletopWidthM: C.tabletopWidthM,
    tabletopHeightM: C.tabletopHeightM,
    preservesIdentity: true,
    addRectangularTable,
    convertTable,
    isRectangularTable,
    renderRectangularTable
  });
  render();
})();