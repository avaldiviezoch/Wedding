const VERSION = '20260814-1504-geometry1';

function numberVar(node, name, fallback) {
  const raw = node?.style?.getPropertyValue(name) || getComputedStyle(node || document.documentElement).getPropertyValue(name);
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function spread(count, start, end) {
  if (count <= 0) return [];
  if (count === 1) return [(start + end) / 2];
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, index) => start + step * index);
}

function balancedSides(capacity) {
  const counts = [0, 0, 0, 0];
  for (let i = 0; i < capacity; i++) counts[i % 4] += 1;
  return counts;
}

function squarePositions(capacity, w, h, visualW, visualH) {
  const cx = visualW / 2;
  const cy = visualH / 2;
  const seatOffset = 23;
  const inset = Math.min(24, Math.max(14, w * 0.18));
  const [topCount, rightCount, bottomCount, leftCount] = balancedSides(capacity);
  const positions = [];

  spread(topCount, cx - w / 2 + inset, cx + w / 2 - inset).forEach((x) => positions.push({ x, y: cy - h / 2 - seatOffset }));
  spread(rightCount, cy - h / 2 + inset, cy + h / 2 - inset).forEach((y) => positions.push({ x: cx + w / 2 + seatOffset, y }));
  spread(bottomCount, cx + w / 2 - inset, cx - w / 2 + inset).forEach((x) => positions.push({ x, y: cy + h / 2 + seatOffset }));
  spread(leftCount, cy + h / 2 - inset, cy - h / 2 + inset).forEach((y) => positions.push({ x: cx - w / 2 - seatOffset, y }));
  return positions;
}

function rectangularCounts(capacity) {
  if (capacity <= 1) return { top: capacity, right: 0, bottom: 0, left: 0 };
  if (capacity === 2) return { top: 1, right: 0, bottom: 1, left: 0 };
  if (capacity === 3) return { top: 1, right: 1, bottom: 1, left: 0 };

  // En mesas rectangulares reales priorizamos los lados largos y usamos
  // una silla en cada cabecera. Así 8 = 3+3+1+1, 10 = 4+4+1+1, etc.
  const remaining = capacity - 2;
  const top = Math.ceil(remaining / 2);
  const bottom = Math.floor(remaining / 2);
  return { top, right: 1, bottom, left: 1 };
}

function rectangularPositions(capacity, w, h, visualW, visualH) {
  const cx = visualW / 2;
  const cy = visualH / 2;
  const seatOffset = 23;
  const insetX = Math.min(28, Math.max(16, w * 0.12));
  const { top, right, bottom, left } = rectangularCounts(capacity);
  const positions = [];

  spread(top, cx - w / 2 + insetX, cx + w / 2 - insetX).forEach((x) => positions.push({ x, y: cy - h / 2 - seatOffset }));
  if (right) positions.push({ x: cx + w / 2 + seatOffset, y: cy });
  spread(bottom, cx + w / 2 - insetX, cx - w / 2 + insetX).forEach((x) => positions.push({ x, y: cy + h / 2 + seatOffset }));
  if (left) positions.push({ x: cx - w / 2 - seatOffset, y: cy });
  return positions;
}

function applyCard(card) {
  const visual = card.querySelector('.mgd-table-visual');
  const body = card.querySelector('.mgd-table-body');
  const seats = [...card.querySelectorAll('.mgd-seat[data-seat-index]')]
    .sort((a, b) => Number(a.dataset.seatIndex) - Number(b.dataset.seatIndex));
  if (!visual || !body || !seats.length) return;

  const type = body.classList.contains('rectangular')
    ? 'rectangular'
    : body.classList.contains('square')
      ? 'square'
      : 'round';
  if (type === 'round') return;

  const w = numberVar(visual, '--table-w', 130);
  const h = numberVar(visual, '--table-h', type === 'square' ? w : 90);
  const visualW = numberVar(visual, '--visual-w', w + 74);
  const visualH = numberVar(visual, '--visual-h', h + 86);
  const positions = type === 'square'
    ? squarePositions(seats.length, w, h, visualW, visualH)
    : rectangularPositions(seats.length, w, h, visualW, visualH);

  seats.forEach((seat, index) => {
    const position = positions[index];
    if (!position) return;
    seat.style.left = `${position.x}px`;
    seat.style.top = `${position.y}px`;
  });
}

function applyGeometry(doc) {
  doc?.querySelectorAll('.mgd-table-card[data-table-id]').forEach(applyCard);
}

function bindFrame(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  if (!doc?.getElementById('mgdTablesEditor')) return false;
  applyGeometry(doc);
  if (!doc.documentElement.dataset.mgdGeometryObserver) {
    doc.documentElement.dataset.mgdGeometryObserver = VERSION;
    const observer = new MutationObserver(() => applyGeometry(doc));
    observer.observe(doc.body, { childList: true, subtree: true });
  }
  return true;
}

function scan() {
  for (const frame of document.querySelectorAll('#unifiedWorkspace iframe, iframe')) {
    if (bindFrame(frame)) break;
  }
}

const observer = new MutationObserver(scan);
observer.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', scan);
window.addEventListener('load', scan);
window.addEventListener('migrandia:datachange', () => setTimeout(scan, 30));
if (document.readyState !== 'loading') scan();
