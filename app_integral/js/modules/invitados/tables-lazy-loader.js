(() => {
  'use strict';

  const VERSION = '20260816-1510-final-style-ready';
  let tablesRuntime = null;

  function setReady(view, ready) {
    if (!view) return;
    view.style.visibility = ready ? 'visible' : 'hidden';
    view.style.opacity = ready ? '1' : '0';
    view.style.pointerEvents = ready ? '' : 'none';
    view.setAttribute('aria-busy', ready ? 'false' : 'true');
  }

  function finalStyleLoaded(view) {
    if (!view?.querySelector('#mgdTablesEditor')) return false;
    const doc = view.ownerDocument;
    const finalCss = doc?.querySelector('link[data-mgd-tables-old-look]');
    if (!finalCss) return false;
    try {
      return Boolean(finalCss.sheet);
    } catch (_) {
      return false;
    }
  }

  function revealWhenReady(view) {
    if (!view) return;
    setReady(view, false);

    if (finalStyleLoaded(view)) {
      setReady(view, true);
      return;
    }

    const doc = view.ownerDocument;
    const win = doc?.defaultView || window;
    const token = `${VERSION}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    view.dataset.mgdTablesReadyToken = token;

    let attempts = 0;
    const check = () => {
      if (!view.isConnected || view.dataset.mgdTablesReadyToken !== token) return;
      if (finalStyleLoaded(view)) {
        setReady(view, true);
        return;
      }
      attempts += 1;
      if (attempts < 180) win.setTimeout(check, 16);
    };

    const observer = new MutationObserver(() => {
      const finalCss = doc?.querySelector('link[data-mgd-tables-old-look]');
      if (finalCss && finalCss.dataset.mgdReadyLoadBound !== VERSION) {
        finalCss.dataset.mgdReadyLoadBound = VERSION;
        finalCss.addEventListener('load', () => check(), { once: true });
      }
      check();
      if (finalStyleLoaded(view)) observer.disconnect();
    });
    observer.observe(doc.documentElement, { childList: true, subtree: true });

    const existingCss = doc?.querySelector('link[data-mgd-tables-old-look]');
    if (existingCss && existingCss.dataset.mgdReadyLoadBound !== VERSION) {
      existingCss.dataset.mgdReadyLoadBound = VERSION;
      existingCss.addEventListener('load', () => check(), { once: true });
    }
    check();
  }

  function prepare(doc) {
    const view = doc?.getElementById('tablesView');
    if (!view) return null;
    setReady(view, false);
    revealWhenReady(view);
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
      setReady(view, true);
    });
  }

  function loadTablesRuntime() {
    if (tablesRuntime) return tablesRuntime;
    tablesRuntime = import(new URL('tables-editor-entry.js?v=20260816-1510-final-style-ready', import.meta.url).href)
      .then((runtime) => {
        const workspace = document.getElementById('unifiedWorkspace');
        workspace?.querySelectorAll('iframe').forEach((frame) => {
          let doc;
          try { doc = frame.contentDocument; } catch (_) { return; }
          revealWhenReady(doc?.getElementById('tablesView'));
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
    prepare(doc);
    if (doc.documentElement.dataset.mgdTablesLazyBound === VERSION) return true;
    doc.documentElement.dataset.mgdTablesLazyBound = VERSION;

    doc.addEventListener('click', (event) => {
      if (!isTablesControl(event.target)) return;
      prepare(doc);
      loadTablesRuntime();
    }, true);

    const view = doc.getElementById('tablesView');
    const win = doc.defaultView;
    if (view && win) {
      const style = win.getComputedStyle(view);
      if (style.display !== 'none' && !view.hidden) loadTablesRuntime();
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