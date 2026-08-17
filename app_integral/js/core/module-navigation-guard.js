(() => {
  'use strict';

  const VERSION = '20260817-module-navigation-guard-v4-reopen';
  let reconciling = false;

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function hashModule() {
    return normalize(location.hash.replace(/^#/, ''));
  }

  function workspaceModule() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!document.body?.classList.contains('module-view')) return '';
    return normalize(workspace?.dataset?.activeModule);
  }

  function currentModule() {
    return workspaceModule() || hashModule();
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

  function workspaceHasContent(moduleId) {
    const id = normalize(moduleId);
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace || !workspace.childElementCount) return false;

    const owner = normalize(workspace.dataset.activeModule);
    if (owner && owner !== id) return false;

    if (id === 'invitaciones') {
      return Boolean(
        workspace.querySelector('[data-owner-module="invitaciones"], [data-invitations-layout], .mgd-inv-panel')
      );
    }

    return true;
  }

  function recoverEmptyWorkspace(moduleId) {
    const id = normalize(moduleId);
    if (!id) return;

    requestAnimationFrame(() => {
      if (workspaceHasContent(id)) return;

      // Algunos renderizadores heredados se activan únicamente con hashchange.
      // Si el hash ya era el mismo, el navegador no emite el evento; lo reemitimos
      // solo cuando el workspace quedó vacío para permitir una reapertura real.
      if (hashModule() === id) {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    });
  }

  function openModule(moduleId) {
    const id = normalize(moduleId);
    if (!id) return;

    syncActive(id);

    // Nunca retornamos solo porque el hash coincida. Invitaciones y algunos módulos
    // pueden limpiar/reemplazar el workspace sin cambiar el hash; en ese escenario
    // el botón superior debe poder abrir nuevamente el módulo.
    const source = sourceFor(id);
    if (source instanceof HTMLElement) {
      source.click();
      recoverEmptyWorkspace(id);
      return;
    }

    if (hashModule() !== id) {
      location.hash = id;
      return;
    }

    recoverEmptyWorkspace(id);
  }

  function requestedModule(target) {
    if (!(target instanceof Element)) return '';
    const trigger = target.closest('[data-quick-module]');
    return trigger ? normalize(trigger.dataset.quickModule) : '';
  }

  // Captura en window para ejecutarse antes que los handlers heredados de document.
  // El botón superior se traduce inmediatamente al acceso original data-module,
  // conservando la lógica propia de cada módulo y permitiendo reabrirlo si hiciera falta.
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

  window.addEventListener('hashchange', () => syncActive(hashModule() || currentModule()));
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
