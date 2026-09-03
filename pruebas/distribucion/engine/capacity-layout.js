(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const supported = root.seats?.SUPPORTED_CAPACITIES || Object.freeze([4,6,8,10,12,14,16]);

  const ROUND_VARIANTS = Object.freeze({
    default:Object.freeze({ id:'default', label:'Radial · silla arriba', phase:'north' }),
    offset:Object.freeze({ id:'offset', label:'Radial · giro medio paso', phase:'half-step' })
  });

  const SQUARE_MATRIX = Object.freeze({
    4:Object.freeze([Object.freeze({id:'balanced',label:'1 · 1 · 1 · 1',counts:Object.freeze([1,1,1,1])})]),
    6:Object.freeze([
      Object.freeze({id:'horizontal',label:'2 · 1 · 2 · 1',counts:Object.freeze([2,1,2,1])}),
      Object.freeze({id:'vertical',label:'1 · 2 · 1 · 2',counts:Object.freeze([1,2,1,2])})
    ]),
    8:Object.freeze([Object.freeze({id:'balanced',label:'2 · 2 · 2 · 2',counts:Object.freeze([2,2,2,2])})]),
    10:Object.freeze([
      Object.freeze({id:'legacy',label:'2 · 3 · 2 · 3',counts:Object.freeze([2,3,2,3])}),
      Object.freeze({id:'rotated',label:'3 · 2 · 3 · 2',counts:Object.freeze([3,2,3,2])})
    ]),
    12:Object.freeze([Object.freeze({id:'balanced',label:'3 · 3 · 3 · 3',counts:Object.freeze([3,3,3,3])})]),
    14:Object.freeze([
      Object.freeze({id:'horizontal',label:'4 · 3 · 4 · 3',counts:Object.freeze([4,3,4,3])}),
      Object.freeze({id:'vertical',label:'3 · 4 · 3 · 4',counts:Object.freeze([3,4,3,4])})
    ]),
    16:Object.freeze([Object.freeze({id:'balanced',label:'4 · 4 · 4 · 4',counts:Object.freeze([4,4,4,4])})])
  });

  const RECTANGULAR_MATRIX = Object.freeze({
    4:Object.freeze([
      Object.freeze({id:'long-sides',label:'2 · 0 · 2 · 0',counts:Object.freeze([2,0,2,0])}),
      Object.freeze({id:'all-sides',label:'1 · 1 · 1 · 1',counts:Object.freeze([1,1,1,1])})
    ]),
    6:Object.freeze([
      Object.freeze({id:'ends',label:'2 · 1 · 2 · 1',counts:Object.freeze([2,1,2,1])}),
      Object.freeze({id:'long-sides',label:'3 · 0 · 3 · 0',counts:Object.freeze([3,0,3,0])})
    ]),
    8:Object.freeze([
      Object.freeze({id:'ends',label:'3 · 1 · 3 · 1',counts:Object.freeze([3,1,3,1])}),
      Object.freeze({id:'long-sides',label:'4 · 0 · 4 · 0',counts:Object.freeze([4,0,4,0])})
    ]),
    10:Object.freeze([
      Object.freeze({id:'legacy',label:'4 · 1 · 4 · 1',counts:Object.freeze([4,1,4,1])}),
      Object.freeze({id:'long-sides',label:'5 · 0 · 5 · 0',counts:Object.freeze([5,0,5,0])})
    ]),
    12:Object.freeze([
      Object.freeze({id:'ends',label:'5 · 1 · 5 · 1',counts:Object.freeze([5,1,5,1])}),
      Object.freeze({id:'double-ends',label:'4 · 2 · 4 · 2',counts:Object.freeze([4,2,4,2])}),
      Object.freeze({id:'long-sides',label:'6 · 0 · 6 · 0',counts:Object.freeze([6,0,6,0])})
    ]),
    14:Object.freeze([
      Object.freeze({id:'ends',label:'6 · 1 · 6 · 1',counts:Object.freeze([6,1,6,1])}),
      Object.freeze({id:'double-ends',label:'5 · 2 · 5 · 2',counts:Object.freeze([5,2,5,2])}),
      Object.freeze({id:'long-sides',label:'7 · 0 · 7 · 0',counts:Object.freeze([7,0,7,0])})
    ]),
    16:Object.freeze([
      Object.freeze({id:'ends',label:'7 · 1 · 7 · 1',counts:Object.freeze([7,1,7,1])}),
      Object.freeze({id:'double-ends',label:'6 · 2 · 6 · 2',counts:Object.freeze([6,2,6,2])}),
      Object.freeze({id:'long-sides',label:'8 · 0 · 8 · 0',counts:Object.freeze([8,0,8,0])})
    ])
  });

  function assertCapacity(capacity) {
    const value = Number(capacity);
    if (!supported.includes(value)) throw new Error(`Capacidad no soportada: ${capacity}`);
    return value;
  }

  function normalizeShape(shape) {
    return shape === 'square' || shape === 'rectangular' ? shape : 'round';
  }

  function layoutVariants(shapeValue, capacityValue) {
    const shape = normalizeShape(shapeValue);
    const capacity = assertCapacity(capacityValue);
    if (shape === 'round') return Object.freeze(Object.values(ROUND_VARIANTS));
    return shape === 'square' ? SQUARE_MATRIX[capacity] : RECTANGULAR_MATRIX[capacity];
  }

  function normalizeVariant(shapeValue, capacityValue, variantValue) {
    const variants = layoutVariants(shapeValue, capacityValue);
    const requested = String(variantValue || '');
    return variants.find((variant) => variant.id === requested)?.id || variants[0].id;
  }

  function variantDefinition(shapeValue, capacityValue, variantValue) {
    const variants = layoutVariants(shapeValue, capacityValue);
    const id = normalizeVariant(shapeValue, capacityValue, variantValue);
    return variants.find((variant) => variant.id === id) || variants[0];
  }

  function roundPositions(capacity, radiusPx, variantValue = 'default') {
    const total = assertCapacity(capacity);
    const variant = variantDefinition('round', total, variantValue);
    const step = Math.PI * 2 / total;
    const phase = variant.phase === 'half-step' ? step / 2 : 0;
    return Object.freeze(Array.from({ length: total }, (_, index) => {
      const angle = step * index - Math.PI / 2 + phase;
      return Object.freeze({ x: Math.cos(angle) * radiusPx, y: Math.sin(angle) * radiusPx, angle, side: 'round' });
    }));
  }

  function balancedSideCounts(capacity, rectangular = false, variantValue = null) {
    const total = assertCapacity(capacity);
    const shape = rectangular ? 'rectangular' : 'square';
    return variantDefinition(shape, total, variantValue).counts;
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

  function rectPositions(capacity, widthPx, heightPx, offsetPx, rectangular = false, variantValue = null) {
    const [top,right,bottom,left] = balancedSideCounts(capacity, rectangular, variantValue);
    const halfW = widthPx / 2;
    const halfH = heightPx / 2;
    const points = [
      ...sidePoints(top,'top',halfW,halfH,offsetPx),
      ...sidePoints(right,'right',halfW,halfH,offsetPx),
      ...sidePoints(bottom,'bottom',halfW,halfH,offsetPx),
      ...sidePoints(left,'left',halfW,halfH,offsetPx)
    ];
    if (points.length !== Number(capacity)) throw new Error(`Acomodo inválido: ${points.length}/${capacity}`);
    return Object.freeze(points.map(Object.freeze));
  }

  function positionsFor(shapeValue, capacityValue, dimensions, variantValue = null) {
    const shape = normalizeShape(shapeValue);
    const capacity = assertCapacity(capacityValue);
    const variant = normalizeVariant(shape, capacity, variantValue);
    if (shape === 'round') return roundPositions(capacity, dimensions.tabletopWidthPx / 2 + dimensions.chairOffsetPx, variant);
    return rectPositions(capacity, dimensions.tabletopWidthPx, dimensions.tabletopHeightPx, dimensions.chairOffsetPx, shape === 'rectangular', variant);
  }

  function labelFromSeat(seat, extraPx) {
    if (seat.side === 'round') return Object.freeze({ x: seat.x * 1.64, y: seat.y * 1.64, anchor: Math.cos(seat.angle) > .28 ? 'start' : Math.cos(seat.angle) < -.28 ? 'end' : 'middle' });
    if (seat.side === 'top') return Object.freeze({ x: seat.x, y: seat.y - extraPx, anchor: 'middle' });
    if (seat.side === 'bottom') return Object.freeze({ x: seat.x, y: seat.y + extraPx, anchor: 'middle' });
    if (seat.side === 'right') return Object.freeze({ x: seat.x + extraPx, y: seat.y, anchor: 'start' });
    return Object.freeze({ x: seat.x - extraPx, y: seat.y, anchor: 'end' });
  }

  root.capacityLayout = Object.freeze({
    assertCapacity, normalizeShape, layoutVariants, normalizeVariant, variantDefinition,
    roundPositions, balancedSideCounts, rectPositions, positionsFor, labelFromSeat,
    ROUND_VARIANTS, SQUARE_MATRIX, RECTANGULAR_MATRIX
  });
})();