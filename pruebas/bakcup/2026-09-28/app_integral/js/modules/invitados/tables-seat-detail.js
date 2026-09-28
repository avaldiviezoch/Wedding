import { getWeddingContext } from '../../services/firebase.js?v=20260814-1136-collab1';

const VERSION = '20260814-1544-seatdetail1';
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

function persist(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(buildSharedState(data)));
  try {
    activeFrame?.contentWindow?.postMessage({
      type: 'MIGRANDIA_RSVP_SYNC',
      payload: { guests: data.guests, tables: data.tables }
    }, '*');
  } catch (_) {}
  window.dispatchEvent(new CustomEvent('migrandia:datachange', {
    detail: { source: 'seat-detail-unassign', guests: data.guests.length, tables: data.tables.length }
  }));
}

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function ensureStyle(doc) {
  if (doc.getElementById('mgdSeatDetailStyle')) return;
  const style = doc.createElement('style');
  style.id = 'mgdSeatDetailStyle';
  style.textContent = `
    .mgd-seat-detail-backdrop{position:fixed;z-index:10055;inset:0;background:rgba(35,38,33,.22);backdrop-filter:blur(2px);display:flex;align-items:flex-end;justify-content:center;padding:12px;opacity:0;pointer-events:none;transition:opacity .16s ease}
    .mgd-seat-detail-backdrop.show{opacity:1;pointer-events:auto}
    .mgd-seat-detail-card{width:min(420px,100%);border-radius:22px;background:#fbf8f3;border:1px solid rgba(255,255,255,.78);box-shadow:0 24px 70px rgba(28,31,26,.24);padding:18px;transform:translateY(14px);transition:transform .18s ease}
    .mgd-seat-detail-backdrop.show .mgd-seat-detail-card{transform:none}
    .mgd-seat-detail-head{display:flex;gap:12px;align-items:center}
    .mgd-seat-detail-avatar{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:#eef1e9;color:#68735d;font-weight:800;font-size:13px;flex:none}
    .mgd-seat-detail-copy{min-width:0;flex:1}.mgd-seat-detail-copy strong{display:block;font-size:16px;color:#2f342d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mgd-seat-detail-copy span{display:block;margin-top:3px;color:#74796f;font-size:12px}
    .mgd-seat-detail-close{width:38px;height:38px;border:1px solid rgba(78,88,72,.14);border-radius:50%;background:#fff;color:#74796f;font:inherit;font-size:20px;cursor:pointer}
    .mgd-seat-detail-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
    .mgd-seat-detail-action{min-height:42px;padding:10px 13px;border:1px solid rgba(78,88,72,.14);border-radius:12px;background:#fff;color:#2f342d;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
    .mgd-seat-detail-action.danger{color:#8b4d4d;background:#fff8f7;border-color:rgba(139,77,77,.18)}
    @media(min-width:901px){.mgd-seat-detail-backdrop{align-items:center}}
    @media(prefers-reduced-motion:reduce){.mgd-seat-detail-backdrop,.mgd-seat-detail-card{transition:none!important}}
  `;
  doc.head.appendChild(style);
}

function initials(name = '') {
  return String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '•';
}

function closeDetail() {
  activeDoc?.getElementById('mgdSeatDetailBackdrop')?.classList.remove('show');
}

function showDetail(guestId) {
  const data = readState();
  const guest = data.guests.find((item) => String(item.id) === String(guestId));
  if (!guest) return;
  const table = data.tables.find((item) => String(item.id) === String(guest.tableId || ''));
  let backdrop = activeDoc.getElementById('mgdSeatDetailBackdrop');
  if (!backdrop) {
    backdrop = activeDoc.createElement('div');
    backdrop.id = 'mgdSeatDetailBackdrop';
    backdrop.className = 'mgd-seat-detail-backdrop';
    activeDoc.body.appendChild(backdrop);
  }
  const tableName = table?.name || 'Sin mesa';
  const seatLabel = guest.seatNumber ? `Silla ${guest.seatNumber}` : 'Sin silla';
  backdrop.innerHTML = `<div class="mgd-seat-detail-card" role="dialog" aria-modal="true" aria-label="Detalle del invitado">
    <div class="mgd-seat-detail-head">
      <span class="mgd-seat-detail-avatar">${esc(initials(guest.name))}</span>
      <div class="mgd-seat-detail-copy"><strong>${esc(guest.name || 'Invitado')}</strong><span>${esc(tableName)} · ${esc(seatLabel)}</span></div>
      <button class="mgd-seat-detail-close" type="button" data-seat-detail-close aria-label="Cerrar">×</button>
    </div>
    <div class="mgd-seat-detail-actions">
      ${canEdit() ? `<button class="mgd-seat-detail-action danger" type="button" data-seat-detail-unassign="${esc(guest.id)}">Dejar sin mesa</button>` : ''}
      <button class="mgd-seat-detail-action" type="button" data-seat-detail-close>Listo</button>
    </div>
  </div>`;
  backdrop.onclick = (event) => {
    if (event.target === backdrop || event.target.closest('[data-seat-detail-close]')) return closeDetail();
    const unassign = event.target.closest('[data-seat-detail-unassign]');
    if (!unassign) return;
    const next = readState();
    const target = next.guests.find((item) => String(item.id) === String(unassign.dataset.seatDetailUnassign));
    if (!target) return;
    target.tableId = '';
    target.seatId = '';
    target.seatNumber = null;
    closeDetail();
    persist(next);
  };
  requestAnimationFrame(() => backdrop.classList.add('show'));
}

function bindRoot(root, doc) {
  if (!root || root.dataset.mgdSeatDetailBound === VERSION) return;
  root.dataset.mgdSeatDetailBound = VERSION;
  ensureStyle(doc);
  root.addEventListener('click', (event) => {
    const seat = event.target.closest('.mgd-seat.is-occupied[data-guest-id]');
    if (!seat) return;
    if (root.querySelector('.mgd-guest-item.is-selected')) return;
    // En escritorio el título nativo sigue disponible; el clic abre un detalle adicional.
    event.preventDefault();
    event.stopPropagation();
    showDetail(seat.dataset.guestId);
  });
}

function bindFrame(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  const root = doc?.getElementById('mgdTablesEditor');
  if (!doc?.body || !root) return false;
  activeFrame = frame;
  activeDoc = doc;
  bindRoot(root, doc);
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
window.addEventListener('migrandia:wedding-context', () => setTimeout(scan, 50));
if (document.readyState !== 'loading') scan();
