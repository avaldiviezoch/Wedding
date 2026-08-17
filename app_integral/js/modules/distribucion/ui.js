const VERSION = '20260817-1634-native-ui3';
const STYLE_ID = 'mgdDistribucionNativeCss';
const HEADER_ID = 'mgdDistributionNativeHeader';
const frameState = new WeakMap();
let workspaceObserver = null;

function isDistributionDoc(doc) {
  return Boolean(
    doc?.getElementById('planner') &&
    doc?.getElementById('itemsLayer') &&
    doc?.getElementById('selectionForm') &&
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
  if (!doc?.head) return;
  let link = doc.getElementById(STYLE_ID);
  const href = new URL(`css/modules/distribucion.css?v=${VERSION}`, document.baseURI).href;
  if (!link) {
    link = doc.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    doc.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
}

function findClickable(doc, ids = [], patterns = []) {
  for (const id of ids) {
    const node = doc.getElementById(id);
    if (node) return node;
  }
  const nodes = [...doc.querySelectorAll('button,a,[role="button"]')];
  return nodes.find((node) => {
    if (node.closest(`#${HEADER_ID}`)) return false;
    const text = normalize(node.textContent || node.getAttribute('aria-label') || node.title || '');
    return patterns.some((pattern) => pattern.test(text));
  }) || null;
}

function clickExisting(doc, ids, patterns) {
  const target = findClickable(doc, ids, patterns);
  if (!target) return false;
  target.click();
  return true;
}

function actionButton(doc, { label, icon, action, title = label, primary = false }) {
  const button = doc.createElement('button');
  button.type = 'button';
  button.className = `mgd-dist-action${primary ? ' is-primary' : ''}`;
  button.title = title;
  button.setAttribute('aria-label', title);
  button.innerHTML = `<span class="mgd-dist-action-icon" aria-hidden="true">${icon}</span><span>${label}</span>`;
  button.addEventListener('click', action);
  return button;
}

function buildElementMenu(doc) {
  const wrap = doc.createElement('div');
  wrap.className = 'mgd-dist-element-wrap';

  const menu = doc.createElement('div');
  menu.className = 'mgd-dist-element-menu';
  menu.hidden = true;

  const opener = actionButton(doc, {
    label: 'Elemento',
    icon: '＋',
    action: () => {
      menu.hidden = !menu.hidden;
      opener.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
    }
  });
  opener.setAttribute('aria-haspopup', 'menu');
  opener.setAttribute('aria-expanded', 'false');

  [
    ['Pista de baile', ['btnAddDance', 'addDance'], [/pista de baile/, /^pista$/]],
    ['Mesa de novios', ['btnAddCouple', 'addCouple'], [/mesa de novios/]],
    ['DJ / sonido', ['btnAddDj', 'addDj'], [/^dj/, /sonido/]],
    ['Barra', ['btnAddBar', 'addBar'], [/^barra$/]],
    ['Altar', ['btnAddAltar', 'addAltar'], [/^altar$/]],
    ['Mesa de torta', ['btnAddCake', 'addCake'], [/mesa de torta/, /^torta$/]],
    ['Photobooth', ['btnAddPhoto', 'addPhoto'], [/photobooth/, /fotocabina/]],
    ['Espejo', ['btnAddMirror', 'addMirror'], [/^espejo$/]]
  ].forEach(([label, ids, patterns]) => {
    const item = doc.createElement('button');
    item.type = 'button';
    item.className = 'mgd-dist-element-item';
    item.textContent = label;
    item.addEventListener('click', () => {
      clickExisting(doc, ids, patterns);
      menu.hidden = true;
      opener.setAttribute('aria-expanded', 'false');
    });
    menu.appendChild(item);
  });

  wrap.append(opener, menu);
  doc.addEventListener('pointerdown', (event) => {
    if (!wrap.contains(event.target)) {
      menu.hidden = true;
      opener.setAttribute('aria-expanded', 'false');
    }
  }, true);
  return wrap;
}

function buildHeader(doc) {
  const existing = doc.getElementById(HEADER_ID);
  if (existing) return existing;

  const header = doc.createElement('header');
  header.id = HEADER_ID;
  header.className = 'mgd-dist-native-header';
  header.innerHTML = `
    <div class="mgd-dist-heading">
      <span class="mgd-dist-eyebrow">ESPACIO DE LA BODA</span>
      <h1>Distribución del espacio</h1>
      <p>Diseña el salón, organiza las mesas y asigna a tus invitados.</p>
      <div class="mgd-dist-header-meta" aria-live="polite">
        <span class="mgd-dist-save-dot" aria-hidden="true"></span>
        <span class="mgd-dist-save-copy">Todo guardado</span>
      </div>
    </div>`;

  const toolbar = doc.createElement('div');
  toolbar.className = 'mgd-dist-native-toolbar';
  toolbar.append(
    actionButton(doc, {
      label: 'Mesa', icon: '＋', primary: true,
      action: () => clickExisting(doc, ['btnAddTable', 'addTable'], [/^mesa$/, /^agregar mesa$/, /^nueva mesa$/, /mesa 10 personas/])
    }),
    buildElementMenu(doc),
    actionButton(doc, {
      label: 'Deshacer', icon: '↶',
      action: () => doc.getElementById('btnUndo')?.click()
    }),
    actionButton(doc, {
      label: 'Rehacer', icon: '↷',
      action: () => doc.getElementById('btnRedo')?.click()
    }),
    actionButton(doc, {
      label: 'Medir', icon: '⌁', title: 'Medir distancias',
      action: () => doc.getElementById('btnMeasure')?.click()
    })
  );

  const spacer = doc.createElement('span');
  spacer.className = 'mgd-dist-toolbar-spacer';
  toolbar.appendChild(spacer);
  toolbar.appendChild(actionButton(doc, {
    label: 'Mis diseños', icon: '▱',
    action: () => clickExisting(
      doc,
      ['btnProposals', 'btnProposal', 'openProposalModal'],
      [/mis disenos/, /propuestas/, /abrir diseno/, /disenos guardados/]
    )
  }));

  header.appendChild(toolbar);
  doc.body.insertBefore(header, doc.body.firstChild);
  return header;
}

function regionFrom(node, preferredSelectors = []) {
  if (!node) return null;
  for (const selector of preferredSelectors) {
    const found = node.closest(selector);
    if (found && found !== node.ownerDocument.body) return found;
  }

  let current = node.parentElement;
  while (current && current !== node.ownerDocument.body) {
    const rect = current.getBoundingClientRect?.();
    if ((rect?.width || 0) >= 210 && (rect?.height || 0) >= 220) return current;
    current = current.parentElement;
  }
  return node.parentElement;
}

function commonAncestor(nodes = []) {
  const valid = nodes.filter(Boolean);
  if (!valid.length) return null;
  let current = valid[0].parentElement;
  while (current && current !== current.ownerDocument.body) {
    if (valid.every((node) => current.contains(node))) return current;
    current = current.parentElement;
  }
  return null;
}

function markRegions(doc) {
  const planner = doc.getElementById('planner');
  const selection = doc.getElementById('selectionForm');
  const seats = doc.getElementById('seatEditorWrap') || doc.getElementById('seatEditor');
  const drawTent = doc.getElementById('btnDrawTent');
  const layers = doc.getElementById('layerList');

  const canvas = regionFrom(planner, [
    '.canvas-panel', '.canvas-wrap', '.stage', '.workspace-center', '.editor-center', '.plan-wrap', '.planner-wrap'
  ]);
  canvas?.classList.add('mgd-dist-canvas-region');

  let inspector = commonAncestor([selection, seats]) || regionFrom(selection || seats, [
    '.inspector', '.properties', '.right-panel', '.right-sidebar', 'aside', '.sidebar', '.panel'
  ]);
  if (inspector?.contains(planner)) inspector = (selection || seats)?.parentElement;
  inspector?.classList.add('mgd-dist-inspector-region');

  let tools = regionFrom(drawTent || layers, [
    '.toolbox', '.tools', '.left-panel', '.left-sidebar', 'aside', '.sidebar', '.panel'
  ]);
  if (tools?.contains(planner) || tools === inspector) tools = (drawTent || layers)?.parentElement;
  tools?.classList.add('mgd-dist-tools-region');

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

function hideDuplicateGuests(doc) {
  const guestList = doc.getElementById('guestList');
  const guestSearch = doc.getElementById('guestSearch');
  const seatEditor = doc.getElementById('seatEditor');
  const planner = doc.getElementById('planner');
  if (!guestList || !guestSearch) return;

  let current = guestList.parentElement;
  let candidate = null;
  for (let depth = 0; current && depth < 7; depth += 1, current = current.parentElement) {
    if (current.contains(guestSearch)) candidate = current;
    if (seatEditor && current.contains(seatEditor)) break;
  }

  if (candidate && candidate !== doc.body && !candidate.contains(seatEditor) && !candidate.contains(planner)) {
    candidate.classList.add('mgd-dist-duplicate-guests');
  }
}

function hideInternalTabs(doc) {
  doc.querySelectorAll('[role="tablist"],.tabs,.tab-list,.tabbar,.tab-bar,.nav-tabs,.editor-tabs,.tool-tabs').forEach((node) => {
    if (node.closest(`#${HEADER_ID},#proposalModal`)) return;
    const controls = node.querySelectorAll('button,a,[role="tab"]');
    const text = normalize(node.textContent);
    const hits = ['objeto', 'mesa', 'invitado', 'capa', 'medicion', 'configuracion', 'herramienta']
      .filter((word) => text.includes(word)).length;
    if (controls.length >= 2 && hits >= 2) node.classList.add('mgd-dist-internal-tabs');
  });
}

function hideLegacyChrome(doc) {
  [...doc.querySelectorAll('body > header, body > .header, body > .topbar, body > .app-header')]
    .filter((node) => node.id !== HEADER_ID)
    .forEach((node) => node.classList.add('mgd-dist-old-chrome'));

  [...doc.querySelectorAll('h1,h2')].forEach((node) => {
    if (node.closest(`#${HEADER_ID}`)) return;
    const text = normalize(node.textContent);
    if (!/(distribucion|planificador|diseno del evento|editor del evento)/.test(text)) return;
    const parent = node.parentElement;
    if (parent && !parent.contains(doc.getElementById('planner'))) parent.classList.add('mgd-dist-old-chrome');
  });
}

function mirrorSaveStatus(doc, state) {
  const copy = doc.querySelector(`#${HEADER_ID} .mgd-dist-save-copy`);
  const dot = doc.querySelector(`#${HEADER_ID} .mgd-dist-save-dot`);
  const status = doc.getElementById('autosaveStatus');
  const title = doc.getElementById('autosaveTitle');
  const subtitle = doc.getElementById('autosaveSubtitle');

  const update = () => {
    const raw = normalize([title?.textContent, subtitle?.textContent, status?.textContent].filter(Boolean).join(' '));
    if (!copy || !dot) return;
    if (/guardando|saving/.test(raw)) {
      copy.textContent = 'Guardando…';
      dot.classList.add('is-saving');
      dot.classList.remove('is-error');
    } else if (/error|fallo|problema/.test(raw)) {
      copy.textContent = 'Revisar guardado';
      dot.classList.add('is-error');
      dot.classList.remove('is-saving');
    } else {
      copy.textContent = 'Todo guardado';
      dot.classList.remove('is-saving', 'is-error');
    }
  };

  state.statusObserver?.disconnect();
  state.statusObserver = new MutationObserver(update);
  [status, title, subtitle].filter(Boolean).forEach((node) => state.statusObserver.observe(node, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true
  }));
  update();
}

function applyNativeUi(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  if (!isDistributionDoc(doc)) return false;

  let state = frameState.get(frame);
  if (!state) {
    state = { statusObserver: null, domObserver: null, doc: null };
    frameState.set(frame, state);
  }

  ensureStyles(doc);
  doc.body.classList.add('mgd-distribucion-native');
  doc.documentElement.dataset.mgdDistribucionNativeUi = VERSION;
  buildHeader(doc);
  markRegions(doc);
  hideDuplicateGuests(doc);
  hideInternalTabs(doc);
  hideLegacyChrome(doc);
  mirrorSaveStatus(doc, state);

  if (state.doc !== doc) {
    state.domObserver?.disconnect();
    state.doc = doc;
    state.domObserver = new MutationObserver(() => {
      markRegions(doc);
      hideDuplicateGuests(doc);
      hideInternalTabs(doc);
      hideLegacyChrome(doc);
    });
    state.domObserver.observe(doc.body, { childList: true, subtree: true });
  }
  return true;
}

function bindFrame(frame) {
  if (!(frame instanceof HTMLIFrameElement)) return;
  const apply = () => window.setTimeout(() => applyNativeUi(frame), 35);
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
