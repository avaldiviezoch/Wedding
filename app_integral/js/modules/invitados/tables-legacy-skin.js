(() => {
  'use strict';

  const VERSION = '20260814-1625-legacyskin1';
  const CSS_HREF = new URL(`css/modules/invitados-tables-legacy-skin.css?v=${VERSION}`, document.baseURI).href;

  function signature(el) {
    const classes = typeof el.className === 'string' ? el.className : '';
    const dataNames = [...(el.attributes || [])]
      .map((attr) => attr.name)
      .filter((name) => name.startsWith('data-'))
      .join(' ');
    return `${el.id || ''} ${classes} ${dataNames}`.toLowerCase();
  }

  function restoreOriginalView(view, doc) {
    view.querySelector('#mgdTablesEditor')?.remove();
    doc.getElementById('mgdTablesModal')?.remove();
    doc.getElementById('mgdTablesStablePolish')?.remove();
    doc.getElementById('mgdSeatRemoveStyle')?.remove();
    doc.querySelector('link[data-mgd-tables-css]')?.remove();

    const backup = view.querySelector(':scope > .mgd-legacy-tables-backup');
    if (backup) {
      const fragment = doc.createDocumentFragment();
      while (backup.firstChild) fragment.appendChild(backup.firstChild);
      backup.replaceWith(fragment);
    }

    view.classList.remove('mgd-tables-enhanced');
    view.classList.add('mgd-tables-legacy-skin');
    view.dataset.mgdLegacySkin = VERSION;
  }

  function ensureCss(doc) {
    let link = doc.querySelector('link[data-mgd-legacy-tables-skin]');
    if (link) return;
    link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_HREF;
    link.dataset.mgdLegacyTablesSkin = VERSION;
    doc.head.appendChild(link);
  }

  function clearTags(view) {
    view.querySelectorAll('.mgd-legacy-table-grid,.mgd-legacy-table-card,.mgd-legacy-table-visual,.mgd-legacy-table-body,.mgd-legacy-seat,.mgd-legacy-guest-pill')
      .forEach((el) => el.classList.remove(
        'mgd-legacy-table-grid','mgd-legacy-table-card','mgd-legacy-table-visual',
        'mgd-legacy-table-body','mgd-legacy-seat','mgd-legacy-guest-pill',
        'mgd-shape-round','mgd-shape-square','mgd-shape-rectangular'
      ));
  }

  function classifyLegacyDom(view) {
    clearTags(view);
    const all = [...view.querySelectorAll('*')];

    for (const el of all) {
      const sig = signature(el);
      const tag = el.tagName;

      if (/(tables?|mesas?)[-_\s]?(grid|list|container|wrap|cards)/.test(sig) && !/tab|button/.test(sig)) {
        el.classList.add('mgd-legacy-table-grid');
      }

      if (tag !== 'BUTTON' && tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'OPTION' &&
          (/(table|mesa)[-_\s]?(card|item|box|panel)/.test(sig) || /(card|item)[-_\s]?(table|mesa)/.test(sig))) {
        el.classList.add('mgd-legacy-table-card');
      }

      if (tag !== 'BUTTON' && /(table|mesa)[-_\s]?(visual|preview|shape|drawing|graphic)/.test(sig)) {
        el.classList.add('mgd-legacy-table-visual');
      }

      if (tag !== 'BUTTON' && /(table|mesa)[-_\s]?(body|surface|top|center)/.test(sig)) {
        el.classList.add('mgd-legacy-table-body');
      }

      if (/(^|[-_\s])(seat|chair|silla)([-_\s]|$)/.test(sig) && !/editor|select|row|list|count/.test(sig)) {
        el.classList.add('mgd-legacy-seat');
      }

      if (/(guest|invitad)[-_\s]?(pill|chip|tag|badge|name)/.test(sig)) {
        el.classList.add('mgd-legacy-guest-pill');
      }

      if (el.classList.contains('mgd-legacy-table-body')) {
        if (/rect|rectangle|rectangular/.test(sig)) el.classList.add('mgd-shape-rectangular');
        else if (/square|cuadrad/.test(sig)) el.classList.add('mgd-shape-square');
        else el.classList.add('mgd-shape-round');
      }
    }

    /* Fallback semantico: detecta tarjetas por texto Mesa + contenido interactivo,
       sin reconstruir ni reemplazar ningun nodo del editor original. */
    if (!view.querySelector('.mgd-legacy-table-card')) {
      const candidates = [...view.querySelectorAll('article,section,li,div')]
        .filter((el) => {
          if (el === view || el.children.length < 2) return false;
          const own = [...el.childNodes]
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent || '')
            .join(' ');
          const heading = el.querySelector(':scope > h1,:scope > h2,:scope > h3,:scope > h4,:scope > strong,:scope > .title');
          const label = `${own} ${heading?.textContent || ''}`.trim();
          return /\bmesa\s*\d*\b/i.test(label) && el.querySelector('button,input,select,[draggable="true"]');
        });

      candidates.forEach((el) => el.classList.add('mgd-legacy-table-card'));
      const parentCounts = new Map();
      candidates.forEach((el) => {
        if (!el.parentElement) return;
        parentCounts.set(el.parentElement, (parentCounts.get(el.parentElement) || 0) + 1);
      });
      for (const [parent, count] of parentCounts) {
        if (count >= 2) parent.classList.add('mgd-legacy-table-grid');
      }
    }
  }

  function apply(frame) {
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return false; }
    const view = doc?.getElementById('tablesView');
    if (!doc?.head || !view || !doc.getElementById('guestList')) return false;

    restoreOriginalView(view, doc);
    ensureCss(doc);
    classifyLegacyDom(view);
    return true;
  }

  function scan() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return false;
    for (const frame of workspace.querySelectorAll('iframe')) {
      if (apply(frame)) return true;
    }
    return false;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (scan() || attempts >= 25) clearInterval(timer);
  }, 100);

  scan();
})();
