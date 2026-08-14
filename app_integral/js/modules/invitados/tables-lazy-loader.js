(() => {
  'use strict';

  const VERSION = '20260814-1645-exactlegacy1';
  let tablesRuntime = null;

  function clearLegacySkinTags(view) {
    view.querySelectorAll('.mgd-legacy-table-grid,.mgd-legacy-table-card,.mgd-legacy-table-visual,.mgd-legacy-table-body,.mgd-legacy-seat,.mgd-legacy-guest-pill')
      .forEach((el) => el.classList.remove(
        'mgd-legacy-table-grid',
        'mgd-legacy-table-card',
        'mgd-legacy-table-visual',
        'mgd-legacy-table-body',
        'mgd-legacy-seat',
        'mgd-legacy-guest-pill',
        'mgd-shape-round',
        'mgd-shape-square',
        'mgd-shape-rectangular'
      ));
  }

  function restoreExactLegacyTables() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return false;

    let restored = false;

    workspace.querySelectorAll('iframe').forEach((frame) => {
      let doc;
      try { doc = frame.contentDocument; } catch (_) { return; }

      const view = doc?.getElementById('tablesView');
      if (!view || !doc.getElementById('guestList')) return;

      /*
       * IMPORTANTE:
       * Mesas debe conservar EXACTAMENTE el DOM y la estetica del codigo antiguo.
       * No se aplica ningun skin nuevo ni se reclasifican elementos por heuristicas.
       */
      view.classList.remove('mgd-tables-enhanced', 'mgd-tables-legacy-skin');
      delete view.dataset.mgdLegacySkin;
      delete view.dataset.mgdLegacySkinObserver;

      view.querySelector('#mgdTablesEditor')?.remove();
      doc.getElementById('mgdTablesModal')?.remove();
      doc.getElementById('mgdTablesStablePolish')?.remove();
      doc.getElementById('mgdSeatRemoveStyle')?.remove();
      doc.querySelector('link[data-mgd-tables-css]')?.remove();
      doc.querySelector('link[data-mgd-legacy-tables-skin]')?.remove();

      clearLegacySkinTags(view);

      const legacy = view.querySelector(':scope > .mgd-legacy-tables-backup');
      if (legacy) {
        const fragment = doc.createDocumentFragment();
        while (legacy.firstChild) fragment.appendChild(legacy.firstChild);
        legacy.replaceWith(fragment);
      }

      restored = true;
    });

    return restored;
  }

  function loadTablesRuntime() {
    if (tablesRuntime) {
      restoreExactLegacyTables();
      return tablesRuntime;
    }

    /*
     * Antes se importaba tables-legacy-skin.js, que tomaba las mesas antiguas
     * y les imponia una estetica nueva. Eso producia una mezcla visual y era
     * lo contrario a conservar el aspecto original.
     */
    restoreExactLegacyTables();
    tablesRuntime = Promise.resolve(true);
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

    /* Limpiamos cualquier skin previo apenas aparece el modulo. */
    restoreExactLegacyTables();

    if (doc.documentElement.dataset.mgdTablesLazyBound === VERSION) return true;
    doc.documentElement.dataset.mgdTablesLazyBound = VERSION;

    doc.addEventListener('click', (event) => {
      if (!isTablesControl(event.target)) return;
      loadTablesRuntime();
      requestAnimationFrame(restoreExactLegacyTables);
    }, true);

    return true;
  }

  function scan() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;
    workspace.querySelectorAll('iframe').forEach((frame) => {
      if (!frame.dataset.mgdTablesLazyLoadBound || frame.dataset.mgdTablesLazyLoadBound !== VERSION) {
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
