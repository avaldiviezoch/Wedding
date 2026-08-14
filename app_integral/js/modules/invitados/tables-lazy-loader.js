(() => {
  'use strict';

  const VERSION = '20260814-1605-tablesstable2';
  let tablesRuntime = null;

  function restoreLegacyTables() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;
    workspace.querySelectorAll('iframe').forEach((frame) => {
      let doc;
      try { doc = frame.contentDocument; } catch (_) { return; }
      const view = doc?.getElementById('tablesView');
      if (!view) return;

      view.classList.remove('mgd-tables-enhanced');
      view.querySelector('#mgdTablesEditor')?.remove();
      doc.getElementById('mgdTablesModal')?.remove();
      doc.querySelector('link[data-mgd-tables-css]')?.remove();

      const legacy = view.querySelector('.mgd-legacy-tables-backup');
      if (legacy) {
        legacy.style.removeProperty('display');
        legacy.style.removeProperty('visibility');
      }
    });
  }

  function loadTablesRuntime() {
    if (tablesRuntime) return tablesRuntime;
    tablesRuntime = import(new URL('tables-editor-entry.js?v=20260814-1605-seatremove1', import.meta.url).href)
      .catch((error) => {
        console.error('No se pudo iniciar el Editor de Mesas:', error);
        restoreLegacyTables();
        tablesRuntime = null;
        return null;
      });
    return tablesRuntime;
  }

  function isTablesControl(node) {
    const control = node?.closest?.('[data-view],#tablesTab,[data-tab]');
    if (!control) return false;
    const values = [control.dataset?.view, control.dataset?.tab, control.id, control.textContent]
      .map((value) => String(value || '').trim().toLowerCase());
    return values.some((value) => value === 'tables' || value === 'table' || value === 'mesas' || value.includes('mesa'));
  }

  function bindGuestFrame(frame) {
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return false; }
    if (!doc?.body || !doc.getElementById('guestList') || !doc.getElementById('tablesView')) return false;

    if (doc.documentElement.dataset.mgdTablesLazyBound === VERSION) return true;
    doc.documentElement.dataset.mgdTablesLazyBound = VERSION;

    doc.addEventListener('click', (event) => {
      if (!isTablesControl(event.target)) return;
      loadTablesRuntime();
    }, true);

    return true;
  }

  function scan() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;
    workspace.querySelectorAll('iframe').forEach((frame) => {
      if (!frame.dataset.mgdTablesLazyLoadBound) {
        frame.dataset.mgdTablesLazyLoadBound = VERSION;
        frame.addEventListener('load', () => setTimeout(() => bindGuestFrame(frame), 30));
      }
      bindGuestFrame(frame);
    });
  }

  function bindWorkspace() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace || workspace.dataset.mgdTablesLazyObserver === VERSION) return;
    workspace.dataset.mgdTablesLazyObserver = VERSION;
    new MutationObserver(scan).observe(workspace, { childList: true, subtree: true });
    scan();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindWorkspace, { once: true });
  else bindWorkspace();
})();
