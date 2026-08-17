(() => {
  'use strict';

  const NAV_SELECTOR = '#moduleQuickNav';
  const TAB_SELECTOR = '[data-quick-module]';
  const MODULE_TRIGGER_SELECTOR = '[data-module],[data-quick-module]';
  const CLEAR_TRIGGER_SELECTOR = '#moduleQuickHome,#unifiedHomeButton,.module-quick-home,.unified-home-button,#moduleSessionLogout,#logoutButton,.module-session-logout,.account-logout';

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function currentModuleFromHash() {
    return normalize(location.hash.replace(/^#/, ''));
  }

  function setActiveModule(moduleId) {
    const activeId = normalize(moduleId);
    document.querySelectorAll(`${NAV_SELECTOR} ${TAB_SELECTOR}`).forEach(button => {
      const buttonId = normalize(button.dataset.quickModule);
      const active = Boolean(activeId) && buttonId === activeId;
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });
  }

  function syncFromLocation() {
    setActiveModule(currentModuleFromHash());
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (target.closest(CLEAR_TRIGGER_SELECTOR)) {
      queueMicrotask(() => setActiveModule(''));
      return;
    }

    const trigger = target.closest(MODULE_TRIGGER_SELECTOR);
    if (!trigger) return;

    const moduleId = normalize(trigger.dataset.quickModule || trigger.dataset.module);
    if (!moduleId) return;

    // Run after module-specific handlers so this stays the final source of truth.
    queueMicrotask(() => setActiveModule(moduleId));
  }, true);

  window.addEventListener('hashchange', syncFromLocation);
  window.addEventListener('popstate', syncFromLocation);

  function observeFutureButtons() {
    const nav = document.querySelector(NAV_SELECTOR);
    if (!nav) return;
    new MutationObserver(syncFromLocation).observe(nav, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observeFutureButtons();
      syncFromLocation();
    }, { once: true });
  } else {
    observeFutureButtons();
    syncFromLocation();
  }

  window.MiGranDiaModuleNav = Object.freeze({
    setActiveModule,
    syncFromLocation
  });
})();
