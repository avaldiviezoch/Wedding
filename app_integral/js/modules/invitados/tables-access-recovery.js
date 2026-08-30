(() => {
  'use strict';

  const VERSION = '20260830-tables-access-recovery1';

  function normalized(value = '') {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function isTablesTab(control) {
    if (!control) return false;
    const values = [control.dataset?.view, control.dataset?.tab, control.id, control.textContent]
      .map(normalized);
    return values.some((value) =>
      value === 'tables' ||
      value === 'table' ||
      value === 'mesas' ||
      value.includes('mesas y asientos')
    );
  }

  function activateTables(doc, tab) {
    const view = doc?.getElementById('tablesView');
    if (!view) return;

    ['listView', 'mapView', 'rsvpNativeView'].forEach((id) => {
      const panel = doc.getElementById(id);
      if (panel) panel.hidden = true;
    });

    view.hidden = false;
    doc.querySelectorAll('.view-tabs .view-tab, .view-tabs [data-view], .view-tabs [data-tab]').forEach((control) => {
      control.classList.remove('active');
      control.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    // El loader de Mesas escucha este mismo clic en captura. Si el CSS final tarda
    // demasiado pero el editor ya existe, evitamos que la vista quede invisible.
    setTimeout(() => {
      const editor = view.querySelector('#mgdTablesEditor');
      if (!editor || view.hidden) return;
      view.style.visibility = 'visible';
      view.style.opacity = '1';
      view.style.pointerEvents = '';
      view.setAttribute('aria-busy', 'false');
    }, 1800);
  }

  function ensureTablesTab(doc) {
    if (!doc?.body || !doc.getElementById('guestList') || !doc.getElementById('tablesView')) return false;
    const tabs = doc.querySelector('.view-tabs');
    if (!tabs) return false;

    let tab = [...tabs.querySelectorAll('button, a, [data-view], [data-tab]')].find(isTablesTab);
    if (!tab) {
      tab = doc.createElement('button');
      tab.className = 'view-tab';
      tab.id = 'tablesTab';
      tab.type = 'button';
      tab.dataset.view = 'tables';
      tab.textContent = 'Mesas y asientos';
      const rsvpTab = tabs.querySelector('#rsvpNativeTab');
      if (rsvpTab) tabs.insertBefore(tab, rsvpTab);
      else tabs.appendChild(tab);
    }

    tab.hidden = false;
    tab.disabled = false;
    tab.removeAttribute('aria-hidden');
    tab.style.removeProperty('display');
    tab.style.removeProperty('visibility');
    tab.style.removeProperty('pointer-events');
    if (!normalized(tab.textContent).includes('mesas')) tab.textContent = 'Mesas y asientos';

    if (tab.dataset.mgdTablesAccessRecovery !== VERSION) {
      tab.dataset.mgdTablesAccessRecovery = VERSION;
      tab.addEventListener('click', () => activateTables(doc, tab));
    }
    return true;
  }

  function watchFrame(frame) {
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return false; }
    if (!ensureTablesTab(doc)) return false;

    if (frame.dataset.mgdTablesAccessRecoveryLoad !== VERSION) {
      frame.dataset.mgdTablesAccessRecoveryLoad = VERSION;
      frame.addEventListener('load', () => setTimeout(() => watchFrame(frame), 40));
    }

    if (doc.documentElement.dataset.mgdTablesAccessRecoveryObserver !== VERSION) {
      doc.documentElement.dataset.mgdTablesAccessRecoveryObserver = VERSION;
      let scheduled = false;
      new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          ensureTablesTab(doc);
        });
      }).observe(doc.body, { childList: true, subtree: true });
    }
    return true;
  }

  function scan() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;
    workspace.querySelectorAll('iframe').forEach((frame) => watchFrame(frame));
  }

  function start() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;
    if (workspace.dataset.mgdTablesAccessRecoveryObserver !== VERSION) {
      workspace.dataset.mgdTablesAccessRecoveryObserver = VERSION;
      new MutationObserver(scan).observe(workspace, { childList: true });
    }
    scan();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
