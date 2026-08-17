const VERSION = '20260817-1605-native-ui2';
const STYLE_ID = 'mgdDistribucionNativeCss';
const BOUND = 'mgdDistribucionNativeUi';
const frameState = new WeakMap();
let workspaceObserver = null;

function isDistributionDoc(doc) {
  return Boolean(
    doc?.getElementById('planner') &&
    doc?.getElementById('itemsLayer') &&
    doc?.getElementById('seatEditor') &&
    doc?.getElementById('proposalModal')
  );
}

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function ensureStyles(doc) {
  if (!doc?.head || doc.getElementById(STYLE_ID)) return;
  const link = doc.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.href = new URL(`css/modules/distribucion.css?v=${VERSION}`, document.baseURI).href;
  doc.head.appendChild(link);
}

function nearestPanel(node, stopAt = null) {
  let current = node?.parentElement || null;
  while (current && current !== stopAt && current !== current.ownerDocument.body) {
    const rect = current.getBoundingClientRect?.();
    const tag = current.tagName?.toLowerCase();
    if (
      ['aside', 'section'].includes(tag) ||
      /panel|sidebar|inspector|controls|tools|card|column/i.test(current.className || '') ||
      ((rect?.width || 0) > 180 && (rect?.height || 0) > 220)
    ) return current;
    current = current.parentElement;
  }
  return node?.parentElement || null;
}

function commonAncestor(nodes = []) {
  const valid = nodes.filter(Boolean);
  if (!valid.length) return null;
  let current = valid[0];
  while (current && current !== current.ownerDocument.body) {
    if (valid.every((node) => current.contains(node))) return current;
    current = current.parentElement;
  }
  return null;
}

function findClickableByText(doc, patterns, exclude = new Set()) {
  const nodes = [...doc.querySelectorAll('button,a,[role="button"],label')];
  return nodes.find((node) => {
    if (exclude.has(node) || node.closest('.mgd-dist-native-header')) return false;
    const text = normalize(node.textContent || node.getAttribute('aria-label') || node.title || '');
    return patterns.some((pattern) => pattern.test(text));
  }) || null;
}

function clickExisting(doc, patterns, fallbackId = '') {
  const target = (fallbackId && doc.getElementById(fallbackId)) || findClickableByText(doc, patterns);
  if (!target) return false;
  target.click();
  return true;
}

function actionButton(doc, { label, icon, action, title = label, className = '' }) {
  const button = doc.createElement('button');
  button.type = 'button';
  button.className = `mgd-dist-action ${className}`.trim();
  button.title = title;
  button.setAttribute('aria-label', title);
  button.innerHTML = `<span class="mgd-dist-action-icon" aria-hidden="true">${icon}</span><span>${label}</span>`;
  button.addEventListener('click', action);
  return button;
}

function buildHeader(doc) {
  const header = doc.createElement('header');
  header.className = 'mgd-dist-native-header';
  header.innerHTML = `
    <div class="mgd-dist-heading">
      <span class="mgd-dist-eyebrow">ESPACIO DE LA BODA</span>
      <h1>Distribución del espacio</h1>
      <p>Diseña el salón, organiza las mesas y asigna a tus invitados.</p>
    </div>
    <div class="mgd-dist-header-meta">
      <span class="mgd-dist-save-dot" aria-hidden="true"></span>
      <span class="mgd-dist-save-copy">Todo guardado</span>
    </div>`;

  const bar = doc.createElement('div');
  bar.className = 'mgd-dist-native-toolbar';

  const mesa = actionButton(doc, {
    label: 'Mesa',
    icon: '+',
    className: 'is-primary',
    action: () => clickExisting(doc, [/^mesa$/, /^agregar mesa$/, /^nueva mesa$/, /mesa 10 personas/])
  });

  const elementWrap = doc.createElement('div');
  elementWrap.className = 'mgd-dist-element-wrap';
  const elementMenu = doc.createElement('div');
  elementMenu.className = 'mgd-dist-element-menu';
  elementMenu.hidden = true;

  const element = actionButton(doc, {
    label: 'Elemento',
    icon: '+',
    action: () => {
      elementMenu.hidden = !elementMenu.hidden;
      element.setAttribute('aria-expanded', elementMenu.hidden ? 'false' : 'true');
    }
  });
  element.setAttribute('aria-haspopup', 'menu');
  element.setAttribute('aria-expanded', 'false');

  [
    ['Pista de baile', [/pista de baile/, /^pista$/]],
    ['Mesa de novios', [/mesa de novios/]],
    ['DJ / sonido', [/^dj/, /sonido/]],
    ['Barra', [/^barra$/]],
    ['Altar', [/^altar$/]],
    ['Mesa de torta', [/torta/]],
    ['Photobooth', [/photo/, /fotocabina/]],
    ['Espejo', [/^espejo$/]]
  ].forEach(([label, patterns]) => {
    const item = doc.createElement('button');
    item.type = 'button';
    item.className = 'mgd-dist-element-item';
    item.textContent = label;
    item.addEventListener('click', () => {
      clickExisting(doc, patterns);
      elementMenu.hidden = true;
      element.setAttribute('aria-expanded', 'false');
    });
    elementMenu.appendChild(item);
  });
  elementWrap.append(element, elementMenu);

  const undo = actionButton(doc, {
    label: 'Deshacer', icon: '↶', title: 'Deshacer',
    action: () => doc.getElementById('btnUndo')?.click()
  });
  const redo = actionButton(doc, {
    label: 'Rehacer', icon: '↷', title: 'Rehacer',
    action: () => doc.getElementById('btnRedo')?.click()
  });
  const measure = actionButton(doc, {
    label: 'Medir', icon: '⌁', title: 'Medir distancias',
    action: () => doc.getElementById('btnMeasure')?.click()
  });
  const designs = actionButton(doc, {
    label: 'Mis diseños', icon: '▱',
    action: () => clickExisting(doc, [/mis disenos/, /propuestas/, /abrir diseno/, /disenos guardados/])
  });

  const spacer = doc.createElement('span');
  spacer.className = 'mgd-dist-toolbar-spacer';
  bar.append(mesa, elementWrap, undo, redo, measure, spacer, designs);
  header.appendChild(bar);

  doc.addEventListener('pointerdown', (event) => {
    if (!elementWrap.contains(event.target)) {
      elementMenu.hidden = true;
      element.setAttribute('aria-expanded', 'false');
    }
  }, true);

  return header;
}

function markRegions(doc) {
  const planner = doc.getElementById('planner');
  const selection = doc.getElementById('selectionForm');
  const seatEditor = doc.getElementById('seatEditorWrap');
  const drawTent = doc.getElementById('btnDrawTent');

  const canvasPanel = nearestPanel(planner);
  canvasPanel?.classList.add('mgd-dist-canvas-region');

  const inspectorCommon = commonAncestor([selection, seatEditor]);
  const inspectorPanel = inspectorCommon && inspectorCommon !== doc.body
    ? nearestPanel(inspectorCommon)
    : nearestPanel(selection || seatEditor);
  inspectorPanel?.classList.add('mgd-dist-inspector-region');

  const toolsPanel = nearestPanel(drawTent);
  if (toolsPanel && toolsPanel !== canvasPanel && toolsPanel !== inspectorPanel) {
    toolsPanel.classList.add('mgd-dist-tools-region');
  }

  const duplicateGuestNodes = [
    doc.getElementById('guestList'),
    doc.getElementById('guestSearch'),
    doc.getElementById('newGuestName'),
    doc.getElementById('bulkGuests')
  ].filter(Boolean);
  const guestManager = commonAncestor(duplicateGuestNodes);
  if (
    guestManager &&
    guestManager !== doc.body &&
    !guestManager.contains(seatEditor) &&
    !guestManager.contains(planner)
  ) {
    guestManager.classList.add('mgd-dist-duplicate-guests');
  }

  [...doc.querySelectorAll('nav,[role="tablist"],.tabs,.tabbar,.tab-bar,.nav-tabs')].forEach((node) => {
    if (node.closest('.mgd-dist-native-header')) return;
    const text = normalize(node.textContent);
    const hits = ['objeto', 'mesa', 'invitado', 'capa', 'medicion', 'configuracion']
      .filter((word) => text.includes(word)).length;
    if (hits >= 2) node.classList.add('mgd-dist-internal-tabs');
  });

  [
    ['selectionForm', 'Propiedades'],
    ['seatEditorWrap', 'Invitados de la mesa'],
    ['layerList', 'Capas'],
    ['validationBox', 'Validación']
  ].forEach(([id, title]) => {
    const node = doc.getElementById(id);
    if (!node || node.previousElementSibling?.classList.contains('mgd-dist-section-label')) return;
    const label = doc.createElement('div');
    label.className = 'mgd-dist-section-label';
    label.textContent = title;
    node.parentNode?.insertBefore(label, node);
  });
}

function compactLegacyChrome(doc) {
  const headerCandidates = [...doc.querySelectorAll('body > header, body > .header, body > .topbar, body > .app-header')]
    .filter((node) => !node.classList.contains('mgd-dist-native-header'));
  headerCandidates.forEach((node) => node.classList.add('mgd-dist-old-chrome'));

  const headings = [...doc.querySelectorAll('h1,h2')];
  headings.forEach((node) => {
    const text = normalize(node.textContent);
    if ((text.includes('distribucion') || text.includes('planificador') || text.includes('diseno del evento')) && !node.closest('.mgd-dist-native-header')) {
      const parent = node.parentElement;
      if (parent && !parent.contains(doc.getElementById('planner'))) parent.classList.add('mgd-dist-old-chrome');
    }
  });
}

function mirrorStatus(doc, state) {
  const copy = doc.querySelector('.mgd-dist-save-copy');
  const dot = doc.querySelector('.mgd-dist-save-dot');
  const status = doc.getElementById('autosaveStatus');
  const title = doc.getElementById('autosaveTitle');
  const subtitle = doc.getElementById('autosaveSubtitle');

  const update = () => {
    if (!copy) return;
    const raw = normalize([title?.textContent, subtitle?.textContent, status?.textContent].filter(Boolean).join(' '));
    if (raw.includes('guardando')) {
      copy.textContent = 'Guardando…';
      dot?.classList.add('is-saving');
    } else if (raw.includes('error') || raw.includes('problema')) {
      copy.textContent = 'Revisar guardado';
      dot?.classList.add('is-error');
      dot?.classList.remove('is-saving');
    } else {
      copy.textContent = 'Todo guardado';
      dot?.classList.remove('is-saving', 'is-error');
    }
  };

  state.statusObserver?.disconnect();
  state.statusObserver = new MutationObserver(update);
  [status, title, subtitle].filter(Boolean).forEach((node) => state.statusObserver.observe(node, {
    childList: true, subtree: true, characterData: true, attributes: true
  }));
  update();
}

function applyNativeUi(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  if (!isDistributionDoc(doc)) return false;

  let state = frameState.get(frame);
  if (!state) {
    state = { statusObserver: null };
    frameState.set(frame, state);
  }

  ensureStyles(doc);
  doc.documentElement.dataset[BOUND] = VERSION;
  doc.body.classList.add('mgd-distribucion-native');

  let header = doc.querySelector('.mgd-dist-native-header');
  if (!header) {
    header = buildHeader(doc);
    doc.body.insertBefore(header, doc.body.firstChild);
  }

  markRegions(doc);
  compactLegacyChrome(doc);
  mirrorStatus(doc, state);
  return true;
}

function bindFrame(frame) {
  if (!(frame instanceof HTMLIFrameElement)) return;
  const apply = () => window.setTimeout(() => applyNativeUi(frame), 30);
  if (frame.dataset.mgdDistributionUiLoad !== VERSION) {
    frame.dataset.mgdDistributionUiLoad = VERSION;
    frame.addEventListener('load', apply);
  }
  apply();
}

function scan() {
  const workspace = document.getElementById('unifiedWorkspace');
  if (!workspace) return;
  workspace.querySelectorAll('iframe').forEach(bindFrame);
}

function start() {
  const workspace = document.getElementById('unifiedWorkspace');
  if (!workspace) return;
  if (!workspaceObserver) {
    workspaceObserver = new MutationObserver(scan);
    workspaceObserver.observe(workspace, { childList: true, subtree: true });
  }
  scan();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();

export const distributionUiVersion = VERSION;
