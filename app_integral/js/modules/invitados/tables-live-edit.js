const VERSION = '20260814-1431-live1';
const STORAGE_KEY = 'planificador_bodas_invitados_v1';
const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';

let activeFrame = null;
let activeDoc = null;
let editingTableId = '';
let saveTimer = 0;
let nameTimer = 0;

function uid(prefix = 'seat') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
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

function normalizeShape(value) {
  const shape = String(value || '').toLowerCase();
  if (['rect', 'rectangle', 'rectangular'].includes(shape)) return 'rectangular';
  if (['square', 'cuadrada', 'cuadrado'].includes(shape)) return 'square';
  return 'round';
}

function createSeats(existing, capacity) {
  const source = Array.isArray(existing) ? existing : [];
  return Array.from({ length: capacity }, (_, index) => ({
    ...(source[index] && typeof source[index] === 'object' ? source[index] : {}),
    id: source[index]?.id || uid('seat'),
    index
  }));
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

function setModalState(text, saving = false) {
  const node = activeDoc?.getElementById('mgdEditAutosaveState');
  if (!node) return;
  node.textContent = text;
  node.dataset.saving = saving ? '1' : '0';
}

function persistTable(tableId, patch) {
  const data = readState();
  const table = data.tables.find((item) => String(item.id) === String(tableId));
  if (!table) return false;

  const assigned = data.guests
    .filter((guest) => String(guest.tableId || '') === String(table.id))
    .sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999));
  const occupied = assigned.length;
  const currentCapacity = Math.max(1, Number(table.capacity || table.seats?.length || 10));
  const requestedCapacity = Math.max(1, Math.min(40, Number(patch.capacity ?? currentCapacity) || currentCapacity));

  if (requestedCapacity < occupied) return false;

  const previousCapacity = currentCapacity;
  table.name = String(patch.name ?? table.name ?? '').trim().slice(0, 80) || table.name || 'Mesa';
  table.type = normalizeShape(patch.type ?? table.type);
  table.capacity = requestedCapacity;
  table.seats = createSeats(table.seats, requestedCapacity);

  if (requestedCapacity !== previousCapacity) {
    assigned.forEach((guest, index) => {
      guest.seatNumber = index + 1;
      guest.seatId = table.seats[index]?.id || '';
    });
  } else {
    assigned.forEach((guest) => {
      const seatIndex = Math.max(0, Number(guest.seatNumber || 1) - 1);
      guest.seatId = table.seats[seatIndex]?.id || guest.seatId || '';
    });
  }

  table.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(buildSharedState(data)));
  try {
    activeFrame?.contentWindow?.postMessage({
      type: 'MIGRANDIA_RSVP_SYNC',
      payload: { guests: data.guests, tables: data.tables }
    }, '*');
  } catch (_) {}

  setModalState('Guardando…', true);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => setModalState('Guardado ✓', false), 520);
  window.dispatchEvent(new CustomEvent('migrandia:datachange', {
    detail: { source: 'mesas-live-edit', guests: data.guests.length, tables: data.tables.length }
  }));
  return true;
}

function modalValues(modal) {
  const name = modal.querySelector('#mgdEditTableName')?.value || '';
  const shape = modal.querySelector('#mgdEditShapes .mgd-shape-option.is-active')?.dataset.modalShape || '';
  const capacity = Number(modal.querySelector('#mgdEditCapacity')?.textContent || 0);
  return { name, type: shape, capacity };
}

function persistFromModal(modal) {
  if (!editingTableId || !modal?.classList.contains('show')) return;
  persistTable(editingTableId, modalValues(modal));
}

function decorateModal(modal) {
  if (!modal?.classList.contains('show') || !modal.querySelector('#mgdEditTableName') || !editingTableId) return;
  const dialog = modal.querySelector('.mgd-modal');
  if (!dialog) return;

  const saveButton = modal.querySelector('#mgdSaveTable');
  if (saveButton) saveButton.textContent = 'Listo';

  if (!modal.querySelector('#mgdEditAutosaveState')) {
    const head = modal.querySelector('.mgd-modal-head > div');
    if (head) {
      const state = activeDoc.createElement('span');
      state.id = 'mgdEditAutosaveState';
      state.className = 'mgd-edit-autosave-state';
      state.textContent = 'Guardado ✓';
      head.appendChild(state);
    }
  }

  if (dialog.dataset.mgdLiveEditBound === VERSION) return;
  dialog.dataset.mgdLiveEditBound = VERSION;

  const nameInput = modal.querySelector('#mgdEditTableName');
  nameInput?.addEventListener('input', () => {
    clearTimeout(nameTimer);
    nameTimer = setTimeout(() => persistFromModal(modal), 260);
  });

  dialog.addEventListener('click', (event) => {
    if (
      event.target.closest('[data-modal-shape]') ||
      event.target.closest('[data-modal-capacity]') ||
      event.target.closest('[data-edit-capacity]')
    ) {
      setTimeout(() => persistFromModal(modal), 0);
    }
  });
}

function ensureStyle(doc) {
  if (doc.getElementById('mgdLiveEditStyle')) return;
  const style = doc.createElement('style');
  style.id = 'mgdLiveEditStyle';
  style.textContent = `
    .mgd-edit-autosave-state{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:5px 8px;border-radius:999px;background:rgba(111,125,93,.08);color:#69725f;font-size:10px;font-weight:650}
    .mgd-edit-autosave-state::before{content:"";width:6px;height:6px;border-radius:50%;background:#91a081}
    .mgd-edit-autosave-state[data-saving="1"]::before{animation:mgdLivePulse .7s ease-in-out infinite alternate}
    @keyframes mgdLivePulse{from{opacity:.35}to{opacity:1}}
  `;
  doc.head.appendChild(style);
}

function bindFrame(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  const root = doc?.getElementById('mgdTablesEditor');
  if (!doc?.body || !root) return false;
  activeFrame = frame;
  activeDoc = doc;
  ensureStyle(doc);

  if (root.dataset.mgdLiveEditCapture !== VERSION) {
    root.dataset.mgdLiveEditCapture = VERSION;
    root.addEventListener('click', (event) => {
      const edit = event.target.closest('[data-edit-table]');
      if (edit) editingTableId = edit.dataset.editTable || '';
    }, true);
  }

  const modal = doc.getElementById('mgdTablesModal');
  if (modal) decorateModal(modal);

  if (!doc.documentElement.dataset.mgdLiveEditObserver) {
    doc.documentElement.dataset.mgdLiveEditObserver = VERSION;
    const observer = new MutationObserver(() => {
      const currentRoot = doc.getElementById('mgdTablesEditor');
      if (currentRoot && currentRoot.dataset.mgdLiveEditCapture !== VERSION) {
        currentRoot.dataset.mgdLiveEditCapture = VERSION;
        currentRoot.addEventListener('click', (event) => {
          const edit = event.target.closest('[data-edit-table]');
          if (edit) editingTableId = edit.dataset.editTable || '';
        }, true);
      }
      decorateModal(doc.getElementById('mgdTablesModal'));
    });
    observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
  return true;
}

function scan() {
  const frames = [...document.querySelectorAll('#unifiedWorkspace iframe, iframe')];
  for (const frame of frames) {
    if (bindFrame(frame)) break;
  }
}

const rootObserver = new MutationObserver(scan);
rootObserver.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', scan);
window.addEventListener('load', scan);
window.addEventListener('migrandia:wedding-context', () => {
  editingTableId = '';
  setTimeout(scan, 80);
});
if (document.readyState !== 'loading') scan();
