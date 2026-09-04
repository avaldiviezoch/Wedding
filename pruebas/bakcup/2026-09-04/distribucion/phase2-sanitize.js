(() => {
  if (document.documentElement.dataset.phase2Sanitize === 'ready') return;
  document.documentElement.dataset.phase2Sanitize = 'ready';

  const engine = window.MiGranDiaDistributionEngine;
  if (!engine?.geometry || !engine?.collisions || !engine?.clearance) {
    throw new Error('El engine modular de Distribución no está disponible.');
  }

  const { geometry, collisions, clearance } = engine;
  const { CANVAS_W, CANVAS_H, metersToPx, itemHalfExtents, clampItemToCanvas } = geometry;
  const { TOLERANCES_M, satIntersects, circleCircleIntersects, circlePolygonIntersects } = collisions;
  const { HIDDEN_LAYER_POLICY } = clearance;

  polygonIntersectsPolygon = function modularPolygonIntersectsPolygon(a, b) {
    return satIntersects(a, b, currentScale());
  };

  intersects = function modularIntersects(a, b) {
    const aCircle = a.shape === 'table' || a.shape === 'circle';
    const bCircle = b.shape === 'table' || b.shape === 'circle';
    const scale = currentScale();
    if (aCircle && bCircle) return circleCircleIntersects(circleGeom(a), circleGeom(b), scale);
    if (!aCircle && !bCircle) return satIntersects(rectPolygon(a), rectPolygon(b), scale);
    const circle = aCircle ? circleGeom(a) : circleGeom(b);
    const poly = aCircle ? rectPolygon(b) : rectPolygon(a);
    return circlePolygonIntersects(circle, poly, scale, pointInPolygon, pointSegmentDistance);
  };

  function clampAllToCanvas() {
    let changed = false;
    elements.forEach((item) => {
      if (clampItemToCanvas(item, currentScale(), CANVAS_W, CANVAS_H)) changed = true;
    });
    return changed;
  }

  const originalCommitMutation = commitMutation;
  commitMutation = function modularCommitMutation() {
    clampAllToCanvas();
    originalCommitMutation();
  };

  const originalRestoreState = restoreState;
  restoreState = function modularRestoreState(state) {
    originalRestoreState(state);
    const validIds = new Set(elements.map((item) => item.id));
    selectedIds = selectedIds.filter((id) => validIds.has(id) && !hiddenLayers[getItem(id)?.type]);
    selectedId = selectedIds.includes(selectedId) ? selectedId : (selectedIds[0] || '');
    measureDraft = null;
    drawingTent = false;
    tentDraft = [];
    tentHoverPoint = null;
    guideLines = { vertical: null, horizontal: null };
    drawLayer?.replaceChildren();
    guideLayer?.replaceChildren();
    if (clampAllToCanvas()) render();
  };

  planner.addEventListener('pointermove', () => {
    if (clampAllToCanvas()) render();
  });

  const canvasWrap = document.getElementById('canvasWrap');
  const touchFocus = new Map();
  let pinchViewport = null;

  function touchMidpoint() {
    const points = [...touchFocus.values()];
    if (points.length < 2) return null;
    return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
  }

  function beginFocusedPinch() {
    if (!canvasWrap || touchFocus.size !== 2) return;
    const midpoint = touchMidpoint();
    const rect = canvasWrap.getBoundingClientRect();
    pinchViewport = {
      localX: midpoint.x - rect.left,
      localY: midpoint.y - rect.top,
      contentX: (canvasWrap.scrollLeft + midpoint.x - rect.left) / (Number(zoom) || 1),
      contentY: (canvasWrap.scrollTop + midpoint.y - rect.top) / (Number(zoom) || 1)
    };
  }

  function keepPinchFocus() {
    if (!canvasWrap || !pinchViewport || touchFocus.size < 2) return;
    requestAnimationFrame(() => {
      const nextZoom = Number(zoom) || 1;
      canvasWrap.scrollLeft = Math.max(0, pinchViewport.contentX * nextZoom - pinchViewport.localX);
      canvasWrap.scrollTop = Math.max(0, pinchViewport.contentY * nextZoom - pinchViewport.localY);
    });
  }

  if (canvasWrap) {
    canvasWrap.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch') return;
      touchFocus.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touchFocus.size === 2) beginFocusedPinch();
    }, { capture: true, passive: false });
    canvasWrap.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'touch' || !touchFocus.has(event.pointerId)) return;
      touchFocus.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touchFocus.size >= 2) keepPinchFocus();
    }, { capture: true, passive: false });
    const endTouch = (event) => {
      if (event.pointerType !== 'touch') return;
      touchFocus.delete(event.pointerId);
      if (touchFocus.size < 2) pinchViewport = null;
    };
    canvasWrap.addEventListener('pointerup', endTouch, { capture: true, passive: false });
    canvasWrap.addEventListener('pointercancel', endTouch, { capture: true, passive: false });
  }

  window.MiGranDiaDistributionSanitization = Object.freeze({
    status: 'ready',
    engineModular: true,
    tolerancesMeters: TOLERANCES_M,
    hiddenLayerPolicy: HIDDEN_LAYER_POLICY,
    metersToPx,
    satIntersects,
    circlePolygonIntersects: (circle, poly, scale) => circlePolygonIntersects(circle, poly, scale, pointInPolygon, pointSegmentDistance),
    itemHalfExtents,
    clampItemToCanvas,
    clampAllToCanvas,
    touchFocusPreserved: true,
    historyTransientsClearedOnRestore: true
  });
})();