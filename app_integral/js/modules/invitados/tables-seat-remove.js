const VERSION = '20260814-1604-seatremove1';
const STORAGE_KEY = 'planificador_bodas_invitados_v1';
const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';

let activeFrame = null;
let activeDoc = null;

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

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

function updateSharedState(data) {
  let shared = {};
  try { shared = JSON.parse(localStorage.getItem(SHARED_STORAGE_KEY) || '{}'); } catch (_) {}

  const sharedGuests = Array.isArray(shared.guests) ? shared.guests : [];
  const byId = new Map(data.guests.map((guest) => [String(guest.id), guest]));

  shared.guests = sharedGuests.map((guest) => {
    const source = byId.get(String(guest.id));
    if (!source) return guest;
    return {
      ...guest,
      tableId: source.tableId || '',
      seatId: source.seatId || '',
      seatNumber: source.seatNumber ?? null
    };
  });

  if (!shared.guests.length && data.guests.length) {
    shared.guests = data.guests.map((guest) => ({ ...guest }));
  }

  shared.tables = data.tables.map((table) => ({
    ...table,
    guestIds: data.guests
      .filter((guest) => String(guest.tableId || '') === String(table.id))
      .sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999))
      .map((guest) => guest.id)
  }));
  shared.version = Math.max(3, Number(shared.version) || 0);
  shared.updatedAt = new Date().toISOString();
  shared.source = 'invitados';

  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(shared));
}

function showToast(message) {
  if (!activeDoc) return;
  let node = activeDoc.getElementById('mgdTablesToast');
  if (!node) {
    node = activeDoc.createElement('div');
    node.id = 'mgdTablesToast';
    node.className = 'mgd-toast';
    activeDoc.body.appendChild(node);
  }
  node.textContent = message;
  node.classList.add('show');
  setTimeout(() => node.classList.remove('show'), 1800);
}

function unassignGuest(guestId) {
  const data = readState();
  const guest = data.guests.find((item) => String(item.id) === String(guestId));
  if (!guest || !guest.tableId) return;

  guest.tableId = '';
  guest.seatId = '';
  guest.seatNumber = null;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  updateSharedState(data);

  try {
    activeFrame?.contentWindow?.postMessage({
      type: 'MIGRANDIA_RSVP_SYNC',
      payload: { guests: data.guests, tables: data.tables }
    }, '*');
  } catch (_) {}

  window.dispatchEvent(new CustomEvent('migrandia:datachange', {
    detail: {
      source: 'seat-remove-ui',
      guests: data.guests.length,
      tables: data.tables.length
    }
  }));

  showToast(`${guest.name || 'Invitado'} volvió a Sin mesa.`);
}

function ensureStyle(doc) {
  if (doc.getElementById('mgdSeatRemoveStyle')) return;
  const style = doc.createElement('style');
  style.id = 'mgdSeatRemoveStyle';
  style.textContent = `
    .mgd-seat-remove {
      position: absolute;
      z-index: 12;
      width: 15px;
      height: 15px;
      min-width: 15px;
      min-height: 15px;
      padding: 0;
      border: 1px solid rgba(92, 88, 82, .18);
      border-radius: 50%;
      background: rgba(255,255,255,.96);
      color: #77736d;
      display: grid;
      place-items: center;
      font: 700 10px/1 Arial, sans-serif;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(37,35,31,.10);
      transform: translate(8px, -25px);
      transition: transform .12s ease, background .12s ease, color .12s ease;
    }
    .mgd-seat-remove:hover,
    .mgd-seat-remove:focus-visible {
      background: #fff7f5;
      color: #9a5e56;
      transform: translate(8px, -25px) scale(1.08);
      outline: none;
    }
    @media (max-width: 720px) {
      .mgd-seat-remove {
        width: 16px;
        height: 16px;
        min-width: 16px;
        min-height: 16px;
        font-size: 10px;
      }
    }
  `;
  doc.head.appendChild(style);
}

function decorate(view) {
  if (!view || !activeDoc) return;
  ensureStyle(activeDoc);

  view.querySelectorAll('.mgd-table-visual').forEach((visual) => {
    visual.querySelectorAll('.mgd-seat.is-occupied[data-guest-id]').forEach((seat) => {
      const guestId = seat.dataset.guestId;
      if (!guestId) return;
      if (visual.querySelector(`.mgd-seat-remove[data-seat-remove-guest="${CSS.escape(guestId)}"]`)) return;

      const button = activeDoc.createElement('button');
      button.type = 'button';
      button.className = 'mgd-seat-remove';
      button.dataset.seatRemoveGuest = guestId;
      button.style.left = seat.style.left;
      button.style.top = seat.style.top;
      button.textContent = '×';
      button.title = 'Quitar de esta mesa';
      button.setAttribute('aria-label', `Quitar a ${seat.getAttribute('aria-label') || 'este invitado'} de la mesa`);
      visual.appendChild(button);
    });
  });
}

function bindFrame(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  const view = doc?.getElementById('tablesView');
  if (!doc?.body || !view || !doc.getElementById('mgdTablesEditor')) return false;

  activeFrame = frame;
  activeDoc = doc;
  ensureStyle(doc);

  if (view.dataset.mgdSeatRemoveBound !== VERSION) {
    view.dataset.mgdSeatRemoveBound = VERSION;

    view.addEventListener('click', (event) => {
      const button = event.target.closest('.mgd-seat-remove[data-seat-remove-guest]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      unassignGuest(button.dataset.seatRemoveGuest);
    }, true);

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        observer.disconnect();
        decorate(view);
        observer.observe(view, { childList: true, subtree: true });
      });
    });

    decorate(view);
    observer.observe(view, { childList: true, subtree: true });
  } else {
    decorate(view);
  }

  return true;
}

let attempts = 0;
const timer = setInterval(() => {
  attempts += 1;
  const frames = [...document.querySelectorAll('#unifiedWorkspace iframe, iframe')];
  if (frames.some((frame) => bindFrame(frame)) || attempts >= 30) clearInterval(timer);
}, 120);

window.addEventListener('migrandia:datachange', () => {
  setTimeout(() => {
    const frames = [...document.querySelectorAll('#unifiedWorkspace iframe, iframe')];
    frames.some((frame) => bindFrame(frame));
  }, 60);
});
