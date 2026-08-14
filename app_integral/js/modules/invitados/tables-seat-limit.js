(() => {
  'use strict';

  const VERSION = '20260814-1725-seat-limit16';
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

  function sanitizeTablesPayload(rawValue) {
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

  if (!Storage.prototype.__mgdSeatLimit16) {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      const nextValue = STORAGE_KEYS.has(String(key)) ? sanitizeTablesPayload(String(value)) : value;
      return originalSetItem.call(this, key, nextValue);
    };
    Object.defineProperty(Storage.prototype, '__mgdSeatLimit16', { value: VERSION, configurable: true });
  }

  STORAGE_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const safe = sanitizeTablesPayload(raw);
      if (safe !== raw) localStorage.setItem(key, safe);
    } catch (error) {
      console.warn('No se pudo normalizar el límite de sillas:', error);
    }
  });

  function updateCapacityControls(doc) {
    const valueNode = doc?.getElementById('mgdEditCapacity');
    const plusButton = doc?.querySelector('[data-edit-capacity="1"]');
    if (!valueNode || !plusButton) return;
    const capacity = Number(valueNode.textContent || 0);
    const atLimit = capacity >= MAX_SEATS;
    plusButton.disabled = atLimit;
    plusButton.setAttribute('aria-disabled', atLimit ? 'true' : 'false');
    plusButton.title = atLimit ? 'Máximo 16 sillas por mesa' : 'Añadir silla';
  }

  function bindFrame(frame) {
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return false; }
    if (!doc?.body || !doc.getElementById('tablesView')) return false;
    if (doc.documentElement.dataset.mgdSeatLimit === VERSION) {
      updateCapacityControls(doc);
      return true;
    }
    doc.documentElement.dataset.mgdSeatLimit = VERSION;
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
    const observer = new MutationObserver(() => updateCapacityControls(doc));
    observer.observe(doc.body, { childList: true, subtree: true, characterData: true });
    updateCapacityControls(doc);
    return true;
  }

  function scan() {
    document.querySelectorAll('#unifiedWorkspace iframe, iframe').forEach((frame) => {
      bindFrame(frame);
      if (frame.dataset.mgdSeatLimitLoad !== VERSION) {
        frame.dataset.mgdSeatLimitLoad = VERSION;
        frame.addEventListener('load', () => bindFrame(frame));
      }
    });
  }

  const rootObserver = new MutationObserver(scan);
  rootObserver.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', scan);
  window.addEventListener('load', scan);
  if (document.readyState !== 'loading') scan();
})();