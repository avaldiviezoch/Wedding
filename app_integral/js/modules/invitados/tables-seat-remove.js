const VERSION = '20260816-1520-seatremove3';
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

function restoreCursor(doc = activeDoc) {
  if (!doc) return;
  doc.documentElement?.style.removeProperty('cursor');
  doc.body?.style.removeProperty('cursor');
  doc.querySelectorAll('.mgd-table-card.is-drop-ready,.mgd-table-card.is-drop-over').forEach((node) => {
    node.classList.remove('is-drop-ready', 'is-drop-over');
  });
  doc.querySelectorAll('.mgd-seat.is-seat-drop').forEach((node) => node.classList.remove('is-seat-drop'));
}

function ensureStyle(doc) {
  let style = doc.getElementById('mgdSeatRemoveStyle');
  if (!style) {
    style = doc.createElement('style');
    style.id = 'mgdSeatRemoveStyle';
    doc.head.appendChild(style);
  }
  style.textContent = `
    #mgdTablesEditor { cursor: default !important; }
    #mgdTablesEditor button,
    #mgdTablesEditor .mgd-table-body,
    #mgdTablesEditor .mgd-filter { cursor: pointer !important; }
    #mgdTablesEditor .mgd-guest-item,
    #mgdTablesEditor .mgd-seat.is-occupied { cursor: grab !important; }
    #mgdTablesEditor .mgd-guest-item:active,
    #mgdTablesEditor .mgd-seat.is-occupied:active { cursor: grabbing !important; }

    .mgd-seat-remove {
      position: absolute;
      z-index: 14;
      width: 14px;
      height: 14px;
      min-width: 14px;
      min-height: 14px;
      padding: 0;
      border: 1px solid rgba(125, 77, 77, .22);
      border-radius: 50%;
      background: rgba(255,255,255,.98);
      color: #8a5a5a;
      display: grid;
      place-items: center;
      font: 700 10px/1 Arial, sans-serif;
      cursor: pointer !important;
      box-shadow: 0 2px 5px rgba(37,35,31,.10);
      transform: translate(8px, -24px) scale(.94);
      transition: transform .12s ease, background .12s ease, color .12s ease, opacity .12s ease;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    .mgd-seat-remove.is-visible,
    .mgd-seat-remove:focus-visible {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: translate(8px, -24px) scale(1);
    }
    .mgd-seat-remove.is-visible:hover,
    .mgd-seat-remove:focus-visible {
      background: #fff5f4;
      color: #7a3f3f;
      transform: translate(8px, -24px) scale(1.08);
      outline: none;
    }
    @media (max-width: 720px) {
      .mgd-seat-remove {
        width: 15px;
        height: 15px;
        min-width: 15px;
        min-height: 15px;
        font-size: 10px;
      }
    }
  `;
}

function findRemoveButton(view, guestId) {
  return [...view.querySelectorAll('.mgd-seat-remove[data-seat-remove-guest]')]
    .find((node) => String(node.dataset.seatRemoveGuest) === String(guestId));
}

function hideRemoveButtons(view, except = null) {
  view.querySelectorAll('.mgd-seat-remove.is-visible').forEach((button) => {
    if (button !== except) button.classList.remove('is-visible');
  });
}

function decorate(view) {
  if (!view || !activeDoc) return;
  ensureStyle(activeDoc);

  view.querySelectorAll('.mgd-table-visual').forEach((visual) => {
    visual.querySelectorAll('.mgd-seat.is-occupied[data-guest-id]').forEach((seat) => {
      const guestId = seat.dataset.guestId;
      if (!guestId) return;
      const existing = findRemoveButton(visual, guestId);
      if (existing) {
        existing.style.left = seat.style.left;
        existing.style.top = seat.style.top;
        return;
      }

      const button = activeDoc.createElement('button');
      button.type = 'button';
      button.className = 'mgd-seat-remove';
      button.dataset.seatRemoveGuest = guestId;
      button.style.left = seat.style.left;
      button.style.top = seat.style.top;
      button.textContent = '×';
      button.title = 'Quitar de esta mesa';
      button.setAttribute('aria-label', `Quitar a ${seat.getAttribute('aria-label') || 'este invitado'} de la mesa`);
      button.draggable = false;
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

    view.addEventListener('pointerover', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const seat = event.target.closest('.mgd-seat.is-occupied[data-guest-id]');
      if (seat) {
        const button = findRemoveButton(view, seat.dataset.guestId);
        hideRemoveButtons(view, button);
        button?.classList.add('is-visible');
        return;
      }
      const button = event.target.closest('.mgd-seat-remove[data-seat-remove-guest]');
      if (button) {
        hideRemoveButtons(view, button);
        button.classList.add('is-visible');
      }
    }, true);

    view.addEventListener('pointerout', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const seat = event.target.closest('.mgd-seat.is-occupied[data-guest-id]');
      if (seat) {
        const button = findRemoveButton(view, seat.dataset.guestId);
        if (event.relatedTarget === button || button?.contains(event.relatedTarget)) return;
        button?.classList.remove('is-visible');
        return;
      }
      const button = event.target.closest('.mgd-seat-remove[data-seat-remove-guest]');
      if (button) {
        const relatedSeat = event.relatedTarget?.closest?.('.mgd-seat.is-occupied[data-guest-id]');
        if (relatedSeat && String(relatedSeat.dataset.guestId) === String(button.dataset.seatRemoveGuest)) return;
        button.classList.remove('is-visible');
      }
    }, true);

    view.addEventListener('pointerdown', (event) => {
      if (!event.target.closest('.mgd-seat-remove[data-seat-remove-guest]')) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);

    view.addEventListener('click', (event) => {
      const button = event.target.closest('.mgd-seat-remove[data-seat-remove-guest]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      unassignGuest(button.dataset.seatRemoveGuest);
      restoreCursor(doc);
    }, true);

    const cursorEvents = ['dragend', 'drop', 'pointerup', 'mouseup', 'touchend'];
    cursorEvents.forEach((type) => view.addEventListener(type, () => restoreCursor(doc), true));
    doc.defaultView?.addEventListener('blur', () => restoreCursor(doc));
    doc.addEventListener('visibilitychange', () => {
      if (doc.visibilityState === 'visible') restoreCursor(doc);
    });

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
  if (frames.some((frame) => bindFrame(frame)) || attempts >= 40) clearInterval(timer);
}, 90);

window.addEventListener('migrandia:datachange', () => {
  setTimeout(() => {
    const frames = [...document.querySelectorAll('#unifiedWorkspace iframe, iframe')];
    frames.some((frame) => bindFrame(frame));
  }, 30);
});
