(() => {
  'use strict';

  const VERSION = '20260817-module-navigation-guard-v6-deterministic';
  const RETRY_DELAYS = [0, 80, 220];
  let reconciling = false;
  let navigationToken = 0;

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function hashModule() {
    return normalize(location.hash.replace(/^#/, ''));
  }

  function workspace() {
    return document.getElementById('unifiedWorkspace');
  }

  function workspaceModule() {
    const root = workspace();
    if (!document.body?.classList.contains('module-view')) return '';
    return normalize(root?.dataset?.activeModule);
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

  function belongsTo(moduleId) {
    const id = normalize(moduleId);
    const root = workspace();
    if (!root || !root.childElementCount) return false;

    const owner = normalize(root.dataset.activeModule);
    if (owner && owner !== id) return false;

    if (id === 'invitaciones') {
      return Boolean(root.querySelector('[data-owner-module="invitaciones"], [data-invitations-layout], .mgd-inv-panel'));
    }

    return true;
  }

  function cleanForNavigation(moduleId) {
    const id = normalize(moduleId);
    const root = workspace();
    if (!root) return;

    // Cada navegación arranca desde un estado conocido. No dejamos que el contenido
    // del módulo anterior determine si el siguiente puede abrir o reabrirse.
    root.replaceChildren();
    root.dataset.activeModule = id;
    root.removeAttribute('data-mgd-invitations-fast');

    if (id !== 'invitaciones') {
      document.getElementById('mgdNativeInvitationsStyles')?.remove();
      document.getElementById('mgdInvitationMobilePanelStyles')?.remove();
    }

    document.body.dataset.mgdActiveModule = id;
    document.body.classList.add('module-view');
  }

  function alignHash(moduleId) {
    const id = normalize(moduleId);
    const wanted = `#${id}`;
    if (location.hash === wanted) return false;
    history.replaceState({ module: id }, '', `${location.pathname}${location.search}${wanted}`);
    return true;
  }

  function triggerOriginal(moduleId) {
    const id = normalize(moduleId);
    const source = sourceFor(id);

    if (source instanceof HTMLElement) {
      source.click();
      return true;
    }

    window.dispatchEvent(new Event('hashchange'));
    return false;
  }

  function verifyAndRetry(moduleId, token, attempt = 0) {
    const id = normalize(moduleId);
    if (token !== navigationToken || belongsTo(id)) return;
    if (attempt >= RETRY_DELAYS.length) return;

    window.setTimeout(() => {
      if (token !== navigationToken || belongsTo(id)) return;

      // Repetimos el ciclo de activación, no solo el cambio visual del botón.
      // Esto cubre renderizadores que escuchan click y otros que escuchan hashchange.
      const source = sourceFor(id);
      if (source instanceof HTMLElement) source.click();
      window.dispatchEvent(new Event('hashchange'));

      verifyAndRetry(id, token, attempt + 1);
    }, RETRY_DELAYS[attempt]);
  }

  function openModule(moduleId) {
    const id = normalize(moduleId);
    if (!id) return;

    const token = ++navigationToken;
    syncActive(id);
    cleanForNavigation(id);
    alignHash(id);

    // Siempre ejecutamos la entrada original, incluso si se vuelve al mismo módulo
    // o si ya se visitó anteriormente durante la sesión.
    triggerOriginal(id);
    window.dispatchEvent(new Event('hashchange'));
    verifyAndRetry(id, token, 0);
  }

  function requestedModule(target) {
    if (!(target instanceof Element)) return '';
    const trigger = target.closest('[data-quick-module]');
    return trigger ? normalize(trigger.dataset.quickModule) : '';
  }

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
