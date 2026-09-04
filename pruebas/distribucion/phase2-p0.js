(() => {
  const CANVAS_W = 1448;
  const CANVAS_H = 1086;
  const CENTER_X = 724;
  const CENTER_Y = 543;
  const OLD_W = 1200;
  const OLD_H = 760;
  const TABLETOP_RADIUS_M = 0.915;
  const CHAIR_ORBIT_FACTOR = 1.33;
  const LABEL_ORBIT_FACTOR = 2.18;
  const TABLE_CLEARANCE_MARGIN_M = 0.60;
  const RECT_SAT_TOLERANCE_PX = 3;

  document.documentElement.dataset.phase2P0 = 'true';

  function resizePlannerSurface() {
    planner.setAttribute('viewBox', `0 0 ${CANVAS_W} ${CANVAS_H}`);
    const floor = planner.querySelector('.floor');
    [floor, bgImage, gridLayer].filter(Boolean).forEach((node) => {
      node.setAttribute('width', String(CANVAS_W));
      node.setAttribute('height', String(CANVAS_H));
    });
  }

  function rebasePoint(point) {
    if (!point) return;
    point.x = Number(point.x || 0) * CANVAS_W / OLD_W;
    point.y = Number(point.y || 0) * CANVAS_H / OLD_H;
  }

  function rebaseState(state) {
    if (!state || state.__phase2P0Canvas === true) return;
    (state.elements || []).forEach((item) => rebasePoint(item));
    (state.measurements || []).forEach((measure) => {
      rebasePoint(measure.a);
      rebasePoint(measure.b);
    });
    state.__phase2P0Canvas = true;
  }

  function rebaseCurrentSession() {
    if (planner.dataset.phase2P0Rebased === 'true') return;
    planner.dataset.phase2P0Rebased = 'true';
    elements.forEach((item) => rebasePoint(item));
    measurements.forEach((measure) => {
      rebasePoint(measure.a);
      rebasePoint(measure.b);
    });
    proposals.forEach((proposal) => rebaseState(proposal.state));
  }

  nextPosition = function phase2NextPosition(index) {
    const column = index % 3;
    const row = Math.floor(index / 3);
    return {
      x: (310 + column * 265) * CANVAS_W / OLD_W,
      y: (230 + (row % 3) * 220) * CANVAS_H / OLD_H
    };
  };

  initialState = function phase2InitialState() {
    seedGuests();
    elements = [];
    const table = addElement('table', { record: false, assignGuests: false });
    table.x = CENTER_X;
    table.y = CENTER_Y;
    setSelection([table.id], table.id);
    hiddenLayers = {};
    lockedLayers = {};
    measurements = [];
    measurementUid = 1;
    scaleInput.value = 32;
    showGrid.checked = true;
    showClearance.checked = true;
    showLabels.checked = true;
    showNames.checked = true;
    bgVisible = true;
    zoom = 1;
    setZoom(1);
    historyPast = [];
    historyFuture = [];
    pushHistory();
    render();
  };

  applySmartGuides = function phase2ApplySmartGuides(targetX, targetY, ignoreIds = []) {
    const ignore = new Set(ignoreIds);
    const threshold = 9;
    let nextX = targetX;
    let nextY = targetY;
    guideLines = { vertical: null, horizontal: null };

    const visible = getVisibleElements().filter((item) => !ignore.has(item.id));
    const xCandidates = [CENTER_X, ...visible.map((item) => item.x)];
    const yCandidates = [CENTER_Y, ...visible.map((item) => item.y)];
    let bestX = null;
    let bestY = null;

    xCandidates.forEach((value) => {
      const diff = Math.abs(targetX - value);
      if (diff <= threshold && (!bestX || diff < bestX.diff)) bestX = { value, diff };
    });
    yCandidates.forEach((value) => {
      const diff = Math.abs(targetY - value);
      if (diff <= threshold && (!bestY || diff < bestY.diff)) bestY = { value, diff };
    });

    if (bestX) {
      nextX = bestX.value;
      guideLines.vertical = bestX.value;
    }
    if (bestY) {
      nextY = bestY.value;
      guideLines.horizontal = bestY.value;
    }
    return { x: nextX, y: nextY };
  };

  renderGuideLayer = function phase2RenderGuideLayer() {
    guideLayer.replaceChildren();
    if (guideLines.vertical !== null) {
      guideLayer.appendChild(svgEl('line', {
        x1: guideLines.vertical,
        x2: guideLines.vertical,
        y1: 0,
        y2: CANVAS_H,
        class: 'guide-line'
      }));
    }
    if (guideLines.horizontal !== null) {
      guideLayer.appendChild(svgEl('line', {
        x1: 0,
        x2: CANVAS_W,
        y1: guideLines.horizontal,
        y2: guideLines.horizontal,
        class: 'guide-line'
      }));
    }
  };

  function phase2GuestAnchor(worldAngle) {
    const c = Math.cos(worldAngle);
    if (c > 0.28) return 'start';
    if (c < -0.28) return 'end';
    return 'middle';
  }

  function phase2GuestLabel(group, guestName, seatNumber, angle, tableRadius, parentRotation) {
    if (!showNames.checked || !guestName) return;
    const labelOrbit = tableRadius * LABEL_ORBIT_FACTOR;
    const x = Math.cos(angle) * labelOrbit;
    const y = Math.sin(angle) * labelOrbit;
    const worldAngle = angle + (Number(parentRotation) || 0) * Math.PI / 180;
    const anchor = phase2GuestAnchor(worldAngle);
    const label = compactName(guestName, 18);
    const dx = anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0;

    const wrapper = svgEl('g', {
      transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${-(Number(parentRotation) || 0)})`,
      class: 'guest-tag',
      'pointer-events': 'none'
    });
    const title = svgEl('title');
    title.textContent = `Asiento ${seatNumber}: ${guestName}`;
    wrapper.appendChild(title);
    const text = svgEl('text', {
      x: dx,
      y: 3,
      'text-anchor': anchor,
      'font-size': 9.5,
      'font-weight': 800,
      fill: '#2d2924',
      stroke: '#ffffff',
      'stroke-width': 4,
      'paint-order': 'stroke'
    });
    text.textContent = label;
    wrapper.appendChild(text);
    group.appendChild(wrapper);
  }

  renderTable = function phase2RenderTable(item, scale, conflicts) {
    ensureTableSeats(item);
    const danger = conflicts.has(item.id);
    const selectedState = isSelected(item.id);
    const clearanceRadius = item.widthM * scale / 2;
    const tableRadius = TABLETOP_RADIUS_M * scale;
    const chairRadius = Math.max(7, tableRadius * 0.12);
    const chairOrbit = tableRadius * CHAIR_ORBIT_FACTOR;
    const stroke = danger ? '#c84242' : selectedState ? '#d59b3c' : item.color;
    const strokeW = danger || selectedState ? 5 : 2;

    const group = svgEl('g', {
      transform: `translate(${item.x} ${item.y}) rotate(${item.rotation || 0})`,
      class: `draggable table-hit${selectedState ? ' table-selected' : ''}${danger ? ' has-conflict' : ''}`,
      'data-id': item.id
    });

    group.appendChild(svgEl('circle', {
      r: clearanceRadius,
      fill: item.color,
      'fill-opacity': 0.16,
      stroke,
      'stroke-width': strokeW,
      'stroke-dasharray': showClearance.checked ? '9 7' : '0',
      class: 'clearance'
    }));

    for (let index = 0; index < 10; index++) {
      const angle = Math.PI * 2 * index / 10 - Math.PI / 2;
      const chairX = Math.cos(angle) * chairOrbit;
      const chairY = Math.sin(angle) * chairOrbit;
      if (showClearance.checked) {
        const chair = svgEl('g', {
          transform: `translate(${chairX.toFixed(1)} ${chairY.toFixed(1)})`,
          class: 'chair-wrap'
        });
        chair.appendChild(svgEl('circle', {
          r: chairRadius.toFixed(2),
          class: 'chair',
          fill: '#fffdf9',
          stroke: '#6d655a',
          'stroke-width': 1.5
        }));
        const number = svgEl('text', {
          x: 0,
          y: 3.2,
          'text-anchor': 'middle',
          'font-size': Math.max(7, chairRadius * 0.88).toFixed(1),
          'font-weight': 800,
          fill: '#5b554d',
          'pointer-events': 'none'
        });
        number.textContent = String(index + 1);
        chair.appendChild(number);
        group.appendChild(chair);
      }
      const guest = guestById(item.seats[index]);
      if (guest) phase2GuestLabel(group, guest.name, index + 1, angle, tableRadius, item.rotation || 0);
    }

    group.appendChild(svgEl('circle', {
      r: tableRadius,
      class: 'tabletop',
      fill: item.color,
      stroke: danger ? '#c84242' : '#755e43',
      'stroke-width': danger ? 5 : 3,
      filter: 'url(#softShadow)'
    }));
    group.appendChild(svgEl('circle', {
      r: tableRadius * 0.55,
      fill: 'none',
      stroke: '#fff',
      'stroke-opacity': 0.55,
      'stroke-width': 2,
      'pointer-events': 'none'
    }));

    if (showLabels.checked) {
      const title = svgEl('text', {
        x: 0,
        y: -3,
        'text-anchor': 'middle',
        class: 'table-title',
        'font-size': 18,
        'font-weight': 800,
        fill: '#342a20'
      });
      title.textContent = item.label;
      group.appendChild(title);
      const meta = svgEl('text', {
        x: 0,
        y: 15,
        'text-anchor': 'middle',
        class: 'table-meta'
      });
      meta.textContent = `${item.capacity || 10} personas`;
      group.appendChild(meta);
    }

    appendRotateHandle(group, item);
    return group;
  };

  function axesForPhase2(poly) {
    return poly.map((point, index) => {
      const next = poly[(index + 1) % poly.length];
      const edgeX = next.x - point.x;
      const edgeY = next.y - point.y;
      const length = Math.hypot(edgeX, edgeY) || 1;
      return { x: -edgeY / length, y: edgeX / length };
    });
  }

  function projectPhase2(poly, axis) {
    const values = poly.map((point) => point.x * axis.x + point.y * axis.y);
    return { min: Math.min(...values), max: Math.max(...values) };
  }

  polygonIntersectsPolygon = function phase2PolygonIntersectsPolygon(a, b) {
    for (const axis of [...axesForPhase2(a), ...axesForPhase2(b)]) {
      const A = projectPhase2(a, axis);
      const B = projectPhase2(b, axis);
      if (A.max <= B.min + RECT_SAT_TOLERANCE_PX || B.max <= A.min + RECT_SAT_TOLERANCE_PX) return false;
    }
    return true;
  };

  function ensureRiskStatus() {
    let node = document.getElementById('phase2RiskStatus');
    if (node) return node;
    node = document.createElement('div');
    node.id = 'phase2RiskStatus';
    node.className = 'phase2-risk-status';
    validationBox.before(node);
    return node;
  }

  renderValidation = function phase2RenderValidation() {
    const conflicts = conflictIds();
    const status = ensureRiskStatus();
    if (conflicts.size) {
      status.className = 'phase2-risk-status bad';
      status.innerHTML = `<strong>Revisar distribución</strong><span>${conflicts.size} elemento(s) invaden áreas funcionales. Muévelos hasta que dejen de aparecer en rojo.</span>`;
    } else {
      status.className = 'phase2-risk-status good';
      status.innerHTML = '<strong>Distribución sin superposiciones</strong><span>No se detectan invasiones entre áreas funcionales visibles.</span>';
    }
    validationBox.innerHTML = validationMessages(conflicts)
      .map((msg) => `<div class="validation-item ${msg.type}">${msg.text}</div>`)
      .join('');
  };

  const originalValidationMessages = validationMessages;
  validationMessages = function phase2ValidationMessages(conflicts = conflictIds()) {
    const messages = originalValidationMessages(conflicts).filter((message) => !/menos de 60 cm libres/.test(message.text));
    const tableItems = getVisibleElements().filter((item) => item.type === 'table');
    let closeTables = 0;
    for (let i = 0; i < tableItems.length; i++) {
      for (let j = i + 1; j < tableItems.length; j++) {
        const A = tableItems[i];
        const B = tableItems[j];
        const minimumCenterDistance = (((A.widthM + B.widthM) / 2) + TABLE_CLEARANCE_MARGIN_M) * currentScale();
        const actualCenterDistance = Math.hypot(A.x - B.x, A.y - B.y);
        if (actualCenterDistance < minimumCenterDistance && actualCenterDistance > 5) closeTables++;
      }
    }
    if (closeTables) {
      messages.push({
        type: 'warn',
        text: `Se detectaron ${closeTables} pares de mesas con menos de 60 cm libres entre sus áreas de circulación.`
      });
    }
    return messages;
  };

  const centerButton = document.getElementById('btnCenter');
  centerButton?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    updateSelected((item) => {
      item.x = CENTER_X;
      item.y = CENTER_Y;
    });
  }, true);

  resizePlannerSurface();
  // app.js ya creó un estado antes de que P0 se cargue. Reinicializamos aquí
  // para que el contrato real de P0 (mesa vacía y capacidades 4–16 libres)
  // sea el que llegue al usuario, no el seed heredado de 10 invitados.
  initialState();

  window.MiGranDiaDistributionPhase2P0 = Object.freeze({
    canvas: { width: CANVAS_W, height: CANVAS_H, centerX: CENTER_X, centerY: CENTER_Y },
    table: {
      tabletopRadiusM: TABLETOP_RADIUS_M,
      clearanceDiameterM: 3.4,
      chairOrbitFactor: CHAIR_ORBIT_FACTOR,
      labelOrbitFactor: LABEL_ORBIT_FACTOR,
      clearanceMarginM: TABLE_CLEARANCE_MARGIN_M
    },
    status: 'ready'
  });
})();
