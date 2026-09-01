import {
  alignGeometryLimits,
  mutationTouchesGeometry
} from './table-capacity-dom.js?v=20260901-table-capacity-dom1';

const VERSION = '20260901-table-capacity-actions2';
const controllers = new WeakMap();
let observer = null;

const clone = (value) => {
  try { return structuredClone(value); } catch (_) { return JSON.parse(JSON.stringify(value)); }
};

function bridge() {
  const api = window.MiGranDiaDistributionGuestLink;
  return api && typeof api.readState === 'function' && typeof api.saveState === 'function' ? api : null;
}

function isDistributionDocument(doc) {
  return Boolean(doc?.getElementById('planner') && doc.getElementById('btnAssignGuests') && doc.getElementById('btnClearAssignments'));
}

function normalizeCapacity(value) {
  return Math.min(16, Math.max(4, Math.round(Number(value) || 10)));
}

function assignSequentially(frame) {
  const api = bridge();
  if (!api) return false;
  const data = clone(api.readState());
  const tables = Array.isArray(data.tables) ? data.tables : [];
  const guests = Array.isArray(data.guests) ? data.guests : [];

  guests.forEach((guest) => {
    guest.tableId = '';
    guest.seatId = '';
    guest.seatNumber = null;
  });

  let guestIndex = 0;
  tables.forEach((table) => {
    const capacity = normalizeCapacity(table.capacity || table.seats?.length || 10);
    const seats = Array.isArray(table.seats) ? table.seats : [];
    for (let seatIndex = 0; seatIndex < capacity && guestIndex < guests.length; seatIndex += 1) {
      const guest = guests[guestIndex++];
      guest.tableId = table.id;
      guest.seatNumber = seatIndex + 1;
      guest.seatId = seats[seatIndex]?.id || '';
    }
  });

  api.saveState(data, 'distribucion-bulk-assign');
  api.syncNow();
  try { frame.contentWindow.alert(`Se asignaron ${guestIndex} invitados por orden de lista.`); } catch (_) {}
  return true;
}

function clearAssignments(frame) {
  const api = bridge();
  if (!api) return false;
  let confirmed = true;
  try { confirmed = frame.contentWindow.confirm('¿Desasignar a todos los invitados de las mesas?'); } catch (_) {}
  if (!confirmed) return false;

  const data = clone(api.readState());
  (data.guests || []).forEach((guest) => {
    guest.tableId = '';
    guest.seatId = '';
    guest.seatNumber = null;
  });
  api.saveState(data, 'distribucion-bulk-clear');
  api.syncNow();
  return true;
}

function bindFrame(frame) {
  if (!(frame instanceof HTMLIFrameElement)) return;
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return; }
  if (!isDistributionDocument(doc)) return;

  const current = controllers.get(frame);
  if (current?.doc === doc || doc.documentElement.dataset.mgdTableCapacityActions === VERSION) return;
  current?.bodyObserver?.disconnect();

  doc.documentElement.dataset.mgdTableCapacityActions = VERSION;
  alignGeometryLimits(doc);
  setTimeout(() => alignGeometryLimits(doc), 120);
  setTimeout(() => alignGeometryLimits(doc), 480);

  doc.addEventListener('click', (event) => {
    const button = event.target?.closest?.('#btnAssignGuests,#btnClearAssignments');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (button.id === 'btnAssignGuests') assignSequentially(frame);
    else clearAssignments(frame);
  }, true);

  // Observar únicamente la aparición de la UI de geometría. El observer anterior
  // reaccionaba a cualquier childList del body y su propio textContent volvía a
  // dispararlo indefinidamente, bloqueando el hilo principal de Chrome.
  const bodyObserver = new MutationObserver((mutations) => {
    if (mutationTouchesGeometry(mutations)) alignGeometryLimits(doc);
  });
  bodyObserver.observe(doc.body, { childList: true, subtree: true });
  controllers.set(frame, { doc, bodyObserver });
}

function scan() {
  document.getElementById('unifiedWorkspace')?.querySelectorAll('iframe').forEach((frame) => {
    if (frame.dataset.mgdTableCapacityActionsLoad !== VERSION) {
      frame.dataset.mgdTableCapacityActionsLoad = VERSION;
      frame.addEventListener('load', () => setTimeout(() => bindFrame(frame), 50));
    }
    bindFrame(frame);
  });
}

function start() {
  const workspace = document.getElementById('unifiedWorkspace');
  if (!workspace) return;
  if (!observer) {
    observer = new MutationObserver(scan);
    observer.observe(workspace, { childList: true });
  }
  scan();
}

window.MiGranDiaDistributionCapacityActions = Object.freeze({ version: VERSION, refresh: scan });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
