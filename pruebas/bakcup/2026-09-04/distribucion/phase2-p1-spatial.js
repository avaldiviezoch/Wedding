(() => {
  const CANVAS_W = 1448;
  const CANVAS_H = 1086;
  const MAX_PROPOSALS = 20;
  const TENT_CLOSE_THRESHOLD = 18;
  const AUTO_LAYOUT = Object.freeze([
    ['dance', 735, 520],
    ['altar', 620, 265],
    ['dj', 780, 370],
    ['bar', 1025, 295],
    ['couple', 820, 775]
  ]);

  if (document.documentElement.dataset.phase2P1Spatial === 'ready') return;
  document.documentElement.dataset.phase2P1Spatial = 'ready';

  let spatialDrag = null;

  const btnMeasureP1 = document.getElementById('btnMeasure');
  const btnClearMeasuresP1 = document.getElementById('btnClearMeasures');
  const btnDrawTentP1 = document.getElementById('btnDrawTent');
  const toggleBgP1 = document.getElementById('toggleBg');
  const btnProposalsP1 = document.getElementById('btnProposals');
  const btnNewProposalP1 = document.getElementById('btnNewProposal');
  const btnDuplicateProposalP1 = document.getElementById('btnDuplicateProposal');
  const closeProposalModalP1 = document.getElementById('closeProposalModal');

  const clampX = (value) => Math.max(0, Math.min(CANVAS_W, Number(value) || 0));
  const clampY = (value) => Math.max(0, Math.min(CANVAS_H, Number(value) || 0));

  function captureButton(button, handler) {
    if (!button) return;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      handler(event);
    }, true);
  }

  function isEditing() {
    const target = document.activeElement;
    const tag = (target?.tagName || '').toLowerCase();
    return ['input', 'select', 'textarea'].includes(tag) || Boolean(target?.isContentEditable);
  }

  function formatMeters(value) {
    const meters = Math.max(0, Number(value) || 0);
    return `${(Math.round(meters * 100) / 100).toFixed(2).replace(/\.?0+$/, '')} m`;
  }

  function normalizeMeasure(item) {
    if (!item) return null;
    if (Number.isFinite(item.x1)) {
      return { id: item.id, start: { x: item.x1, y: item.y1 }, end: { x: item.x2, y: item.y2 } };
    }
    if (item.a && item.b) return { id: item.id, start: item.a, end: item.b };
    if (item.start && item.end) return { id: item.id, start: item.start, end: item.end };
    return null;
  }

  function measureLabelMarkup(start, end) {
    const scale = currentScale();
    const distancePx = Math.hypot(end.x - start.x, end.y - start.y);
    const distanceM = distancePx / scale;
    const midpointX = (start.x + end.x) / 2;
    const midpointY = (start.y + end.y) / 2;
    let angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
    if (angle > 90 || angle < -90) angle += 180;
    return `<g transform="translate(${midpointX.toFixed(2)} ${midpointY.toFixed(2)}) rotate(${angle.toFixed(2)})"><text class="measure-label" text-anchor="middle" y="-6">${formatMeters(distanceM)}</text></g>`;
  }

  renderMeasureLayer = function phase2P1RenderMeasureLayer() {
    const normalized = measurements.map(normalizeMeasure).filter(Boolean);
    const draft = normalizeMeasure(measureDraft);
    if (draft) normalized.push({ ...draft, id: 'draft' });

    let markup = '';
    normalized.forEach((item) => {
      const { start, end } = item;
      markup += `<line class="measure-line" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"/>`;
      markup += `<circle class="measure-end" cx="${start.x}" cy="${start.y}" r="5"/>`;
      markup += `<circle class="measure-end" cx="${end.x}" cy="${end.y}" r="5"/>`;
      markup += measureLabelMarkup(start, end);
    });
    measureLayer.innerHTML = markup;
  };

  function updateMeasureUi() {
    if (btnMeasureP1) btnMeasureP1.classList.toggle('active', measureMode);
    if (measureNote) measureNote.hidden = !measureMode;
    if (measureToolbarChip) measureToolbarChip.hidden = !measureMode;
  }

  function stopMeasureMode() {
    measureMode = false;
    measureDraft = null;
    updateMeasureUi();
    renderMeasureLayer();
  }

  function toggleMeasureModeP1() {
    measureMode = !measureMode;
    measureDraft = null;
    if (measureMode) cancelTentDrawing(false);
    updateMeasureUi();
    render();
  }

  function clearMeasurementsP1() {
    if (!measurements.length && !measureDraft) return;
    measurements = [];
    measureDraft = null;
    commitMutation();
    updateMeasureUi();
  }

  function measurementPointerDown(event) {
    if (!measureMode) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    const point = svgPoint(event);
    if (!measureDraft?.start) {
      measureDraft = { start: point, end: point };
      renderMeasureLayer();
      return true;
    }
    measurements.push({
      id: measurementUid++,
      x1: measureDraft.start.x,
      y1: measureDraft.start.y,
      x2: point.x,
      y2: point.y
    });
    measureDraft = null;
    commitMutation();
    updateMeasureUi();
    return true;
  }

  function measurementPointerMove(event) {
    if (!measureMode || !measureDraft?.start) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    measureDraft.end = svgPoint(event);
    renderMeasureLayer();
    return true;
  }

  function refreshTentDimensions(item) {
    if (!item || item.type !== 'tent') return;
    const points = Array.isArray(item.pointsM) ? item.pointsM : [];
    if (!points.length) {
      item.widthM = Math.max(.2, Number(item.widthM) || .2);
      item.heightM = Math.max(.2, Number(item.heightM) || .2);
      return;
    }
    const xs = points.map((point) => Number(point.x) || 0);
    const ys = points.map((point) => Number(point.y) || 0);
    item.widthM = Math.max(.2, Math.max(...xs) - Math.min(...xs));
    item.heightM = Math.max(.2, Math.max(...ys) - Math.min(...ys));
  }

  function normalizeTentPoints(item) {
    if (!item || item.type !== 'tent') return [];
    if (Array.isArray(item.pointsM) && item.pointsM.length) return item.pointsM;
    if (Array.isArray(item.points) && item.points.length) {
      const scale = currentScale();
      item.pointsM = item.points.map((point) => ({ x: (Number(point.x) || 0) / scale, y: (Number(point.y) || 0) / scale }));
      item.points = undefined;
      refreshTentDimensions(item);
      return item.pointsM;
    }
    item.pointsM = [];
    return item.pointsM;
  }

  resizeTent = function phase2P1ResizeTent(item, nextWidth, nextHeight) {
    if (!item || item.type !== 'tent') return;
    const points = normalizeTentPoints(item);
    const oldWidth = Math.max(.001, Number(item.widthM) || 1);
    const oldHeight = Math.max(.001, Number(item.heightM) || 1);
    const width = Math.max(.2, Number(nextWidth) || oldWidth);
    const height = Math.max(.2, Number(nextHeight) || oldHeight);
    const sx = width / oldWidth;
    const sy = height / oldHeight;
    item.pointsM = points.map((point) => ({ x: point.x * sx, y: point.y * sy }));
    item.widthM = width;
    item.heightM = height;
  };

  function edgeLabel(pointA, pointB, index, rotation) {
    const scale = currentScale();
    const ax = pointA.x * scale;
    const ay = pointA.y * scale;
    const bx = pointB.x * scale;
    const by = pointB.y * scale;
    const midX = (ax + bx) / 2;
    const midY = (ay + by) / 2;
    const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
    let angle = Math.atan2(by - ay, bx - ax) * 180 / Math.PI;
    const worldAngle = angle + (Number(rotation) || 0);
    if (worldAngle > 90 || worldAngle < -90) angle += 180;
    const text = svgEl('text', {
      x: midX,
      y: midY - 7,
      'text-anchor': 'middle',
      class: 'measure-label tent-side-label',
      transform: `rotate(${angle} ${midX} ${midY})`,
      'data-tent-side': index
    });
    text.textContent = formatMeters(distance);
    return text;
  }

  renderTent = function phase2P1RenderTent(item) {
    const selectedState = isSelected(item.id);
    const scale = currentScale();
    const pointsM = normalizeTentPoints(item);
    const pointsPx = pointsM.map((point) => ({ x: point.x * scale, y: point.y * scale }));
    const group = svgEl('g', {
      transform: `translate(${item.x} ${item.y}) rotate(${item.rotation || 0})`,
      class: `draggable tent-hit${selectedState ? ' item-selected' : ''}`,
      'data-id': item.id
    });
    const points = pointsPx.map((point) => `${point.x},${point.y}`).join(' ');
    const opacity = Math.max(0, Math.min(1, 1 - (Number(item.transparency ?? 85) / 100)));
    group.appendChild(svgEl('polygon', {
      points,
      fill: item.fillColor || item.color || '#d8c9a6',
      'fill-opacity': opacity,
      stroke: selectedState ? '#d59b3c' : (item.outlineColor || '#555555'),
      'stroke-width': selectedState ? 5 : 3,
      class: 'object-shape'
    }));

    if (showLabels.checked) {
      const text = svgEl('text', { x: 0, y: 0, 'text-anchor': 'middle', class: 'object-title' });
      text.textContent = item.label;
      group.appendChild(text);
    }

    pointsM.forEach((point, index) => {
      const next = pointsM[(index + 1) % pointsM.length];
      if (next) group.appendChild(edgeLabel(point, next, index, item.rotation));
    });

    if (selectedState && !isItemLocked(item)) {
      pointsPx.forEach((point, index) => {
        group.appendChild(svgEl('circle', {
          class: 'vertex-handle tent-vertex',
          'data-id': item.id,
          'data-vertex-index': index,
          cx: point.x,
          cy: point.y,
          r: 9
        }));
      });
    }

    appendRotateHandle(group, item);
    return group;
  };

  function draftDistanceMarkup(pointA, pointB) {
    if (!pointA || !pointB) return '';
    const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y) / currentScale();
    const midX = (pointA.x + pointB.x) / 2;
    const midY = (pointA.y + pointB.y) / 2;
    return `<text class="measure-label" x="${midX}" y="${midY - 7}" text-anchor="middle">${formatMeters(distance)}</text>`;
  }

  function renderTentDraftP1() {
    if (!drawingTent || !tentDraft.length) {
      drawLayer.replaceChildren();
      drawLayer.setAttribute('display', 'none');
      return;
    }
    drawLayer.setAttribute('display', '');
    const points = [...tentDraft];
    if (tentHoverPoint) points.push(tentHoverPoint);
    let markup = `<polyline points="${points.map((point) => `${point.x},${point.y}`).join(' ')}" class="tent-draft-line" fill="none"/>`;
    tentDraft.forEach((point, index) => {
      markup += `<circle cx="${point.x}" cy="${point.y}" r="${index === 0 ? 8 : 6}" class="tent-draft-point${index === 0 ? ' tent-draft-start' : ''}"/>`;
      if (index > 0) markup += draftDistanceMarkup(tentDraft[index - 1], point);
    });
    if (tentHoverPoint && tentDraft.length) markup += draftDistanceMarkup(tentDraft.at(-1), tentHoverPoint);
    if (tentDraft.length >= 3) markup += draftDistanceMarkup(tentDraft.at(-1), tentDraft[0]);
    drawLayer.innerHTML = markup;
  }

  function setTentUi(active) {
    if (btnDrawTentP1) btnDrawTentP1.classList.toggle('active', active);
    if (tentDrawHint) tentDrawHint.hidden = !active;
  }

  function cancelTentDrawing(shouldRender = true) {
    drawingTent = false;
    tentDraft = [];
    tentHoverPoint = null;
    spatialDrag = null;
    setTentUi(false);
    renderTentDraftP1();
    if (shouldRender) render();
  }

  function startTentDrawingP1() {
    if (drawingTent) {
      cancelTentDrawing();
      return;
    }
    stopMeasureMode();
    drawingTent = true;
    tentDraft = [];
    tentHoverPoint = null;
    clearSelection();
    setTentUi(true);
    render();
  }

  function finishTentDrawingP1() {
    if (tentDraft.length < 3) {
      window.alert('El toldo necesita como mínimo tres vértices.');
      return false;
    }
    const closedPoints = tentDraft.map((point) => ({ x: Number(point.x), y: Number(point.y) }));
    const centroid = {
      x: closedPoints.reduce((sum, point) => sum + point.x, 0) / closedPoints.length,
      y: closedPoints.reduce((sum, point) => sum + point.y, 0) / closedPoints.length
    };
    const scale = currentScale();
    const pointsM = closedPoints.map((point) => ({
      x: (point.x - centroid.x) / scale,
      y: (point.y - centroid.y) / scale
    }));
    const item = {
      id: makeId('tent'),
      type: 'tent',
      shape: 'polygon',
      label: `Toldo ${elements.filter((entry) => entry.type === 'tent').length + 1}`,
      x: clampX(centroid.x),
      y: clampY(centroid.y),
      widthM: 1,
      heightM: 1,
      rotation: 0,
      color: '#d8c9a6',
      fillColor: '#d8c9a6',
      outlineColor: '#555555',
      transparency: 45,
      pointsM,
      locked: false
    };
    refreshTentDimensions(item);
    elements.push(item);
    hiddenLayers.tent = false;
    setSelection([item.id], item.id);
    drawingTent = false;
    tentDraft = [];
    tentHoverPoint = null;
    setTentUi(false);
    commitMutation();
    return true;
  }

  function tentPointerDown(event) {
    const vertex = event.target?.closest?.('.tent-vertex');
    if (vertex) {
      const item = getItem(vertex.getAttribute('data-id'));
      if (!item || isItemLocked(item)) return false;
      event.preventDefault();
      event.stopImmediatePropagation();
      setSelection([item.id], item.id);
      spatialDrag = {
        mode: 'tent-vertex',
        pointerId: event.pointerId,
        id: item.id,
        vertexIndex: Number(vertex.getAttribute('data-vertex-index')) || 0,
        moved: false
      };
      try { planner.setPointerCapture(event.pointerId); } catch (_) {}
      return true;
    }

    if (!drawingTent) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    const point = svgPoint(event);
    if (tentDraft.length >= 3) {
      const first = tentDraft[0];
      if (Math.hypot(point.x - first.x, point.y - first.y) <= TENT_CLOSE_THRESHOLD) {
        finishTentDrawingP1();
        return true;
      }
    }
    tentDraft.push({ x: point.x, y: point.y });
    tentHoverPoint = null;
    renderTentDraftP1();
    return true;
  }

  function tentPointerMove(event) {
    if (spatialDrag?.mode === 'tent-vertex' && event.pointerId === spatialDrag.pointerId) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const item = getItem(spatialDrag.id);
      if (!item || isItemLocked(item)) return true;
      const point = svgPoint(event);
      const angle = -(Number(item.rotation) || 0) * Math.PI / 180;
      const dx = point.x - item.x;
      const dy = point.y - item.y;
      const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
      const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
      normalizeTentPoints(item);
      item.pointsM[spatialDrag.vertexIndex] = { x: localX / currentScale(), y: localY / currentScale() };
      refreshTentDimensions(item);
      spatialDrag.moved = true;
      render();
      return true;
    }
    if (!drawingTent) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    tentHoverPoint = svgPoint(event);
    renderTentDraftP1();
    return true;
  }

  function endSpatialDrag(event) {
    if (!spatialDrag || event.pointerId !== spatialDrag.pointerId) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    try { planner.releasePointerCapture(event.pointerId); } catch (_) {}
    const changed = spatialDrag.moved;
    spatialDrag = null;
    if (changed) {
      pushHistory();
      saveCurrentProposalSnapshot();
    }
    render();
    return true;
  }

  function makeLayoutItem(type, x, y) {
    const base = TYPE_DEFAULTS[type];
    if (!base) return null;
    return {
      id: makeId(type),
      type,
      shape: base.shape,
      label: base.label,
      x,
      y,
      widthM: base.widthM,
      heightM: base.heightM,
      rotation: 0,
      color: base.color,
      locked: false
    };
  }

  function autoLayoutP1() {
    cancelTentDrawing(false);
    stopMeasureMode();
    elements = AUTO_LAYOUT.map(([type, x, y]) => makeLayoutItem(type, x, y)).filter(Boolean);
    hiddenLayers = {};
    lockedLayers = {};
    clearSelection();
    commitMutation();
  }

  function installAutoLayoutButton() {
    if (document.getElementById('btnAutoLayoutP1')) return;
    const viewSection = toggleBgP1?.closest?.('.panel-section');
    if (!viewSection) return;
    const button = document.createElement('button');
    button.id = 'btnAutoLayoutP1';
    button.type = 'button';
    button.className = 'wide-button';
    button.textContent = 'Auto distribución';
    button.title = 'Replica la composición inicial del Distribución estable';
    button.addEventListener('click', autoLayoutP1);
    toggleBgP1.insertAdjacentElement('afterend', button);
  }

  function toggleBackgroundP1(event) {
    bgVisible = !bgVisible;
    if (event?.currentTarget) event.currentTarget.textContent = bgVisible ? 'Ocultar plano' : 'Mostrar plano';
    commitMutation();
  }

  saveCurrentProposalSnapshot = function phase2P1SaveCurrentProposalSnapshot() {
    if (!currentProposalId) return;
    const proposal = proposals.find((entry) => entry.id === currentProposalId);
    if (!proposal) return;
    proposal.state = clone(stateSnapshot());
    proposal.updatedAt = new Date().toISOString();
  };

  function proposalName(value, fallback) {
    const name = String(value || '').trim();
    return name || fallback;
  }

  function switchProposalP1(id) {
    saveCurrentProposalSnapshot();
    const proposal = proposals.find((entry) => entry.id === id);
    if (!proposal) return false;
    currentProposalId = proposal.id;
    historyPast = [];
    historyFuture = [];
    restoreState(clone(proposal.state));
    pushHistory();
    proposalNameTop.textContent = proposal.name;
    proposalNameCanvas.textContent = `${proposal.name} · laboratorio`;
    renderProposalList();
    return true;
  }

  function createProposalP1({ duplicate = false } = {}) {
    saveCurrentProposalSnapshot();
    if (proposals.length >= MAX_PROPOSALS) {
      window.alert(`Puedes guardar como máximo ${MAX_PROPOSALS} propuestas. Elimina una para crear otra.`);
      return false;
    }
    const active = proposals.find((entry) => entry.id === currentProposalId);
    const suggestedName = duplicate
      ? `${active?.name || 'Propuesta'} copia`
      : `Propuesta ${proposals.length + 1}`;
    const answer = window.prompt(duplicate ? 'Nombre de la propuesta duplicada:' : 'Nombre de la nueva propuesta:', suggestedName);
    if (answer === null) return false;
    const state = duplicate && active ? clone(active.state) : blankState();
    const now = new Date().toISOString();
    const proposal = {
      id: makeId('proposal'),
      name: proposalName(answer, suggestedName),
      state,
      createdAt: now,
      updatedAt: now
    };
    proposals.push(proposal);
    return switchProposalP1(proposal.id);
  }

  function renameProposalP1(id) {
    const proposal = proposals.find((entry) => entry.id === id);
    if (!proposal) return;
    const answer = window.prompt('Nuevo nombre de la propuesta:', proposal.name);
    if (answer === null) return;
    proposal.name = proposalName(answer, proposal.name);
    proposal.updatedAt = new Date().toISOString();
    if (proposal.id === currentProposalId) {
      proposalNameTop.textContent = proposal.name;
      proposalNameCanvas.textContent = `${proposal.name} · laboratorio`;
    }
    renderProposalList();
  }

  function deleteProposalP1(id) {
    if (proposals.length <= 1) {
      window.alert('Debe quedar al menos una propuesta en el laboratorio.');
      return;
    }
    const proposal = proposals.find((entry) => entry.id === id);
    if (!proposal) return;
    if (!window.confirm(`¿Eliminar “${proposal.name}”?`)) return;
    const wasActive = proposal.id === currentProposalId;
    proposals = proposals.filter((entry) => entry.id !== id);
    if (wasActive) switchProposalP1(proposals[0].id);
    else renderProposalList();
  }

  renderProposalList = function phase2P1RenderProposalList() {
    if (!proposalList) return;
    saveCurrentProposalSnapshot();
    proposalList.replaceChildren();

    const count = document.createElement('div');
    count.className = 'proposal-count';
    count.textContent = `${proposals.length} de ${MAX_PROPOSALS} propuestas`;
    proposalList.appendChild(count);

    proposals.forEach((proposal) => {
      const row = document.createElement('article');
      row.className = `proposal-row${proposal.id === currentProposalId ? ' active' : ''}`;
      row.dataset.proposalId = proposal.id;

      const info = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = proposal.name;
      const state = proposal.state || {};
      const tables = (state.elements || []).filter((item) => item.type === 'table').length;
      const small = document.createElement('small');
      small.textContent = `${tables} mesa(s) · ${(state.elements || []).length} elemento(s)${proposal.id === currentProposalId ? ' · Activa' : ''}`;
      info.append(title, small);

      const actions = document.createElement('div');
      actions.className = 'mini-actions';
      const open = document.createElement('button');
      open.type = 'button';
      open.textContent = proposal.id === currentProposalId ? 'Abierta' : 'Abrir';
      open.disabled = proposal.id === currentProposalId;
      open.addEventListener('click', () => switchProposalP1(proposal.id));
      const rename = document.createElement('button');
      rename.type = 'button';
      rename.textContent = 'Renombrar';
      rename.addEventListener('click', () => renameProposalP1(proposal.id));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Eliminar';
      remove.disabled = proposals.length <= 1;
      remove.addEventListener('click', () => deleteProposalP1(proposal.id));
      actions.append(open, rename, remove);

      row.append(info, actions);
      proposalList.appendChild(row);
    });
  };

  function openProposalsP1() {
    renderProposalList();
    proposalModal.hidden = false;
  }

  function closeProposalsP1() {
    proposalModal.hidden = true;
  }

  function onPlannerPointerDown(event) {
    if (tentPointerDown(event)) return;
    measurementPointerDown(event);
  }

  function onPlannerPointerMove(event) {
    if (tentPointerMove(event)) return;
    measurementPointerMove(event);
  }

  function onPlannerDoubleClick(event) {
    if (!drawingTent) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    finishTentDrawingP1();
  }

  function onDocumentKeyDown(event) {
    if (isEditing()) return;
    if (drawingTent && event.key === 'Enter') {
      event.preventDefault();
      event.stopImmediatePropagation();
      finishTentDrawingP1();
      return;
    }
    if ((drawingTent || measureMode) && event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (drawingTent) cancelTentDrawing();
      if (measureMode) stopMeasureMode();
    }
  }

  captureButton(btnMeasureP1, toggleMeasureModeP1);
  captureButton(btnClearMeasuresP1, clearMeasurementsP1);
  captureButton(btnDrawTentP1, startTentDrawingP1);
  captureButton(toggleBgP1, toggleBackgroundP1);
  captureButton(btnProposalsP1, openProposalsP1);
  captureButton(btnNewProposalP1, () => createProposalP1({ duplicate: false }));
  captureButton(btnDuplicateProposalP1, () => createProposalP1({ duplicate: true }));
  captureButton(closeProposalModalP1, closeProposalsP1);

  proposalModal?.addEventListener('click', (event) => {
    if (event.target === proposalModal) closeProposalsP1();
  }, true);

  planner.addEventListener('pointerdown', onPlannerPointerDown, true);
  planner.addEventListener('pointermove', onPlannerPointerMove, true);
  planner.addEventListener('pointerup', endSpatialDrag, true);
  planner.addEventListener('pointercancel', endSpatialDrag, true);
  planner.addEventListener('dblclick', onPlannerDoubleClick, true);
  document.addEventListener('keydown', onDocumentKeyDown, true);

  installAutoLayoutButton();
  elements.filter((item) => item.type === 'tent').forEach((item) => normalizeTentPoints(item));
  updateMeasureUi();
  setTentUi(false);
  renderProposalList();
  render();

  window.MiGranDiaDistributionPhase2P1Spatial = Object.freeze({
    canvas: { width: CANVAS_W, height: CANVAS_H },
    measurement: { multiple: true, livePreview: true, labelsInMeters: true },
    tent: { polygon: true, minVertices: 3, closeThresholdPx: TENT_CLOSE_THRESHOLD, editableVertices: true, sideMeasures: true, rotation: true, resize: true, color: true, transparency: true },
    autoLayout: AUTO_LAYOUT.map(([type, x, y]) => ({ type, x, y })),
    background: { visiblePerProposal: true },
    proposals: { max: MAX_PROPOSALS, memoryOnly: true, create: true, duplicate: true, rename: true, delete: true, switch: true },
    status: 'ready'
  });
})();
