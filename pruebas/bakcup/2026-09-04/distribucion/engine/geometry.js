(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const CANVAS_W = 1448;
  const CANVAS_H = 1086;

  const metersToPx = (meters, scale) => Math.max(0, Number(meters) || 0) * Math.max(0, Number(scale) || 0);
  const pxToMeters = (pixels, scale) => (Number(pixels) || 0) / Math.max(1e-9, Number(scale) || 0);
  const degToRad = (degrees) => (Number(degrees) || 0) * Math.PI / 180;

  function rotatePoint(point, degrees) {
    const angle = degToRad(degrees);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = Number(point?.x) || 0;
    const y = Number(point?.y) || 0;
    return { x: x * cos - y * sin, y: x * sin + y * cos };
  }

  function rotatedRectHalfExtents(item, scale) {
    const halfW = Math.max(0.1, Number(item?.widthM) || 0.1) * scale / 2;
    const halfH = Math.max(0.1, Number(item?.heightM) || 0.1) * scale / 2;
    const angle = degToRad(item?.rotation);
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    return { x: cos * halfW + sin * halfH, y: sin * halfW + cos * halfH };
  }

  function tentHalfExtents(item, scale) {
    const points = Array.isArray(item?.pointsM) ? item.pointsM : [];
    if (!points.length) return rotatedRectHalfExtents(item, scale);
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    points.forEach((point) => {
      const rotated = rotatePoint({ x: (Number(point.x) || 0) * scale, y: (Number(point.y) || 0) * scale }, item.rotation);
      minX = Math.min(minX, rotated.x); maxX = Math.max(maxX, rotated.x);
      minY = Math.min(minY, rotated.y); maxY = Math.max(maxY, rotated.y);
    });
    return { x: Math.max(Math.abs(minX), Math.abs(maxX)), y: Math.max(Math.abs(minY), Math.abs(maxY)) };
  }

  function itemHalfExtents(item, scale) {
    if (item?.type === 'tent') return tentHalfExtents(item, scale);
    if (item?.shape === 'table' || item?.shape === 'circle') {
      const radius = Math.max(0.1, Number(item?.widthM) || 0.1) * scale / 2;
      return { x: radius, y: radius };
    }
    return rotatedRectHalfExtents(item, scale);
  }

  function clampItemToCanvas(item, scale, width = CANVAS_W, height = CANVAS_H) {
    if (!item) return false;
    const half = itemHalfExtents(item, scale);
    const minX = Math.min(width / 2, half.x);
    const minY = Math.min(height / 2, half.y);
    const maxX = Math.max(width / 2, width - half.x);
    const maxY = Math.max(height / 2, height - half.y);
    const nextX = Math.max(minX, Math.min(maxX, Number(item.x) || 0));
    const nextY = Math.max(minY, Math.min(maxY, Number(item.y) || 0));
    const changed = nextX !== item.x || nextY !== item.y;
    item.x = nextX;
    item.y = nextY;
    return changed;
  }

  root.geometry = Object.freeze({ CANVAS_W, CANVAS_H, metersToPx, pxToMeters, degToRad, rotatePoint, rotatedRectHalfExtents, tentHalfExtents, itemHalfExtents, clampItemToCanvas });
})();