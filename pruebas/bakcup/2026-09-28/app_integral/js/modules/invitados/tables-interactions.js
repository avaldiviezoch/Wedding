const VERSION = '20260814-1456-interactions1';
const STORAGE_KEY = 'planificador_bodas_invitados_v1';
const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';
let activeFrame = null;
let activeDoc = null;

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

function persist(data, source) {
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

function selectedGuestId(root) {
  return root.querySelector('.mgd-guest-item.is-selected[data-guest-id]')?.dataset.guestId || '';
}

function unassignSelected(root) {
  const guestId = selectedGuestId(root);
  if (!guestId) return;
  const data = readState();
  const guest = data.guests.find((item) => String(item.id) === String(guestId));
  if (!guest?.tableId) return;
  guest.tableId = '';
  guest.seatId = '';
  guest.seatNumber = null;
  persist(data, 'table-touch-unassign');
}

function occupancy(card) {
  const text = card.querySelector('.mgd-table-body span')?.textContent || '';
  const match = text.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return { occupied: 0, capacity: 0, full: card.classList.contains('is-full') };
  const occupied = Number(match[1]);
  const capacity = Number(match[2]);
  return { occupied, capacity, full: capacity > 0 && occupied >= capacity };
}

function refreshDropStates(root, dragging = false) {
  root.querySelectorAll('.mgd-table-card[data-table-id]').forEach((card) => {
    const state = occupancy(card);
    card.classList.toggle('is-drop-blocked', dragging && state.full);
    if (dragging && state.full) card.classList.remove('is-drop-ready', 'is-drop-over');
  });
}

function decorate(root) {
  const drop = root.querySelector('#mgdUnassignedDrop');
  if (drop) {
    drop.setAttribute('role', 'button');
    drop.setAttribute('tabindex', '0');
    drop.title = 'Arrastra aquí o toca después de seleccionar un invitado';
    const selected = Boolean(selectedGuestId(root));
    drop.classList.toggle('has-selected-guest', selected);
    drop.textContent = selected ? 'Toca aquí para dejar al invitado sin mesa' : 'Suelta aquí para dejar sin mesa';
  }
}

function ensureStyle(doc) {
  if (doc.getElementById('mgdTablesInteractionsStyle')) return;
  const style = doc.createElement('style');
  style.id = 'mgdTablesInteractionsStyle';
  style.textContent = `
    .mgd-table-card.is-drop-blocked{border-color:rgba(132,109,96,.22)!important;box-shadow:none!important;opacity:.68}
    .mgd-table-card.is-drop-blocked::before{content:"Sin lugares";position:absolute;z-index:9;left:50%;top:10px;transform:translateX(-50%);padding:4px 8px;border-radius:999px;background:#f2ede8;color:#7b6e65;font-size:9px;font-weight:700;white-space:nowrap}
    .mgd-unassigned-drop[role="button"]{cursor:pointer}
    .mgd-unassigned-drop.has-selected-guest{background:rgba(111,125,93,.09);border-color:rgba(111,125,93,.4);color:#5f6a55;font-weight:650}
  `;
  doc.head.appendChild(style);
}

function bindRoot(root) {
  if (!root || root.dataset.mgdInteractionsBound === VERSION) return;
  root.dataset.mgdInteractionsBound = VERSION;
  decorate(root);

  root.addEventListener('click', (event) => {
    const drop = event.target.closest('#mgdUnassignedDrop');
    if (drop && selectedGuestId(root)) {
      event.preventDefault();
      event.stopPropagation();
      unassignSelected(root);
    }
  });

  root.addEventListener('keydown', (event) => {
    if (!['Enter', ' '].includes(event.key)) return;
    if (!event.target.closest('#mgdUnassignedDrop') || !selectedGuestId(root)) return;
    event.preventDefault();
    unassignSelected(root);
  });

  root.addEventListener('dragstart', (event) => {
    if (!event.target.closest('[data-guest-id]') || event.target.closest('[data-table-order-drag]')) return;
    setTimeout(() => refreshDropStates(root, true), 0);
  });
  root.addEventListener('dragend', () => refreshDropStates(root, false));
  root.addEventListener('drop', () => setTimeout(() => refreshDropStates(root, false), 0));
}

function bindFrame(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  const root = doc?.getElementById('mgdTablesEditor');
  if (!doc?.body || !root) return false;
  activeFrame = frame;
  activeDoc = doc;
  ensureStyle(doc);
  bindRoot(root);
  decorate(root);

  if (!doc.documentElement.dataset.mgdInteractionsObserver) {
    doc.documentElement.dataset.mgdInteractionsObserver = VERSION;
    const observer = new MutationObserver(() => {
      const nextRoot = doc.getElementById('mgdTablesEditor');
      if (!nextRoot) return;
      bindRoot(nextRoot);
      decorate(nextRoot);
    });
    observer.observe(doc.body, { childList: true, subtree: true });
  }
  return true;
}

function scan() {
  const frames = [...document.querySelectorAll('#unifiedWorkspace iframe, iframe')];
  for (const frame of frames) {
    if (bindFrame(frame)) break;
  }
}

const rootObserver = new MutationObserver(scan);
rootObserver.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', scan);
window.addEventListener('load', scan);
window.addEventListener('migrandia:wedding-context', () => setTimeout(scan, 60));
window.addEventListener('migrandia:datachange', () => setTimeout(scan, 40));
if (document.readyState !== 'loading') scan();
