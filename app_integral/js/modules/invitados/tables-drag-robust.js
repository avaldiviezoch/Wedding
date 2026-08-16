(() => {
  'use strict';

  const VERSION = '20260816-1530-dragrobust1';
  const STORAGE_KEY = 'planificador_bodas_invitados_v1';
  const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';
  let draggingGuestId = '';

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

    const byId = new Map(data.guests.map((guest) => [String(guest.id), guest]));
    const sharedGuests = Array.isArray(shared.guests) ? shared.guests : [];
    shared.guests = sharedGuests.length
      ? sharedGuests.map((guest) => {
          const source = byId.get(String(guest.id));
          return source ? {
            ...guest,
            tableId: source.tableId || '',
            seatId: source.seatId || '',
            seatNumber: source.seatNumber ?? null
          } : guest;
        })
      : data.guests.map((guest) => ({ ...guest }));

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

  function showToast(doc, message) {
    let node = doc.getElementById('mgdTablesToast');
    if (!node) {
      node = doc.createElement('div');
      node.id = 'mgdTablesToast';
      node.className = 'mgd-toast';
      doc.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add('show');
    setTimeout(() => node.classList.remove('show'), 1700);
  }

  function persist(frame, data, source) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateSharedState(data);
    try {
      frame.contentWindow?.postMessage({
        type: 'MIGRANDIA_RSVP_SYNC',
        payload: { guests: data.guests, tables: data.tables }
      }, '*');
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('migrandia:datachange', {
      detail: { source, guests: data.guests.length, tables: data.tables.length }
    }));
  }

  function firstFreeSeat(data, table, movingGuestId = '') {
    const occupied = new Set(
      data.guests
        .filter((guest) => String(guest.tableId || '') === String(table.id) && String(guest.id) !== String(movingGuestId))
        .map((guest) => Number(guest.seatNumber) - 1)
        .filter((index) => Number.isInteger(index) && index >= 0)
    );
    const capacity = Math.min(16, Number(table.capacity) || (Array.isArray(table.seats) ? table.seats.length : 0) || 10);
    for (let index = 0; index < capacity; index += 1) {
      if (!occupied.has(index)) return index;
    }
    return -1;
  }

  function seatOccupiedByOther(data, tableId, seatIndex, guestId) {
    return data.guests.some((guest) =>
      String(guest.tableId || '') === String(tableId) &&
      Number(guest.seatNumber) === seatIndex + 1 &&
      String(guest.id) !== String(guestId)
    );
  }

  function assignGuest(frame, doc, guestId, tableId, requestedSeat = null) {
    const data = readState();
    const guest = data.guests.find((item) => String(item.id) === String(guestId));
    const table = data.tables.find((item) => String(item.id) === String(tableId));
    if (!guest || !table) return false;

    const capacity = Math.min(16, Number(table.capacity) || (Array.isArray(table.seats) ? table.seats.length : 0) || 10);
    let seatIndex = Number.isInteger(requestedSeat) ? requestedSeat : firstFreeSeat(data, table, guest.id);

    // Si cae sobre una silla ocupada, interpretar el gesto como “soltar en esta mesa”
    // y buscar automáticamente la primera silla libre.
    if (seatIndex < 0 || seatIndex >= capacity || seatOccupiedByOther(data, table.id, seatIndex, guest.id)) {
      seatIndex = firstFreeSeat(data, table, guest.id);
    }

    if (seatIndex < 0 || seatIndex >= capacity) {
      showToast(doc, 'Esta mesa ya está completa.');
      return false;
    }

    guest.tableId = table.id;
    guest.seatNumber = seatIndex + 1;
    guest.seatId = Array.isArray(table.seats) && table.seats[seatIndex]?.id ? table.seats[seatIndex].id : '';
    persist(frame, data, 'table-drag-robust-assigned');
    showToast(doc, `${guest.name || 'Invitado'} · ${table.name || 'Mesa'}`);
    return true;
  }

  function unassignGuest(frame, doc, guestId) {
    const data = readState();
    const guest = data.guests.find((item) => String(item.id) === String(guestId));
    if (!guest) return false;
    guest.tableId = '';
    guest.seatId = '';
    guest.seatNumber = null;
    persist(frame, data, 'table-drag-robust-unassigned');
    showToast(doc, `${guest.name || 'Invitado'} quedó sin mesa.`);
    return true;
  }

  function cleanup(root) {
    root.querySelectorAll('.mgd-table-card').forEach((card) => card.classList.remove('is-drop-ready', 'is-drop-over'));
    root.querySelectorAll('.mgd-seat').forEach((seat) => seat.classList.remove('is-seat-drop'));
    root.querySelector('#mgdUnassignedDrop')?.classList.remove('is-over');
  }

  function ensureStyle(doc) {
    let style = doc.getElementById('mgdDragRobustStyle');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'mgdDragRobustStyle';
      doc.head.appendChild(style);
    }
    style.textContent = `
      #mgdTablesEditor .mgd-guest-item{user-select:none;-webkit-user-select:none;cursor:grab!important}
      #mgdTablesEditor .mgd-guest-item:active{cursor:grabbing!important}
      #mgdTablesEditor .mgd-guest-item > *{pointer-events:none}
      #mgdTablesEditor .mgd-table-card.is-drop-ready{transition:border-color .12s ease,box-shadow .12s ease,transform .12s ease}
    `;
  }

  function bindFrame(frame) {
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return false; }
    const root = doc?.getElementById('mgdTablesEditor');
    if (!doc?.body || !root) return false;

    ensureStyle(doc);
    root.querySelectorAll('.mgd-guest-item[data-guest-id]').forEach((item) => {
      item.draggable = true;
      item.querySelectorAll('*').forEach((child) => { child.draggable = false; });
    });

    if (root.dataset.mgdDragRobustBound === VERSION) return true;
    root.dataset.mgdDragRobustBound = VERSION;

    root.addEventListener('dragstart', (event) => {
      const source = event.target.closest('.mgd-guest-item[data-guest-id], .mgd-seat.is-occupied[data-guest-id]');
      if (!source) return;
      draggingGuestId = source.dataset.guestId || '';
      if (!draggingGuestId) return;
      try {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/mgd-guest', draggingGuestId);
        event.dataTransfer.setData('text/plain', draggingGuestId);
      } catch (_) {}
      root.querySelectorAll('.mgd-table-card').forEach((card) => card.classList.add('is-drop-ready'));
    }, true);

    root.addEventListener('dragover', (event) => {
      const target = event.target.closest('.mgd-seat[data-table-id], .mgd-table-card[data-table-id], #mgdUnassignedDrop');
      if (!target || !draggingGuestId) return;
      event.preventDefault();
      try { event.dataTransfer.dropEffect = 'move'; } catch (_) {}
      target.closest('.mgd-table-card')?.classList.add('is-drop-over');
      if (target.classList.contains('mgd-seat')) target.classList.add('is-seat-drop');
      if (target.id === 'mgdUnassignedDrop') target.classList.add('is-over');
    }, true);

    root.addEventListener('drop', (event) => {
      const target = event.target.closest('.mgd-seat[data-table-id], .mgd-table-card[data-table-id], #mgdUnassignedDrop');
      if (!target) return;

      let guestId = draggingGuestId;
      if (!guestId) {
        try {
          guestId = event.dataTransfer?.getData('text/mgd-guest') || event.dataTransfer?.getData('text/plain') || '';
        } catch (_) {}
      }
      if (!guestId) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();

      if (target.id === 'mgdUnassignedDrop') {
        unassignGuest(frame, doc, guestId);
      } else {
        const seat = target.closest('.mgd-seat[data-table-id]');
        const table = target.closest('.mgd-table-card[data-table-id]');
        const tableId = seat?.dataset.tableId || table?.dataset.tableId || '';
        const requestedSeat = seat ? Number(seat.dataset.seatIndex) : null;
        if (tableId) assignGuest(frame, doc, guestId, tableId, requestedSeat);
      }

      draggingGuestId = '';
      cleanup(root);
    }, true);

    const finish = () => {
      draggingGuestId = '';
      cleanup(root);
    };
    root.addEventListener('dragend', finish, true);
    doc.defaultView?.addEventListener('blur', finish);
    doc.addEventListener('visibilitychange', () => {
      if (doc.visibilityState === 'visible') finish();
    });

    return true;
  }

  function scan() {
    const frames = [...document.querySelectorAll('#unifiedWorkspace iframe, iframe')];
    frames.forEach((frame) => bindFrame(frame));
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('migrandia:datachange', () => setTimeout(scan, 20));
  window.addEventListener('load', scan);
  scan();
})();
