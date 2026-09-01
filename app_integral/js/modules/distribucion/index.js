import {
  normalizeTableType,
  geometryPatch,
  legacyGeometryPatch
} from './table-geometry-model.js?v=20260901-table-geometry1';

export const moduleId = 'distribucion';
const V = '20260901-distribution-table-geometry2';
const GK = 'planificador_bodas_invitados_v1';
const SK = 'planificador_bodas_datos_compartidos_v1';
const LK = 'migrandia_distribucion_invitados_link_v1';
const DB = 'AntonioEventPlannerMemory', PS = 'proposals', MS = 'meta';
const LM = 'eventPlannerProposalMemoryV1', AK = 'eventPlannerActiveProposalIdV1';
const MAX = 16, ctl = new WeakMap();
let obs = null, lock = false, extTimer = 0, resumeTimer = 0;

const cp = (value) => {
  try { return structuredClone(value); } catch (_) { return JSON.parse(JSON.stringify(value)); }
};
const id = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const txt = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
const cap = (value, high = 0) => Math.min(MAX, Math.max(4, Math.round(Number(value) || 10), Math.min(MAX, Math.round(Number(high) || 0))));
const seats = (old, count) => Array.from({ length: count }, (_, index) => ({
  ...((old || [])[index] || {}),
  id: (old || [])[index]?.id || id('seat'),
  index
}));

function norm(input = {}) {
  const data = {
    ...input,
    guests: Array.isArray(input.guests) ? input.guests.map((guest) => ({ ...guest })) : [],
    tables: Array.isArray(input.tables) ? input.tables.map((table) => ({ ...table })) : []
  };
  const high = new Map();
  data.guests.forEach((guest) => {
    const number = Number(guest.seatNumber);
    if (guest.tableId && Number.isInteger(number) && number > 0) {
      high.set(String(guest.tableId), Math.max(high.get(String(guest.tableId)) || 0, number));
    }
  });
  data.tables = data.tables.map((table, index) => {
    const count = cap(table.capacity || table.seats?.length || 10, high.get(String(table.id)) || 0);
    return {
      ...table,
      id: table.id || id('table'),
      name: String(table.name || `Mesa ${index + 1}`).trim() || `Mesa ${index + 1}`,
      type: normalizeTableType(table.type),
      capacity: count,
      seats: seats(table.seats, count)
    };
  });

  const tableMap = new Map(data.tables.map((table) => [String(table.id), table]));
  const used = new Map();
  data.guests = data.guests.map((guest) => {
    const next = { ...guest };
    const table = next.tableId ? tableMap.get(String(next.tableId)) : null;
    if (!table) {
      next.tableId = '';
      next.seatId = '';
      next.seatNumber = null;
      return next;
    }
    const key = String(table.id);
    if (!used.has(key)) used.set(key, new Set());
    const occupied = used.get(key);
    let seat = Number(next.seatNumber) - 1;
    if (!Number.isInteger(seat) || seat < 0 || seat >= table.capacity || occupied.has(seat)) {
      seat = table.seats.findIndex((_, index) => !occupied.has(index));
    }
    if (seat < 0) {
      next.tableId = '';
      next.seatId = '';
      next.seatNumber = null;
      return next;
    }
    occupied.add(seat);
    next.tableId = table.id;
    next.seatNumber = seat + 1;
    next.seatId = table.seats[seat].id;
    return next;
  });
  return data;
}

function read() {
  try { return norm(JSON.parse(localStorage.getItem(GK) || '{}')); }
  catch (_) { return norm({}); }
}
const sig = (data) => JSON.stringify({ guests: data.guests, tables: data.tables });

function shared(data, source) {
  return {
    version: 4,
    updatedAt: new Date().toISOString(),
    source,
    guests: data.guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      status: guest.status,
      invitationSent: !!guest.invitationSent,
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
        .filter((guest) => String(guest.tableId || '') === String(table.id))
        .sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999))
        .map((guest) => guest.id)
    }))
  };
}

function save(input, source = 'distribucion-link') {
  const data = norm(input), old = read();
  if (sig(data) === sig(old)) return old;
  lock = true;
  try {
    localStorage.setItem(GK, JSON.stringify(data));
    localStorage.setItem(SK, JSON.stringify(shared(data, source)));
    document.getElementById('unifiedWorkspace')?.querySelectorAll('iframe').forEach((frame) => {
      try {
        if (frame.contentDocument?.getElementById('guestList')) {
          frame.contentWindow.postMessage({ type: 'MIGRANDIA_RSVP_SYNC', payload: { guests: data.guests, tables: data.tables } }, '*');
        }
      } catch (_) {}
    });
    window.dispatchEvent(new CustomEvent('migrandia:datachange', {
      detail: { source, guests: data.guests.length, tables: data.tables.length }
    }));
  } finally {
    queueMicrotask(() => { lock = false; });
  }
  return data;
}

function lread() {
  try {
    const value = JSON.parse(localStorage.getItem(LK) || '{}');
    return { guestIds: value.guestIds || {}, proposals: value.proposals || {} };
  } catch (_) {
    return { guestIds: {}, proposals: {} };
  }
}
function lsave(value) {
  try {
    localStorage.setItem(LK, JSON.stringify({ version: 1, guestIds: value.guestIds || {}, proposals: value.proposals || {} }));
  } catch (_) {}
}
function pe(link, proposalId) {
  return link.proposals[proposalId] || (link.proposals[proposalId] = { initialized: false, ready: false, tables: {} });
}

function guestMap(data, snapshot, link) {
  const valid = new Set(data.guests.map((guest) => String(guest.id))), used = new Set();
  data.guests.forEach((guest) => {
    const key = String(guest.id), number = Number(link.guestIds[key]);
    if (!Number.isFinite(number) || number <= 0 || used.has(number)) delete link.guestIds[key];
    else used.add(number);
  });
  const bucket = new Map();
  data.guests.forEach((guest) => {
    const key = txt(guest.name);
    if (!bucket.has(key)) bucket.set(key, []);
    bucket.get(key).push(String(guest.id));
  });
  (snapshot.guests || []).forEach((guest) => {
    const number = Number(guest.id), source = guest.sourceGuestId ? String(guest.sourceGuestId) : '';
    if (Number.isFinite(number) && source && valid.has(source) && !used.has(number) && !Number.isFinite(Number(link.guestIds[source]))) {
      link.guestIds[source] = number;
      used.add(number);
    }
  });
  (snapshot.guests || []).forEach((guest) => {
    const number = Number(guest.id);
    if (!Number.isFinite(number) || used.has(number)) return;
    const available = (bucket.get(txt(guest.name)) || []).filter((key) => !Number.isFinite(Number(link.guestIds[key])));
    if (available.length) {
      link.guestIds[available[0]] = number;
      used.add(number);
    }
  });
  let number = Math.max(100000, ...used, 99999) + 1;
  data.guests.forEach((guest) => {
    const key = String(guest.id);
    if (Number.isFinite(Number(link.guestIds[key]))) return;
    while (used.has(number)) number += 1;
    link.guestIds[key] = number;
    used.add(number++);
  });
  return new Map(data.guests.map((guest) => [Number(link.guestIds[String(guest.id)]), String(guest.id)]));
}

const lt = (snapshot) => (snapshot.elements || []).filter((element) => element?.type === 'table');
// Solo los cambios que requieren que el legacy reconstruya su estado interno
// pueden recargar el iframe. Forma y medidas se dibujan en vivo por la capa
// moderna y NO forman parte de esta firma para evitar ciclos de recarga.
const tableSig = (record) => JSON.stringify(lt(record?.data || {}).map((element) => ({
  id: element.id,
  label: element.label,
  capacity: element.capacity,
  sharedTableId: element.sharedTableId
})));

function nextE(snapshot) {
  return Math.max(Number(snapshot.uid) || 1, ...(snapshot.elements || []).map((element) => Number(element.id) || 0)) + 1;
}

function newLegacy(table, snapshot, index) {
  const count = cap(table.capacity || 10), elementId = nextE(snapshot);
  const geometry = legacyGeometryPatch({ ...table, capacity: count });
  const element = {
    id: elementId,
    type: 'table',
    label: table.name || `Mesa ${index + 1}`,
    x: 720 + (index % 4) * 220,
    y: 360 + Math.floor(index / 4) * 220,
    rotation: Number(table.rotation) || 0,
    color: '#d9b978',
    locked: false,
    seats: Array(count).fill(null),
    sharedTableId: String(table.id),
    ...geometry
  };
  (snapshot.elements || (snapshot.elements = [])).push(element);
  snapshot.uid = Math.max(Number(snapshot.uid) || 1, elementId + 1);
  return element;
}

function newCanon(element, data) {
  const highest = (element.seats || []).reduce((max, value, index) => value !== null && value !== '' && value !== undefined ? Math.max(max, index + 1) : max, 0);
  const count = cap(element.capacity || element.seats?.length || 10, highest);
  let name = String(element.label || '').trim();
  if (!name || /^mesa\s+\d+\s+personas$/i.test(name)) {
    let index = 1;
    const used = new Set(data.tables.map((table) => txt(table.name)));
    while (used.has(txt(`Mesa ${index}`))) index += 1;
    name = `Mesa ${index}`;
  }
  const inferredType = element.sharedTableType
    ? normalizeTableType(element.sharedTableType)
    : element.shape === 'rect'
      ? (Math.abs(Number(element.widthM || 0) - Number(element.heightM || 0)) < 0.05 ? 'square' : 'rectangular')
      : 'round';
  const geometry = geometryPatch({ type: inferredType, capacity: count }, {
    type: inferredType,
    capacity: count,
    tabletopWidthM: element.tabletopWidthM,
    tabletopHeightM: element.tabletopHeightM
  });
  if (typeof element.dimensionsCustom === 'boolean') geometry.dimensionsCustom = element.dimensionsCustom;
  return {
    id: id('table'),
    name,
    ...geometry,
    seats: seats([], count),
    rotation: Number(element.rotation) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function mapTables(data, snapshot, proposal, mode = 'union') {
  if (mode !== 'union') {
    Object.entries({ ...proposal.tables }).forEach(([canonicalId, elementId]) => {
      const hasCanonical = data.tables.some((table) => String(table.id) === String(canonicalId));
      const hasLegacy = lt(snapshot).some((element) => String(element.id) === String(elementId));
      if (hasCanonical && hasLegacy) return;
      if (hasCanonical && !hasLegacy && mode === 'pull') {
        data.guests.forEach((guest) => {
          if (String(guest.tableId || '') === String(canonicalId)) {
            guest.tableId = '';
            guest.seatId = '';
            guest.seatNumber = null;
          }
        });
        data.tables = data.tables.filter((table) => String(table.id) !== String(canonicalId));
      } else if (!hasCanonical && hasLegacy && mode === 'push') {
        snapshot.elements = (snapshot.elements || []).filter((element) => !(element.type === 'table' && String(element.id) === String(elementId)));
      }
      delete proposal.tables[canonicalId];
    });
  }

  const canonicalById = new Map(data.tables.map((table) => [String(table.id), table]));
  const legacyById = new Map(lt(snapshot).map((element) => [String(element.id), element]));
  const usedCanonical = new Set(), usedLegacy = new Set();

  Object.entries({ ...proposal.tables }).forEach(([canonicalId, elementId]) => {
    if (canonicalById.has(canonicalId) && legacyById.has(String(elementId)) && !usedCanonical.has(canonicalId) && !usedLegacy.has(String(elementId))) {
      usedCanonical.add(canonicalId);
      usedLegacy.add(String(elementId));
    } else {
      delete proposal.tables[canonicalId];
    }
  });

  lt(snapshot).forEach((element) => {
    const canonicalId = element.sharedTableId ? String(element.sharedTableId) : '';
    if (canonicalId && canonicalById.has(canonicalId) && !usedCanonical.has(canonicalId) && !usedLegacy.has(String(element.id))) {
      proposal.tables[canonicalId] = Number(element.id);
      usedCanonical.add(canonicalId);
      usedLegacy.add(String(element.id));
    }
  });

  data.tables.forEach((table) => {
    if (usedCanonical.has(String(table.id))) return;
    const matches = lt(snapshot).filter((element) => !usedLegacy.has(String(element.id)) && txt(element.label) === txt(table.name));
    if (matches.length === 1) {
      proposal.tables[String(table.id)] = Number(matches[0].id);
      usedCanonical.add(String(table.id));
      usedLegacy.add(String(matches[0].id));
    }
  });

  const canonicalAvailable = data.tables.filter((table) => !usedCanonical.has(String(table.id)));
  const legacyAvailable = lt(snapshot).filter((element) => !usedLegacy.has(String(element.id)));
  for (let index = 0; index < Math.min(canonicalAvailable.length, legacyAvailable.length); index += 1) {
    proposal.tables[String(canonicalAvailable[index].id)] = Number(legacyAvailable[index].id);
    usedCanonical.add(String(canonicalAvailable[index].id));
    usedLegacy.add(String(legacyAvailable[index].id));
  }

  if (mode === 'pull' || mode === 'union') {
    lt(snapshot).forEach((element) => {
      if (usedLegacy.has(String(element.id))) return;
      const table = newCanon(element, data);
      data.tables.push(table);
      proposal.tables[String(table.id)] = Number(element.id);
      usedLegacy.add(String(element.id));
    });
  }
  if (mode === 'push' || mode === 'union') {
    data.tables.forEach((table, index) => {
      if (Object.prototype.hasOwnProperty.call(proposal.tables, String(table.id))) return;
      const element = newLegacy(table, snapshot, index);
      proposal.tables[String(table.id)] = Number(element.id);
    });
  }
  return proposal;
}

function pullSnap(snapshot, input, link, proposalId, initial = false) {
  let data = norm(input);
  const proposal = pe(link, proposalId);
  mapTables(data, snapshot, proposal, initial ? 'union' : 'pull');
  const reverse = guestMap(data, snapshot, link);

  if (proposal.ready) {
    (snapshot.guests || []).forEach((guest) => {
      const number = Number(guest.id);
      if (!Number.isFinite(number) || reverse.has(number) || !String(guest.name || '').trim()) return;
      const same = data.guests.find((item) => txt(item.name) === txt(guest.name));
      if (same) {
        link.guestIds[String(same.id)] = number;
        reverse.set(number, String(same.id));
        return;
      }
      const next = {
        id: id('guest'),
        name: String(guest.name).trim(),
        status: 'pending',
        invitationSent: false,
        side: 'ambos',
        relation: '',
        restriction: 'Ninguna',
        tableId: '',
        seatId: '',
        seatNumber: null,
        notes: ''
      };
      data.guests.push(next);
      link.guestIds[String(next.id)] = number;
      reverse.set(number, String(next.id));
    });
  }

  const canonicalMap = new Map(data.tables.map((table) => [String(table.id), table])), assigned = new Set();
  Object.entries(proposal.tables).forEach(([canonicalId, elementId]) => {
    const element = lt(snapshot).find((item) => String(item.id) === String(elementId));
    const table = canonicalMap.get(canonicalId);
    if (!element || !table) return;
    const legacySeats = Array.isArray(element.seats) ? element.seats : [];
    const highest = legacySeats.reduce((max, value, index) => value !== null && value !== '' && value !== undefined ? Math.max(max, index + 1) : max, 0);
    const count = cap(element.capacity || legacySeats.length || table.capacity, highest);
    const controlledSeatCount = Math.min(legacySeats.length, count);
    const name = String(element.label || table.name).trim() || table.name;
    const type = normalizeTableType(element.sharedTableType || table.type);
    const geometry = geometryPatch(table, {
      type,
      capacity: count,
      tabletopWidthM: element.tabletopWidthM,
      tabletopHeightM: element.tabletopHeightM
    });
    if (typeof element.dimensionsCustom === 'boolean') geometry.dimensionsCustom = element.dimensionsCustom;
    if (name !== table.name || count !== table.capacity || type !== table.type || geometry.tabletopWidthM !== table.tabletopWidthM || geometry.tabletopHeightM !== table.tabletopHeightM) {
      table.updatedAt = new Date().toISOString();
    }
    table.name = name;
    Object.assign(table, geometry);
    table.seats = seats(table.seats, count);

    // El editor heredado todavía materializa como máximo 10 slots. Solo esos
    // slots son autoritativos en un pull; los asientos 11–16 se preservan en
    // el estado canónico hasta que la capa moderna los edite explícitamente.
    data.guests.forEach((guest) => {
      if (String(guest.tableId || '') !== String(table.id)) return;
      const seatIndex = Number(guest.seatNumber) - 1;
      if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= count || seatIndex < controlledSeatCount) {
        guest.tableId = '';
        guest.seatId = '';
        guest.seatNumber = null;
      }
    });

    legacySeats.slice(0, controlledSeatCount).forEach((value, index) => {
      if (value === null || value === '' || value === undefined) return;
      const guestId = reverse.get(Number(value));
      if (!guestId || assigned.has(guestId)) return;
      const guest = data.guests.find((item) => String(item.id) === guestId);
      if (!guest) return;
      guest.tableId = table.id;
      guest.seatNumber = index + 1;
      guest.seatId = table.seats[index].id;
      assigned.add(guestId);
    });
  });
  return norm(data);
}

function pushSnap(snapshot, input, link, proposalId) {
  const data = norm(input), proposal = pe(link, proposalId);
  mapTables(data, snapshot, proposal, 'push');
  guestMap(data, snapshot, link);
  snapshot.guests = data.guests.map((guest) => ({
    id: Number(link.guestIds[String(guest.id)]),
    name: String(guest.name || 'Invitado'),
    sourceGuestId: String(guest.id),
    status: guest.status || '',
    rsvpStatus: guest.rsvpStatus || '',
    photoId: guest.photoId || '',
    photoThumb: guest.photoThumb || ''
  }));
  snapshot.guestUid = Math.max(1, ...snapshot.guests.map((guest) => guest.id + 1));

  const guestMapByTable = new Map();
  data.guests.forEach((guest) => {
    if (!guest.tableId) return;
    const key = String(guest.tableId);
    if (!guestMapByTable.has(key)) guestMapByTable.set(key, []);
    guestMapByTable.get(key).push(guest);
  });

  data.tables.forEach((table) => {
    const element = lt(snapshot).find((item) => String(item.id) === String(proposal.tables[String(table.id)]));
    if (!element) return;
    const count = cap(table.capacity || 10);
    const geometry = legacyGeometryPatch({ ...table, capacity: count });
    element.type = 'table';
    element.label = table.name || element.label;
    element.sharedTableId = String(table.id);
    Object.assign(element, geometry);
    element.seats = Array(count).fill(null);
    (guestMapByTable.get(String(table.id)) || []).forEach((guest) => {
      const index = Number(guest.seatNumber) - 1;
      const value = Number(link.guestIds[String(guest.id)]);
      if (Number.isInteger(index) && index >= 0 && index < count && Number.isFinite(value) && element.seats[index] === null) {
        element.seats[index] = value;
      }
    });
  });
  proposal.initialized = true;
  proposal.ready = true;
  return snapshot;
}

function openDb(targetWindow) {
  return new Promise((resolve, reject) => {
    if (!targetWindow?.indexedDB) return reject();
    const request = targetWindow.indexedDB.open(DB);
    let upgrading = false;
    request.onupgradeneeded = () => {
      upgrading = true;
      try { request.transaction.abort(); } catch (_) {}
    };
    request.onsuccess = () => upgrading ? (request.result.close(), reject()) : resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
const get = (db, store, key) => new Promise((resolve, reject) => {
  try {
    const request = db.transaction(store, 'readonly').objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  } catch (error) { reject(error); }
});
const put = (db, store, value) => new Promise((resolve, reject) => {
  try {
    const transaction = db.transaction(store, 'readwrite');
    transaction.objectStore(store).put(value);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  } catch (error) { reject(error); }
});

async function planner(targetWindow) {
  try {
    const db = await openDb(targetWindow);
    try {
      const meta = await get(db, MS, 'activeProposalId');
      const activeId = meta?.value || targetWindow.localStorage.getItem(AK);
      const record = activeId ? await get(db, PS, activeId) : null;
      if (record) return { b: 'idb', aid: String(activeId), r: record };
    } finally { db.close(); }
  } catch (_) {}
  try {
    const memory = JSON.parse(targetWindow.localStorage.getItem(LM) || '{}');
    const activeId = memory.activeProposalId || targetWindow.localStorage.getItem(AK);
    const record = (memory.proposals || []).find((item) => String(item.id) === String(activeId)) || (memory.proposals || [])[0];
    return { b: 'ls', aid: record ? String(record.id) : String(activeId || ''), r: record || null };
  } catch (_) {
    return { b: 'ls', aid: '', r: null };
  }
}

async function writePlan(targetWindow, storage, record) {
  const next = { ...record, updatedAt: new Date().toISOString() };
  if (storage.b === 'idb') {
    try {
      const db = await openDb(targetWindow);
      try {
        await put(db, PS, next);
        return next;
      } finally { db.close(); }
    } catch (_) {}
  }
  try {
    const memory = JSON.parse(targetWindow.localStorage.getItem(LM) || '{}');
    const proposals = Array.isArray(memory.proposals) ? memory.proposals : [];
    const index = proposals.findIndex((item) => String(item.id) === String(next.id));
    if (index >= 0) proposals[index] = next;
    else proposals.push(next);
    memory.proposals = proposals;
    memory.activeProposalId = next.id;
    targetWindow.localStorage.setItem(LM, JSON.stringify(memory));
    targetWindow.localStorage.setItem(AK, String(next.id));
    return next;
  } catch (_) {
    return null;
  }
}

const proj = (record) => JSON.stringify({
  g: record?.data?.guests || [],
  t: lt(record?.data || {}).map((element) => ({
    id: element.id,
    label: element.label,
    capacity: element.capacity,
    seats: element.seats,
    sharedTableId: element.sharedTableId,
    sharedTableType: element.sharedTableType,
    shape: element.shape,
    widthM: element.widthM,
    heightM: element.heightM,
    tabletopWidthM: element.tabletopWidthM,
    tabletopHeightM: element.tabletopHeightM,
    dimensionsCustom: element.dimensionsCustom,
    dimensionShape: element.dimensionShape
  })),
  uid: record?.data?.uid || 0
});

function plannerSaveState(controller) {
  try { return String(controller.frame.contentDocument?.getElementById('autosaveStatus')?.dataset?.state || ''); }
  catch (_) { return ''; }
}
function deferPush(controller) {
  clearTimeout(controller.pushTimer);
  controller.pushTimer = setTimeout(() => push(controller), 220);
}
function refreshLiveFrame(controller, structureSig) {
  clearTimeout(controller.reloadTimer);
  controller.reloadTimer = setTimeout(() => {
    if (!controller.frame.isConnected) return;
    const state = plannerSaveState(controller);
    if (state === 'saving') return refreshLiveFrame(controller, structureSig);
    if (state === 'error') {
      console.warn('Distribución: se evitó refrescar porque hay cambios sin guardar.');
      return;
    }
    // El mismo estado estructural nunca debe provocar una segunda recarga.
    // El controlador vive en el padre y conserva esta firma aunque el iframe
    // vuelva a cargar, cortando cualquier ciclo legacy ↔ puente.
    if (structureSig && controller.lastReloadSig === structureSig) return;
    controller.lastReloadSig = structureSig || controller.lastReloadSig || '';
    try { controller.frame.contentWindow.location.reload(); } catch (_) {}
  }, 120);
}

async function push(controller) {
  if (controller.busy || !controller.frame.isConnected) return;
  const state = plannerSaveState(controller);
  if (state === 'saving') return deferPush(controller);
  if (state === 'error') {
    console.warn('Distribución: sincronización pospuesta por un error de guardado.');
    return;
  }
  controller.busy = true;
  try {
    const storage = await planner(controller.frame.contentWindow);
    if (!storage.r?.data || !storage.aid) return;
    const data = read(), link = lread(), before = proj(storage.r), beforeTables = tableSig(storage.r), nextRecord = cp(storage.r);
    nextRecord.data = cp(nextRecord.data);
    pushSnap(nextRecord.data, data, link, storage.aid);
    lsave(link);
    controller.aid = storage.aid;
    if (before !== proj(nextRecord)) {
      const tablesChanged = beforeTables !== tableSig(nextRecord);
      const written = await writePlan(controller.frame.contentWindow, storage, nextRecord);
      controller.last = written?.updatedAt || '';
      if (written && tablesChanged) refreshLiveFrame(controller, tableSig(nextRecord));
    } else {
      controller.last = storage.r.updatedAt || '';
    }
  } finally {
    controller.busy = false;
  }
}

async function pull(controller, initial = false) {
  if (controller.busy || !controller.frame.isConnected) return;
  controller.busy = true;
  try {
    const storage = await planner(controller.frame.contentWindow);
    if (!storage.r?.data || !storage.aid) return;
    const old = read(), link = lread(), data = pullSnap(storage.r.data, old, link, storage.aid, initial);
    pe(link, storage.aid).initialized = true;
    lsave(link);
    if (sig(old) !== sig(data)) save(data, initial ? 'distribucion-migration' : 'distribucion-seating');
    controller.aid = storage.aid;
    controller.last = storage.r.updatedAt || '';
  } finally {
    controller.busy = false;
  }
}

async function init(controller) {
  if (controller.init) return;
  controller.init = true;
  try {
    let storage;
    for (let index = 0; index < 15; index += 1) {
      storage = await planner(controller.frame.contentWindow);
      if (storage.r?.data && storage.aid) break;
      await new Promise((resolve) => setTimeout(resolve, 160));
    }
    if (!storage?.r?.data) return;
    let data = read(), link = lread(), proposal = pe(link, storage.aid);
    if (!proposal.initialized) {
      const before = sig(data);
      mapTables(data, storage.r.data, proposal, 'union');
      const reverse = guestMap(data, storage.r.data, link);
      let legacyAssigned = 0;
      Object.values(proposal.tables).forEach((elementId) => {
        const element = lt(storage.r.data).find((item) => String(item.id) === String(elementId));
        (element?.seats || []).forEach((value) => { if (reverse.has(Number(value))) legacyAssigned += 1; });
      });
      if (!data.guests.some((guest) => guest.tableId) && legacyAssigned) data = pullSnap(storage.r.data, data, link, storage.aid, true);
      proposal.initialized = true;
      lsave(link);
      if (sig(read()) !== sig(data) || before !== sig(data)) data = save(data, 'distribucion-migration');
      controller.aid = storage.aid;
      await push(controller);
      return;
    }
    controller.aid = storage.aid;
    await push(controller);
  } finally {
    controller.init = false;
  }
}

function seatChange(controller, select) {
  const link = lread(), proposal = pe(link, controller.aid || '');
  const elementId = String(select.dataset.tableId || ''), seatIndex = Number(select.dataset.seatIndex);
  const canonicalId = Object.entries(proposal.tables).find(([, value]) => String(value) === elementId)?.[0];
  if (!canonicalId || !Number.isInteger(seatIndex) || seatIndex < 0) return;
  const data = read(), table = data.tables.find((item) => String(item.id) === canonicalId);
  if (!table || seatIndex >= table.capacity) return;
  guestMap(data, { guests: [] }, link);
  const reverse = new Map(Object.entries(link.guestIds).map(([guestId, value]) => [Number(value), guestId]));
  const selectedGuestId = select.value === '' ? '' : reverse.get(Number(select.value)) || '';
  data.guests.forEach((guest) => {
    const here = String(guest.tableId || '') === canonicalId && Number(guest.seatNumber) === seatIndex + 1;
    const selected = selectedGuestId && String(guest.id) === selectedGuestId;
    if (here && !selected) {
      guest.tableId = '';
      guest.seatId = '';
      guest.seatNumber = null;
    }
    if (selected) {
      guest.tableId = table.id;
      guest.seatNumber = seatIndex + 1;
      guest.seatId = table.seats[seatIndex].id;
    }
  });
  lsave(link);
  save(data, 'distribucion-seat-change');
}

async function poll(controller) {
  if (document.hidden) return;
  if (!controller.frame.isConnected) {
    clearInterval(controller.timer);
    return;
  }
  if (controller.busy || controller.init) return;
  const storage = await planner(controller.frame.contentWindow);
  if (!storage.r?.data) return;
  if (controller.aid && String(storage.aid) !== String(controller.aid)) {
    controller.aid = String(storage.aid);
    await pull(controller, false);
    await push(controller);
    return;
  }
  if (String(storage.r.updatedAt || '') === String(controller.last || '')) return;
  controller.last = storage.r.updatedAt || '';
  await pull(controller, false);
  await push(controller);
}

function isDist(doc) {
  return !!(doc?.getElementById('planner') && doc.getElementById('itemsLayer') && doc.getElementById('seatEditor') && doc.getElementById('proposalModal'));
}
function bind(frame) {
  if (!(frame instanceof HTMLIFrameElement)) return;
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return; }
  if (!isDist(doc)) return;
  let controller = ctl.get(frame);
  if (!controller) {
    controller = { frame, aid: '', last: '', busy: false, init: false, timer: 0, reloadTimer: 0, pushTimer: 0, lastReloadSig: '', doc: null };
    ctl.set(frame, controller);
  }
  if (controller.doc === doc) return;
  controller.doc = doc;
  clearInterval(controller.timer);
  if (doc.documentElement.dataset.mgdDistGuestLink !== V) {
    doc.documentElement.dataset.mgdDistGuestLink = V;
    doc.addEventListener('change', (event) => {
      const select = event.target?.closest?.('#seatEditor select[data-seat-index]');
      if (select) {
        seatChange(controller, select);
        setTimeout(() => poll(controller), 420);
      }
    }, true);
  }
  controller.timer = setInterval(() => poll(controller).catch(console.warn), 800);
  init(controller).catch((error) => console.warn('Distribución: vínculo con Invitados', error));
}
function scan() {
  document.getElementById('unifiedWorkspace')?.querySelectorAll('iframe').forEach((frame) => {
    if (frame.dataset.mgdDistGuestLoad === V) return;
    frame.dataset.mgdDistGuestLoad = V;
    frame.addEventListener('load', () => setTimeout(() => bind(frame), 40));
    bind(frame);
  });
}
function external() {
  clearTimeout(extTimer);
  extTimer = setTimeout(() => document.getElementById('unifiedWorkspace')?.querySelectorAll('iframe').forEach((frame) => {
    const controller = ctl.get(frame);
    if (controller) push(controller);
  }), 120);
}
function start() {
  const workspace = document.getElementById('unifiedWorkspace');
  if (!workspace) return;
  if (!obs) {
    obs = new MutationObserver(scan);
    obs.observe(workspace, { childList: true });
  }
  scan();
}

window.addEventListener('migrandia:datachange', (event) => {
  if (lock || String(event.detail?.source || '').startsWith('distribucion')) return;
  external();
});
window.addEventListener('storage', (event) => {
  if (event.key === GK || event.key === SK) external();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  clearTimeout(resumeTimer);
  resumeTimer = setTimeout(() => document.getElementById('unifiedWorkspace')?.querySelectorAll('iframe').forEach((frame) => {
    const controller = ctl.get(frame);
    if (controller && !controller.busy && !controller.init) poll(controller).catch(console.warn);
  }), 120);
});
window.addEventListener('message', (event) => {
  if (event.data?.type !== 'MIGRANDIA_DISTRIBUTION_CHANGED') return;
  document.getElementById('unifiedWorkspace')?.querySelectorAll('iframe').forEach((frame) => {
    if (frame.contentWindow !== event.source) return;
    const controller = ctl.get(frame);
    if (!controller) return;
    setTimeout(() => pull(controller, false).then(() => push(controller)).catch(console.warn), 60);
  });
});

window.MiGranDiaDistributionGuestLink = Object.freeze({
  version: V,
  syncNow() { scan(); external(); },
  readState: read,
  saveState: save
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
