(() => {
  'use strict';

  const VERSION = '20260814-1405-tables1';
  const STORAGE_KEY = 'planificador_bodas_invitados_v1';
  const SHARED_KEY = 'planificador_bodas_datos_compartidos_v1';
  const STYLE_ID = 'mgdTableEditorCss';
  const EDITOR_ID = 'mgdTableEditor';
  const TABLE_SHAPES = ['round', 'square', 'rectangular', 'oval'];
  const SHAPE_LABELS = { round: 'Redonda', square: 'Cuadrada', rectangular: 'Rectangular', oval: 'Ovalada' };
  const CAPACITY_PRESETS = {
    round: [4, 6, 8, 10, 12],
    square: [4, 8],
    rectangular: [6, 8, 10, 12, 14, 16],
    oval: [6, 8, 10, 12, 14]
  };
  const MAX_CAPACITY = 24;
  const MAX_BULK = 30;

  let activeFrame = null;
  let activeDoc = null;
  let selectedGuestId = '';
  let guestFilter = 'unassigned';
  let guestSearch = '';
  let toastTimer = 0;
  let saveTimer = 0;
  let scanTimer = 0;
  let renderQueued = false;
  let storageListenerBound = false;

  function uid(prefix = 'id') {
    if (globalThis.crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function escapeHtml(value = '') {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function cleanText(value = '', max = 120) {
    return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
  }

  function normalizeShape(value) {
    const raw = String(value || '').toLowerCase().trim();
    if (TABLE_SHAPES.includes(raw)) return raw;
    if (raw === 'rectangle' || raw === 'rect') return 'rectangular';
    if (raw === 'circle' || raw === 'circular') return 'round';
    return 'round';
  }

  function clampCapacity(value, fallback = 10) {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(1, Math.min(MAX_CAPACITY, n));
  }

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return normalizeState(parsed);
    } catch (error) {
      console.error('No se pudo leer Invitados:', error);
      return normalizeState({});
    }
  }

  function normalizeState(input = {}) {
    const guests = Array.isArray(input.guests) ? input.guests.map((guest, index) => ({
      ...guest,
      id: guest?.id || uid(`guest${index + 1}`)
    })) : [];

    const tables = Array.isArray(input.tables) ? input.tables.map((table, index) => {
      const id = table?.id || uid(`table${index + 1}`);
      const legacyShape = table?.shape || table?.tableShape || (
        TABLE_SHAPES.includes(String(table?.type || '').toLowerCase()) ? table.type : ''
      );
      const assignedCount = guests.filter((guest) => String(guest.tableId || '') === String(id)).length;
      const inferredCapacity = Array.isArray(table?.seats) && table.seats.length
        ? table.seats.length
        : Number(table?.capacity || table?.chairs || table?.seatCount || 10);
      const capacity = Math.max(assignedCount, clampCapacity(inferredCapacity, 10));
      return {
        ...table,
        id,
        name: cleanText(table?.name || table?.label || `Mesa ${index + 1}`, 80) || `Mesa ${index + 1}`,
        shape: normalizeShape(legacyShape),
        capacity,
        seats: normalizeSeats(table?.seats, id, capacity)
      };
    }) : [];

    const tableIds = new Set(tables.map((table) => String(table.id)));
    guests.forEach((guest) => {
      if (guest.tableId && !tableIds.has(String(guest.tableId))) {
        guest.tableId = '';
        guest.seatNumber = null;
        guest.seatId = '';
      }
    });

    tables.forEach((table) => repairGuestSeats(guests, table));
    return { ...input, guests, tables };
  }

  function normalizeSeats(existing, tableId, capacity) {
    const old = Array.isArray(existing) ? existing : [];
    return Array.from({ length: capacity }, (_, index) => {
      const prior = old[index] || {};
      return { ...prior, id: prior.id || `${tableId}_seat_${index + 1}`, index: index + 1 };
    });
  }

  function repairGuestSeats(guests, table) {
    const assigned = guests.filter((guest) => String(guest.tableId || '') === String(table.id));
    const used = new Set();
    const pending = [];

    assigned.forEach((guest) => {
      const seat = Number.parseInt(guest.seatNumber, 10);
      if (seat >= 1 && seat <= table.capacity && !used.has(seat)) {
        used.add(seat);
        guest.seatNumber = seat;
        guest.seatId = table.seats[seat - 1]?.id || `${table.id}_seat_${seat}`;
      } else {
        pending.push(guest);
      }
    });

    pending.forEach((guest) => {
      const free = firstFreeSeatNumber(table, guests, used);
      if (!free) return;
      used.add(free);
      guest.seatNumber = free;
      guest.seatId = table.seats[free - 1]?.id || `${table.id}_seat_${free}`;
    });
  }

  function buildSharedState(state) {
    const guests = state.guests || [];
    const tables = state.tables || [];
    return {
      version: 3,
      updatedAt: new Date().toISOString(),
      source: 'invitados',
      guests: guests.map((guest) => ({
        id: guest.id,
        name: guest.name,
        status: guest.status,
        invitationSent: Boolean(guest.invitationSent),
        side: guest.side || 'ambos',
        relation: guest.relation || '',
        restriction: guest.restriction || 'Ninguna',
        tableId: guest.tableId || '',
        seatNumber: guest.seatNumber ?? null,
        seatId: guest.seatId || '',
        photoId: guest.photoId || '',
        photoThumb: guest.photoThumb || '',
        notes: guest.notes || '',
        rsvpResponseId: guest.rsvpResponseId || '',
        rsvpResponseName: guest.rsvpResponseName || '',
        rsvpGroup: guest.rsvpGroup || '',
        rsvpFamilyLabel: guest.rsvpFamilyLabel || '',
        rsvpTags: Array.isArray(guest.rsvpTags) ? guest.rsvpTags : []
      })),
      tables: tables.map((table) => ({
        ...table,
        guestIds: guests
          .filter((guest) => String(guest.tableId || '') === String(table.id))
          .sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999))
          .map((guest) => guest.id)
      }))
    };
  }

  function writeState(state, source = 'table-editor') {
    const normalized = normalizeState(state);
    setSaveState('Guardando…');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    localStorage.setItem(SHARED_KEY, JSON.stringify(buildSharedState(normalized)));

    try {
      activeFrame?.contentWindow?.postMessage({
        type: 'MIGRANDIA_RSVP_SYNC',
        payload: { guests: normalized.guests || [], tables: normalized.tables || [] }
      }, '*');
    } catch (_) {}

    window.dispatchEvent(new CustomEvent('migrandia:datachange', {
      detail: { source, guests: normalized.guests.length, tables: normalized.tables.length }
    }));

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => setSaveState('Guardado ✓'), 450);
    queueRender();
  }

  function setSaveState(text) {
    const el = activeDoc?.getElementById('mgdTableSaveState');
    if (el) el.textContent = text;
  }

  function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      if (activeDoc?.getElementById(EDITOR_ID)) renderEditor(activeDoc);
    });
  }

  function tableById(state, tableId) {
    return state.tables.find((table) => String(table.id) === String(tableId));
  }

  function guestsAtTable(state, tableId) {
    return state.guests
      .filter((guest) => String(guest.tableId || '') === String(tableId))
      .sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999));
  }

  function occupiedSeatMap(state, tableId, excludingGuestId = '') {
    const map = new Map();
    state.guests.forEach((guest) => {
      if (
        String(guest.tableId || '') === String(tableId) &&
        String(guest.id) !== String(excludingGuestId) &&
        Number(guest.seatNumber) > 0
      ) map.set(Number(guest.seatNumber), guest);
    });
    return map;
  }

  function firstFreeSeatNumber(table, guestsOrState, preUsed) {
    const used = preUsed || new Set();
    if (!preUsed) {
      const guests = Array.isArray(guestsOrState) ? guestsOrState : guestsOrState?.guests || [];
      guests.forEach((guest) => {
        if (String(guest.tableId || '') === String(table.id) && Number(guest.seatNumber) > 0) {
          used.add(Number(guest.seatNumber));
        }
      });
    }
    for (let seat = 1; seat <= table.capacity; seat += 1) {
      if (!used.has(seat)) return seat;
    }
    return null;
  }

  function guestInitials(name = '') {
    const parts = cleanText(name, 80).split(' ').filter(Boolean);
    if (!parts.length) return '?';
    return `${parts[0]?.[0] || ''}${parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : ''}`.toUpperCase();
  }

  function shapeDimensions(shape, capacity) {
    const cap = clampCapacity(capacity, 10);
    if (shape === 'rectangular') return { w: Math.min(370, 150 + cap * 12), h: 104 };
    if (shape === 'oval') return { w: Math.min(320, 165 + cap * 9), h: Math.min(180, 112 + cap * 3) };
    if (shape === 'square') {
      const size = Math.min(220, 130 + cap * 7);
      return { w: size, h: size };
    }
    const size = Math.min(220, 132 + cap * 5);
    return { w: size, h: size };
  }

  function seatCoordinates(shape, capacity, width, height) {
    const count = clampCapacity(capacity, 10);
    const coords = [];
    if (shape === 'round' || shape === 'oval') {
      const rx = width / 2 + 24;
      const ry = height / 2 + 24;
      for (let i = 0; i < count; i += 1) {
        const angle = (-Math.PI / 2) + (Math.PI * 2 * i / count);
        coords.push({ x: width / 2 + Math.cos(angle) * rx, y: height / 2 + Math.sin(angle) * ry });
      }
      return coords;
    }

    const margin = 20;
    const w = width + margin * 2;
    const h = height + margin * 2;
    const perimeter = 2 * (w + h);
    for (let i = 0; i < count; i += 1) {
      let d = (perimeter * i / count + w / 4) % perimeter;
      let x;
      let y;
      if (d < w) {
        x = d - margin;
        y = -margin;
      } else if (d < w + h) {
        d -= w;
        x = width + margin;
        y = d - margin;
      } else if (d < 2 * w + h) {
        d -= w + h;
        x = width + margin - d;
        y = height + margin;
      } else {
        d -= 2 * w + h;
        x = -margin;
        y = height + margin - d;
      }
      coords.push({ x, y });
    }
    return coords;
  }

  function statusFilterMatch(guest, filter) {
    const hasTable = Boolean(guest.tableId);
    if (filter === 'unassigned') return !hasTable;
    if (filter === 'assigned') return hasTable;
    if (filter === 'confirmed') return guest.status === 'confirmed';
    if (filter === 'pending') return !guest.status || guest.status === 'pending' || guest.status === 'tentative';
    return true;
  }

  function guestMatchesSearch(guest, query) {
    if (!query) return true;
    return `${guest.name || ''} ${guest.relation || ''}`.toLowerCase().includes(query.toLowerCase());
  }

  function filteredGuests(state) {
    return state.guests
      .filter((guest) => statusFilterMatch(guest, guestFilter))
      .filter((guest) => guestMatchesSearch(guest, guestSearch))
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'));
  }

  function ensureStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    const link = doc.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = new URL(`css/modules/invitados-table-editor.css?v=${VERSION}`, document.baseURI).href;
    doc.head.appendChild(link);
  }

  function editorMarkup() {
    return `
      <div class="mgd-table-shell">
        <header class="mgd-table-toolbar">
          <div class="mgd-table-heading">
            <span class="mgd-table-eyebrow">Organización de invitados</span>
            <h2>Editor de Mesas</h2>
            <p>Crea mesas a tu medida y organiza a tus invitados de forma visual.</p>
          </div>
          <div class="mgd-table-toolbar-actions">
            <span class="mgd-save-state" id="mgdTableSaveState">Guardado ✓</span>
            <button class="mgd-btn mgd-btn-primary" type="button" data-mgd-add-table><span aria-hidden="true">＋</span> Agregar mesa</button>
          </div>
        </header>

        <div class="mgd-table-layout">
          <aside class="mgd-guest-panel">
            <div class="mgd-guest-panel-head">
              <div><strong>Invitados</strong><span id="mgdGuestCount">0</span></div>
              <button class="mgd-icon-btn mgd-mobile-panel-close" type="button" data-mgd-close-guests aria-label="Cerrar invitados">×</button>
            </div>
            <label class="mgd-search"><span aria-hidden="true">⌕</span><input id="mgdGuestSearch" type="search" autocomplete="off" placeholder="Buscar invitado..."></label>
            <div class="mgd-filter-row" id="mgdGuestFilters">
              <button type="button" data-filter="all">Todos</button>
              <button type="button" data-filter="unassigned" class="is-active">Sin mesa</button>
              <button type="button" data-filter="assigned">Con mesa</button>
              <button type="button" data-filter="confirmed">Confirmados</button>
              <button type="button" data-filter="pending">Pendientes</button>
            </div>
            <div class="mgd-unassign-zone" id="mgdUnassignZone">
              <span class="mgd-unassign-icon" aria-hidden="true">↩</span>
              <div><strong>Sin mesa</strong><small>Arrastra aquí para quitar una asignación</small></div>
            </div>
            <div class="mgd-guest-list" id="mgdGuestList"></div>
          </aside>

          <main class="mgd-table-canvas-wrap">
            <div class="mgd-selected-hint" id="mgdSelectedHint" hidden><span></span><button type="button" data-mgd-clear-selected>Cancelar</button></div>
            <div class="mgd-table-summary" id="mgdTableSummary"></div>
            <div class="mgd-table-canvas" id="mgdTableCanvas"></div>
          </main>
        </div>

        <button class="mgd-mobile-guests-button" type="button" data-mgd-open-guests>Invitados <span id="mgdMobileUnassignedCount">0</span></button>

        <div class="mgd-modal-backdrop" id="mgdTableModal" hidden>
          <section class="mgd-modal" role="dialog" aria-modal="true" aria-labelledby="mgdModalTitle">
            <button class="mgd-modal-close" type="button" data-mgd-close-modal aria-label="Cerrar">×</button>
            <div id="mgdModalBody"></div>
          </section>
        </div>
        <div class="mgd-toast" id="mgdTableToast" role="status" aria-live="polite"></div>
      </div>`;
  }

  function injectEditor(frame) {
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return false; }
    if (!doc?.body) return false;
    const view = doc.getElementById('tablesView');
    const guestList = doc.getElementById('guestList');
    if (!view || !guestList) return false;

    activeFrame = frame;
    activeDoc = doc;
    ensureStyles(doc);
    if (!view.querySelector(`#${EDITOR_ID}`)) {
      const host = doc.createElement('div');
      host.id = EDITOR_ID;
      host.innerHTML = editorMarkup();
      view.prepend(host);
      bindEditor(doc, host);
    }
    view.classList.add('mgd-table-editor-active');
    renderEditor(doc);
    return true;
  }

  function renderEditor(doc) {
    const host = doc.getElementById(EDITOR_ID);
    if (!host) return;
    const state = readState();
    const unassignedCount = state.guests.filter((guest) => !guest.tableId).length;
    const assignedCount = state.guests.length - unassignedCount;
    const totalSeats = state.tables.reduce((sum, table) => sum + table.capacity, 0);

    host.querySelector('#mgdGuestCount').textContent = String(filteredGuests(state).length);
    host.querySelector('#mgdMobileUnassignedCount').textContent = String(unassignedCount);
    host.querySelector('#mgdTableSummary').innerHTML = `
      <div><strong>${state.tables.length}</strong><span>${state.tables.length === 1 ? 'mesa' : 'mesas'}</span></div>
      <div><strong>${assignedCount}</strong><span>con mesa</span></div>
      <div><strong>${unassignedCount}</strong><span>sin mesa</span></div>
      <div><strong>${totalSeats}</strong><span>lugares</span></div>`;
    host.querySelector('#mgdGuestList').innerHTML = renderGuestList(state);
    host.querySelector('#mgdTableCanvas').innerHTML = state.tables.length
      ? state.tables.map((table) => renderTableCard(state, table)).join('')
      : renderEmptyCanvas();

    host.querySelectorAll('#mgdGuestFilters button').forEach((button) => button.classList.toggle('is-active', button.dataset.filter === guestFilter));
    const search = host.querySelector('#mgdGuestSearch');
    if (search && search.value !== guestSearch) search.value = guestSearch;
    renderSelectedHint(host, state);
  }

  function renderGuestList(state) {
    const guests = filteredGuests(state);
    if (!guests.length) {
      const message = guestSearch ? 'No encontramos invitados con esa búsqueda.' : guestFilter === 'unassigned' ? 'Todos tus invitados ya tienen mesa.' : 'No hay invitados en este filtro.';
      return `<div class="mgd-guest-empty">${escapeHtml(message)}</div>`;
    }
    return guests.map((guest) => {
      const table = guest.tableId ? tableById(state, guest.tableId) : null;
      const meta = table ? `${table.name} · Silla ${guest.seatNumber || '—'}` : guest.relation || 'Sin mesa';
      return `<button class="mgd-guest-card${String(selectedGuestId) === String(guest.id) ? ' is-selected' : ''}" type="button" draggable="true" data-mgd-guest-id="${escapeHtml(guest.id)}" title="${escapeHtml(guest.name || '')}">
        <span class="mgd-guest-avatar">${escapeHtml(guestInitials(guest.name))}</span>
        <span class="mgd-guest-copy"><strong>${escapeHtml(guest.name || 'Sin nombre')}</strong><small>${escapeHtml(meta)}</small></span>
        <span class="mgd-drag-handle" aria-hidden="true">⋮⋮</span>
      </button>`;
    }).join('');
  }

  function renderEmptyCanvas() {
    return `<div class="mgd-table-empty">
      <div class="mgd-table-empty-shape" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
      <h3>Crea tu primera mesa</h3><p>Elige la forma, la capacidad y cuántas mesas iguales deseas crear.</p>
      <button class="mgd-btn mgd-btn-primary" type="button" data-mgd-add-table>＋ Agregar mesa</button>
    </div>`;
  }

  function renderTableCard(state, table) {
    const assigned = guestsAtTable(state, table.id);
    const occupied = assigned.length;
    const full = occupied >= table.capacity;
    const pct = Math.min(100, table.capacity ? occupied / table.capacity * 100 : 0);
    const dims = shapeDimensions(table.shape, table.capacity);
    const seats = seatCoordinates(table.shape, table.capacity, dims.w, dims.h);
    const seatMap = occupiedSeatMap(state, table.id);
    const stageW = dims.w + 96;
    const stageH = dims.h + 96;

    const seatMarkup = seats.map((position, index) => {
      const seatNumber = index + 1;
      const guest = seatMap.get(seatNumber);
      return `<button class="mgd-seat${guest ? ' is-occupied' : ''}" type="button" data-mgd-seat-table="${escapeHtml(table.id)}" data-mgd-seat="${seatNumber}" style="left:${position.x + 48}px;top:${position.y + 48}px" title="${escapeHtml(guest ? `${guest.name} · Silla ${seatNumber}` : `Silla ${seatNumber} libre`)}" aria-label="${escapeHtml(guest ? `${guest.name}, silla ${seatNumber}` : `Silla ${seatNumber} libre`)}" ${guest ? `draggable="true" data-mgd-guest-id="${escapeHtml(guest.id)}"` : ''}>${guest ? `<span>${escapeHtml(guestInitials(guest.name))}</span>` : '<i></i>'}</button>`;
    }).join('');

    return `<article class="mgd-table-card${full ? ' is-full' : occupied ? ' is-partial' : ' is-empty'}" data-mgd-table-id="${escapeHtml(table.id)}">
      <header class="mgd-table-card-head"><div><strong>${escapeHtml(table.name)}</strong><span>${escapeHtml(SHAPE_LABELS[table.shape] || 'Redonda')} · ${table.capacity} lugares</span></div><button class="mgd-icon-btn" type="button" data-mgd-edit-table="${escapeHtml(table.id)}" aria-label="Editar ${escapeHtml(table.name)}" title="Editar mesa">•••</button></header>
      <div class="mgd-table-stage" data-mgd-drop-table="${escapeHtml(table.id)}" style="--stage-w:${stageW}px;--stage-h:${stageH}px;--table-w:${dims.w}px;--table-h:${dims.h}px">
        <div class="mgd-table-furniture mgd-shape-${escapeHtml(table.shape)}"><div class="mgd-table-center-copy"><strong>${escapeHtml(table.name)}</strong><span>${occupied} / ${table.capacity}</span></div></div>${seatMarkup}
      </div>
      <footer class="mgd-table-card-foot"><div class="mgd-occupancy"><div><span>Ocupación</span><strong>${occupied} / ${table.capacity}</strong></div><div class="mgd-occupancy-track"><i style="width:${pct}%"></i></div></div><span class="mgd-table-state">${full ? 'Completa' : occupied ? `${table.capacity - occupied} libres` : 'Vacía'}</span></footer>
    </article>`;
  }

  function renderSelectedHint(host, state) {
    const hint = host.querySelector('#mgdSelectedHint');
    const guest = state.guests.find((item) => String(item.id) === String(selectedGuestId));
    if (!guest) {
      selectedGuestId = '';
      hint.hidden = true;
      return;
    }
    hint.hidden = false;
    hint.querySelector('span').textContent = `${guest.name}: toca una mesa o una silla para asignarlo.`;
  }

  function bindEditor(doc, host) {
    host.addEventListener('click', (event) => {
      const add = event.target.closest('[data-mgd-add-table]');
      if (add) return openCreateModal(doc);
      const edit = event.target.closest('[data-mgd-edit-table]');
      if (edit) return openEditModal(doc, edit.dataset.mgdEditTable);
      const filter = event.target.closest('[data-filter]');
      if (filter) { guestFilter = filter.dataset.filter || 'all'; renderEditor(doc); return; }
      if (event.target.closest('[data-mgd-clear-selected]')) { selectedGuestId = ''; renderEditor(doc); return; }

      const guestButton = event.target.closest('[data-mgd-guest-id]');
      if (guestButton && !event.target.closest('[data-mgd-seat-table]')) {
        selectedGuestId = String(guestButton.dataset.mgdGuestId || '');
        renderEditor(doc);
        return;
      }

      const seat = event.target.closest('[data-mgd-seat-table]');
      if (seat) {
        if (selectedGuestId) assignGuest(selectedGuestId, seat.dataset.mgdSeatTable, Number(seat.dataset.mgdSeat));
        else if (seat.dataset.mgdGuestId) { selectedGuestId = seat.dataset.mgdGuestId; renderEditor(doc); }
        return;
      }

      const stage = event.target.closest('[data-mgd-drop-table]');
      if (stage && selectedGuestId) { assignGuest(selectedGuestId, stage.dataset.mgdDropTable); return; }
      if (event.target.closest('[data-mgd-open-guests]')) { host.classList.add('is-guest-panel-open'); return; }
      if (event.target.closest('[data-mgd-close-guests]')) host.classList.remove('is-guest-panel-open');
    });

    host.querySelector('#mgdGuestSearch')?.addEventListener('input', (event) => { guestSearch = event.target.value || ''; renderEditor(doc); });

    host.addEventListener('dragstart', (event) => {
      const guest = event.target.closest('[data-mgd-guest-id]');
      if (!guest) return;
      const guestId = String(guest.dataset.mgdGuestId || '');
      if (!guestId) return;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/mgd-guest-id', guestId);
      selectedGuestId = guestId;
      host.classList.add('is-dragging-guest');
      const state = readState();
      host.querySelectorAll('[data-mgd-table-id]').forEach((card) => {
        const table = tableById(state, card.dataset.mgdTableId);
        if (!table) return;
        const occupied = guestsAtTable(state, table.id).length;
        card.classList.toggle('can-accept-drop', occupied < table.capacity || String(state.guests.find(g => String(g.id) === guestId)?.tableId || '') === String(table.id));
        card.classList.toggle('cannot-accept-drop', occupied >= table.capacity);
      });
    });

    host.addEventListener('dragend', () => {
      host.classList.remove('is-dragging-guest');
      host.querySelectorAll('.can-accept-drop,.cannot-accept-drop,.is-drop-hover').forEach((node) => node.classList.remove('can-accept-drop', 'cannot-accept-drop', 'is-drop-hover'));
    });

    host.addEventListener('dragover', (event) => {
      const target = event.target.closest('[data-mgd-seat-table],[data-mgd-drop-table],#mgdUnassignZone');
      if (!target) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      target.classList.add('is-drop-hover');
    });

    host.addEventListener('dragleave', (event) => event.target.closest('[data-mgd-seat-table],[data-mgd-drop-table],#mgdUnassignZone')?.classList.remove('is-drop-hover'));

    host.addEventListener('drop', (event) => {
      const seat = event.target.closest('[data-mgd-seat-table]');
      const table = event.target.closest('[data-mgd-drop-table]');
      const unassign = event.target.closest('#mgdUnassignZone');
      if (!seat && !table && !unassign) return;
      event.preventDefault();
      const guestId = event.dataTransfer.getData('text/mgd-guest-id') || selectedGuestId;
      if (!guestId) return;
      if (unassign) unassignGuest(guestId);
      else if (seat) assignGuest(guestId, seat.dataset.mgdSeatTable, Number(seat.dataset.mgdSeat));
      else assignGuest(guestId, table.dataset.mgdDropTable);
    });

    host.querySelector('#mgdUnassignZone')?.addEventListener('click', () => { if (selectedGuestId) unassignGuest(selectedGuestId); });
    bindModal(doc, host);
  }

  function assignGuest(guestId, tableId, requestedSeat = null) {
    const state = readState();
    const guest = state.guests.find((item) => String(item.id) === String(guestId));
    const table = tableById(state, tableId);
    if (!guest || !table) return;
    const seatMap = occupiedSeatMap(state, table.id, guest.id);
    let seat = Number(requestedSeat) || null;

    if (seat) {
      if (seat < 1 || seat > table.capacity) return showToast('Esa silla no existe en esta mesa.');
      if (seatMap.has(seat)) return showToast('Esta silla ya está ocupada.');
    } else {
      seat = firstFreeSeatNumber(table, state.guests.filter((item) => String(item.id) !== String(guest.id)));
      if (!seat) { showToast('Esta mesa ya está completa.'); pulseTable(table.id); return; }
    }

    const oldTableId = guest.tableId || '';
    guest.tableId = table.id;
    guest.seatNumber = seat;
    guest.seatId = table.seats[seat - 1]?.id || `${table.id}_seat_${seat}`;
    selectedGuestId = '';
    writeState(state, oldTableId && String(oldTableId) !== String(table.id) ? 'guest-moved-table' : 'guest-assigned-table');
    showToast(`${guest.name || 'Invitado'} → ${table.name} · Silla ${seat}`, 'success');
  }

  function unassignGuest(guestId) {
    const state = readState();
    const guest = state.guests.find((item) => String(item.id) === String(guestId));
    if (!guest) return;
    if (!guest.tableId) { selectedGuestId = ''; renderEditor(activeDoc); return; }
    guest.tableId = '';
    guest.seatNumber = null;
    guest.seatId = '';
    selectedGuestId = '';
    writeState(state, 'guest-unassigned-table');
    showToast(`${guest.name || 'Invitado'} quedó sin mesa`, 'success');
  }

  function pulseTable(tableId) {
    const selector = `[data-mgd-table-id="${String(tableId).replaceAll('"', '\\"')}"]`;
    const card = activeDoc?.querySelector(selector);
    if (!card) return;
    card.classList.remove('mgd-pulse-full');
    void card.offsetWidth;
    card.classList.add('mgd-pulse-full');
  }

  function nextTableNumber(state) {
    let max = 0;
    state.tables.forEach((table) => {
      const match = String(table.name || '').match(/^Mesa\s+(\d+)$/i);
      if (match) max = Math.max(max, Number(match[1]) || 0);
    });
    return max + 1;
  }

  function newTableObject(state, shape, capacity, name) {
    const id = uid('table');
    const cap = clampCapacity(capacity, 10);
    return {
      id,
      name: cleanText(name || `Mesa ${nextTableNumber(state)}`, 80),
      shape: normalizeShape(shape),
      capacity: cap,
      seats: normalizeSeats([], id, cap),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function createTables({ shape, capacity, quantity }) {
    const state = readState();
    const count = Math.max(1, Math.min(MAX_BULK, Number(quantity) || 1));
    let number = nextTableNumber(state);
    for (let i = 0; i < count; i += 1) {
      state.tables.push(newTableObject(state, shape, capacity, `Mesa ${number}`));
      number += 1;
    }
    writeState(state, 'table-created');
    closeModal(activeDoc);
    showToast(count === 1 ? 'Mesa creada' : `${count} mesas creadas`, 'success');
  }

  function changeTableCapacity(state, table, newCapacity) {
    const cap = clampCapacity(newCapacity, table.capacity);
    const assigned = guestsAtTable(state, table.id);
    if (cap < assigned.length) {
      showToast(`Esta mesa tiene ${assigned.length} invitados. Reasigna primero ${assigned.length - cap}.`);
      return false;
    }
    table.capacity = cap;
    table.seats = normalizeSeats(table.seats, table.id, cap);
    table.updatedAt = new Date().toISOString();
    repairGuestSeats(state.guests, table);
    return true;
  }

  function updateTable(tableId, input) {
    const state = readState();
    const table = tableById(state, tableId);
    if (!table) return false;
    if (!changeTableCapacity(state, table, clampCapacity(input.capacity, table.capacity))) return false;
    table.name = cleanText(input.name || table.name, 80) || table.name;
    table.shape = normalizeShape(input.shape || table.shape);
    table.updatedAt = new Date().toISOString();
    table.seats = normalizeSeats(table.seats, table.id, table.capacity);
    writeState(state, 'table-edited');
    closeModal(activeDoc);
    showToast('Mesa actualizada', 'success');
    return true;
  }

  function duplicateTable(tableId) {
    const state = readState();
    const source = tableById(state, tableId);
    if (!source) return;
    state.tables.push(newTableObject(state, source.shape, source.capacity, `Mesa ${nextTableNumber(state)}`));
    writeState(state, 'table-duplicated');
    closeModal(activeDoc);
    showToast('Mesa duplicada', 'success');
  }

  function deleteTable(tableId) {
    const state = readState();
    const table = tableById(state, tableId);
    if (!table) return;
    const assigned = guestsAtTable(state, table.id);
    const proceed = assigned.length === 0 || confirm(`Esta mesa tiene ${assigned.length} invitado${assigned.length === 1 ? '' : 's'} asignado${assigned.length === 1 ? '' : 's'}. Si la eliminas, ${assigned.length === 1 ? 'volverá' : 'volverán'} a “Sin mesa”.`);
    if (!proceed) return;
    assigned.forEach((guest) => { guest.tableId = ''; guest.seatNumber = null; guest.seatId = ''; });
    state.tables = state.tables.filter((item) => String(item.id) !== String(table.id));
    writeState(state, 'table-deleted');
    closeModal(activeDoc);
    showToast('Mesa eliminada', 'success');
  }

  function shapeChoiceMarkup(selected) {
    return TABLE_SHAPES.map((shape) => `<button class="mgd-shape-choice${shape === selected ? ' is-selected' : ''}" type="button" data-mgd-shape-choice="${shape}"><span class="mgd-shape-preview mgd-shape-${shape}"></span><strong>${SHAPE_LABELS[shape]}</strong></button>`).join('');
  }

  function capacityChipsMarkup(shape, selected) {
    return (CAPACITY_PRESETS[shape] || CAPACITY_PRESETS.round).map((capacity) => `<button class="mgd-capacity-chip${Number(selected) === capacity ? ' is-selected' : ''}" type="button" data-mgd-capacity="${capacity}">${capacity}</button>`).join('');
  }

  function openCreateModal(doc) {
    const modal = doc.getElementById('mgdTableModal');
    const body = doc.getElementById('mgdModalBody');
    if (!modal || !body) return;
    const shape = 'round';
    const capacity = 10;
    body.innerHTML = `<div class="mgd-modal-intro"><span>Agregar mesa</span><h3 id="mgdModalTitle">¿Qué tipo de mesa deseas agregar?</h3><p>Elige la forma y luego define su capacidad.</p></div>
      <div class="mgd-shape-choices" data-mgd-shape-list>${shapeChoiceMarkup(shape)}</div>
      <div class="mgd-modal-section"><div class="mgd-modal-label"><strong>Capacidad</strong><span>personas</span></div><div class="mgd-capacity-chips" data-mgd-capacity-list>${capacityChipsMarkup(shape, capacity)}</div><div class="mgd-stepper mgd-capacity-custom"><button type="button" data-mgd-capacity-step="-1">−</button><input type="number" min="1" max="${MAX_CAPACITY}" value="${capacity}" data-mgd-create-capacity aria-label="Capacidad"><button type="button" data-mgd-capacity-step="1">＋</button></div></div>
      <div class="mgd-modal-section"><div class="mgd-modal-label"><strong>Cantidad de mesas iguales</strong><span>máx. ${MAX_BULK}</span></div><div class="mgd-stepper"><button type="button" data-mgd-quantity-step="-1">−</button><input type="number" min="1" max="${MAX_BULK}" value="1" data-mgd-create-quantity aria-label="Cantidad de mesas"><button type="button" data-mgd-quantity-step="1">＋</button></div></div>
      <div class="mgd-modal-actions"><button class="mgd-btn" type="button" data-mgd-close-modal>Cancelar</button><button class="mgd-btn mgd-btn-primary" type="button" data-mgd-create-table>Crear mesa</button></div>`;
    body.dataset.mode = 'create';
    body.dataset.shape = shape;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
  }

  function openEditModal(doc, tableId) {
    const state = readState();
    const table = tableById(state, tableId);
    const modal = doc.getElementById('mgdTableModal');
    const body = doc.getElementById('mgdModalBody');
    if (!table || !modal || !body) return;
    const assigned = guestsAtTable(state, table.id).length;
    body.innerHTML = `<div class="mgd-modal-intro"><span>Propiedades de mesa</span><h3 id="mgdModalTitle">${escapeHtml(table.name)}</h3><p>${assigned} de ${table.capacity} lugares ocupados.</p></div>
      <label class="mgd-form-field"><span>Nombre de la mesa</span><input type="text" maxlength="80" value="${escapeHtml(table.name)}" data-mgd-edit-name></label>
      <div class="mgd-modal-section"><div class="mgd-modal-label"><strong>Forma</strong></div><div class="mgd-shape-choices" data-mgd-shape-list>${shapeChoiceMarkup(table.shape)}</div></div>
      <div class="mgd-modal-section"><div class="mgd-modal-label"><strong>Número de sillas</strong><span>mínimo actual: ${assigned}</span></div><div class="mgd-capacity-chips" data-mgd-capacity-list>${capacityChipsMarkup(table.shape, table.capacity)}</div><div class="mgd-stepper"><button type="button" data-mgd-capacity-step="-1">− Quitar silla</button><input type="number" min="${Math.max(1, assigned)}" max="${MAX_CAPACITY}" value="${table.capacity}" data-mgd-edit-capacity aria-label="Número de sillas"><button type="button" data-mgd-capacity-step="1">Añadir silla ＋</button></div></div>
      <div class="mgd-modal-actions mgd-modal-actions-split"><div><button class="mgd-btn" type="button" data-mgd-duplicate-table>Duplicar</button><button class="mgd-btn mgd-btn-danger" type="button" data-mgd-delete-table>Eliminar</button></div><div><button class="mgd-btn" type="button" data-mgd-close-modal>Cancelar</button><button class="mgd-btn mgd-btn-primary" type="button" data-mgd-save-table>Guardar cambios</button></div></div>`;
    body.dataset.mode = 'edit';
    body.dataset.tableId = table.id;
    body.dataset.shape = table.shape;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
  }

  function closeModal(doc) {
    const modal = doc?.getElementById('mgdTableModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    setTimeout(() => {
      modal.hidden = true;
      const body = doc.getElementById('mgdModalBody');
      if (body) { body.innerHTML = ''; body.dataset.mode = ''; body.dataset.tableId = ''; }
    }, 160);
  }

  function bindModal(doc, host) {
    const modal = host.querySelector('#mgdTableModal');
    if (!modal) return;
    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.closest('[data-mgd-close-modal]')) { closeModal(doc); return; }
      const body = host.querySelector('#mgdModalBody');
      if (!body) return;

      const shapeChoice = event.target.closest('[data-mgd-shape-choice]');
      if (shapeChoice) {
        const shape = normalizeShape(shapeChoice.dataset.mgdShapeChoice);
        body.dataset.shape = shape;
        body.querySelectorAll('[data-mgd-shape-choice]').forEach((button) => button.classList.toggle('is-selected', button === shapeChoice));
        const input = body.querySelector('[data-mgd-create-capacity],[data-mgd-edit-capacity]');
        const current = clampCapacity(input?.value, CAPACITY_PRESETS[shape]?.[0] || 8);
        const recommended = CAPACITY_PRESETS[shape] || [];
        const next = body.dataset.mode === 'edit' ? current : recommended.includes(current) ? current : recommended.reduce((best, n) => Math.abs(n - current) < Math.abs(best - current) ? n : best, recommended[0] || current);
        if (input) input.value = String(next);
        const list = body.querySelector('[data-mgd-capacity-list]');
        if (list) list.innerHTML = capacityChipsMarkup(shape, next);
        return;
      }

      const capacityChip = event.target.closest('[data-mgd-capacity]');
      if (capacityChip) {
        const input = body.querySelector('[data-mgd-create-capacity],[data-mgd-edit-capacity]');
        if (input) input.value = capacityChip.dataset.mgdCapacity;
        body.querySelectorAll('[data-mgd-capacity]').forEach((button) => button.classList.toggle('is-selected', button === capacityChip));
        return;
      }

      const capacityStep = event.target.closest('[data-mgd-capacity-step]');
      if (capacityStep) {
        const input = body.querySelector('[data-mgd-create-capacity],[data-mgd-edit-capacity]');
        if (!input) return;
        const min = Number(input.min || 1);
        const max = Number(input.max || MAX_CAPACITY);
        const next = Math.max(min, Math.min(max, Number(input.value || 1) + Number(capacityStep.dataset.mgdCapacityStep || 0)));
        input.value = String(next);
        body.querySelectorAll('[data-mgd-capacity]').forEach((button) => button.classList.toggle('is-selected', Number(button.dataset.mgdCapacity) === next));
        return;
      }

      const quantityStep = event.target.closest('[data-mgd-quantity-step]');
      if (quantityStep) {
        const input = body.querySelector('[data-mgd-create-quantity]');
        if (!input) return;
        input.value = String(Math.max(1, Math.min(MAX_BULK, Number(input.value || 1) + Number(quantityStep.dataset.mgdQuantityStep || 0))));
        return;
      }

      if (event.target.closest('[data-mgd-create-table]')) {
        createTables({ shape: body.dataset.shape || 'round', capacity: body.querySelector('[data-mgd-create-capacity]')?.value || 10, quantity: body.querySelector('[data-mgd-create-quantity]')?.value || 1 });
        return;
      }
      if (event.target.closest('[data-mgd-save-table]')) {
        updateTable(body.dataset.tableId, { name: body.querySelector('[data-mgd-edit-name]')?.value, shape: body.dataset.shape, capacity: body.querySelector('[data-mgd-edit-capacity]')?.value });
        return;
      }
      if (event.target.closest('[data-mgd-duplicate-table]')) { duplicateTable(body.dataset.tableId); return; }
      if (event.target.closest('[data-mgd-delete-table]')) deleteTable(body.dataset.tableId);
    });
  }

  function showToast(message, type = '') {
    const toast = activeDoc?.getElementById('mgdTableToast');
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `mgd-toast is-visible${type ? ` is-${type}` : ''}`;
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  function bindStorageListener() {
    if (storageListenerBound) return;
    storageListenerBound = true;
    window.addEventListener('storage', (event) => { if (event.key === STORAGE_KEY || event.key === SHARED_KEY) queueRender(); });
    window.addEventListener('migrandia:datachange', () => queueRender());
    window.addEventListener('migrandia:wedding-context', () => {
      selectedGuestId = '';
      guestSearch = '';
      guestFilter = 'unassigned';
      queueRender();
      scan();
    });
  }

  function scan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      const frames = [...document.querySelectorAll('#unifiedWorkspace iframe, iframe')];
      for (const frame of frames) {
        if (injectEditor(frame)) {
          if (!frame.dataset.mgdTableEditorLoadBound) {
            frame.dataset.mgdTableEditorLoadBound = '1';
            frame.addEventListener('load', () => setTimeout(() => injectEditor(frame), 80));
          }
          break;
        }
      }
    }, 80);
  }

  bindStorageListener();
  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', scan);
  window.addEventListener('load', scan);
  if (document.readyState !== 'loading') scan();
})();
