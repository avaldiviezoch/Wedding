(() => {
  if (document.documentElement.dataset.phase2Square === 'ready') return;
  const contractApi = window.MiGranDiaDistributionEngine?.squareTableContract;
  if (!contractApi) throw new Error('Contrato de mesa cuadrada no disponible');
  const C = contractApi.SQUARE_TABLE_CONTRACT;
  const legacyRenderTable = renderTable;

  function isSquareTable(item) {
    return Boolean(item && item.type === 'table' && (item.tableShape === 'square' || (!item.tableShape && item.shape === 'rect')));
  }

  function renderSquareGuestLabel(group, guestName, seatNumber, index, scale, rotation) {
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

  function renderSquareTable(item, scale, conflicts) {
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
      'data-table-shape': 'square'
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
      if (guest) renderSquareGuestLabel(group, guest.name, index + 1, index, scale, item.rotation || 0);
    }

    group.appendChild(svgEl('rect', {
      x: -dims.tabletopHalfPx,
      y: -dims.tabletopHalfPx,
      width: dims.tabletopSidePx,
      height: dims.tabletopSidePx,
      rx: 5,
      class: 'tabletop',
      fill: item.color,
      stroke: danger ? C.conflictColor : C.tabletopStroke,
      'stroke-width': danger ? 5 : 3,
      filter: 'url(#softShadow)'
    }));
    group.appendChild(svgEl('rect', {
      x: -dims.tabletopSidePx * 0.275,
      y: -dims.tabletopSidePx * 0.275,
      width: dims.tabletopSidePx * 0.55,
      height: dims.tabletopSidePx * 0.55,
      rx: 3,
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

  renderTable = function phase2SquareAwareRenderTable(item, scale, conflicts) {
    return isSquareTable(item) ? renderSquareTable(item, scale, conflicts) : legacyRenderTable(item, scale, conflicts);
  };

  function convertTable(item, shape) {
    if (!item || item.type !== 'table' || isItemLocked(item)) return false;
    const identity = { id: item.id, x: item.x, y: item.y, rotation: item.rotation, seats: item.seats.slice(), label: item.label, color: item.color };
    if (shape === 'square') contractApi.normalizeSquareTable(item);
    else {
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

  function addSquareTable() {
    const item = addElement('table', { record: false, assignGuests: false });
    if (!item) return null;
    contractApi.normalizeSquareTable(item);
    item.label = `Mesa cuadrada ${elements.filter((entry) => entry.type === 'table' && isSquareTable(entry)).length}`;
    commitMutation();
    return item;
  }

  function installToolButton() {
    const circular = document.querySelector('[data-add="table"]');
    if (!circular || document.getElementById('btnAddSquareTable')) return;
    const button = circular.cloneNode(true);
    button.id = 'btnAddSquareTable';
    button.removeAttribute('data-add');
    button.querySelector('strong').textContent = '□';
    button.querySelector('span').innerHTML = 'Mesa cuadrada<small>10 personas · 1.80 m</small>';
    button.addEventListener('click', (event) => { event.preventDefault(); event.stopImmediatePropagation(); addSquareTable(); }, true);
    circular.insertAdjacentElement('afterend', button);
  }

  function installShapeControls() {
    if (document.getElementById('phase2TableShapeControls')) return;
    const firstSection = selectionForm?.querySelector('.panel-section');
    if (!firstSection) return;
    const wrap = document.createElement('div');
    wrap.id = 'phase2TableShapeControls';
    wrap.className = 'action-grid';
    wrap.innerHTML = '<button type="button" data-shape="round">Mesa redonda</button><button type="button" data-shape="square">Mesa cuadrada</button>';
    wrap.addEventListener('click', (event) => {
      const button = event.target.closest('[data-shape]');
      if (!button) return;
      event.preventDefault();
      if (button.dataset.shape === 'rectangular') return;
      convertTable(selected(), button.dataset.shape);
    });
    firstSection.appendChild(wrap);
  }

  installToolButton();
  installShapeControls();
  document.documentElement.dataset.phase2Square = 'ready';
  window.MiGranDiaDistributionSquareV1 = Object.freeze({
    status: 'ready',
    capacity: C.capacity,
    tabletopSideM: C.tabletopSideM,
    preservesIdentity: true,
    addSquareTable,
    convertTable,
    isSquareTable,
    renderSquareTable
  });
  render();
})();