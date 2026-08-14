const VERSION = '20260814-1418-order1';
const STORAGE_KEY = 'planificador_bodas_invitados_v1';
const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';

let activeFrame = null;
let activeDoc = null;
let activeRoot = null;
let observer = null;

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

function persistOrder(tables) {
  const data = readState();
  data.tables = tables.map((table, index) => ({
    ...table,
    order: index,
    updatedAt: new Date().toISOString()
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(buildSharedState(data)));
  try {
    activeFrame?.contentWindow?.postMessage({
      type: 'MIGRANDIA_RSVP_SYNC',
      payload: { guests: data.guests, tables: data.tables }
    }, '*');
  } catch (_) {}
  window.dispatchEvent(new CustomEvent('migrandia:datachange', {
    detail: { source: 'mesas-order', guests: data.guests.length, tables: data.tables.length }
  }));
}

function moveTable(tableId, targetId, placeAfter = false) {
  const data = readState();
  const sourceIndex = data.tables.findIndex((table) => String(table.id) === String(tableId));
  const targetIndex = data.tables.findIndex((table) => String(table.id) === String(targetId));
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;

  const next = [...data.tables];
  const [source] = next.splice(sourceIndex, 1);
  let insertIndex = next.findIndex((table) => String(table.id) === String(targetId));
  if (insertIndex < 0) insertIndex = next.length;
  if (placeAfter) insertIndex += 1;
  next.splice(insertIndex, 0, source);
  persistOrder(next);
}

function nudgeTable(tableId, delta) {
  const data = readState();
  const index = data.tables.findIndex((table) => String(table.id) === String(tableId));
  const nextIndex = index + Number(delta || 0);
  if (index < 0 || nextIndex < 0 || nextIndex >= data.tables.length) return;
  const next = [...data.tables];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  persistOrder(next);
}

function ensureStyle(doc) {
  if (doc.getElementById('mgdTableOrderStyle')) return;
  const style = doc.createElement('style');
  style.id = 'mgdTableOrderStyle';
  style.textContent = `
    .mgd-table-order-tools{position:absolute;z-index:8;top:10px;left:10px;display:flex;gap:5px;align-items:center}
    .mgd-table-order-handle,.mgd-table-order-step{width:30px;height:30px;border:1px solid rgba(78,88,72,.14);border-radius:999px;background:rgba(255,255,255,.92);color:#74796f;display:grid;place-items:center;font:inherit;font-size:12px;cursor:pointer;box-shadow:0 4px 12px rgba(58,65,52,.05)}
    .mgd-table-order-handle{cursor:grab;font-size:14px;touch-action:none}
    .mgd-table-order-handle:active{cursor:grabbing}
    .mgd-table-card.is-order-drag{opacity:.58;transform:scale(.985)}
    .mgd-table-card.is-order-target{outline:2px solid rgba(111,125,93,.36);outline-offset:2px}
    @media(max-width:620px){.mgd-table-order-handle{display:none}.mgd-table-order-step{width:32px;height:32px}}
  `;
  doc.head.appendChild(style);
}

function decorateCards(root) {
  const cards = [...root.querySelectorAll('.mgd-table-card[data-table-id]')];
  cards.forEach((card, index) => {
    if (card.querySelector('.mgd-table-order-tools')) return;
    const id = card.dataset.tableId;
    const tools = activeDoc.createElement('div');
    tools.className = 'mgd-table-order-tools';
    tools.innerHTML = `
      <span class="mgd-table-order-handle" draggable="true" data-table-order-drag="${id}" title="Arrastra para ordenar" aria-label="Arrastra para ordenar">↕</span>
      <button class="mgd-table-order-step" type="button" data-table-order-step="-1" data-table-id="${id}" title="Mover antes" aria-label="Mover mesa antes" ${index === 0 ? 'disabled' : ''}>‹</button>
      <button class="mgd-table-order-step" type="button" data-table-order-step="1" data-table-id="${id}" title="Mover después" aria-label="Mover mesa después" ${index === cards.length - 1 ? 'disabled' : ''}>›</button>`;
    card.appendChild(tools);
  });
}

function clearDragClasses(root) {
  root.querySelectorAll('.mgd-table-card').forEach((card) => card.classList.remove('is-order-drag', 'is-order-target'));
}

function bindRoot(root) {
  if (!root || root.dataset.mgdTableOrderBound === VERSION) return;
  root.dataset.mgdTableOrderBound = VERSION;
  decorateCards(root);

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-table-order-step]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    nudgeTable(button.dataset.tableId, Number(button.dataset.tableOrderStep));
  });

  root.addEventListener('dragstart', (event) => {
    const handle = event.target.closest('[data-table-order-drag]');
    if (!handle) return;
    const id = handle.dataset.tableOrderDrag;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/mgd-table-order', id);
    event.dataTransfer.setData('text/plain', `table:${id}`);
    handle.closest('.mgd-table-card')?.classList.add('is-order-drag');
  });

  root.addEventListener('dragover', (event) => {
    const id = event.dataTransfer?.getData('text/mgd-table-order');
    if (!id) return;
    const card = event.target.closest('.mgd-table-card[data-table-id]');
    if (!card || String(card.dataset.tableId) === String(id)) return;
    event.preventDefault();
    root.querySelectorAll('.mgd-table-card').forEach((item) => item.classList.toggle('is-order-target', item === card));
  });

  root.addEventListener('drop', (event) => {
    const sourceId = event.dataTransfer?.getData('text/mgd-table-order');
    const card = event.target.closest('.mgd-table-card[data-table-id]');
    if (!sourceId || !card || String(card.dataset.tableId) === String(sourceId)) return;
    event.preventDefault();
    const rect = card.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2 || event.clientX > rect.left + rect.width / 2;
    moveTable(sourceId, card.dataset.tableId, after);
    clearDragClasses(root);
  });

  root.addEventListener('dragend', () => clearDragClasses(root));
}

function bindFrame(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  const root = doc?.getElementById('mgdTablesEditor');
  if (!doc?.body || !root) return false;
  activeFrame = frame;
  activeDoc = doc;
  activeRoot = root;
  ensureStyle(doc);
  bindRoot(root);
  decorateCards(root);

  if (!doc.documentElement.dataset.mgdTableOrderObserver) {
    doc.documentElement.dataset.mgdTableOrderObserver = VERSION;
    const localObserver = new MutationObserver(() => {
      const nextRoot = doc.getElementById('mgdTablesEditor');
      if (!nextRoot) return;
      activeRoot = nextRoot;
      bindRoot(nextRoot);
      decorateCards(nextRoot);
    });
    localObserver.observe(doc.body, { childList: true, subtree: true });
  }
  return true;
}

function scan() {
  const frames = [...document.querySelectorAll('#unifiedWorkspace iframe, iframe')];
  for (const frame of frames) {
    if (bindFrame(frame)) break;
  }
}

observer = new MutationObserver(scan);
observer.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', scan);
window.addEventListener('load', scan);
window.addEventListener('migrandia:wedding-context', () => setTimeout(scan, 80));
window.addEventListener('migrandia:datachange', () => setTimeout(scan, 50));
if (document.readyState !== 'loading') scan();
