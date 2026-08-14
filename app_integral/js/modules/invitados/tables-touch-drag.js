const VERSION = '20260814-1608-touch2';
const STORAGE_KEY = 'planificador_bodas_invitados_v1';
const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';

let activeFrame = null;
let activeDoc = null;
let drag = null;

function readState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      ...parsed,
      guests: Array.isArray(parsed.guests) ? parsed.guests : [],
      tables: Array.isArray(parsed.tables) ? parsed.tables : []
    };
  } catch (_) {
    return { guests: [], tables: [] };
  }
}

function buildSharedState(data) {
  return {
    version: 3,
    updatedAt: new Date().toISOString(),
    source: 'invitados',
    guests: data.guests,
    tables: data.tables.map((table) => ({
      ...table,
      guestIds: data.guests
        .filter((guest) => String(guest.tableId || '') === String(table.id))
        .sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999))
        .map((guest) => guest.id)
    }))
  };
}

function persist(data, source = 'touch-guest-drag') {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(buildSharedState(data)));
  try {
    activeFrame?.contentWindow?.postMessage({
      type: 'MIGRANDIA_RSVP_SYNC',
      payload: { guests: data.guests, tables: data.tables }
    }, '*');
  } catch (_) {}
  window.dispatchEvent(new CustomEvent('migrandia:datachange', {
    detail: { source, guests: data.guests.length, tables: data.tables.length }
  }));
}

function toast(message) {
  if (!activeDoc) return;
  let node = activeDoc.getElementById('mgdTouchDragToast');
  if (!node) {
    node = activeDoc.createElement('div');
    node.id = 'mgdTouchDragToast';
    node.className = 'mgd-touch-drag-toast';
    activeDoc.body.appendChild(node);
  }
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(node._timer);
  node._timer = setTimeout(() => node.classList.remove('show'), 1800);
}

function firstFreeSeat(data, table, guestId) {
  const occupied = new Set(
    data.guests
      .filter((guest) => String(guest.tableId || '') === String(table.id) && String(guest.id) !== String(guestId))
      .map((guest) => Number(guest.seatNumber) - 1)
      .filter((index) => Number.isInteger(index) && index >= 0)
  );
  for (let index = 0; index < Number(table.capacity || table.seats?.length || 0); index++) {
    if (!occupied.has(index)) return index;
  }
  return -1;
}

function assignGuest(guestId, tableId, preferredSeat = null) {
  const data = readState();
  const guest = data.guests.find((item) => String(item.id) === String(guestId));
  const table = data.tables.find((item) => String(item.id) === String(tableId));
  if (!guest || !table) return false;
  const capacity = Math.max(1, Number(table.capacity || table.seats?.length || 0));
  const occupiedByOthers = data.guests.filter((item) => String(item.tableId || '') === String(table.id) && String(item.id) !== String(guest.id));
  if (occupiedByOthers.length >= capacity) {
    toast('Esta mesa ya está completa.');
    return false;
  }

  let seatIndex = Number.isInteger(preferredSeat) ? preferredSeat : firstFreeSeat(data, table, guest.id);
  if (seatIndex < 0 || seatIndex >= capacity) {
    toast('Esta mesa ya está completa.');
    return false;
  }
  const occupiedSeat = occupiedByOthers.some((item) => Number(item.seatNumber) === seatIndex + 1);
  if (occupiedSeat) {
    toast('Esta silla ya está ocupada.');
    return false;
  }

  if (!Array.isArray(table.seats)) table.seats = [];
  while (table.seats.length < capacity) {
    const index = table.seats.length;
    table.seats.push({ id: `seat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`, index });
  }
  guest.tableId = table.id;
  guest.seatNumber = seatIndex + 1;
  guest.seatId = table.seats[seatIndex]?.id || '';
  persist(data);
  toast(`${guest.name || 'Invitado'} · ${table.name || 'Mesa'}`);
  return true;
}

function unassignGuest(guestId) {
  const data = readState();
  const guest = data.guests.find((item) => String(item.id) === String(guestId));
  if (!guest) return false;
  guest.tableId = '';
  guest.seatId = '';
  guest.seatNumber = null;
  persist(data, 'touch-guest-unassign');
  toast(`${guest.name || 'Invitado'} quedó sin mesa.`);
  return true;
}

function guestName(guestId) {
  return readState().guests.find((guest) => String(guest.id) === String(guestId))?.name || 'Invitado';
}

function ensureStyle(doc) {
  if (doc.getElementById('mgdTouchDragStyle')) return;
  const style = doc.createElement('style');
  style.id = 'mgdTouchDragStyle';
  style.textContent = `
    .mgd-guest-drag{display:grid;place-items:center;min-width:38px;min-height:38px;border-radius:10px;touch-action:none;user-select:none;cursor:grab}
    .mgd-touch-drag-ghost{position:fixed;z-index:10040;left:0;top:0;transform:translate(-50%,-50%);pointer-events:none;padding:9px 12px;border-radius:999px;background:#343a31;color:#fff;font-size:12px;font-weight:700;box-shadow:0 12px 32px rgba(29,34,27,.24);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .mgd-table-card.is-touch-target{outline:3px solid rgba(111,125,93,.25);outline-offset:2px}
    .mgd-seat.is-touch-target{transform:scale(1.18);border-color:rgba(111,125,93,.7);background:#e9f0e3}
    .mgd-unassigned-drop.is-touch-target{background:rgba(111,125,93,.12);border-color:rgba(111,125,93,.6)}
    .mgd-touch-drag-toast{position:fixed;z-index:10050;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translate(-50%,12px);padding:10px 14px;border-radius:999px;background:#343a31;color:#fff;font-size:12px;opacity:0;pointer-events:none;transition:.16s ease;box-shadow:0 12px 35px rgba(27,31,25,.22)}
    .mgd-touch-drag-toast.show{opacity:1;transform:translate(-50%,0)}
  `;
  doc.head.appendChild(style);
}

function clearTargets(root) {
  root.querySelectorAll('.is-touch-target').forEach((node) => node.classList.remove('is-touch-target'));
}

function targetAt(root, clientX, clientY) {
  clearTargets(root);
  const node = activeDoc.elementFromPoint(clientX, clientY);
  if (!node) return null;
  const unassigned = node.closest('#mgdUnassignedDrop');
  if (unassigned) {
    unassigned.classList.add('is-touch-target');
    return { kind: 'unassigned', node: unassigned };
  }
  const seat = node.closest('.mgd-seat[data-table-id]');
  if (seat && !seat.dataset.guestId) {
    seat.classList.add('is-touch-target');
    seat.closest('.mgd-table-card')?.classList.add('is-touch-target');
    return { kind: 'seat', node: seat, tableId: seat.dataset.tableId, seatIndex: Number(seat.dataset.seatIndex) };
  }
  const card = node.closest('.mgd-table-card[data-table-id]');
  if (card) {
    card.classList.add('is-touch-target');
    return { kind: 'table', node: card, tableId: card.dataset.tableId };
  }
  return null;
}

function startDrag(event, root, guestId, sourceNode) {
  if (!guestId || root.dataset.mgdCanEdit === '0') return;
  event.preventDefault();
  event.stopPropagation();
  root.classList.remove('is-guests-open');
  const ghost = activeDoc.createElement('div');
  ghost.className = 'mgd-touch-drag-ghost';
  ghost.textContent = guestName(guestId);
  activeDoc.body.appendChild(ghost);
  drag = { pointerId: event.pointerId, guestId, sourceNode, ghost, moved: false, target: null, startX: event.clientX, startY: event.clientY };
  ghost.style.left = `${event.clientX}px`;
  ghost.style.top = `${event.clientY}px`;
  try { sourceNode.setPointerCapture(event.pointerId); } catch (_) {}
}

function moveDrag(event, root) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  event.preventDefault();
  const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
  if (distance > 5) drag.moved = true;
  drag.ghost.style.left = `${event.clientX}px`;
  drag.ghost.style.top = `${event.clientY}px`;
  drag.target = targetAt(root, event.clientX, event.clientY);
}

function endDrag(event, root) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  event.preventDefault();
  const current = drag;
  drag = null;
  try { current.sourceNode.releasePointerCapture(event.pointerId); } catch (_) {}
  current.ghost.remove();
  clearTargets(root);
  if (!current.moved || !current.target) return;
  if (current.target.kind === 'unassigned') return void unassignGuest(current.guestId);
  if (current.target.kind === 'seat') return void assignGuest(current.guestId, current.target.tableId, current.target.seatIndex);
  if (current.target.kind === 'table') return void assignGuest(current.guestId, current.target.tableId);
}

function bindRoot(root, doc) {
  if (!root || root.dataset.mgdTouchDragBound === VERSION) return;
  root.dataset.mgdTouchDragBound = VERSION;
  ensureStyle(doc);

  root.addEventListener('pointerdown', (event) => {
    if (!['touch', 'pen'].includes(event.pointerType)) return;
    const dragHandle = event.target.closest('.mgd-guest-drag');
    if (!dragHandle) return;
    const item = dragHandle.closest('.mgd-guest-item[data-guest-id]');
    startDrag(event, root, item?.dataset.guestId, dragHandle);
  }, true);
  root.addEventListener('pointermove', (event) => moveDrag(event, root), true);
  root.addEventListener('pointerup', (event) => endDrag(event, root), true);
  root.addEventListener('pointercancel', (event) => endDrag(event, root), true);
}

function bindFrame(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  const root = doc?.getElementById('mgdTablesEditor');
  if (!doc?.body || !root) return false;
  activeFrame = frame;
  activeDoc = doc;
  bindRoot(root, doc);
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
window.addEventListener('migrandia:wedding-context', () => setTimeout(scan, 60));
if (document.readyState !== 'loading') scan();
