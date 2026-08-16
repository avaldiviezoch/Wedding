(() => {
  'use strict';

  const VERSION = '20260816-1916-idle1';
  let tablesRuntime = null;
  let preloadScheduled = false;

  function setReady(view, ready) {
    if (!view) return;
    view.style.visibility = ready ? 'visible' : 'hidden';
    view.style.opacity = ready ? '1' : '0';
    view.style.pointerEvents = ready ? '' : 'none';
    view.setAttribute('aria-busy', ready ? 'false' : 'true');
  }

  function finalStyleLoaded(view) {
    if (!view?.querySelector('#mgdTablesEditor')) return false;
    const link = view.ownerDocument?.querySelector('link[data-mgd-tables-old-look]');
    if (!link) return false;
    try { return Boolean(link.sheet); } catch (_) { return false; }
  }

  function revealWhenReady(view) {
    if (!view) return;
    if (finalStyleLoaded(view)) {
      setReady(view, true);
      return;
    }
    setReady(view, false);
    const doc = view.ownerDocument;
    let attempts = 0;
    const check = () => {
      if (!view.isConnected) return;
      if (finalStyleLoaded(view)) {
        setReady(view, true);
        return;
      }
      const link = doc?.querySelector('link[data-mgd-tables-old-look]');
      if (link && !link.dataset.mgdRevealBound) {
        link.dataset.mgdRevealBound = VERSION;
        link.addEventListener('load', () => setReady(view, true), { once: true });
      }
      attempts += 1;
      if (attempts < 30) setTimeout(check, 50);
      else if (view.querySelector('#mgdTablesEditor')) setReady(view, true);
    };
    check();
  }

  function prepare(doc) {
    const view = doc?.getElementById('tablesView');
    if (!view) return null;
    if (!finalStyleLoaded(view)) setReady(view, false);
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
    tablesRuntime = import(new URL('tables-editor-entry.js?v=20260816-1545-fast-tables1', import.meta.url).href)
      .then((runtime) => {
        const workspace = document.getElementById('unifiedWorkspace');
        workspace?.querySelectorAll('iframe').forEach((frame) => {
          try { revealWhenReady(frame.contentDocument?.getElementById('tablesView')); } catch (_) {}
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
    const control = node?.closest?.('[data-view],#tablesTab,[data-tab],button,a');
    if (!control) return false;
    const values = [control.dataset?.view, control.dataset?.tab, control.id, control.textContent]
      .map((value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase());
    return values.some((value) => value === 'tables' || value === 'table' || value === 'mesas' || value.includes('mesas y asientos'));
  }

  function scheduleIdlePreload() {
    if (preloadScheduled || tablesRuntime) return;
    preloadScheduled = true;
    const run = () => {
      preloadScheduled = false;
      loadTablesRuntime();
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 1400 });
    else setTimeout(run, 900);
  }

  function bindGuestFrame(frame) {
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return false; }
    if (!doc?.body || !doc.getElementById('guestList') || !doc.getElementById('tablesView')) return false;

    prepare(doc);
    if (doc.documentElement.dataset.mgdTablesLazyBound !== VERSION) {
      doc.documentElement.dataset.mgdTablesLazyBound = VERSION;
      doc.addEventListener('click', (event) => {
        if (!isTablesControl(event.target)) return;
        const view = prepare(doc);
        loadTablesRuntime().then(() => revealWhenReady(view));
      }, true);
    }

    scheduleIdlePreload();
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
    new MutationObserver(scan).observe(workspace, { childList: true });
    scan();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindWorkspace, { once: true });
  else bindWorkspace();
})();