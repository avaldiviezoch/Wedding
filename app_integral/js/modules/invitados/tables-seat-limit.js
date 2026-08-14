(() => {
  'use strict';

  const MAX_SEATS = 16;
  const STORAGE_KEYS = new Set([
    'planificador_bodas_invitados_v1',
    'planificador_bodas_datos_compartidos_v1'
  ]);

  function makeSeatId() {
    return `seat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function clampCapacity(value, fallback = 10) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return Math.min(MAX_SEATS, Math.max(1, fallback));
    return Math.min(MAX_SEATS, Math.max(1, Math.round(numeric)));
  }

  function sanitizePayload(rawValue) {
    if (typeof rawValue !== 'string' || !rawValue) return rawValue;
    try {
      const data = JSON.parse(rawValue);
      if (!data || !Array.isArray(data.tables)) return rawValue;
      let changed = false;

      data.tables = data.tables.map((table) => {
        if (!table || typeof table !== 'object') return table;
        const currentSeats = Array.isArray(table.seats) ? table.seats : [];
        const requested = Number(table.capacity) || currentSeats.length || 10;
        const capacity = clampCapacity(requested);
        const seats = currentSeats.slice(0, capacity).map((seat, index) => ({
          ...(seat || {}),
          id: seat?.id || makeSeatId(),
          index
        }));
        while (seats.length < capacity) seats.push({ id: makeSeatId(), index: seats.length });
        if (Number(table.capacity) !== capacity || currentSeats.length !== seats.length) changed = true;
        return { ...table, capacity, seats };
      });

      return changed ? JSON.stringify(data) : rawValue;
    } catch (_) {
      return rawValue;
    }
  }

  if (!Storage.prototype.__mgdMax16Seats) {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      const next = STORAGE_KEYS.has(String(key)) ? sanitizePayload(String(value)) : value;
      return originalSetItem.call(this, key, next);
    };
    Object.defineProperty(Storage.prototype, '__mgdMax16Seats', { value: true, configurable: true });
  }

  STORAGE_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const safe = sanitizePayload(raw);
      if (safe !== raw) localStorage.setItem(key, safe);
    } catch (_) {}
  });

  function syncUi(doc) {
    const value = Number(doc?.getElementById('mgdEditCapacity')?.textContent || 0);
    const plus = doc?.querySelector('[data-edit-capacity="1"]');
    if (!plus) return;
    const atMax = value >= MAX_SEATS;
    plus.disabled = atMax;
    plus.title = atMax ? 'Máximo 16 sillas por mesa' : 'Añadir silla';
    plus.setAttribute('aria-disabled', atMax ? 'true' : 'false');
  }

  function bindFrame(frame) {
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return; }
    if (!doc?.body || !doc.getElementById('tablesView')) return;
    if (doc.documentElement.dataset.mgdMax16Seats === '1') {
      syncUi(doc);
      return;
    }
    doc.documentElement.dataset.mgdMax16Seats = '1';
    doc.addEventListener('click', (event) => {
      const plus = event.target?.closest?.('[data-edit-capacity="1"]');
      if (!plus) return;
      const current = Number(doc.getElementById('mgdEditCapacity')?.textContent || 0);
      if (current < MAX_SEATS) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      plus.disabled = true;
      plus.title = 'Máximo 16 sillas por mesa';
    }, true);
    new MutationObserver(() => syncUi(doc)).observe(doc.body, { childList: true, subtree: true, characterData: true });
    syncUi(doc);
  }

  function scan() {
    document.querySelectorAll('#unifiedWorkspace iframe, iframe').forEach((frame) => {
      bindFrame(frame);
      if (!frame.dataset.mgdMax16Load) {
        frame.dataset.mgdMax16Load = '1';
        frame.addEventListener('load', () => bindFrame(frame));
      }
    });
  }

  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', scan);
  window.addEventListener('load', scan);
  if (document.readyState !== 'loading') scan();
})();