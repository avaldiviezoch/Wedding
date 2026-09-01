import {
  TABLE_TYPES,
  TABLE_CAPACITY_OPTIONS,
  MAX_TABLE_CAPACITY,
  standardTabletop,
  resolveTableGeometry,
  geometryPatch,
  seatPositions
} from './table-geometry-model.js?v=20260901-table-geometry1';

const VERSION = '20260901-table-geometry1';
const LINK_STORAGE_KEY = 'migrandia_distribucion_invitados_link_v1';
const ACTIVE_PROPOSAL_KEY = 'eventPlannerActiveProposalIdV1';
const CSS_URL = new URL(`css/modules/distribution-table-geometry.css?v=${VERSION}`, document.baseURI).href;
const controllers = new WeakMap();
let observer = null;
let toastTimer = 0;

const clone = (value) => {
  try { return structuredClone(value); } catch (_) { return JSON.parse(JSON.stringify(value)); }
};
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const normalizeText = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));

function bridge() {
  const api = window.MiGranDiaDistributionGuestLink;
  return api && typeof api.readState === 'function' && typeof api.saveState === 'function' ? api : null;
}

function readLinkState() {
  try {
    const value = JSON.parse(localStorage.getItem(LINK_STORAGE_KEY) || '{}');
    return { proposals: value.proposals || {} };
  } catch (_) {
    return { proposals: {} };
  }
}

function isDistributionDocument(doc) {
  return Boolean(doc?.getElementById('planner') && doc.getElementById('itemsLayer') && doc.getElementById('selectionForm'));
}

function ensureCss(doc) {
  if (doc.getElementById('mgdTableGeometryCss')) return;
  const link = doc.createElement('link');
  link.id = 'mgdTableGeometryCss';
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  doc.head.appendChild(link);
}

function ensureToast(doc) {
  let node = doc.getElementById('mgdTableGeometryToast');
  if (!node) {
    node = doc.createElement('div');
    node.id = 'mgdTableGeometryToast';
    node.className = 'mgd-table-geometry-toast';
    doc.body.appendChild(node);
  }
  return node;
}

function showToast(doc, message) {
  const node = ensureToast(doc);
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 2200);
}

function proposalMapping(controller) {
  const link = readLinkState();
  let active = '';
  try { active = String(controller.frame.contentWindow.localStorage.getItem(ACTIVE_PROPOSAL_KEY) || ''); } catch (_) {}
  if (active && link.proposals[active]?.tables) return { proposalId: active, tables: link.proposals[active].tables };

  const visibleIds = new Set(Array.from(controller.doc.querySelectorAll('#itemsLayer .draggable[data-id]')).map((node) => String(node.dataset.id || '')));
  for (const [proposalId, proposal] of Object.entries(link.proposals)) {
    const values = Object.values(proposal?.tables || {}).map(String);
    if (values.some((value) => visibleIds.has(value))) return { proposalId, tables: proposal.tables || {} };
  }
  return { proposalId: active, tables: {} };
}

function canonicalIdFromLegacy(controller, legacyId) {
  const mapping = proposalMapping(controller).tables;
  return Object.entries(mapping).find(([, value]) => String(value) === String(legacyId))?.[0] || '';
}

function legacyIdFromCanonical(controller, canonicalId) {
  const mapping = proposalMapping(controller).tables;
  const value = mapping[String(canonicalId)];
  return value === undefined || value === null ? '' : String(value);
}

function resizeSeats(existing, capacity) {
  const source = Array.isArray(existing) ? existing : [];
  return Array.from({ length: capacity }, (_, index) => ({
    ...(source[index] || {}),
    id: source[index]?.id || uid('seat'),
    index
  }));
}

function nextTableName(tables) {
  const used = new Set((tables || []).map((table) => String(table.name || '').trim()));
  let index = 1;
  while (used.has(`Mesa ${index}`)) index += 1;
  return `Mesa ${index}`;
}

function saveCanonicalState(next, source) {
  const api = bridge();
  if (!api) return false;
  api.saveState(next, source);
  api.syncNow();
  return true;
}

function applyGeometry(controller, canonicalId, values) {
  const api = bridge();
  if (!api) return false;
  const data = clone(api.readState());
  const table = data.tables.find((item) => String(item.id) === String(canonicalId));
  if (!table) return false;

  const patch = geometryPatch(table, values);
  const assigned = data.guests
    .filter((guest) => String(guest.tableId || '') === String(table.id))
    .sort((a, b) => Number(a.seatNumber || 999) - Number(b.seatNumber || 999));

  if (assigned.length > patch.capacity) {
    showToast(controller.doc, `Esta mesa tiene ${assigned.length} invitados. No puede reducirse a ${patch.capacity} sillas.`);
    return false;
  }

  const capacityChanged = Number(table.capacity) !== patch.capacity;
  Object.assign(table, patch, { updatedAt: new Date().toISOString() });
  table.seats = resizeSeats(table.seats, patch.capacity);

  if (capacityChanged) {
    assigned.forEach((guest, index) => {
      guest.seatNumber = index + 1;
      guest.seatId = table.seats[index]?.id || '';
    });
  }

  if (!saveCanonicalState(data, 'distribucion-table-geometry')) return false;
  showToast(controller.doc, 'Mesa actualizada.');
  return true;
}

function createCanonicalTable(controller, values) {
  const api = bridge();
  if (!api) return false;
  const data = clone(api.readState());
  const patch = geometryPatch({}, values);
  data.tables = Array.isArray(data.tables) ? data.tables : [];
  data.tables.push({
    id: uid('table'),
    name: nextTableName(data.tables),
    ...patch,
    seats: resizeSeats([], patch.capacity),
    rotation: 0,
    positionX: null,
    positionY: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  if (!saveCanonicalState(data, 'distribucion-table-created')) return false;
  showToast(controller.doc, 'Mesa creada en Distribución y Mesas y asientos.');
  return true;
}

function setDimensionFields(root, type, capacity, values = null) {
  const standard = standardTabletop(type, capacity);
  const geometry = values || { tabletopWidthM: standard.widthM, tabletopHeightM: standard.heightM };
  const widthWrap = root.querySelector('[data-mgd-dimension="width"]');
  const heightWrap = root.querySelector('[data-mgd-dimension="height"]');
  const widthLabel = widthWrap?.querySelector('span');
  const widthInput = widthWrap?.querySelector('input');
  const heightInput = heightWrap?.querySelector('input');

  if (widthLabel) widthLabel.textContent = type === 'round' ? 'Diámetro (m)' : type === 'square' ? 'Lado (m)' : 'Largo (m)';
  if (widthInput) widthInput.value = Number(geometry.tabletopWidthM || standard.widthM).toFixed(2);
  if (heightInput) heightInput.value = Number(geometry.tabletopHeightM || standard.heightM).toFixed(2);
  if (heightWrap) heightWrap.hidden = type !== 'rectangular';
}

function geometryFormMarkup(prefix) {
  const typeOptions = [
    ['round', 'Redonda'],
    ['square', 'Cuadrada'],
    ['rectangular', 'Rectangular']
  ].map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
  const capacityOptions = TABLE_CAPACITY_OPTIONS.map((value) => `<option value="${value}">${value} sillas</option>`).join('');
  return `
    <div class="mgd-table-geometry-grid">
      <label class="mgd-table-geometry-field">
        <span>Forma</span>
        <select data-mgd-field="type" id="${prefix}Type">${typeOptions}</select>
      </label>
      <label class="mgd-table-geometry-field">
        <span>Capacidad</span>
        <select data-mgd-field="capacity" id="${prefix}Capacity">${capacityOptions}</select>
      </label>
      <label class="mgd-table-geometry-field" data-mgd-dimension="width">
        <span>Diámetro (m)</span>
        <input data-mgd-field="width" id="${prefix}Width" type="number" min="0.50" max="8" step="0.05">
      </label>
      <label class="mgd-table-geometry-field" data-mgd-dimension="height" hidden>
        <span>Ancho (m)</span>
        <input data-mgd-field="height" id="${prefix}Height" type="number" min="0.50" max="8" step="0.05">
      </label>
    </div>`;
}

function readGeometryForm(root) {
  const type = root.querySelector('[data-mgd-field="type"]')?.value || 'round';
  const capacity = Number(root.querySelector('[data-mgd-field="capacity"]')?.value || 10);
  const width = Number(root.querySelector('[data-mgd-field="width"]')?.value || 0);
  const heightInput = root.querySelector('[data-mgd-field="height"]');
  const standard = standardTabletop(type, capacity);
  return {
    type,
    capacity: Math.min(MAX_TABLE_CAPACITY, Math.max(4, capacity)),
    tabletopWidthM: width > 0 ? width : standard.widthM,
    tabletopHeightM: type === 'rectangular' && Number(heightInput?.value) > 0 ? Number(heightInput.value) : (type === 'rectangular' ? standard.heightM : width || standard.widthM)
  };
}

function bindStandardRefresh(root) {
  const type = root.querySelector('[data-mgd-field="type"]');
  const capacity = root.querySelector('[data-mgd-field="capacity"]');
  const refresh = () => setDimensionFields(root, type.value, Number(capacity.value));
  type.addEventListener('change', refresh);
  capacity.addEventListener('change', refresh);
}

function ensureSelectionPanel(controller) {
  const doc = controller.doc;
  const selectionForm = doc.getElementById('selectionForm');
  if (!selectionForm) return null;
  let panel = doc.getElementById('mgdTableGeometryPanel');
  if (!panel) {
    panel = doc.createElement('section');
    panel.id = 'mgdTableGeometryPanel';
    panel.className = 'mgd-table-geometry-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <p class="mgd-table-geometry-title">Mesa · forma y medida real</p>
      ${geometryFormMarkup('mgdEditTable')}
      <div class="mgd-table-geometry-actions">
        <button class="mgd-table-geometry-standard" type="button" data-mgd-action="standard">Medida estándar</button>
        <button class="mgd-table-geometry-apply" type="button" data-mgd-action="apply">Aplicar cambios</button>
      </div>
      <p class="mgd-table-geometry-help">Máximo 16 sillas. La medida modifica el tamaño real de la mesa y su huella en la escala actual del plano.</p>`;
    selectionForm.appendChild(panel);
    bindStandardRefresh(panel);
    panel.querySelector('[data-mgd-action="standard"]').addEventListener('click', () => {
      const type = panel.querySelector('[data-mgd-field="type"]').value;
      const capacity = Number(panel.querySelector('[data-mgd-field="capacity"]').value);
      setDimensionFields(panel, type, capacity);
    });
    panel.querySelector('[data-mgd-action="apply"]').addEventListener('click', () => {
      const canonicalId = canonicalIdFromLegacy(controller, controller.selectedLegacyId);
      if (!canonicalId) return showToast(doc, 'Selecciona una mesa del plano.');
      applyGeometry(controller, canonicalId, readGeometryForm(panel));
    });
  }
  return panel;
}

function legacySizeContainer(input) {
  return input?.closest('label,.field,.form-field,.control,.input-row') || input?.parentElement || null;
}

function setLegacySizeVisibility(controller, hidden) {
  ['selW', 'selH'].forEach((id) => {
    const input = controller.doc.getElementById(id);
    const container = legacySizeContainer(input);
    if (!container) return;
    if (hidden) {
      if (!Object.prototype.hasOwnProperty.call(container.dataset, 'mgdOriginalDisplay')) container.dataset.mgdOriginalDisplay = container.style.display || '';
      container.style.display = 'none';
    } else if (Object.prototype.hasOwnProperty.call(container.dataset, 'mgdOriginalDisplay')) {
      container.style.display = container.dataset.mgdOriginalDisplay;
      delete container.dataset.mgdOriginalDisplay;
    }
  });
}

function selectedCanonicalTable(controller) {
  const api = bridge();
  if (!api) return null;
  let canonicalId = canonicalIdFromLegacy(controller, controller.selectedLegacyId);
  if (!canonicalId) {
    const selectionForm = controller.doc.getElementById('selectionForm');
    const label = String(controller.doc.getElementById('selLabel')?.value || '').trim();
    if (selectionForm && !selectionForm.classList.contains('hidden') && label) {
      const matches = api.readState().tables.filter((table) => String(table.name || '').trim() === label);
      if (matches.length === 1) {
        canonicalId = String(matches[0].id);
        controller.selectedLegacyId = legacyIdFromCanonical(controller, canonicalId);
      }
    }
  }
  if (!canonicalId) return null;
  return api.readState().tables.find((table) => String(table.id) === canonicalId) || null;
}

function updateSelectionPanel(controller) {
  const panel = ensureSelectionPanel(controller);
  if (!panel) return;
  const table = selectedCanonicalTable(controller);
  if (!table) {
    panel.hidden = true;
    setLegacySizeVisibility(controller, false);
    return;
  }
  panel.hidden = false;
  setLegacySizeVisibility(controller, true);
  const geometry = resolveTableGeometry(table);
  panel.querySelector('[data-mgd-field="type"]').value = geometry.type;
  panel.querySelector('[data-mgd-field="capacity"]').value = String(TABLE_CAPACITY_OPTIONS.includes(geometry.capacity) ? geometry.capacity : Math.min(16, Math.max(4, Math.round(geometry.capacity / 2) * 2)));
  setDimensionFields(panel, geometry.type, geometry.capacity, geometry);
}

function ensureCreateModal(controller) {
  const doc = controller.doc;
  let modal = doc.getElementById('mgdTableCreateModal');
  if (modal) return modal;
  modal = doc.createElement('div');
  modal.id = 'mgdTableCreateModal';
  modal.className = 'mgd-table-create-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <form class="mgd-table-create-card" data-mgd-create-form>
      <h3>Crear mesa</h3>
      <p>Elige forma, capacidad y medida. Puedes partir de la medida estándar y modificarla a tu gusto.</p>
      ${geometryFormMarkup('mgdCreateTable')}
      <div class="mgd-table-geometry-actions">
        <button class="mgd-table-geometry-standard" type="button" data-mgd-action="standard">Medida estándar</button>
      </div>
      <div class="mgd-table-create-footer">
        <button class="mgd-table-create-cancel" type="button" data-mgd-action="cancel">Cancelar</button>
        <button class="mgd-table-create-confirm" type="submit">Crear mesa</button>
      </div>
    </form>`;
  doc.body.appendChild(modal);
  const form = modal.querySelector('[data-mgd-create-form]');
  bindStandardRefresh(form);
  form.querySelector('[data-mgd-field="type"]').value = 'round';
  form.querySelector('[data-mgd-field="capacity"]').value = '10';
  setDimensionFields(form, 'round', 10);
  form.querySelector('[data-mgd-action="standard"]').addEventListener('click', () => {
    const type = form.querySelector('[data-mgd-field="type"]').value;
    const capacity = Number(form.querySelector('[data-mgd-field="capacity"]').value);
    setDimensionFields(form, type, capacity);
  });
  form.querySelector('[data-mgd-action="cancel"]').addEventListener('click', () => { modal.hidden = true; });
  modal.addEventListener('click', (event) => { if (event.target === modal) modal.hidden = true; });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (createCanonicalTable(controller, readGeometryForm(form))) modal.hidden = true;
  });
  return modal;
}

function ensureCreateTrigger(controller) {
  const doc = controller.doc;
  if (doc.getElementById('mgdTableCreateTrigger')) return;
  const original = Array.from(doc.querySelectorAll('button')).find((button) => normalizeText(button.textContent).includes('mesa 10 personas'));
  if (!original) return;
  original.hidden = true;
  original.dataset.mgdTableGeometryLegacyCreate = 'hidden';
  const button = doc.createElement('button');
  button.id = 'mgdTableCreateTrigger';
  button.type = 'button';
  button.className = `${original.className || ''} mgd-table-create-trigger`.trim();
  button.textContent = 'Mesa';
  button.title = 'Crear mesa redonda, cuadrada o rectangular';
  original.insertAdjacentElement('afterend', button);
  button.addEventListener('click', () => {
    const modal = ensureCreateModal(controller);
    modal.hidden = false;
  });
}

function ensureOverlay(controller) {
  const doc = controller.doc;
  const itemsLayer = doc.getElementById('itemsLayer');
  if (!itemsLayer) return null;
  let overlay = doc.getElementById('mgdTableGeometryLayer');
  if (!overlay) {
    overlay = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    overlay.id = 'mgdTableGeometryLayer';
    overlay.setAttribute('pointer-events', 'none');
    itemsLayer.insertAdjacentElement('afterend', overlay);
  }
  return overlay;
}

function tableOverlayMarkup(controller, table, legacyId, group, scale) {
  const geometry = resolveTableGeometry(table);
  const transform = group.getAttribute('transform') || '';
  const selected = String(controller.selectedLegacyId || '') === String(legacyId);
  const danger = Boolean(group.querySelector('[stroke="#c84242"],[stroke="#C84242"]'));
  const stroke = danger ? '#c84242' : selected ? '#d59b3c' : '#755e43';
  const strokeWidth = selected || danger ? 4 : 3;
  const footprintW = geometry.footprintWidthM * scale;
  const footprintH = geometry.footprintHeightM * scale;
  const tableW = geometry.tabletopWidthM * scale;
  const tableH = geometry.tabletopHeightM * scale;
  const chairRadius = Math.max(5, Math.min(8, scale * 0.17));
  const positions = seatPositions(geometry.type, geometry.capacity, geometry.tabletopWidthM, geometry.tabletopHeightM);
  const chairs = positions
    .map((position, index) => `<circle cx="${(position.xM * scale).toFixed(2)}" cy="${(position.yM * scale).toFixed(2)}" r="${chairRadius.toFixed(2)}" fill="#f8f3eb" stroke="#6d604f" stroke-width="1.7" data-seat="${index + 1}"/>`).join('');
  const api = bridge();
  const data = api?.readState?.() || { guests: [] };
  const showGuestLabels = controller.doc.getElementById('showGuestLabels')?.checked;
  const guestLabels = showGuestLabels ? (data.guests || [])
    .filter((guest) => String(guest.tableId || '') === String(table.id) && Number(guest.seatNumber) > 0)
    .map((guest) => {
      const seatIndex = Number(guest.seatNumber) - 1;
      const position = positions[seatIndex];
      if (!position) return '';
      const factor = 1.55;
      return `<text x="${(position.xM * scale * factor).toFixed(2)}" y="${(position.yM * scale * factor).toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="#4d4336">${esc(String(guest.name || '').slice(0, 18))}</text>`;
    }).join('') : '';
  const showLabels = controller.doc.getElementById('showLabels')?.checked !== false;
  const dimension = geometry.type === 'round'
    ? `Ø ${geometry.tabletopWidthM.toFixed(2)} m`
    : geometry.type === 'square'
      ? `${geometry.tabletopWidthM.toFixed(2)} m`
      : `${geometry.tabletopWidthM.toFixed(2)} × ${geometry.tabletopHeightM.toFixed(2)} m`;
  const footprint = geometry.type === 'round'
    ? `<circle r="${(footprintW / 2).toFixed(2)}" fill="#d9b978" fill-opacity=".10" stroke="${stroke}" stroke-opacity=".42" stroke-width="2" stroke-dasharray="8 7"/>`
    : `<rect x="${(-footprintW / 2).toFixed(2)}" y="${(-footprintH / 2).toFixed(2)}" width="${footprintW.toFixed(2)}" height="${footprintH.toFixed(2)}" rx="8" fill="#d9b978" fill-opacity=".10" stroke="${stroke}" stroke-opacity=".42" stroke-width="2" stroke-dasharray="8 7"/>`;
  const tabletop = geometry.type === 'round'
    ? `<circle r="${(tableW / 2).toFixed(2)}" fill="#d9b978" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
    : `<rect x="${(-tableW / 2).toFixed(2)}" y="${(-tableH / 2).toFixed(2)}" width="${tableW.toFixed(2)}" height="${tableH.toFixed(2)}" rx="${geometry.type === 'square' ? 10 : 7}" fill="#d9b978" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
  const labels = showLabels ? `
    <text text-anchor="middle" y="-4" font-size="15" font-weight="800" fill="#342a20">${esc(table.name || 'Mesa')}</text>
    <text text-anchor="middle" y="14" font-size="11" font-weight="700" fill="#514636">${geometry.capacity} sillas · ${dimension}</text>` : '';
  return `<g data-mgd-table-id="${esc(table.id)}" data-mgd-legacy-id="${esc(legacyId)}" transform="${esc(transform)}">${footprint}${chairs}${tabletop}${labels}${guestLabels}</g>`;
}

function renderOverlay(controller) {
  if (!controller.frame.isConnected || !controller.doc?.isConnected) return;
  const overlay = ensureOverlay(controller);
  const api = bridge();
  if (!overlay || !api) return;
  const data = api.readState();
  const mapping = proposalMapping(controller).tables;
  const scale = Math.max(8, Number(controller.doc.getElementById('scaleInput')?.value || 32));
  const markup = [];

  (data.tables || []).forEach((table) => {
    const legacyId = mapping[String(table.id)];
    if (legacyId === undefined || legacyId === null) return;
    const group = controller.doc.querySelector(`#itemsLayer .draggable[data-id="${CSS.escape(String(legacyId))}"]`);
    if (!group) return;
    markup.push(tableOverlayMarkup(controller, table, String(legacyId), group, scale));
    if (group.style.opacity !== '0.001') group.style.opacity = '0.001';
  });
  overlay.innerHTML = markup.join('');
  updateSelectionPanel(controller);
}

function scheduleRender(controller) {
  cancelAnimationFrame(controller.renderFrame || 0);
  controller.renderFrame = requestAnimationFrame(() => renderOverlay(controller));
}

function bindDocument(controller) {
  const doc = controller.doc;
  ensureCss(doc);
  ensureCreateTrigger(controller);
  ensureCreateModal(controller);
  ensureSelectionPanel(controller);
  ensureOverlay(controller);

  if (doc.documentElement.dataset.mgdTableGeometryBound === VERSION) {
    scheduleRender(controller);
    return;
  }
  doc.documentElement.dataset.mgdTableGeometryBound = VERSION;

  doc.addEventListener('pointerdown', (event) => {
    const group = event.target?.closest?.('#itemsLayer .draggable[data-id]');
    if (!group) return;
    const canonicalId = canonicalIdFromLegacy(controller, group.dataset.id);
    controller.selectedLegacyId = canonicalId ? String(group.dataset.id) : '';
    setTimeout(() => scheduleRender(controller), 0);
  }, true);

  doc.addEventListener('change', (event) => {
    if (event.target?.matches?.('#scaleInput,#showLabels,#showGuestLabels')) scheduleRender(controller);
  }, true);

  controller.layerObserver?.disconnect();
  const itemsLayer = doc.getElementById('itemsLayer');
  controller.layerObserver = new MutationObserver(() => scheduleRender(controller));
  controller.layerObserver.observe(itemsLayer, { childList: true, subtree: true, attributes: true, attributeFilter: ['transform', 'style'] });

  controller.selectionObserver?.disconnect();
  const selectionForm = doc.getElementById('selectionForm');
  controller.selectionObserver = new MutationObserver(() => scheduleRender(controller));
  controller.selectionObserver.observe(selectionForm, { attributes: true, attributeFilter: ['class'] });

  scheduleRender(controller);
}

function bindFrame(frame) {
  if (!(frame instanceof HTMLIFrameElement)) return;
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return; }
  if (!isDistributionDocument(doc)) return;
  let controller = controllers.get(frame);
  if (!controller) {
    controller = { frame, doc: null, selectedLegacyId: '', renderFrame: 0, layerObserver: null, selectionObserver: null };
    controllers.set(frame, controller);
  }
  if (controller.doc !== doc) {
    controller.doc = doc;
    controller.selectedLegacyId = '';
  }
  bindDocument(controller);
}

function scan() {
  document.getElementById('unifiedWorkspace')?.querySelectorAll('iframe').forEach((frame) => {
    if (frame.dataset.mgdTableGeometryLoad !== VERSION) {
      frame.dataset.mgdTableGeometryLoad = VERSION;
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

window.addEventListener('migrandia:datachange', () => setTimeout(scan, 80));
window.MiGranDiaDistributionTableGeometry = Object.freeze({ version: VERSION, maxCapacity: MAX_TABLE_CAPACITY, refresh: scan });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
