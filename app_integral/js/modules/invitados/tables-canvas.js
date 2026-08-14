const VERSION = '20260814-1518-canvas1';
const STORAGE_KEY = 'planificador_bodas_invitados_v1';
const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';
const ZOOM_KEY = 'migrandia_tables_zoom_v1';
const DESKTOP_QUERY = '(min-width: 901px)';
const CARD_W = 304;
const CARD_H = 312;
const GAP_X = 34;
const GAP_Y = 34;

let activeFrame = null;
let activeDoc = null;
let zoom = readZoom();
let drag = null;
let resizeTimer = 0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || min));
}

function readZoom() {
  const value = Number(localStorage.getItem(ZOOM_KEY));
  return Number.isFinite(value) ? clamp(value, .25, 1.35) : 1;
}

function saveZoom(value) {
  zoom = clamp(value, .25, 1.35);
  localStorage.setItem(ZOOM_KEY, String(zoom));
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

function persistPosition(tableId, x, y) {
  const data = readState();
  const table = data.tables.find((item) => String(item.id) === String(tableId));
  if (!table) return;
  table.positionX = Math.round(Math.max(0, x));
  table.positionY = Math.round(Math.max(0, y));
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
    detail: { source: 'table-position-updated', guests: data.guests.length, tables: data.tables.length }
  }));
}

function isDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

function defaultPosition(index) {
  const cols = 3;
  return {
    x: 28 + (index % cols) * (CARD_W + GAP_X),
    y: 28 + Math.floor(index / cols) * (CARD_H + GAP_Y)
  };
}

function tablePosition(table, index) {
  const x = Number(table?.positionX);
  const y = Number(table?.positionY);
  if (Number.isFinite(x) && Number.isFinite(y)) return { x: Math.max(0, x), y: Math.max(0, y) };
  return defaultPosition(index);
}

function ensureStyle(doc) {
  if (doc.getElementById('mgdTablesCanvasStyle')) return;
  const style = doc.createElement('style');
  style.id = 'mgdTablesCanvasStyle';
  style.textContent = `
    .mgd-canvas-toolbar{display:none;align-items:center;gap:6px;margin-left:auto}
    .mgd-canvas-tool{min-width:35px;height:35px;padding:0 9px;border:1px solid rgba(78,88,72,.14);border-radius:10px;background:#fff;color:#596254;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
    .mgd-canvas-tool:hover{border-color:rgba(111,125,93,.35);background:#f8faf6}
    .mgd-canvas-tool.zoom-label{min-width:54px;cursor:default;color:#74796f;font-weight:650}
    .mgd-canvas-viewport{position:relative;overflow:auto;min-height:610px;max-height:72vh;border:1px dashed rgba(111,125,93,.12);border-radius:18px;background:radial-gradient(circle at 1px 1px,rgba(111,125,93,.12) 1px,transparent 1.2px);background-size:22px 22px;scroll-behavior:smooth}
    .mgd-canvas-shell{position:relative;min-width:100%;min-height:100%}
    .mgd-tables-editor.is-canvas .mgd-canvas-toolbar{display:flex}
    .mgd-tables-editor.is-canvas .mgd-table-grid{display:block!important;position:relative;margin:0;transform-origin:0 0;will-change:transform}
    .mgd-tables-editor.is-canvas .mgd-table-card{position:absolute!important;width:${CARD_W}px;min-height:${CARD_H}px;margin:0;touch-action:none}
    .mgd-tables-editor.is-canvas .mgd-table-order-tools{display:none!important}
    .mgd-table-move-handle{display:none;position:absolute;z-index:10;left:10px;top:10px;width:36px;height:36px;border:1px solid rgba(78,88,72,.14);border-radius:50%;background:rgba(255,255,255,.95);color:#66705f;place-items:center;font:inherit;font-size:15px;cursor:grab;box-shadow:0 4px 13px rgba(58,65,52,.06);touch-action:none;user-select:none}
    .mgd-tables-editor.is-canvas .mgd-table-move-handle{display:grid}
    .mgd-table-move-handle:active{cursor:grabbing}
    .mgd-table-card.is-position-dragging{z-index:30!important;box-shadow:0 22px 55px rgba(52,60,47,.18)!important;transition:none!important}
    .mgd-canvas-help{display:none;margin-left:8px;color:#7b8077;font-size:12px}
    .mgd-tables-editor.is-canvas .mgd-canvas-help{display:inline}
    @media(max-width:900px){.mgd-canvas-viewport{overflow:visible;min-height:0;max-height:none;border:0;background:none}.mgd-canvas-shell{min-height:0}.mgd-table-grid{transform:none!important}.mgd-table-move-handle,.mgd-canvas-toolbar,.mgd-canvas-help{display:none!important}}
  `;
  doc.head.appendChild(style);
}

function ensureToolbar(root, doc) {
  const head = root.querySelector('.mgd-stage-head');
  if (!head) return;
  if (!head.querySelector('.mgd-canvas-help')) {
    const help = doc.createElement('span');
    help.className = 'mgd-canvas-help';
    help.textContent = 'Arrastra las mesas para ubicarlas';
    head.appendChild(help);
  }
  if (!head.querySelector('#mgdCanvasToolbar')) {
    const toolbar = doc.createElement('div');
    toolbar.className = 'mgd-canvas-toolbar';
    toolbar.id = 'mgdCanvasToolbar';
    toolbar.innerHTML = `
      <button class="mgd-canvas-tool" type="button" data-canvas-action="zoom-out" title="Alejar" aria-label="Alejar">−</button>
      <button class="mgd-canvas-tool zoom-label" type="button" tabindex="-1" aria-label="Nivel de zoom"><span id="mgdCanvasZoomLabel">100%</span></button>
      <button class="mgd-canvas-tool" type="button" data-canvas-action="zoom-in" title="Acercar" aria-label="Acercar">+</button>
      <button class="mgd-canvas-tool" type="button" data-canvas-action="fit" title="Ajustar todas las mesas a pantalla">Ajustar</button>
      <button class="mgd-canvas-tool" type="button" data-canvas-action="center" title="Centrar contenido">Centrar</button>`;
    head.appendChild(toolbar);
  }
}

function ensureCanvasDom(root, doc) {
  const grid = root.querySelector('#mgdTableGrid');
  if (!grid) return null;
  let viewport = root.querySelector('#mgdCanvasViewport');
  let shell = root.querySelector('#mgdCanvasShell');
  if (!viewport || !shell || !shell.contains(grid)) {
    viewport = doc.createElement('div');
    viewport.id = 'mgdCanvasViewport';
    viewport.className = 'mgd-canvas-viewport';
    shell = doc.createElement('div');
    shell.id = 'mgdCanvasShell';
    shell.className = 'mgd-canvas-shell';
    grid.parentNode.insertBefore(viewport, grid);
    viewport.appendChild(shell);
    shell.appendChild(grid);
  }
  return { grid, viewport, shell };
}

function decorateMoveHandles(root, doc) {
  root.querySelectorAll('.mgd-table-card[data-table-id]').forEach((card) => {
    if (card.querySelector('.mgd-table-move-handle')) return;
    const handle = doc.createElement('button');
    handle.className = 'mgd-table-move-handle';
    handle.type = 'button';
    handle.dataset.tableMoveHandle = card.dataset.tableId;
    handle.title = 'Mover mesa';
    handle.setAttribute('aria-label', `Mover ${card.querySelector('.mgd-table-body strong')?.textContent || 'mesa'}`);
    handle.textContent = '✥';
    card.appendChild(handle);
  });
}

function extents(data) {
  if (!data.tables.length) return { minX: 0, minY: 0, maxX: 1050, maxY: 650, width: 1050, height: 650 };
  let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
  data.tables.forEach((table, index) => {
    const p = tablePosition(table, index);
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + CARD_W);
    maxY = Math.max(maxY, p.y + CARD_H);
  });
  const width = Math.max(1050, maxX + 50);
  const height = Math.max(650, maxY + 50);
  return { minX, minY, maxX, maxY, width, height };
}

function applyZoom(root, elements, data) {
  const { grid, shell } = elements;
  const bounds = extents(data);
  grid.style.width = `${bounds.width}px`;
  grid.style.height = `${bounds.height}px`;
  grid.style.transform = isDesktop() ? `scale(${zoom})` : '';
  shell.style.width = isDesktop() ? `${Math.ceil(bounds.width * zoom)}px` : '';
  shell.style.height = isDesktop() ? `${Math.ceil(bounds.height * zoom)}px` : '';
  const label = root.querySelector('#mgdCanvasZoomLabel');
  if (label) label.textContent = `${Math.round(zoom * 100)}%`;
}

function applyPositions(root, data) {
  const cards = [...root.querySelectorAll('.mgd-table-card[data-table-id]')];
  cards.forEach((card, index) => {
    const table = data.tables.find((item) => String(item.id) === String(card.dataset.tableId));
    const p = tablePosition(table, index);
    if (isDesktop()) {
      card.style.left = `${p.x}px`;
      card.style.top = `${p.y}px`;
    } else {
      card.style.left = '';
      card.style.top = '';
      card.style.width = '';
    }
  });
}

function renderCanvas(root, doc) {
  if (!root) return;
  ensureStyle(doc);
  ensureToolbar(root, doc);
  const elements = ensureCanvasDom(root, doc);
  if (!elements) return;
  decorateMoveHandles(root, doc);
  root.classList.toggle('is-canvas', isDesktop());
  const data = readState();
  applyPositions(root, data);
  applyZoom(root, elements, data);
}

function contentCenter(viewport, data) {
  const bounds = extents(data);
  return {
    x: ((bounds.minX + bounds.maxX) / 2) * zoom,
    y: ((bounds.minY + bounds.maxY) / 2) * zoom
  };
}

function centerContent(root) {
  const viewport = root.querySelector('#mgdCanvasViewport');
  if (!viewport || !isDesktop()) return;
  const center = contentCenter(viewport, readState());
  viewport.scrollTo({
    left: Math.max(0, center.x - viewport.clientWidth / 2),
    top: Math.max(0, center.y - viewport.clientHeight / 2),
    behavior: 'smooth'
  });
}

function fitContent(root) {
  const viewport = root.querySelector('#mgdCanvasViewport');
  if (!viewport || !isDesktop()) return;
  const data = readState();
  const bounds = extents(data);
  const contentW = Math.max(1, bounds.maxX - bounds.minX + 70);
  const contentH = Math.max(1, bounds.maxY - bounds.minY + 70);
  const next = clamp(Math.min((viewport.clientWidth - 24) / contentW, (viewport.clientHeight - 24) / contentH, 1.15), .25, 1.15);
  saveZoom(next);
  renderCanvas(root, activeDoc);
  requestAnimationFrame(() => centerContent(root));
}

function changeZoom(root, delta) {
  saveZoom(zoom + delta);
  renderCanvas(root, activeDoc);
}

function pointerDown(event, root) {
  const handle = event.target.closest('[data-table-move-handle]');
  if (!handle || !isDesktop() || root.dataset.mgdCanEdit === '0') return;
  const card = handle.closest('.mgd-table-card[data-table-id]');
  if (!card) return;
  event.preventDefault();
  event.stopPropagation();
  const x = Number.parseFloat(card.style.left) || 0;
  const y = Number.parseFloat(card.style.top) || 0;
  drag = {
    pointerId: event.pointerId,
    tableId: card.dataset.tableId,
    card,
    handle,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: x,
    startY: y,
    x,
    y
  };
  card.classList.add('is-position-dragging');
  try { handle.setPointerCapture(event.pointerId); } catch (_) {}
}

function pointerMove(event, root) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  event.preventDefault();
  const dx = (event.clientX - drag.startClientX) / zoom;
  const dy = (event.clientY - drag.startClientY) / zoom;
  drag.x = Math.max(0, drag.startX + dx);
  drag.y = Math.max(0, drag.startY + dy);
  drag.card.style.left = `${drag.x}px`;
  drag.card.style.top = `${drag.y}px`;
}

function pointerUp(event, root) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const finished = drag;
  drag = null;
  finished.card.classList.remove('is-position-dragging');
  try { finished.handle.releasePointerCapture(event.pointerId); } catch (_) {}
  persistPosition(finished.tableId, finished.x, finished.y);
  renderCanvas(root, activeDoc);
}

function bindRoot(root, doc) {
  if (!root || root.dataset.mgdCanvasBound === VERSION) return;
  root.dataset.mgdCanvasBound = VERSION;
  renderCanvas(root, doc);

  root.addEventListener('click', (event) => {
    const action = event.target.closest('[data-canvas-action]')?.dataset.canvasAction;
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    if (action === 'zoom-in') changeZoom(root, .1);
    if (action === 'zoom-out') changeZoom(root, -.1);
    if (action === 'fit') fitContent(root);
    if (action === 'center') centerContent(root);
  });
  root.addEventListener('pointerdown', (event) => pointerDown(event, root), true);
  root.addEventListener('pointermove', (event) => pointerMove(event, root), true);
  root.addEventListener('pointerup', (event) => pointerUp(event, root), true);
  root.addEventListener('pointercancel', (event) => pointerUp(event, root), true);
}

function bindFrame(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  const root = doc?.getElementById('mgdTablesEditor');
  if (!doc?.body || !root) return false;
  activeFrame = frame;
  activeDoc = doc;
  bindRoot(root, doc);
  renderCanvas(root, doc);

  if (!doc.documentElement.dataset.mgdCanvasObserver) {
    doc.documentElement.dataset.mgdCanvasObserver = VERSION;
    const observer = new MutationObserver(() => {
      const nextRoot = doc.getElementById('mgdTablesEditor');
      if (!nextRoot) return;
      bindRoot(nextRoot, doc);
      renderCanvas(nextRoot, doc);
    });
    observer.observe(doc.body, { childList: true, subtree: true });
  }
  return true;
}

function scan() {
  for (const frame of document.querySelectorAll('#unifiedWorkspace iframe, iframe')) {
    if (bindFrame(frame)) break;
  }
}

const rootObserver = new MutationObserver(scan);
rootObserver.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', scan);
window.addEventListener('load', scan);
window.addEventListener('migrandia:wedding-context', () => setTimeout(scan, 60));
window.addEventListener('migrandia:datachange', (event) => {
  if (String(event?.detail?.source || '') === 'table-position-updated') return;
  setTimeout(scan, 35);
});
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(scan, 120);
});
if (document.readyState !== 'loading') scan();
