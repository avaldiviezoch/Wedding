import { getWeddingContext } from '../../services/firebase.js?v=20260814-1136-collab1';

const VERSION = '20260814-1618-access1';
const STORAGE_KEY = 'planificador_bodas_invitados_v1';
const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';
let activeFrame = null;
let activeDoc = null;

function canEdit() {
  return ['owner', 'admin', 'editor'].includes(String(getWeddingContext()?.role || 'viewer'));
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

function buildSharedState(data) {
  return {
    version: 3,
    updatedAt: new Date().toISOString(),
    source: 'invitados',
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

function persistPosition(tableId, dx, dy) {
  const data = readState();
  const table = data.tables.find((item) => String(item.id) === String(tableId));
  if (!table) return;
  const x = Number.isFinite(Number(table.positionX)) ? Number(table.positionX) : 28;
  const y = Number.isFinite(Number(table.positionY)) ? Number(table.positionY) : 28;
  table.positionX = Math.max(0, Math.round(x + dx));
  table.positionY = Math.max(0, Math.round(y + dy));
  table.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(buildSharedState(data)));
  try {
    activeFrame?.contentWindow?.postMessage({
      type: 'MIGRANDIA_RSVP_SYNC',
      payload: { guests: data.guests, tables: data.tables }
    }, '*');
  } catch (_) {}
  window.dispatchEvent(new CustomEvent('migrandia:datachange', {
    detail: { source: 'table-position-keyboard', guests: data.guests.length, tables: data.tables.length }
  }));
}

function ensureStyle(doc) {
  if (doc.getElementById('mgdTablesAccessibilityStyle')) return;
  const style = doc.createElement('style');
  style.id = 'mgdTablesAccessibilityStyle';
  style.textContent = `
    .mgd-tables-editor.is-readonly .mgd-table-move-handle{display:none!important}
    .mgd-table-move-handle:focus-visible,.mgd-canvas-tool:focus-visible,.mgd-table-edit:focus-visible,.mgd-seat:focus-visible,.mgd-guest-item:focus-visible{outline:3px solid rgba(111,125,93,.28);outline-offset:2px}
    .mgd-canvas-tool,.mgd-table-move-handle{min-height:40px;min-width:40px}
    .mgd-sr-live{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
  `;
  doc.head.appendChild(style);
}

function announce(doc, message) {
  let live = doc.getElementById('mgdTablesLiveRegion');
  if (!live) {
    live = doc.createElement('div');
    live.id = 'mgdTablesLiveRegion';
    live.className = 'mgd-sr-live';
    live.setAttribute('aria-live', 'polite');
    doc.body.appendChild(live);
  }
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = message; });
}

function bindRoot(root, doc) {
  if (!root || root.dataset.mgdAccessibilityBound === VERSION) return;
  root.dataset.mgdAccessibilityBound = VERSION;
  ensureStyle(doc);

  root.addEventListener('keydown', (event) => {
    const handle = event.target.closest('[data-table-move-handle]');
    if (!handle || !canEdit()) return;
    const step = event.shiftKey ? 40 : 12;
    let dx = 0, dy = 0;
    if (event.key === 'ArrowLeft') dx = -step;
    else if (event.key === 'ArrowRight') dx = step;
    else if (event.key === 'ArrowUp') dy = -step;
    else if (event.key === 'ArrowDown') dy = step;
    else return;
    event.preventDefault();
    event.stopPropagation();
    persistPosition(handle.dataset.tableMoveHandle, dx, dy);
    const card = handle.closest('.mgd-table-card');
    announce(doc, `${card?.querySelector('.mgd-table-body strong')?.textContent || 'Mesa'} movida.`);
  }, true);
}

function bindFrame(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  const root = doc?.getElementById('mgdTablesEditor');
  if (!doc?.body || !root) return false;
  activeFrame = frame;
  activeDoc = doc;
  bindRoot(root, doc);
  ensureStyle(doc);
  return true;
}

function scan() {
  for (const frame of document.querySelectorAll('#unifiedWorkspace iframe, iframe')) {
    if (bindFrame(frame)) break;
  }
}

const observer = new MutationObserver(scan);
observer.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', scan);
window.addEventListener('load', scan);
window.addEventListener('migrandia:wedding-context', () => setTimeout(scan, 60));
if (document.readyState !== 'loading') scan();
