import { getWeddingContext } from '../../services/firebase.js?v=20260814-1136-collab1';

const VERSION = '20260814-1438-permissions1';
let activeDoc = null;

function canEditTables() {
  const role = String(getWeddingContext()?.role || 'viewer');
  return ['owner', 'admin', 'editor'].includes(role);
}

function ensureStyle(doc) {
  if (doc.getElementById('mgdTablesPermissionsStyle')) return;
  const style = doc.createElement('style');
  style.id = 'mgdTablesPermissionsStyle';
  style.textContent = `
    .mgd-tables-readonly-note{display:none;align-items:center;gap:8px;margin:0 0 12px;padding:10px 12px;border:1px solid rgba(111,125,93,.14);border-radius:14px;background:rgba(111,125,93,.06);color:#68715f;font-size:11px}
    .mgd-tables-editor.is-readonly .mgd-tables-readonly-note{display:flex}
    .mgd-tables-editor.is-readonly #mgdAddTable,
    .mgd-tables-editor.is-readonly [data-edit-table],
    .mgd-tables-editor.is-readonly .mgd-table-order-tools{display:none!important}
    .mgd-tables-editor.is-readonly .mgd-guest-item,
    .mgd-tables-editor.is-readonly .mgd-seat.is-occupied{cursor:default}
    .mgd-tables-editor.is-readonly .mgd-unassigned-drop{display:none}
  `;
  doc.head.appendChild(style);
}

function applyMode(doc) {
  const root = doc?.getElementById('mgdTablesEditor');
  if (!root) return;
  ensureStyle(doc);
  const editable = canEditTables();
  root.classList.toggle('is-readonly', !editable);
  root.dataset.mgdCanEdit = editable ? '1' : '0';

  let note = root.querySelector('.mgd-tables-readonly-note');
  if (!note) {
    note = doc.createElement('div');
    note.className = 'mgd-tables-readonly-note';
    note.innerHTML = '<span aria-hidden="true">◌</span><span>Modo lectura. Tu acceso permite consultar la organización de mesas, pero no modificarla.</span>';
    const layout = root.querySelector('.mgd-tables-layout');
    layout?.insertAdjacentElement('beforebegin', note);
  }

  root.querySelectorAll('[draggable="true"][data-guest-id]').forEach((node) => {
    if (editable) node.setAttribute('draggable', 'true');
    else node.setAttribute('draggable', 'false');
  });
}

function blockEditEvent(event) {
  const root = event.currentTarget;
  if (root?.dataset?.mgdCanEdit !== '0') return;

  const editingTarget = event.target.closest(
    '#mgdAddTable,[data-edit-table],[data-table-order-step],[data-table-order-drag],.mgd-guest-item[data-guest-id],.mgd-seat[data-table-id],#mgdUnassignedDrop'
  );
  if (!editingTarget) return;

  event.preventDefault();
  event.stopImmediatePropagation();
}

function bindRoot(root) {
  if (!root || root.dataset.mgdPermissionsBound === VERSION) return;
  root.dataset.mgdPermissionsBound = VERSION;
  ['click', 'dragstart', 'dragover', 'drop'].forEach((name) => {
    root.addEventListener(name, blockEditEvent, true);
  });
}

function bindFrame(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  const root = doc?.getElementById('mgdTablesEditor');
  if (!doc?.body || !root) return false;
  activeDoc = doc;
  bindRoot(root);
  applyMode(doc);

  if (!doc.documentElement.dataset.mgdPermissionsObserver) {
    doc.documentElement.dataset.mgdPermissionsObserver = VERSION;
    const observer = new MutationObserver(() => {
      const nextRoot = doc.getElementById('mgdTablesEditor');
      if (!nextRoot) return;
      bindRoot(nextRoot);
      applyMode(doc);
    });
    observer.observe(doc.body, { childList: true, subtree: true });
  }
  return true;
}

function scan() {
  const frames = [...document.querySelectorAll('#unifiedWorkspace iframe, iframe')];
  for (const frame of frames) {
    if (bindFrame(frame)) break;
  }
}

const observer = new MutationObserver(scan);
observer.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', scan);
window.addEventListener('load', scan);
window.addEventListener('migrandia:wedding-context', () => setTimeout(scan, 60));
window.addEventListener('migrandia:datachange', () => setTimeout(scan, 40));
if (document.readyState !== 'loading') scan();
