(() => {
  if (document.documentElement.dataset.phase2Sanitize === 'ready') return;
  document.documentElement.dataset.phase2Sanitize = 'ready';

  const CANVAS_W = 1448;
  const CANVAS_H = 1086;
  const LEGACY_SCALE = 32;
  const SAT_TOLERANCE_M = 3 / LEGACY_SCALE;
  const CIRCLE_TOLERANCE_M = 5 / LEGACY_SCALE;
  const CIRCLE_POLY_TOLERANCE_M = 3 / LEGACY_SCALE;
  const HIDDEN_LAYER_POLICY = Object.freeze({
    visualOnly: true,
    keepsCapacity: true,
    keepsAssignments: true,
    participatesInConflicts: false,
    participatesInProximity: false
  });

  const metersToPx = (meters, scale = currentScale()) => Math.max(0, Number(meters) || 0) * scale;
  const satTolerancePx = (scale = currentScale()) => metersToPx(SAT_TOLERANCE_M, scale);
  const circleTolerancePx = (scale = currentScale()) => metersToPx(CIRCLE_TOLERANCE_M, scale);
  const circlePolyTolerancePx = (scale = currentScale()) => metersToPx(CIRCLE_POLY_TOLERANCE_M, scale);

  function axes(poly) {
    return poly.map((point, index) => {
      const next = poly[(index + 1) % poly.length];
      const edgeX = next.x - point.x;
      const edgeY = next.y - point.y;
      const length = Math.hypot(edgeX, edgeY) || 1;
      return { x: -edgeY / length, y: edgeX / length };
    });
  }

  function project(poly, axis) {
    const values = poly.map((point) => point.x * axis.x + point.y * axis.y);
    return { min: Math.min(...values), max: Math.max(...values) };
  }

  function satIntersects(a, b, scale = currentScale()) {
    const tolerance = satTolerancePx(scale);
    for (const axis of [...axes(a), ...axes(b)]) {
      const A = project(a, axis);
      const B = project(b, axis);
      if (A.max <= B.min + tolerance || B.max <= A.min + tolerance) return false;
    }
    return true;
  }

  function circlePolygonIntersects(circle, poly, scale = currentScale()) {
    if (pointInPolygon(circle, poly)) return true;
    const tolerance = circlePolyTolerancePx(scale);
    for (let index = 0; index < poly.length; index++) {
      if (pointSegmentDistance(circle, poly[index], poly[(index + 1) % poly.length]) < circle.r - tolerance) return true;
    }
    return false;
  }

  polygonIntersectsPolygon = function sanitizedPolygonIntersectsPolygon(a, b) {
    return satIntersects(a, b, currentScale());
  };

  intersects = function sanitizedIntersects(a, b) {
    const aCircle = a.shape === 'table' || a.shape === 'circle';
    const bCircle = b.shape === 'table' || b.shape === 'circle';
    const scale = currentScale();
    if (aCircle && bCircle) {
      const A = circleGeom(a);
      const B = circleGeom(b);
      return Math.hypot(A.x - B.x, A.y - B.y) < A.r + B.r - circleTolerancePx(scale);
    }
    if (!aCircle && !bCircle) return satIntersects(rectPolygon(a), rectPolygon(b), scale);
    const circle = aCircle ? circleGeom(a) : circleGeom(b);
    const poly = aCircle ? rectPolygon(b) : rectPolygon(a);
    return circlePolygonIntersects(circle, poly, scale);
  };

  function rotatedRectHalfExtents(item, scale = currentScale()) {
    const halfW = Math.max(0.1, Number(item.widthM) || 0.1) * scale / 2;
    const halfH = Math.max(0.1, Number(item.heightM) || 0.1) * scale / 2;
    const angle = (Number(item.rotation) || 0) * Math.PI / 180;
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    return { x: cos * halfW + sin * halfH, y: sin * halfW + cos * halfH };
  }

  function tentHalfExtents(item, scale = currentScale()) {
    const points = Array.isArray(item.pointsM) ? item.pointsM : [];
    if (!points.length) return rotatedRectHalfExtents(item, scale);
    const angle = (Number(item.rotation) || 0) * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    points.forEach((point) => {
      const px = (Number(point.x) || 0) * scale;
      const py = (Number(point.y) || 0) * scale;
      const x = px * cos - py * sin;
      const y = px * sin + py * cos;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    });
    return { x: Math.max(Math.abs(minX), Math.abs(maxX)), y: Math.max(Math.abs(minY), Math.abs(maxY)) };
  }

  function itemHalfExtents(item, scale = currentScale()) {
    if (item.type === 'tent') return tentHalfExtents(item, scale);
    if (item.shape === 'table' || item.shape === 'circle') {
      const radius = Math.max(0.1, Number(item.widthM) || 0.1) * scale / 2;
      return { x: radius, y: radius };
    }
    return rotatedRectHalfExtents(item, scale);
  }

  function clampItemToCanvas(item, scale = currentScale()) {
    if (!item) return false;
    const half = itemHalfExtents(item, scale);
    const minX = Math.min(CANVAS_W / 2, half.x);
    const minY = Math.min(CANVAS_H / 2, half.y);
    const maxX = Math.max(CANVAS_W / 2, CANVAS_W - half.x);
    const maxY = Math.max(CANVAS_H / 2, CANVAS_H - half.y);
    const nextX = Math.max(minX, Math.min(maxX, Number(item.x) || 0));
    const nextY = Math.max(minY, Math.min(maxY, Number(item.y) || 0));
    const changed = nextX !== item.x || nextY !== item.y;
    item.x = nextX;
    item.y = nextY;
    return changed;
  }

  function clampAllToCanvas() {
    let changed = false;
    elements.forEach((item) => { if (clampItemToCanvas(item)) changed = true; });
    return changed;
  }

  const originalCommitMutation = commitMutation;
  commitMutation = function sanitizedCommitMutation() {
    clampAllToCanvas();
    originalCommitMutation();
  };

  const originalRestoreState = restoreState;
  restoreState = function sanitizedRestoreState(state) {
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
      zoom: Number(zoom) || 1,
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
    tolerancesMeters: {
      sat: SAT_TOLERANCE_M,
      circle: CIRCLE_TOLERANCE_M,
      circlePolygon: CIRCLE_POLY_TOLERANCE_M
    },
    hiddenLayerPolicy: HIDDEN_LAYER_POLICY,
    metersToPx,
    satIntersects,
    circlePolygonIntersects,
    itemHalfExtents,
    clampItemToCanvas,
    clampAllToCanvas,
    touchFocusPreserved: true,
    historyTransientsClearedOnRestore: true
  });
})();
