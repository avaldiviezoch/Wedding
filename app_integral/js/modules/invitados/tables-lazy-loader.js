(() => {
  'use strict';

  const VERSION = '20260814-1730-no-legacy-flash';
  let tablesRuntime = null;

  function setTablesReady(view, ready) {
    if (!view) return;
    view.style.visibility = ready ? 'visible' : 'hidden';
    view.style.opacity = ready ? '1' : '0';
    view.style.pointerEvents = ready ? '' : 'none';
    view.setAttribute('aria-busy', ready ? 'false' : 'true');
    view.dataset.mgdTablesPrepared = VERSION;
  }

  function revealWhenEditorIsReady(view) {
    if (!view) return;
    if (view.querySelector('#mgdTablesEditor')) {
      setTablesReady(view, true);
      return;
    }
    if (view.dataset.mgdTablesReadyObserver === VERSION) return;
    view.dataset.mgdTablesReadyObserver = VERSION;
    const observer = new MutationObserver(() => {
      if (!view.querySelector('#mgdTablesEditor')) return;
      observer.disconnect();
      setTablesReady(view, true);
    });
    observer.observe(view, { childList: true, subtree: true });
  }

  function prepareTablesView(doc) {
    const view = doc?.getElementById('tablesView');
    if (!view) return null;
    if (!view.querySelector('#mgdTablesEditor')) setTablesReady(view, false);
    else setTablesReady(view, true);
    revealWhenEditorIsReady(view);
    return view;
  }

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
      doc.querySelector('link[data-mgd-tables-old-look]')?.remove();
      const legacy = view.querySelector('.mgd-legacy-tables-backup');
      if (legacy) {
        legacy.style.removeProperty('display');
        legacy.style.removeProperty('visibility');
      }
      setTablesReady(view, true);
    });
  }

  function loadTablesRuntime() {
    if (tablesRuntime) return tablesRuntime;
    tablesRuntime = import(new URL('tables-editor-entry.js?v=20260814-1730-no-legacy-flash', import.meta.url).href)
      .then((runtime) => {
        const workspace = document.getElementById('unifiedWorkspace');
        workspace?.querySelectorAll('iframe').forEach((frame) => {
          let doc;
          try { doc = frame.contentDocument; } catch (_) { return; }
          const view = doc?.getElementById('tablesView');
          if (view) revealWhenEditorIsReady(view);
        });
        return runtime;
      })
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
    prepareTablesView(doc);
    if (doc.documentElement.dataset.mgdTablesLazyBound === VERSION) return true;
    doc.documentElement.dataset.mgdTablesLazyBound = VERSION;
    doc.addEventListener('click', (event) => {
      if (!isTablesControl(event.target)) return;
      prepareTablesView(doc);
      loadTablesRuntime();
    }, true);
    const tablesView = doc.getElementById('tablesView');
    const win = doc.defaultView;
    if (tablesView && win) {
      const style = win.getComputedStyle(tablesView);
      if (style.display !== 'none' && !tablesView.hidden) loadTablesRuntime();
    }
    return true;
  }

  function scan() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;
    workspace.querySelectorAll('iframe').forEach((frame) => {
      if (frame.dataset.mgdTablesLazyLoadBound !== VERSION) {
        frame.dataset.mgdTablesLazyLoadBound = VERSION;
        frame.addEventListener('load', () => bindGuestFrame(frame));
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