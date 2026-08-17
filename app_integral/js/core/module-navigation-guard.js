(() => {
  'use strict';

  const VERSION = '20260817-module-navigation-guard-v1';

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function currentModule() {
    return normalize(location.hash.replace(/^#/, ''));
  }

  function activateFallback(moduleId) {
    const id = normalize(moduleId);
    if (!id || currentModule() === id) return;

    const source = document.querySelector(`[data-module="${CSS.escape(id)}"]`);
    if (source instanceof HTMLElement) {
      source.click();
      return;
    }

    // Último recurso para módulos futuros que ya estén registrados por hash.
    location.hash = id;
  }

  document.addEventListener('click', event => {
    const trigger = event.target instanceof Element
      ? event.target.closest('[data-quick-module]')
      : null;
    if (!trigger) return;

    const moduleId = normalize(trigger.dataset.quickModule);
    if (!moduleId) return;

    // Dejamos actuar primero al router heredado. Solo intervenimos si el clic
    // no cambió realmente de módulo, evitando dobles aperturas o regresiones.
    window.setTimeout(() => {
      if (currentModule() !== moduleId) activateFallback(moduleId);
    }, 90);
  }, true);

  window.MGDModuleNavigationGuard = Object.freeze({ version: VERSION });
})();
