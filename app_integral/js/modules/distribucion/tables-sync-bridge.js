(() => {
  'use strict';

  const VERSION = '20260918-tables-distribution-sync1';
  const STORAGE_KEY = 'planificador_bodas_invitados_v1';
  const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';
  const FRAME_SELECTOR = '#unifiedWorkspace iframe[data-mgd-distribution-frame="true"]';

  if (window.MiGranDiaTablesDistributionBridge?.version === VERSION) return;

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const normalizeShape = (value) => {
    const clean = String(value || '').toLowerCase();
    if (['rect', 'rectangle', 'rectangular'].includes(clean)) return 'rectangular';
    if (['square', 'cuadrada', 'cuadrado'].includes(clean)) return 'square';
    return 'round';
  };
  const uid = (prefix = 'seat') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        ...parsed,
        guests: Array.isArray(parsed.guests) ? parsed.guests.map((item) => ({ ...item })) : [],
        tables: Array.isArray(parsed.tables) ? parsed.tables.map((item) => ({ ...item })) : []
      };
    } catch (_) {
      return { guests: [], tables: [] };
    }
  }

  function capacityOf(table) {
    const value = Number(table?.capacity || table?.seats?.length || 10);
    const supported = [4, 6, 8, 10, 12, 14, 16];
    return supported.includes(value) ? value : 10;
  }

  function ensureSeatObjects(existing, capacity) {
    const source = Array.isArray(existing) ? existing : [];
    return Array.from({ length: capacity }, (_, index) => ({
      ...(source[index] && typeof source[index] === 'object' ? source[index] : {}),
      id: source[index]?.id || uid('seat'),
      index
    }));
  }

  function buildSharedState(data, source = 'distribucion') {
    return {
      version: 3,
      updatedAt: new Date().toISOString(),
      source,
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

  function snapshotFromCanonical() {
    const data = readState();
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      source: 'mesas-asientos',
      guests: data.guests.map((guest) => ({ ...guest })),
      tables: data.tables.map((table) => {
        const capacity = capacityOf(table);
        const seats = Array(capacity).fill(null);
        data.guests
          .filter((guest) => String(guest.tableId || '') === String(table.id))
          .forEach((guest) => {
            const index = Number(guest.seatNumber) - 1;
            if (index >= 0 && index < capacity && !seats[index]) seats[index] = guest.id;
          });
        return {
          id: String(table.id),
          label: String(table.name || 'Mesa'),
          name: String(table.name || 'Mesa'),
          tableShape: normalizeShape(table.type || table.tableShape || table.shape),
          capacity,
          seats,
          x: Number(table.distributionX),
          y: Number(table.distributionY),
          rotation: Number(table.distributionRotation || 0),
          tabletopWidthM: Number(table.distributionTabletopWidthM),
          tabletopHeightM: Number(table.distributionTabletopHeightM),
          clearanceMarginM: Number(table.distributionClearanceMarginM),
          clearanceMarginXM: Number(table.distributionClearanceMarginXM),
          clearanceMarginYM: Number(table.distributionClearanceMarginYM),
          seatLayoutVariant: table.distributionSeatLayoutVariant || ''
        };
      })
    };
  }

  function publish(reason = 'sync') {
    const frame = document.querySelector(FRAME_SELECTOR);
    if (!frame?.contentWindow) return;
    try {
      frame.contentWindow.postMessage({
        type: 'MIGRANDIA_TABLES_STATE',
        reason,
        payload: snapshotFromCanonical()
      }, '*');
    } catch (_) {}
  }

  function applyDistributionCommit(payload = {}) {
    const incomingTables = Array.isArray(payload.tables) ? payload.tables.filter((item) => item?.id) : [];
    const incomingGuests = Array.isArray(payload.guests) ? payload.guests : [];
    const data = readState();
    const existingTables = new Map(data.tables.map((table) => [String(table.id), table]));
    const guestById = new Map(data.guests.map((guest) => [String(guest.id), guest]));
    const incomingGuestById = new Map(incomingGuests.filter((guest) => guest?.id).map((guest) => [String(guest.id), guest]));

    // Nombres: el mismo invitado conserva un único nombre en ambos módulos.
    incomingGuestById.forEach((incoming, id) => {
      const guest = guestById.get(id);
      const nextName = String(incoming?.name || '').trim();
      if (guest && nextName) guest.name = nextName;
    });

    const nextTables = incomingTables.map((incoming, index) => {
      const id = String(incoming.id);
      const previous = existingTables.get(id) || {};
      const capacity = capacityOf(incoming);
      const seats = ensureSeatObjects(previous.seats, capacity);
      return {
        ...previous,
        id,
        name: String(incoming.label || incoming.name || previous.name || `Mesa ${index + 1}`).trim() || `Mesa ${index + 1}`,
        type: normalizeShape(incoming.tableShape || incoming.type || previous.type),
        capacity,
        seats,
        distributionX: Number.isFinite(Number(incoming.x)) ? Number(incoming.x) : previous.distributionX,
        distributionY: Number.isFinite(Number(incoming.y)) ? Number(incoming.y) : previous.distributionY,
        distributionRotation: Number.isFinite(Number(incoming.rotation)) ? Number(incoming.rotation) : Number(previous.distributionRotation || 0),
        distributionTabletopWidthM: Number.isFinite(Number(incoming.tabletopWidthM)) ? Number(incoming.tabletopWidthM) : previous.distributionTabletopWidthM,
        distributionTabletopHeightM: Number.isFinite(Number(incoming.tabletopHeightM)) ? Number(incoming.tabletopHeightM) : previous.distributionTabletopHeightM,
        distributionClearanceMarginM: Number.isFinite(Number(incoming.clearanceMarginM)) ? Number(incoming.clearanceMarginM) : previous.distributionClearanceMarginM,
        distributionClearanceMarginXM: Number.isFinite(Number(incoming.clearanceMarginXM)) ? Number(incoming.clearanceMarginXM) : previous.distributionClearanceMarginXM,
        distributionClearanceMarginYM: Number.isFinite(Number(incoming.clearanceMarginYM)) ? Number(incoming.clearanceMarginYM) : previous.distributionClearanceMarginYM,
        distributionSeatLayoutVariant: incoming.seatLayoutVariant || previous.distributionSeatLayoutVariant || '',
        updatedAt: new Date().toISOString(),
        createdAt: previous.createdAt || new Date().toISOString()
      };
    });

    const nextTableIds = new Set(nextTables.map((table) => String(table.id)));
    const assignmentByGuest = new Map();
    incomingTables.forEach((table) => {
      const tableId = String(table.id || '');
      const seats = Array.isArray(table.seats) ? table.seats : [];
      seats.forEach((guestId, seatIndex) => {
        if (!guestId || assignmentByGuest.has(String(guestId))) return;
        assignmentByGuest.set(String(guestId), { tableId, seatIndex });
      });
    });

    data.guests.forEach((guest) => {
      const assignment = assignmentByGuest.get(String(guest.id));
      if (!assignment || !nextTableIds.has(assignment.tableId)) {
        guest.tableId = '';
        guest.seatId = '';
        guest.seatNumber = null;
        return;
      }
      const table = nextTables.find((item) => String(item.id) === assignment.tableId);
      if (!table || assignment.seatIndex >= table.capacity) {
        guest.tableId = '';
        guest.seatId = '';
        guest.seatNumber = null;
        return;
      }
      guest.tableId = table.id;
      guest.seatNumber = assignment.seatIndex + 1;
      guest.seatId = table.seats[assignment.seatIndex]?.id || '';
    });

    data.tables = nextTables;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(buildSharedState(data, 'distribucion')));

    window.dispatchEvent(new CustomEvent('migrandia:datachange', {
      detail: {
        source: 'distribucion-sync',
        guests: data.guests.length,
        tables: data.tables.length
      }
    }));

    publish('commit-ack');
  }

  window.addEventListener('message', (event) => {
    const frame = document.querySelector(FRAME_SELECTOR);
    if (!frame?.contentWindow || event.source !== frame.contentWindow) return;
    const message = event.data || {};
    if (message.type === 'MIGRANDIA_TABLES_REQUEST') {
      publish(message.reason || 'request');
      return;
    }
    if (message.type === 'MIGRANDIA_DISTRIBUTION_COMMIT') {
      applyDistributionCommit(message.payload || {});
    }
  });

  document.addEventListener('migrandia:datachange', (event) => {
    if (String(event?.detail?.source || '') === 'distribucion-sync') return;
    queueMicrotask(() => publish(String(event?.detail?.source || 'datachange')));
  });

  window.addEventListener('migrandia:wedding-context', () => setTimeout(() => publish('wedding-context'), 0));
  window.addEventListener('hashchange', () => {
    if (String(location.hash || '').toLowerCase().includes('distribucion')) setTimeout(() => publish('route'), 80);
  });

  const observer = new MutationObserver(() => {
    const frame = document.querySelector(FRAME_SELECTOR);
    if (!frame || frame.dataset.mgdTablesSyncBound === VERSION) return;
    frame.dataset.mgdTablesSyncBound = VERSION;
    frame.addEventListener('load', () => setTimeout(() => publish('frame-load'), 0));
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.MiGranDiaTablesDistributionBridge = Object.freeze({
    version: VERSION,
    publish,
    snapshot: snapshotFromCanonical
  });
})();
