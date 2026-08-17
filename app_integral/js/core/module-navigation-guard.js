(() => {
  'use strict';

  const VERSION = '20260817-module-navigation-guard-v3-direct';
  let reconciling = false;

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

  function sourceFor(moduleId) {
    const id = normalize(moduleId);
    if (!id) return null;
    return document.querySelector(`[data-module="${CSS.escape(id)}"]`);
  }

  function openModule(moduleId) {
    const id = normalize(moduleId);
    if (!id) return;

    syncActive(id);
    if (currentModule() === id) return;

    const source = sourceFor(id);
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

  // Captura en window para ejecutarse antes que los handlers heredados de document.
  // El botón superior no espera timers ni una segunda ruta de navegación: se traduce
  // inmediatamente al acceso original data-module, que conserva toda la lógica existente.
  window.addEventListener('pointerdown', event => {
    const id = requestedModule(event.target);
    if (id) syncActive(id);
  }, true);

  window.addEventListener('click', event => {
    const id = requestedModule(event.target);
    if (!id) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    openModule(id);
  }, true);

  window.addEventListener('hashchange', () => syncActive(currentModule()));
  window.addEventListener('pageshow', () => syncActive(currentModule()));

  const nav = document.getElementById('moduleQuickNav');
  if (nav) {
    new MutationObserver(() => {
      if (!reconciling) syncActive(currentModule());
    }).observe(nav, { childList: true, subtree: true });
  }

  syncActive(currentModule());

  window.MGDModuleNavigationGuard = Object.freeze({
    version: VERSION,
    sync: syncActive,
    open: openModule
  });
})();
