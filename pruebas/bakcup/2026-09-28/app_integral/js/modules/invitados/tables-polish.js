const VERSION = '20260814-1558-polish1';
const previous = new Map();
let raf = 0;

function occupancy(card) {
  const text = card.querySelector('.mgd-table-body span')?.textContent || '';
  const match = text.match(/(\d+)\s*\/\s*(\d+)/);
  const occupied = match ? Number(match[1]) : 0;
  const capacity = match ? Number(match[2]) : 0;
  return { occupied, capacity };
}

function statusLabel(occupied, capacity) {
  if (!occupied) return 'Vacía';
  if (capacity > 0 && occupied >= capacity) return 'Completa';
  return 'Parcial';
}

function ensureStyle(doc) {
  if (doc.getElementById('mgdTablesPolishStyle')) return;
  const style = doc.createElement('style');
  style.id = 'mgdTablesPolishStyle';
  style.textContent = `
    .mgd-filter{font-size:12px!important;min-height:36px;padding:8px 11px!important}
    .mgd-guests-head p,.mgd-table-meta-row,.mgd-selection-hint,.mgd-unassigned-drop{font-size:12px!important}
    .mgd-guest-copy strong{font-size:13px!important}.mgd-guest-copy span{font-size:12px!important}
    .mgd-table-body strong{font-size:14px!important}.mgd-table-body span{font-size:13px!important}
    .mgd-table-edit{width:40px!important;height:40px!important}
    .mgd-modal-close{min-width:40px;min-height:40px}
    .mgd-stepper button{width:42px!important;height:42px!important}
    .mgd-seat{width:32px!important;height:32px!important;margin:-16px 0 0 -16px!important}
    .mgd-table-status{display:inline-flex;align-items:center;justify-content:center;min-height:22px;padding:3px 7px;border:1px solid rgba(78,88,72,.12);border-radius:999px;background:rgba(255,255,255,.7);color:#6f756b;font-size:11px;font-weight:700;white-space:nowrap}
    .mgd-table-status[data-state="complete"]{background:#f2ede5;color:#776b61}.mgd-table-status[data-state="empty"]{background:#f7f8f5;color:#7d8279}
    .mgd-table-card.mgd-new-table{animation:mgdNewTable .34s ease both}
    .mgd-table-card.mgd-guest-placed .mgd-table-body{animation:mgdGuestPlaced .42s ease}
    .mgd-table-card.mgd-capacity-changed .mgd-seat{animation:mgdSeatBloom .38s ease}
    .mgd-table-card.mgd-completed-now{animation:mgdCompleted .55s ease}
    @keyframes mgdNewTable{0%{opacity:0;transform:translateY(8px) scale(.975)}100%{opacity:1;transform:none}}
    @keyframes mgdGuestPlaced{0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 9px 22px rgba(86,73,61,.08)}50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 0 0 5px rgba(111,125,93,.10),0 12px 28px rgba(86,73,61,.11)}}
    @keyframes mgdSeatBloom{0%{transform:scale(.82);opacity:.45}100%{transform:scale(1);opacity:1}}
    @keyframes mgdCompleted{0%,100%{box-shadow:0 12px 30px rgba(58,65,53,.07)}50%{box-shadow:0 0 0 4px rgba(200,170,145,.12),0 18px 38px rgba(58,65,53,.10)}}
    @media(max-width:620px){.mgd-btn,.mgd-mobile-guests-button,.mgd-capacity{min-height:44px}.mgd-table-edit{width:42px!important;height:42px!important}}
    @media(prefers-reduced-motion:reduce){.mgd-new-table,.mgd-guest-placed .mgd-table-body,.mgd-capacity-changed .mgd-seat,.mgd-completed-now{animation:none!important}}
  `;
  doc.head.appendChild(style);
}

function decorateCard(card) {
  const id = String(card.dataset.tableId || '');
  if (!id) return;
  const current = occupancy(card);
  const old = previous.get(id);
  const row = card.querySelector('.mgd-table-meta-row');
  if (row) {
    let status = row.querySelector('.mgd-table-status');
    if (!status) {
      status = card.ownerDocument.createElement('span');
      status.className = 'mgd-table-status';
      row.insertAdjacentElement('afterend', status);
      status.style.marginTop = '7px';
    }
    const label = statusLabel(current.occupied, current.capacity);
    status.textContent = label;
    status.dataset.state = label === 'Completa' ? 'complete' : label === 'Vacía' ? 'empty' : 'partial';
  }
  card.setAttribute('aria-label', `${card.querySelector('.mgd-table-body strong')?.textContent || 'Mesa'}, ${current.occupied} de ${current.capacity} lugares, ${statusLabel(current.occupied, current.capacity)}`);

  if (!old) {
    card.classList.add('mgd-new-table');
  } else {
    if (current.occupied > old.occupied) card.classList.add('mgd-guest-placed');
    if (current.capacity !== old.capacity) card.classList.add('mgd-capacity-changed');
    if (current.capacity > 0 && current.occupied >= current.capacity && old.occupied < old.capacity) card.classList.add('mgd-completed-now');
  }
  previous.set(id, current);
  if (card.classList.contains('mgd-new-table') || card.classList.contains('mgd-guest-placed') || card.classList.contains('mgd-capacity-changed') || card.classList.contains('mgd-completed-now')) {
    setTimeout(() => card.classList.remove('mgd-new-table', 'mgd-guest-placed', 'mgd-capacity-changed', 'mgd-completed-now'), 700);
  }
}

function apply(doc) {
  ensureStyle(doc);
  const cards = [...doc.querySelectorAll('.mgd-table-card[data-table-id]')];
  const liveIds = new Set(cards.map((card) => String(card.dataset.tableId || '')));
  [...previous.keys()].forEach((id) => { if (!liveIds.has(id)) previous.delete(id); });
  cards.forEach(decorateCard);
}

function schedule(doc) {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => apply(doc));
}

function bindFrame(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  if (!doc?.getElementById('mgdTablesEditor')) return false;
  schedule(doc);
  if (!doc.documentElement.dataset.mgdPolishObserver) {
    doc.documentElement.dataset.mgdPolishObserver = VERSION;
    const observer = new MutationObserver(() => schedule(doc));
    observer.observe(doc.body, { childList: true, subtree: true });
  }
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
window.addEventListener('migrandia:datachange', () => setTimeout(scan, 30));
if (document.readyState !== 'loading') scan();
