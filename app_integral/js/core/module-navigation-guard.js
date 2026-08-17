(() => {
  'use strict';

  const VERSION = '20260817-module-navigation-guard-v2-single-active';
  let reconciling = false;
  let scheduled = 0;

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function currentModule() {
    return normalize(location.hash.replace(/^#/, ''));
  }

  function syncActive(moduleId) {
    const id = normalize(moduleId);
    if (reconciling) return;
    reconciling = true;

    document.querySelectorAll('[data-quick-module]').forEach(button => {
      const buttonId = normalize(button.dataset.quickModule);
      const selected = Boolean(id) && id !== 'home' && id !== 'logout' && buttonId === id;
      button.classList.toggle('active', selected);
      button.classList.toggle('is-active', selected);
      if (selected) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });

    reconciling = false;
  }

  function scheduleSync(moduleId) {
    const id = normalize(moduleId || currentModule());
    syncActive(id);

    if (scheduled) cancelAnimationFrame(scheduled);
    scheduled = requestAnimationFrame(() => {
      scheduled = 0;
      syncActive(currentModule() || id);
    });

    setTimeout(() => syncActive(currentModule() || id), 0);
  }

  function activateFallback(moduleId) {
    const id = normalize(moduleId);
    if (!id || currentModule() === id) return;
    const source = document.querySelector(`[data-module="${CSS.escape(id)}"]`);
    if (source instanceof HTMLElement) {
      source.click();
      return;
    }
    location.hash = id;
  }

  function requestedModule(target) {
    if (!(target instanceof Element)) return '';
    const trigger = target.closest('[data-quick-module]');
    return trigger ? normalize(trigger.dataset.quickModule) : '';
  }

  document.addEventListener('pointerdown', event => {
    const id = requestedModule(event.target);
    if (id) syncActive(id);
  }, true);

  document.addEventListener('click', event => {
    const id = requestedModule(event.target);
    if (!id) return;
    scheduleSync(id);
    requestAnimationFrame(() => {
      if (currentModule() !== id) activateFallback(id);
      scheduleSync(id);
    });
  }, true);

  window.addEventListener('hashchange', () => scheduleSync(currentModule()));
  window.addEventListener('pageshow', () => scheduleSync(currentModule()));

  const nav = document.getElementById('moduleQuickNav');
  if (nav) {
    new MutationObserver(() => {
      if (!reconciling) scheduleSync(currentModule());
    }).observe(nav, { childList: true, subtree: true });
  }

  scheduleSync(currentModule());

  window.MGDModuleNavigationGuard = Object.freeze({ version: VERSION, sync: syncActive });
})();
