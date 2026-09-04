(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const geometry = root.geometry;
  if (!geometry) throw new Error('geometry.js debe cargarse antes de collisions.js');

  const LEGACY_SCALE = 32;
  const TOLERANCES_M = Object.freeze({ sat: 3 / LEGACY_SCALE, circle: 5 / LEGACY_SCALE, circlePolygon: 3 / LEGACY_SCALE });

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

  function satIntersects(a, b, scale) {
    const tolerance = geometry.metersToPx(TOLERANCES_M.sat, scale);
    for (const axis of [...axes(a), ...axes(b)]) {
      const A = project(a, axis);
      const B = project(b, axis);
      if (A.max <= B.min + tolerance || B.max <= A.min + tolerance) return false;
    }
    return true;
  }

  function circleCircleIntersects(a, b, scale) {
    const tolerance = geometry.metersToPx(TOLERANCES_M.circle, scale);
    return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - tolerance;
  }

  function circlePolygonIntersects(circle, poly, scale, pointInPolygon, pointSegmentDistance) {
    if (pointInPolygon(circle, poly)) return true;
    const tolerance = geometry.metersToPx(TOLERANCES_M.circlePolygon, scale);
    for (let index = 0; index < poly.length; index++) {
      if (pointSegmentDistance(circle, poly[index], poly[(index + 1) % poly.length]) < circle.r - tolerance) return true;
    }
    return false;
  }

  root.collisions = Object.freeze({ TOLERANCES_M, axes, project, satIntersects, circleCircleIntersects, circlePolygonIntersects });
})();