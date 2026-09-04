(() => {
  if (document.documentElement.dataset.phase2P2 === 'ready') return;
  document.documentElement.dataset.phase2P2 = 'ready';

  const SESSION_VERSION = 2;
  const MAX_PROPOSALS = 20;
  const CANVAS_W = 1448;
  const CANVAS_H = 1086;
  const ALLOWED_TYPES = new Set(['table','dance','couple','bar','dj','altar','cake','photo','mirror','tent']);
  const touchPoints = new Map();
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let toastTimer = 0;

  const byId = (id) => document.getElementById(id);
  const safeText = (value, fallback = '') => String(value ?? fallback).slice(0, 160);
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const bounded = (value, min, max, fallback) => Math.max(min, Math.min(max, finite(value, fallback)));
  const nowIso = () => new Date().toISOString();

  function toast(message, bad = false) {
    let node = byId('p2Toast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'p2Toast';
      node.className = 'p2-toast';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.toggle('bad', bad);
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function sanitizePoint(point) {
    return { x: bounded(point?.x, -100, 2000, 0), y: bounded(point?.y, -100, 1600, 0) };
  }

  function sanitizeElement(item) {
    if (!item || !ALLOWED_TYPES.has(item.type)) return null;
    const type = item.type;
    const out = {
      id: safeText(item.id || `${type}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`),
      type,
      shape: safeText(item.shape || (type === 'table' ? 'table' : 'rect')),
      label: safeText(item.label || type),
      x: bounded(item.x, 0, CANVAS_W, CANVAS_W / 2),
      y: bounded(item.y, 0, CANVAS_H, CANVAS_H / 2),
      widthM: bounded(item.widthM, .2, 50, 1),
      heightM: bounded(item.heightM, .2, 50, 1),
      rotation: bounded(item.rotation, -360, 360, 0),
      color: /^#[0-9a-f]{6}$/i.test(item.color || '') ? item.color : '#d9b978',
      locked: Boolean(item.locked)
    };
    if (type === 'table') {
      out.capacity = 10;
      out.seats = Array.isArray(item.seats) ? item.seats.slice(0, 10).map((id) => id ? safeText(id) : null) : Array(10).fill(null);
      while (out.seats.length < 10) out.seats.push(null);
    }
    if (type === 'tent') {
      out.fillColor = /^#[0-9a-f]{6}$/i.test(item.fillColor || '') ? item.fillColor : out.color;
      out.outlineColor = /^#[0-9a-f]{6}$/i.test(item.outlineColor || '') ? item.outlineColor : '#555555';
      out.transparency = bounded(item.transparency, 0, 90, 45);
      const points = Array.isArray(item.pointsM) ? item.pointsM : [];
      out.pointsM = points.slice(0, 80).map((point) => ({ x: bounded(point?.x, -50, 50, 0), y: bounded(point?.y, -50, 50, 0) }));
    }
    return out;
  }

  function sanitizeState(input) {
    const raw = input && typeof input === 'object' ? input : {};
    const safeElements = Array.isArray(raw.elements) ? raw.elements.map(sanitizeElement).filter(Boolean).slice(0, 300) : [];
    const safeGuests = Array.isArray(raw.guests) ? raw.guests.slice(0, 1000).map((guest, index) => ({
      id: safeText(guest?.id || `guest-import-${index + 1}`),
      name: safeText(guest?.name || `Invitado ${index + 1}`)
    })) : [];
    const guestIds = new Set(safeGuests.map((guest) => guest.id));
    safeElements.filter((item) => item.type === 'table').forEach((table) => {
      table.seats = table.seats.map((id) => id && guestIds.has(id) ? id : null);
    });
    const ids = new Set(safeElements.map((item) => item.id));
    const selectedIdsSafe = Array.isArray(raw.selectedIds) ? raw.selectedIds.map(String).filter((id) => ids.has(id)).slice(0, 60) : [];
    const selectedIdSafe = ids.has(String(raw.selectedId || '')) ? String(raw.selectedId) : (selectedIdsSafe[0] || '');
    const safeMeasures = Array.isArray(raw.measurements) ? raw.measurements.slice(0, 200).map((measure, index) => {
      if (Number.isFinite(Number(measure?.x1))) {
        return { id: finite(measure.id, index + 1), x1: bounded(measure.x1, 0, CANVAS_W, 0), y1: bounded(measure.y1, 0, CANVAS_H, 0), x2: bounded(measure.x2, 0, CANVAS_W, 0), y2: bounded(measure.y2, 0, CANVAS_H, 0) };
      }
      return { id: finite(measure?.id, index + 1), a: sanitizePoint(measure?.a), b: sanitizePoint(measure?.b) };
    }) : [];
    const hidden = {};
    const locked = {};
    Object.keys(raw.hiddenLayers || {}).forEach((key) => { if (ALLOWED_TYPES.has(key)) hidden[key] = Boolean(raw.hiddenLayers[key]); });
    Object.keys(raw.lockedLayers || {}).forEach((key) => { if (ALLOWED_TYPES.has(key)) locked[key] = Boolean(raw.lockedLayers[key]); });
    return {
      elements: safeElements,
      guests: safeGuests,
      guestUid: Math.max(1, Math.floor(finite(raw.guestUid, safeGuests.length + 1))),
      selectedIds: selectedIdsSafe,
      selectedId: selectedIdSafe,
      scale: bounded(raw.scale, 18, 50, 32),
      hiddenLayers: hidden,
      lockedLayers: locked,
      measurements: safeMeasures,
      measurementUid: Math.max(1, Math.floor(finite(raw.measurementUid, safeMeasures.length + 1))),
      bgVisible: raw.bgVisible !== false,
      settings: {
        grid: raw.settings?.grid !== false,
        clearance: raw.settings?.clearance !== false,
        labels: raw.settings?.labels !== false,
        names: raw.settings?.names !== false
      }
    };
  }

  function sessionPayload() {
    saveCurrentProposalSnapshot();
    return {
      kind: 'mi-gran-dia-distribucion-lab-session',
      version: SESSION_VERSION,
      exportedAt: nowIso(),
      currentProposalId,
      proposals: proposals.slice(0, MAX_PROPOSALS).map((proposal) => ({
        id: safeText(proposal.id),
        name: safeText(proposal.name || 'Propuesta'),
        updatedAt: proposal.updatedAt || nowIso(),
        state: sanitizeState(proposal.state)
      }))
    };
  }

  function exportSessionJson() {
    const payload = sessionPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `distribucion-lab-${new Date().toISOString().slice(0,10)}.json`);
    toast('Sesión JSON exportada.');
  }

  async function importSessionJson(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('El JSON supera el límite de 5 MB.', true);
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.kind !== 'mi-gran-dia-distribucion-lab-session' || Number(parsed?.version) !== SESSION_VERSION) {
        throw new Error('Formato o versión no compatible.');
      }
      if (!Array.isArray(parsed.proposals) || !parsed.proposals.length) throw new Error('El archivo no contiene propuestas.');
      const imported = parsed.proposals.slice(0, MAX_PROPOSALS).map((proposal, index) => ({
        id: safeText(proposal?.id || `proposal-import-${index + 1}`),
        name: safeText(proposal?.name || `Propuesta ${index + 1}`),
        updatedAt: proposal?.updatedAt || nowIso(),
        state: sanitizeState(proposal?.state)
      }));
      const ids = new Set();
      imported.forEach((proposal, index) => {
        if (!proposal.id || ids.has(proposal.id)) proposal.id = `proposal-import-${Date.now()}-${index + 1}`;
        ids.add(proposal.id);
      });
      proposals = imported;
      const requested = safeText(parsed.currentProposalId || '');
      currentProposalId = ids.has(requested) ? requested : proposals[0].id;
      const active = proposals.find((proposal) => proposal.id === currentProposalId) || proposals[0];
      proposalNameTop.textContent = active.name;
      proposalNameCanvas.textContent = `${active.name} · laboratorio`;
      historyPast = [];
      historyFuture = [];
      restoreState(clone(active.state));
      pushHistory();
      renderProposalList();
      saveCurrentProposalSnapshot();
      toast(`Sesión importada: ${proposals.length} propuesta(s).`);
    } catch (error) {
      toast(error?.message || 'No se pudo importar el JSON.', true);
    }
  }

  function stripEditingUi(svg) {
    svg.querySelectorAll('.rotate-ui,.rotate-handle,.rotate-stem,.vertex-handle,.tent-vertex').forEach((node) => node.remove());
    svg.querySelector('#guideLayer')?.replaceChildren();
    svg.querySelector('#drawLayer')?.replaceChildren();
    svg.querySelectorAll('.item-selected,.table-selected').forEach((node) => node.classList.remove('item-selected','table-selected'));
    svg.querySelectorAll('[data-rotate-id],[data-vertex-index]').forEach((node) => {
      node.removeAttribute('data-rotate-id');
      node.removeAttribute('data-vertex-index');
    });
    svg.setAttribute('viewBox', `0 0 ${CANVAS_W} ${CANVAS_H}`);
    svg.setAttribute('width', String(CANVAS_W));
    svg.setAttribute('height', String(CANVAS_H));
    svg.style.width = '';
    svg.style.height = '';
    return svg;
  }

  function copyComputedSvgStyles(source, target) {
    const originalNodes = [source, ...source.querySelectorAll('*')];
    const clonedNodes = [target, ...target.querySelectorAll('*')];
    const props = ['fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray','opacity','font-family','font-size','font-style','font-weight','text-anchor','paint-order','visibility','display'];
    originalNodes.forEach((node, index) => {
      const cloneNode = clonedNodes[index];
      if (!cloneNode || !(node instanceof SVGElement)) return;
      const style = getComputedStyle(node);
      props.forEach((prop) => {
        const value = style.getPropertyValue(prop);
        if (value) cloneNode.style.setProperty(prop, value);
      });
    });
  }

  function finalSvgClone({ inlineStyles = false } = {}) {
    render();
    const cloned = planner.cloneNode(true);
    if (inlineStyles) copyComputedSvgStyles(planner, cloned);
    stripEditingUi(cloned);
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return cloned;
  }

  async function exportPng() {
    try {
      const svg = finalSvgClone({ inlineStyles: true });
      const xml = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const image = new Image();
      const loaded = new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('No se pudo rasterizar el plano.'));
      });
      image.src = url;
      await loaded;
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, CANVAS_W, CANVAS_H);
      context.drawImage(image, 0, 0, CANVAS_W, CANVAS_H);
      URL.revokeObjectURL(url);
      const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1));
      if (!pngBlob) throw new Error('No se pudo crear el PNG.');
      const name = (proposals.find((proposal) => proposal.id === currentProposalId)?.name || 'propuesta').toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '-').replace(/^-|-$/g, '');
      downloadBlob(pngBlob, `distribucion-${name || 'propuesta'}.png`);
      toast('PNG 1448 × 1086 exportado.');
    } catch (error) {
      toast(error?.message || 'No se pudo exportar el PNG.', true);
    }
  }

  function ensureFinalOverlay() {
    let overlay = byId('p2FinalOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'p2FinalOverlay';
    overlay.className = 'p2-final-overlay';
    overlay.hidden = true;
    overlay.innerHTML = '<header class="p2-final-head"><div><strong id="p2FinalTitle">Vista final</strong><small>Presentación limpia de la propuesta actual</small></div><div class="p2-final-actions"><button id="p2FinalPng" class="primary" type="button">Exportar PNG</button><button id="p2FinalClose" type="button">Cerrar</button></div></header><div class="p2-final-stage" id="p2FinalStage"></div>';
    document.body.appendChild(overlay);
    byId('p2FinalPng').addEventListener('click', exportPng);
    byId('p2FinalClose').addEventListener('click', closeFinalView);
    return overlay;
  }

  function openFinalView() {
    cancelModes?.();
    const overlay = ensureFinalOverlay();
    const stage = byId('p2FinalStage');
    stage.replaceChildren(finalSvgClone());
    const active = proposals.find((proposal) => proposal.id === currentProposalId);
    byId('p2FinalTitle').textContent = active?.name || 'Vista final';
    overlay.hidden = false;
    document.body.classList.add('p2-final-open');
  }

  function closeFinalView() {
    const overlay = byId('p2FinalOverlay');
    if (overlay) overlay.hidden = true;
    document.body.classList.remove('p2-final-open');
  }

  function buildDesktopActions() {
    const host = document.querySelector('.top-actions');
    if (!host || byId('p2ActionStrip')) return;
    const strip = document.createElement('div');
    strip.id = 'p2ActionStrip';
    strip.className = 'p2-action-strip';
    const jsonButton = document.createElement('button');
    jsonButton.type = 'button';
    jsonButton.textContent = '↓ JSON';
    jsonButton.title = 'Exportar sesión JSON';
    jsonButton.addEventListener('click', exportSessionJson);
    const pngButton = document.createElement('button');
    pngButton.type = 'button';
    pngButton.textContent = '↓ PNG';
    pngButton.title = 'Exportar plano PNG';
    pngButton.addEventListener('click', exportPng);
    const importLabel = document.createElement('label');
    importLabel.textContent = '↑ JSON';
    importLabel.title = 'Importar sesión JSON';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'application/json,.json';
    file.addEventListener('change', async () => {
      const selectedFile = file.files?.[0];
      file.value = '';
      await importSessionJson(selectedFile);
    });
    importLabel.appendChild(file);
    strip.append(jsonButton, pngButton, importLabel);
    host.insertBefore(strip, byId('resetLab'));
  }

  function closeMobilePanels() {
    document.querySelector('.tools-panel')?.classList.remove('p2-sheet-open');
    document.querySelector('.properties-panel')?.classList.remove('p2-sheet-open');
    byId('p2MobileActions')?.classList.remove('show');
    byId('p2MobileBackdrop')?.classList.remove('show');
  }

  function openPanel(selector) {
    closeMobilePanels();
    document.querySelector(selector)?.classList.add('p2-sheet-open');
    byId('p2MobileBackdrop')?.classList.add('show');
  }

  function buildMobileUi() {
    if (byId('p2MobileFab')) return;
    const backdrop = document.createElement('div');
    backdrop.id = 'p2MobileBackdrop';
    backdrop.className = 'p2-mobile-backdrop';
    backdrop.addEventListener('click', closeMobilePanels);
    const actions = document.createElement('div');
    actions.id = 'p2MobileActions';
    actions.className = 'p2-mobile-sheet';
    actions.setAttribute('aria-label', 'Acciones de distribución');
    const makeButton = (text, handler, className = '') => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = text;
      if (className) button.className = className;
      button.addEventListener('click', () => { handler(); if (!['Herramientas','Propiedades'].includes(text)) closeMobilePanels(); });
      return button;
    };
    actions.append(
      makeButton('Herramientas', () => openPanel('.tools-panel')),
      makeButton('Propiedades', () => openPanel('.properties-panel')),
      makeButton('Propuestas', () => { renderProposalList(); proposalModal.hidden = false; }),
      makeButton('Vista final', openFinalView),
      makeButton('Exportar PNG', exportPng),
      makeButton('Exportar JSON', exportSessionJson)
    );
    const importLabel = document.createElement('label');
    importLabel.textContent = 'Importar JSON';
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      closeMobilePanels();
      await importSessionJson(file);
    });
    importLabel.appendChild(input);
    actions.append(importLabel, makeButton('Cerrar', closeMobilePanels, 'primary'));
    const fab = document.createElement('button');
    fab.id = 'p2MobileFab';
    fab.className = 'p2-mobile-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Abrir acciones');
    fab.textContent = '+';
    fab.addEventListener('click', () => {
      const show = !actions.classList.contains('show');
      closeMobilePanels();
      actions.classList.toggle('show', show);
      backdrop.classList.toggle('show', show);
      fab.textContent = show ? '×' : '+';
    });
    document.body.append(backdrop, actions, fab);
  }

  function touchDistance() {
    const points = [...touchPoints.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  }

  function onTouchPointerDown(event) {
    if (event.pointerType !== 'touch') return;
    touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touchPoints.size === 2) {
      event.preventDefault();
      pinchStartDistance = touchDistance() || 1;
      pinchStartZoom = zoom;
      if (typeof p1Drag !== 'undefined') p1Drag = null;
      if (typeof drag !== 'undefined') drag = null;
      if (typeof spatialDrag !== 'undefined') spatialDrag = null;
    }
  }

  function onTouchPointerMove(event) {
    if (event.pointerType !== 'touch' || !touchPoints.has(event.pointerId)) return;
    touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touchPoints.size >= 2) {
      event.preventDefault();
      const distance = touchDistance();
      if (!pinchStartDistance || !distance) return;
      setZoom(pinchStartZoom * distance / pinchStartDistance);
    }
  }

  function onTouchPointerEnd(event) {
    if (event.pointerType !== 'touch') return;
    touchPoints.delete(event.pointerId);
    if (touchPoints.size < 2) {
      pinchStartDistance = 0;
      pinchStartZoom = zoom;
    }
  }

  function installTouchZoom() {
    const wrap = byId('canvasWrap');
    if (!wrap || wrap.dataset.p2TouchZoom === 'ready') return;
    wrap.dataset.p2TouchZoom = 'ready';
    wrap.addEventListener('pointerdown', onTouchPointerDown, { capture: true, passive: false });
    wrap.addEventListener('pointermove', onTouchPointerMove, { capture: true, passive: false });
    wrap.addEventListener('pointerup', onTouchPointerEnd, { capture: true, passive: false });
    wrap.addEventListener('pointercancel', onTouchPointerEnd, { capture: true, passive: false });

    // Rueda del mouse = zoom del lienzo completo. No modifica ninguna medida
    // física: únicamente cambia la escala visual de planner.
    wrap.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaY) < 1) return;
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.10 : 0.90;
      setZoom(zoom * factor);
    }, { passive:false });
  }

  function overridePresentationButton() {
    const button = byId('btnPresentation');
    if (!button) return;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openFinalView();
    }, true);
  }

  buildDesktopActions();
  buildMobileUi();
  installTouchZoom();
  overridePresentationButton();

  window.MiGranDiaDistributionPhase2P2 = Object.freeze({
    sessionVersion: SESSION_VERSION,
    jsonSession: true,
    png: { width: CANVAS_W, height: CANVAS_H },
    finalView: true,
    mobile: { sheets: true, fab: true, pinchZoom: true, wheelZoom: true },
    memoryOnly: true,
    status: 'ready'
  });
})();
