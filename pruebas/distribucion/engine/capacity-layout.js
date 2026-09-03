(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const supported = root.seats?.SUPPORTED_CAPACITIES || Object.freeze([4,6,8,10,12,14,16]);

  function assertCapacity(capacity) {
    const value = Number(capacity);
    if (!supported.includes(value)) throw new Error(`Capacidad no soportada: ${capacity}`);
    return value;
  }

  function roundPositions(capacity, radiusPx) {
    const total = assertCapacity(capacity);
    return Object.freeze(Array.from({ length: total }, (_, index) => {
      const angle = Math.PI * 2 * index / total - Math.PI / 2;
      return Object.freeze({ x: Math.cos(angle) * radiusPx, y: Math.sin(angle) * radiusPx, angle, side: 'round' });
    }));
  }

  function balancedSideCounts(capacity, rectangular = false) {
    const total = assertCapacity(capacity);
    if (rectangular) {
      if (total === 10) return Object.freeze([4,1,4,1]);
      const shortEach = total <= 6 ? 1 : Math.max(1, Math.floor(total / 8));
      const remaining = total - shortEach * 2;
      const top = Math.ceil(remaining / 2);
      return Object.freeze([top, shortEach, remaining - top, shortEach]);
    }
    if (total === 10) return Object.freeze([2,3,2,3]);
    const base = Math.floor(total / 4);
    const remainder = total % 4;
    return Object.freeze(Array.from({ length: 4 }, (_, i) => base + (i < remainder ? 1 : 0)));
  }

  function sidePoints(count, side, halfW, halfH, offsetPx) {
    if (!count) return [];
    const points = [];
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / (count + 1);
      if (side === 'top') points.push({ x: -halfW + t * halfW * 2, y: -(halfH + offsetPx), side });
      if (side === 'right') points.push({ x: halfW + offsetPx, y: -halfH + t * halfH * 2, side });
      if (side === 'bottom') points.push({ x: halfW - t * halfW * 2, y: halfH + offsetPx, side });
      if (side === 'left') points.push({ x: -(halfW + offsetPx), y: halfH - t * halfH * 2, side });
    }
    return points;
  }

  function rectPositions(capacity, widthPx, heightPx, offsetPx, rectangular = false) {
    const [top,right,bottom,left] = balancedSideCounts(capacity, rectangular);
    const halfW = widthPx / 2;
    const halfH = heightPx / 2;
    return Object.freeze([
      ...sidePoints(top,'top',halfW,halfH,offsetPx),
      ...sidePoints(right,'right',halfW,halfH,offsetPx),
      ...sidePoints(bottom,'bottom',halfW,halfH,offsetPx),
      ...sidePoints(left,'left',halfW,halfH,offsetPx)
    ].map(Object.freeze));
  }

  function labelFromSeat(seat, extraPx) {
    if (seat.side === 'round') return Object.freeze({ x: seat.x * 1.64, y: seat.y * 1.64, anchor: Math.cos(seat.angle) > .28 ? 'start' : Math.cos(seat.angle) < -.28 ? 'end' : 'middle' });
    if (seat.side === 'top') return Object.freeze({ x: seat.x, y: seat.y - extraPx, anchor: 'middle' });
    if (seat.side === 'bottom') return Object.freeze({ x: seat.x, y: seat.y + extraPx, anchor: 'middle' });
    if (seat.side === 'right') return Object.freeze({ x: seat.x + extraPx, y: seat.y, anchor: 'start' });
    return Object.freeze({ x: seat.x - extraPx, y: seat.y, anchor: 'end' });
  }

  root.capacityLayout = Object.freeze({ assertCapacity, roundPositions, balancedSideCounts, rectPositions, labelFromSeat });
})();