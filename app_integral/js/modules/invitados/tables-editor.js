const VERSION = '20260819-seat-remove-source2';
const STORAGE_KEY = 'planificador_bodas_invitados_v1';
const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';
const CSS_URL = new URL(`css/modules/invitados-tables-editor.css?v=${VERSION}`, document.baseURI).href;
const SHAPES = ['round', 'square', 'rectangular'];
const SHAPE_LABELS = { round: 'Redonda', square: 'Cuadrada', rectangular: 'Rectangular' };
const MIN_CAPACITY = 4;
const MAX_CAPACITY = 16;
const CAPACITY_STEP = 2;
const CAPACITY_PRESETS = {
  round: [4, 6, 8, 10, 12, 14, 16],
  square: [4, 6, 8, 10, 12, 14, 16],
  rectangular: [4, 6, 8, 10, 12, 14, 16]
};

let activeFrame = null;
let activeDoc = null;
let selectedGuestId = '';
let activeFilter = 'unassigned';
let searchText = '';
let saveTimer = 0;
let toastTimer = 0;
let renderTimer = 0;

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || min));
}
function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
function initials(name = '') {
  return String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '•';
}
function normalizeText(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
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

function tableCapacity(table) {
  const fromCapacity = Number(table?.capacity);
  const fromSeats = Array.isArray(table?.seats) ? table.seats.length : 0;
  return clamp(fromCapacity || fromSeats || 10, MIN_CAPACITY, MAX_CAPACITY);
}

function normalizeShape(value) {
  const clean = String(value || '').toLowerCase();
  if (['rect', 'rectangle', 'rectangular'].includes(clean)) return 'rectangular';
  if (['square', 'cuadrada', 'cuadrado'].includes(clean)) return 'square';
  return 'round';
}

function createSeats(existing, capacity) {
  const source = Array.isArray(existing) ? existing : [];
  return Array.from({ length: capacity }, (_, index) => ({
    ...(source[index] || {}),
    id: source[index]?.id || uid('seat'),
    index
  }));
}

function normalizeData(input, persistIfChanged = false) {
  const data = {
    ...input,
    guests: Array.isArray(input.guests) ? input.guests.map((guest) => ({ ...guest })) : [],
    tables: Array.isArray(input.tables) ? input.tables.map((table) => ({ ...table })) : []
  };
  let changed = false;

  data.tables = data.tables.map((table, index) => {
    const type = normalizeShape(table.type || table.shape);
    const capacity = tableCapacity(table);
    const seats = createSeats(table.seats, capacity);
    const next = {
      ...table,
      id: table.id || uid('table'),
      name: String(table.name || `Mesa ${index + 1}`),
      type,
      capacity,
      seats
    };
    if (!table.id || table.type !== type || Number(table.capacity) !== capacity || !Array.isArray(table.seats) || table.seats.length !== capacity) changed = true;
    return next;
  });

  const tableMap = new Map(data.tables.map((table) => [String(table.id), table]));
  const occupiedByTable = new Map();

  data.guests = data.guests.map((guest) => {
    const next = { ...guest };
    if (!next.tableId || !tableMap.has(String(next.tableId))) {
      if (next.tableId || next.seatId || next.seatNumber) changed = true;
      next.tableId = '';
      next.seatId = '';
      next.seatNumber = null;
      return next;
    }

    const table = tableMap.get(String(next.tableId));
    if (!occupiedByTable.has(table.id)) occupiedByTable.set(table.id, new Set());
    const occupied = occupiedByTable.get(table.id);
    let seatIndex = Number(next.seatNumber) - 1;
    if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= table.capacity || occupied.has(seatIndex)) {
      seatIndex = table.seats.findIndex((_, idx) => !occupied.has(idx));
      changed = true;
    }
    if (seatIndex < 0) {
      next.tableId = '';
      next.seatId = '';
      next.seatNumber = null;
      changed = true;
      return next;
    }
    occupied.add(seatIndex);
    next.seatNumber = seatIndex + 1;
    next.seatId = table.seats[seatIndex].id;
    return next;
  });

  if (persistIfChanged && changed) writeState(data, 'tables-normalized', false);
  return data;
}

function buildSharedState(data) {
  return {
    version: 3,
    updatedAt: new Date().toISOString(),
    source: 'invitados',
    guests: data.guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      status: guest.status,
      invitationSent: Boolean(guest.invitationSent),
      side: guest.side || 'ambos',
      relation: guest.relation || '',
      restriction: guest.restriction || 'Ninguna',
      tableId: guest.tableId || '',
      seatId: guest.seatId || '',
      seatNumber: guest.seatNumber ?? null,
      photoId: guest.photoId || '',
      photoThumb: guest.photoThumb || '',
      notes: guest.notes || '',
      rsvpResponseId: guest.rsvpResponseId || '',
      rsvpResponseName: guest.rsvpResponseName || '',
      rsvpGroup: guest.rsvpGroup || '',
      rsvpFamilyLabel: guest.rsvpFamilyLabel || '',
      rsvpTags: Array.isArray(guest.rsvpTags) ? guest.rsvpTags : []
    })),
    tables: data.tables.map((table) => ({
      ...table,
      guestIds: data.guests
        .filter((guest) => guest.tableId === table.id)
        .sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999))
        .map((guest) => guest.id)
    }))
  };
}

function setSaveState(text, saving = false) {
  const node = activeDoc?.getElementById('mgdTablesSaveState');
  if (!node) return;
  node.textContent = text;
  node.classList.toggle('is-saving', saving);
}

function writeState(input, source = 'tables-editor', rerender = true) {
  const data = normalizeData(input, false);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(buildSharedState(data)));
  setSaveState('Guardando…', true);

  try {
    activeFrame?.contentWindow?.postMessage({
      type: 'MIGRANDIA_RSVP_SYNC',
      payload: { guests: data.guests, tables: data.tables }
    }, '*');
  } catch (_) {}

  window.dispatchEvent(new CustomEvent('migrandia:datachange', {
    detail: { source, guests: data.guests.length, tables: data.tables.length }
  }));

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => setSaveState('Guardado ✓', false), 650);
  if (rerender) scheduleRender();
  return data;
}

function toast(message) {
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
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 2200);
}

function guestsAtTable(data, tableId) {
  return data.guests.filter((guest) => String(guest.tableId || '') === String(tableId));
}
function guestAtSeat(data, tableId, seatIndex) {
  return data.guests.find((guest) => String(guest.tableId || '') === String(tableId) && Number(guest.seatNumber) === seatIndex + 1);
}
function firstFreeSeat(data, table) {
  const occupied = new Set(guestsAtTable(data, table.id).map((guest) => Number(guest.seatNumber) - 1));
  return table.seats.findIndex((_, index) => !occupied.has(index));
}

function assignGuest(guestId, tableId, preferredSeat = null) {
  const data = normalizeData(readState(), false);
  const table = data.tables.find((item) => String(item.id) === String(tableId));
  const guest = data.guests.find((item) => String(item.id) === String(guestId));
  if (!table || !guest) return;

  let seatIndex = Number.isInteger(preferredSeat) ? preferredSeat : firstFreeSeat(data, table);
  if (seatIndex < 0 || seatIndex >= table.capacity) {
    toast('Esta mesa ya está completa.');
    return;
  }
  const occupied = guestAtSeat(data, table.id, seatIndex);
  if (occupied && String(occupied.id) !== String(guest.id)) {
    if (preferredSeat !== null) toast('Esta silla ya está ocupada.');
    else toast('Esta mesa ya está completa.');
    return;
  }

  guest.tableId = table.id;
  guest.seatNumber = seatIndex + 1;
  guest.seatId = table.seats[seatIndex].id;
  selectedGuestId = '';
  writeState(data, 'table-guest-assigned');
  toast(`${guest.name || 'Invitado'} · ${table.name}`);
}

function unassignGuest(guestId) {
  const data = normalizeData(readState(), false);
  const guest = data.guests.find((item) => String(item.id) === String(guestId));
  if (!guest || !guest.tableId) return;
  guest.tableId = '';
  guest.seatId = '';
  guest.seatNumber = null;
  selectedGuestId = '';
  writeState(data, 'table-guest-unassigned');
  toast(`${guest.name || 'Invitado'} quedó sin mesa.`);
}

function nextTableName(tables) {
  const used = new Set(tables.map((table) => String(table.name || '').trim()));
  let number = 1;
  while (used.has(`Mesa ${number}`)) number += 1;
  return `Mesa ${number}`;
}

function addTables(type, capacity, quantity) {
  const data = normalizeData(readState(), false);
  const amount = clamp(quantity, 1, 30);
  for (let i = 0; i < amount; i++) {
    const name = nextTableName(data.tables);
    data.tables.push({
      id: uid('table'),
      name,
      type: normalizeShape(type),
      capacity: clamp(capacity, MIN_CAPACITY, MAX_CAPACITY),
      seats: createSeats([], clamp(capacity, MIN_CAPACITY, MAX_CAPACITY)),
      positionX: null,
      positionY: null,
      rotation: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  writeState(data, 'table-created');
  toast(amount === 1 ? 'Mesa agregada.' : `${amount} mesas agregadas.`);
}

function compactGuestsForCapacity(data, table, capacity) {
  const assigned = guestsAtTable(data, table.id).sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999));
  if (assigned.length > capacity) return false;
  assigned.forEach((guest, index) => {
    guest.seatNumber = index + 1;
    guest.seatId = table.seats[index]?.id || '';
  });
  return true;
}

function updateTable(tableId, patch) {
  const data = normalizeData(readState(), false);
  const table = data.tables.find((item) => String(item.id) === String(tableId));
  if (!table) return false;
  const oldCapacity = table.capacity;
  const newCapacity = clamp(patch.capacity ?? oldCapacity, MIN_CAPACITY, MAX_CAPACITY);
  const occupied = guestsAtTable(data, table.id).length;
  if (newCapacity < occupied) {
    toast(`Esta mesa tiene ${occupied} invitados. Reasigna ${occupied - newCapacity} antes de reducirla.`);
    return false;
  }
  const affectedByReduction = newCapacity < oldCapacity && guestsAtTable(data, table.id)
    .some((guest) => Number(guest.seatNumber) > newCapacity);
  if (affectedByReduction && activeFrame?.contentWindow && !activeFrame.contentWindow.confirm(
    'Hay invitados en sillas que desaparecerán. ¿Deseas reducir la mesa y reubicarlos automáticamente en sillas disponibles?'
  )) return false;

  table.name = String(patch.name ?? table.name).trim().slice(0, 80) || table.name;
  table.type = normalizeShape(patch.type ?? table.type);
  if (newCapacity !== oldCapacity) {
    if (affectedByReduction) compactGuestsForCapacity(data, table, newCapacity);
    table.capacity = newCapacity;
    table.seats = createSeats(table.seats, newCapacity);
    guestsAtTable(data, table.id).forEach((guest) => {
      const index = Number(guest.seatNumber) - 1;
      guest.seatId = table.seats[index]?.id || '';
    });
  }
  table.updatedAt = new Date().toISOString();
  writeState(data, 'table-updated');
  return true;
}

function duplicateTable(tableId) {
  const data = normalizeData(readState(), false);
  const source = data.tables.find((item) => String(item.id) === String(tableId));
  if (!source) return;
  data.tables.push({
    ...source,
    id: uid('table'),
    name: nextTableName(data.tables),
    seats: createSeats([], source.capacity),
    positionX: null,
    positionY: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  writeState(data, 'table-duplicated');
  toast('Mesa duplicada.');
}

function deleteTable(tableId) {
  const data = normalizeData(readState(), false);
  const table = data.tables.find((item) => String(item.id) === String(tableId));
  if (!table) return;
  const assigned = guestsAtTable(data, table.id);
  const message = assigned.length
    ? `Esta mesa tiene ${assigned.length} invitado${assigned.length === 1 ? '' : 's'} asignado${assigned.length === 1 ? '' : 's'}. Si la eliminas, volverán a “Sin mesa”. ¿Eliminar mesa?`
    : '¿Eliminar esta mesa?';
  if (!activeFrame?.contentWindow?.confirm(message)) return;
  assigned.forEach((guest) => {
    guest.tableId = '';
    guest.seatId = '';
    guest.seatNumber = null;
  });
  data.tables = data.tables.filter((item) => String(item.id) !== String(table.id));
  writeState(data, 'table-deleted');
  closeModal();
  toast('Mesa eliminada.');
}

function tableDimensions(type, capacity) {
  if (type === 'rectangular') {
    return { w: clamp(142 + Math.max(0, capacity - 6) * 11, 142, 280), h: clamp(82 + Math.floor(capacity / 8) * 5, 86, 104) };
  }
  if (type === 'square') {
    const size = clamp(112 + Math.max(0, capacity - 4) * 5, 112, 160);
    return { w: size, h: size };
  }
  const size = clamp(112 + Math.max(0, capacity - 4) * 4, 112, 172);
  return { w: size, h: size };
}

function seatPositions(type, capacity, tableW, tableH) {
  const visualW = tableW + 74;
  const visualH = tableH + 86;
  const centerX = visualW / 2;
  const centerY = visualH / 2;
  const positions = [];

  if (type === 'round') {
    const radiusX = tableW / 2 + 24;
    const radiusY = tableH / 2 + 24;
    for (let i = 0; i < capacity; i++) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * i / capacity);
      positions.push({ x: centerX + Math.cos(angle) * radiusX, y: centerY + Math.sin(angle) * radiusY });
    }
    return { positions, visualW, visualH };
  }

  const outerW = tableW + 46;
  const outerH = tableH + 46;
  const left = centerX - outerW / 2;
  const top = centerY - outerH / 2;
  const perimeter = 2 * (outerW + outerH);
  for (let i = 0; i < capacity; i++) {
    let d = (perimeter * i / capacity + outerW / 2) % perimeter;
    let x, y;
    if (d < outerW) { x = left + d; y = top; }
    else if ((d -= outerW) < outerH) { x = left + outerW; y = top + d; }
    else if ((d -= outerH) < outerW) { x = left + outerW - d; y = top + outerH; }
    else { d -= outerW; x = left; y = top + outerH - d; }
    positions.push({ x, y });
  }
  return { positions, visualW, visualH };
}

function seatMarkup(data, table, index, position) {
  const guest = guestAtSeat(data, table.id, index);
  const occupied = Boolean(guest);
  const seat = `<button
    class="mgd-seat${occupied ? ' is-occupied' : ''}"
    type="button"
    data-seat-index="${index}"
    data-table-id="${esc(table.id)}"
    ${occupied ? `data-guest-id="${esc(guest.id)}" draggable="true"` : ''}
    style="left:${position.x}px;top:${position.y}px"
    title="${esc(occupied ? `${guest.name || 'Invitado'} · Silla ${index + 1}` : `Silla ${index + 1} libre`)}"
    aria-label="${esc(occupied ? `${guest.name || 'Invitado'}, silla ${index + 1}` : `Silla ${index + 1} libre`)}"
  >${occupied ? esc(initials(guest.name)) : ''}</button>`;
  if (!occupied) return seat;
  return `${seat}<button
    class="mgd-seat-remove"
    type="button"
    data-unassign-guest="${esc(guest.id)}"
    style="left:${position.x}px;top:${position.y}px"
    title="Quitar de esta mesa"
    aria-label="Quitar a ${esc(guest.name || 'este invitado')} de la mesa"
  >×</button>`;
}

function tableMarkup(data, table) {
  const assigned = guestsAtTable(data, table.id);
  const occupied = assigned.length;
  const full = occupied >= table.capacity;
  const dims = tableDimensions(table.type, table.capacity);
  const geometry = seatPositions(table.type, table.capacity, dims.w, dims.h);
  const fill = table.capacity ? Math.round(occupied / table.capacity * 100) : 0;
  return `<article class="mgd-table-card${full ? ' is-full' : ''}" data-table-card="${esc(table.id)}" data-table-id="${esc(table.id)}">
    <button class="mgd-table-edit" type="button" data-edit-table="${esc(table.id)}" title="Editar mesa" aria-label="Editar ${esc(table.name)}">•••</button>
    <div class="mgd-table-visual" style="--table-w:${dims.w}px;--table-h:${dims.h}px;--visual-w:${geometry.visualW}px;--visual-h:${geometry.visualH}px;width:${geometry.visualW}px;height:${geometry.visualH}px">
      <div class="mgd-table-body ${esc(table.type)}" data-table-drop="${esc(table.id)}">
        <strong title="${esc(table.name)}">${esc(table.name)}</strong>
        <span>${occupied} / ${table.capacity}</span>
      </div>
      ${geometry.positions.map((position, index) => seatMarkup(data, table, index, position)).join('')}
    </div>
    <div class="mgd-table-meta">
      <div class="mgd-occupancy" aria-label="Ocupación ${occupied} de ${table.capacity}"><i style="--fill:${fill}%"></i></div>
      <div class="mgd-table-meta-row"><span>${SHAPE_LABELS[table.type]}</span><span>${Math.max(0, table.capacity - occupied)} lugar${table.capacity - occupied === 1 ? '' : 'es'} libre${table.capacity - occupied === 1 ? '' : 's'}</span></div>
    </div>
  </article>`;
}

function guestFilterMatch(guest) {
  if (activeFilter === 'unassigned' && guest.tableId) return false;
  if (activeFilter === 'assigned' && !guest.tableId) return false;
  if (activeFilter === 'confirmed' && guest.status !== 'confirmed') return false;
  if (activeFilter === 'pending' && guest.status === 'confirmed') return false;
  if (searchText && !normalizeText(guest.name).includes(normalizeText(searchText))) return false;
  return true;
}

function guestMarkup(data, guest) {
  const table = data.tables.find((item) => String(item.id) === String(guest.tableId || ''));
  const sub = table ? `${table.name} · silla ${guest.seatNumber || '—'}` : 'Sin mesa';
  return `<button class="mgd-guest-item${String(selectedGuestId) === String(guest.id) ? ' is-selected' : ''}" type="button" draggable="true" data-guest-id="${esc(guest.id)}">
    <span class="mgd-guest-avatar">${esc(initials(guest.name))}</span>
    <span class="mgd-guest-copy"><strong>${esc(guest.name || 'Sin nombre')}</strong><span>${esc(sub)}</span></span>
    <span class="mgd-guest-drag" aria-hidden="true">⋮⋮</span>
  </button>`;
}

function editorMarkup(data) {
  const visibleGuests = data.guests.filter(guestFilterMatch);
  const visibleTableIds = activeFilter === 'assigned'
    ? new Set(visibleGuests.map((guest) => String(guest.tableId || '')).filter(Boolean))
    : null;
  const visibleTables = visibleTableIds
    ? data.tables.filter((table) => visibleTableIds.has(String(table.id)))
    : data.tables;
  const unassigned = data.guests.filter((guest) => !guest.tableId).length;
  return `<div class="mgd-tables-editor" id="mgdTablesEditor">
    <div class="mgd-tables-topbar">
      <div class="mgd-tables-title"><small>Organización de invitados</small><h2>Editor de mesas</h2><p>Combina formas y capacidades según tu boda.</p></div>
      <span class="mgd-save-state" id="mgdTablesSaveState">Guardado ✓</span>
      <button class="mgd-btn primary mgd-add-table" id="mgdAddTable" type="button"><strong>+</strong> Agregar mesa</button>
    </div>
    <div class="mgd-tables-layout">
      <section class="mgd-table-stage">
        <div class="mgd-stage-head"><strong>${visibleTables.length} mesa${visibleTables.length === 1 ? '' : 's'}</strong><span>${unassigned} invitado${unassigned === 1 ? '' : 's'} sin mesa</span></div>
        <div class="mgd-table-grid" id="mgdTableGrid">
          ${visibleTables.length ? visibleTables.map((table) => tableMarkup(data, table)).join('') : `<div class="mgd-empty-tables"><div><strong>${activeFilter === 'assigned' ? 'No hay mesas para este filtro' : 'Aún no hay mesas'}</strong><span>${activeFilter === 'assigned' ? 'Los invitados con mesa aparecerán aquí con su mesa correspondiente.' : 'Agrega la primera y elige su forma y capacidad.'}</span></div></div>`}
        </div>
      </section>
      <aside class="mgd-guests-panel" id="mgdGuestsPanel">
        <div class="mgd-guests-head"><h3>Invitados</h3><p>Arrastra una persona a una mesa o tócala y luego toca la mesa.</p></div>
        <input class="mgd-search" id="mgdGuestSearch" type="search" placeholder="Buscar invitado..." value="${esc(searchText)}">
        <div class="mgd-filter-row">
          ${[['unassigned','Sin mesa'],['all','Todos'],['assigned','Con mesa'],['confirmed','Confirmados'],['pending','Pendientes']].map(([key,label]) => `<button class="mgd-filter${activeFilter === key ? ' is-active' : ''}" type="button" data-guest-filter="${key}">${label}</button>`).join('')}
        </div>
        <div class="mgd-selection-hint${selectedGuestId ? ' is-visible' : ''}" id="mgdSelectionHint">Invitado seleccionado. Toca una mesa o una silla libre.</div>
        <div class="mgd-unassigned-drop" id="mgdUnassignedDrop">Suelta aquí para dejar sin mesa</div>
        <div class="mgd-guest-list" id="mgdGuestList">${visibleGuests.length ? visibleGuests.map((guest) => guestMarkup(data, guest)).join('') : '<div class="mgd-guests-empty">No hay invitados en este filtro.</div>'}</div>
      </aside>
    </div>
  </div>`;
}

function ensureCss(doc) {
  if (doc.querySelector('link[data-mgd-tables-css]')) return;
  const link = doc.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  link.dataset.mgdTablesCss = VERSION;
  doc.head.appendChild(link);
}

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => renderEditor(), 30);
}

function renderEditor() {
  const view = activeDoc?.getElementById('tablesView');
  if (!view) return;
  const data = normalizeData(readState(), true);
  const editor = view.querySelector('#mgdTablesEditor');
  if (!editor) return mountEditor(activeFrame, activeDoc);
  editor.outerHTML = editorMarkup(data);
  bindEditorEvents(activeDoc);
}

function mountEditor(frame, doc) {
  const view = doc.getElementById('tablesView');
  if (!view || !doc.getElementById('guestList')) return false;
  activeFrame = frame;
  activeDoc = doc;
  ensureCss(doc);
  view.classList.add('mgd-tables-enhanced');

  let legacy = view.querySelector(':scope > .mgd-legacy-tables-backup');
  if (!legacy) {
    legacy = doc.createElement('div');
    legacy.className = 'mgd-legacy-tables-backup';
    legacy.dataset.mgdLegacyTables = '1';
    const children = [...view.childNodes];
    children.forEach((child) => legacy.appendChild(child));
    view.appendChild(legacy);
  }

  let host = view.querySelector('#mgdTablesEditor');
  if (!host) {
    const data = normalizeData(readState(), true);
    view.insertAdjacentHTML('beforeend', editorMarkup(data));
  }
  bindEditorEvents(doc);
  return true;
}

function dragGuestId(event) {
  return event.dataTransfer?.getData('text/mgd-guest') || event.dataTransfer?.getData('text/plain') || '';
}

function bindEditorEvents(doc) {
  const root = doc.getElementById('mgdTablesEditor');
  if (!root || root.dataset.bound === VERSION) return;
  root.dataset.bound = VERSION;

  root.addEventListener('click', (event) => {
    const removeGuest = event.target.closest('[data-unassign-guest]');
    if (removeGuest) {
      event.preventDefault();
      event.stopPropagation();
      return unassignGuest(removeGuest.dataset.unassignGuest);
    }

    const add = event.target.closest('#mgdAddTable');
    if (add) return openCreateModal();

    const edit = event.target.closest('[data-edit-table]');
    if (edit) return openEditModal(edit.dataset.editTable);

    const filter = event.target.closest('[data-guest-filter]');
    if (filter) {
      activeFilter = filter.dataset.guestFilter;
      return renderEditor();
    }

    const guestItem = event.target.closest('.mgd-guest-item[data-guest-id]');
    if (guestItem) {
      selectedGuestId = String(selectedGuestId) === String(guestItem.dataset.guestId) ? '' : guestItem.dataset.guestId;
      return renderEditor();
    }

    const seat = event.target.closest('.mgd-seat[data-table-id]');
    if (seat && selectedGuestId) {
      if (seat.dataset.guestId && String(seat.dataset.guestId) !== String(selectedGuestId)) return toast('Esta silla ya está ocupada.');
      return assignGuest(selectedGuestId, seat.dataset.tableId, Number(seat.dataset.seatIndex));
    }

    const table = event.target.closest('.mgd-table-card[data-table-id]');
    if (table && selectedGuestId) return assignGuest(selectedGuestId, table.dataset.tableId);
  });

  root.addEventListener('input', (event) => {
    if (event.target.id === 'mgdGuestSearch') {
      searchText = event.target.value;
      clearTimeout(renderTimer);
      renderTimer = setTimeout(renderEditor, 160);
    }
  });

  root.addEventListener('dragstart', (event) => {
    const guestSource = event.target.closest('[data-guest-id]');
    if (!guestSource) return;
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/mgd-guest', guestSource.dataset.guestId);
    event.dataTransfer.setData('text/plain', guestSource.dataset.guestId);
    root.querySelectorAll('.mgd-table-card').forEach((card) => card.classList.add('is-drop-ready'));
  });

  root.addEventListener('dragend', () => {
    root.querySelectorAll('.mgd-table-card').forEach((card) => card.classList.remove('is-drop-ready', 'is-drop-over'));
    root.querySelectorAll('.mgd-seat').forEach((seat) => seat.classList.remove('is-seat-drop'));
  });

  root.addEventListener('dragover', (event) => {
    const seat = event.target.closest('.mgd-seat[data-table-id]');
    const table = event.target.closest('.mgd-table-card[data-table-id]');
    const unassigned = event.target.closest('#mgdUnassignedDrop');
    if (!seat && !table && !unassigned) return;
    event.preventDefault();
    if (seat) seat.classList.add('is-seat-drop');
    if (table) table.classList.add('is-drop-over');
    if (unassigned) unassigned.classList.add('is-over');
  });

  root.addEventListener('dragleave', (event) => {
    event.target.closest('.mgd-seat')?.classList.remove('is-seat-drop');
    event.target.closest('.mgd-table-card')?.classList.remove('is-drop-over');
    event.target.closest('#mgdUnassignedDrop')?.classList.remove('is-over');
  });

  root.addEventListener('drop', (event) => {
    const guestId = dragGuestId(event);
    if (!guestId) return;
    const unassigned = event.target.closest('#mgdUnassignedDrop');
    const seat = event.target.closest('.mgd-seat[data-table-id]');
    const table = event.target.closest('.mgd-table-card[data-table-id]');
    if (!unassigned && !seat && !table) return;
    event.preventDefault();
    event.stopPropagation();
    if (unassigned) return unassignGuest(guestId);
    if (seat) return assignGuest(guestId, seat.dataset.tableId, Number(seat.dataset.seatIndex));
    if (table) return assignGuest(guestId, table.dataset.tableId);
  });
}

function modalShell(content) {
  if (!activeDoc) return null;
  let backdrop = activeDoc.getElementById('mgdTablesModal');
  if (!backdrop) {
    backdrop = activeDoc.createElement('div');
    backdrop.id = 'mgdTablesModal';
    backdrop.className = 'mgd-modal-backdrop';
    activeDoc.body.appendChild(backdrop);
  }
  backdrop.innerHTML = content;
  backdrop.classList.add('show');
  backdrop.onclick = (event) => {
    if (event.target === backdrop || event.target.closest('[data-close-table-modal]')) closeModal();
  };
  return backdrop;
}
function closeModal() {
  activeDoc?.getElementById('mgdTablesModal')?.classList.remove('show');
}

function shapeButtons(selected) {
  return SHAPES.map((shape) => `<button class="mgd-shape-option${selected === shape ? ' is-active' : ''}" type="button" data-modal-shape="${shape}"><i class="mgd-shape-icon ${shape}"></i><span>${SHAPE_LABELS[shape]}</span></button>`).join('');
}
function capacityButtons(shape, selected) {
  return (CAPACITY_PRESETS[shape] || CAPACITY_PRESETS.round).map((capacity) => `<button class="mgd-capacity${Number(selected) === capacity ? ' is-active' : ''}" type="button" data-modal-capacity="${capacity}">${capacity}</button>`).join('');
}

function openCreateModal() {
  let shape = 'round';
  let capacity = 10;
  let quantity = 1;
  const backdrop = modalShell(`<div class="mgd-modal" role="dialog" aria-modal="true">
    <div class="mgd-modal-head"><div><h3>Agregar mesa</h3><p>Elige la forma, capacidad y cuántas mesas deseas crear.</p></div><button class="mgd-modal-close" data-close-table-modal type="button">×</button></div>
    <span class="mgd-form-label">¿Qué tipo de mesa deseas agregar?</span>
    <div class="mgd-shape-grid" id="mgdCreateShapes">${shapeButtons(shape)}</div>
    <span class="mgd-form-label">Capacidad</span>
    <div class="mgd-capacity-grid" id="mgdCreateCapacities">${capacityButtons(shape, capacity)}</div>
    <span class="mgd-form-label">Cantidad</span>
    <div class="mgd-stepper"><button type="button" data-create-qty="-1">−</button><strong id="mgdCreateQty">1</strong><button type="button" data-create-qty="1">+</button></div>
    <div class="mgd-modal-actions"><div></div><div class="mgd-actions-right"><button class="mgd-btn" data-close-table-modal type="button">Cancelar</button><button class="mgd-btn primary" id="mgdConfirmCreateTable" type="button">Crear mesa</button></div></div>
  </div>`);
  if (!backdrop) return;
  backdrop.querySelector('#mgdCreateShapes').onclick = (event) => {
    const button = event.target.closest('[data-modal-shape]');
    if (!button) return;
    shape = button.dataset.modalShape;
    capacity = CAPACITY_PRESETS[shape][Math.min(2, CAPACITY_PRESETS[shape].length - 1)];
    backdrop.querySelector('#mgdCreateShapes').innerHTML = shapeButtons(shape);
    backdrop.querySelector('#mgdCreateCapacities').innerHTML = capacityButtons(shape, capacity);
  };
  backdrop.querySelector('#mgdCreateCapacities').onclick = (event) => {
    const button = event.target.closest('[data-modal-capacity]');
    if (!button) return;
    capacity = Number(button.dataset.modalCapacity);
    backdrop.querySelector('#mgdCreateCapacities').innerHTML = capacityButtons(shape, capacity);
  };
  backdrop.querySelectorAll('[data-create-qty]').forEach((button) => button.onclick = () => {
    quantity = clamp(quantity + Number(button.dataset.createQty), 1, 30);
    backdrop.querySelector('#mgdCreateQty').textContent = String(quantity);
  });
  backdrop.querySelector('#mgdConfirmCreateTable').onclick = () => {
    closeModal();
    addTables(shape, capacity, quantity);
  };
}

function openEditModal(tableId) {
  const data = normalizeData(readState(), false);
  const table = data.tables.find((item) => String(item.id) === String(tableId));
  if (!table) return;
  let shape = table.type;
  let capacity = table.capacity;
  const occupied = guestsAtTable(data, table.id).length;
  const backdrop = modalShell(`<div class="mgd-modal" role="dialog" aria-modal="true">
    <div class="mgd-modal-head"><div><h3>Editar mesa</h3><p>${occupied} de ${table.capacity} lugares ocupados.</p></div><button class="mgd-modal-close" data-close-table-modal type="button">×</button></div>
    <label class="mgd-form-label" for="mgdEditTableName">Nombre</label>
    <input class="mgd-name-input" id="mgdEditTableName" maxlength="80" value="${esc(table.name)}">
    <span class="mgd-form-label">Forma</span>
    <div class="mgd-shape-grid" id="mgdEditShapes">${shapeButtons(shape)}</div>
    <span class="mgd-form-label">Número de sillas</span>
    <div class="mgd-stepper"><button type="button" data-edit-capacity="-1">−</button><strong id="mgdEditCapacity">${capacity}</strong><button type="button" data-edit-capacity="1">+</button></div>
    <div class="mgd-capacity-grid" id="mgdEditPresets" style="margin-top:9px">${capacityButtons(shape, capacity)}</div>
    <div class="mgd-modal-actions">
      <div><button class="mgd-btn danger" id="mgdDeleteTable" type="button">Eliminar mesa</button></div>
      <div class="mgd-actions-right"><button class="mgd-btn soft" id="mgdDuplicateTable" type="button">Duplicar</button><button class="mgd-btn primary" id="mgdSaveTable" type="button">Guardar cambios</button></div>
    </div>
  </div>`);
  if (!backdrop) return;

  const updateUi = () => {
    backdrop.querySelector('#mgdEditShapes').innerHTML = shapeButtons(shape);
    backdrop.querySelector('#mgdEditPresets').innerHTML = capacityButtons(shape, capacity);
    backdrop.querySelector('#mgdEditCapacity').textContent = String(capacity);
  };
  backdrop.querySelector('#mgdEditShapes').onclick = (event) => {
    const button = event.target.closest('[data-modal-shape]');
    if (!button) return;
    shape = button.dataset.modalShape;
    updateUi();
  };
  backdrop.querySelector('#mgdEditPresets').onclick = (event) => {
    const button = event.target.closest('[data-modal-capacity]');
    if (!button) return;
    const next = Number(button.dataset.modalCapacity);
    if (next < occupied) return toast(`Esta mesa tiene ${occupied} invitados asignados.`);
    capacity = next;
    updateUi();
  };
  backdrop.querySelectorAll('[data-edit-capacity]').forEach((button) => button.onclick = () => {
    const direction = Math.sign(Number(button.dataset.editCapacity));
    const next = clamp(capacity + direction * CAPACITY_STEP, MIN_CAPACITY, MAX_CAPACITY);
    if (next < occupied) return toast(`Esta mesa tiene ${occupied} invitados asignados.`);
    capacity = next;
    updateUi();
  });
  backdrop.querySelector('#mgdSaveTable').onclick = () => {
    const name = backdrop.querySelector('#mgdEditTableName').value.trim();
    if (updateTable(table.id, { name, type: shape, capacity })) {
      closeModal();
      toast('Mesa actualizada.');
    }
  };
  backdrop.querySelector('#mgdDuplicateTable').onclick = () => {
    duplicateTable(table.id);
    closeModal();
  };
  backdrop.querySelector('#mgdDeleteTable').onclick = () => deleteTable(table.id);
}

function bindFrame(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  if (!doc?.body || !doc.getElementById('guestList') || !doc.getElementById('tablesView')) return false;
  activeFrame = frame;
  activeDoc = doc;
  mountEditor(frame, doc);

  if (!frame.dataset.mgdTablesLoadBound) {
    frame.dataset.mgdTablesLoadBound = VERSION;
    frame.addEventListener('load', () => setTimeout(() => bindFrame(frame), 80));
  }
  if (!doc.documentElement.dataset.mgdTablesObserver) {
    doc.documentElement.dataset.mgdTablesObserver = VERSION;
    const observer = new MutationObserver(() => {
      const view = doc.getElementById('tablesView');
      if (view && !view.querySelector('#mgdTablesEditor')) mountEditor(frame, doc);
    });
    observer.observe(doc.body, { childList: true, subtree: true });
  }
  return true;
}

function scanFrames() {
  const frames = [...document.querySelectorAll('#unifiedWorkspace iframe, iframe')];
  for (const frame of frames) {
    if (bindFrame(frame)) break;
  }
}

const rootObserver = new MutationObserver(scanFrames);
rootObserver.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', scanFrames);
window.addEventListener('load', scanFrames);
window.addEventListener('migrandia:wedding-context', () => {
  selectedGuestId = '';
  searchText = '';
  activeFilter = 'unassigned';
  setTimeout(scanFrames, 60);
});
window.addEventListener('migrandia:datachange', (event) => {
  if (!String(event?.detail?.source || '').startsWith('table')) scheduleRender();
});

if (document.readyState !== 'loading') scanFrames();
