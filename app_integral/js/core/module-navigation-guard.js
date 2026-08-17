(() => {
  'use strict';

  const VERSION = '20260817-module-navigation-guard-v7-free-return';
  const RETRY_DELAYS = [70, 180, 420];
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

  function isInvitationContent(root = workspace()) {
    return Boolean(root?.querySelector?.(
      '[data-owner-module="invitaciones"], [data-invitations-layout], .mgd-inv-panel'
    ));
  }

  function fingerprint(root = workspace()) {
    if (!root?.firstElementChild) return '';
    const first = root.firstElementChild;
    const frame = first.matches?.('iframe') ? first : first.querySelector?.('iframe');
    return [
      root.childElementCount,
      first.tagName || '',
      first.id || '',
      typeof first.className === 'string' ? first.className : '',
      frame?.getAttribute?.('src') || ''
    ].join('|');
  }

  function rendered(moduleId, before) {
    const id = normalize(moduleId);
    const root = workspace();
    if (!root || !root.childElementCount) return false;

    if (id === 'invitaciones') return isInvitationContent(root);
    if (isInvitationContent(root)) return false;

    const owner = normalize(root.dataset.activeModule);
    if (owner === id) return true;

    if (before.previousId === id && root.childElementCount) return true;
    if (root.firstElementChild !== before.firstElement) return true;
    if (fingerprint(root) !== before.fingerprint) return true;

    return false;
  }

  function markRendered(moduleId) {
    const id = normalize(moduleId);
    const root = workspace();
    if (!root || !root.childElementCount) return false;

    root.dataset.activeModule = id;
    document.body.dataset.mgdActiveModule = id;
    document.body.classList.add('module-view');
    syncActive(id);

    const wanted = `#${id}`;
    if (location.hash !== wanted) {
      history.replaceState({ module: id }, '', `${location.pathname}${location.search}${wanted}`);
    }

    if (id !== 'invitaciones') {
      document.getElementById('mgdNativeInvitationsStyles')?.remove();
      document.getElementById('mgdInvitationMobilePanelStyles')?.remove();
    }

    return true;
  }

  function prepareAttempt() {
    const root = workspace();
    if (!root) return;

    // MUY IMPORTANTE: liberamos únicamente la marca de estado anterior.
    // No borramos el contenido antes del click. El renderizador del módulo debe
    // poder ejecutarse primero; borrar y marcar antes fue la causa del fallo al volver.
    root.removeAttribute('data-active-module');
    delete root.dataset.activeModule;
    document.body.removeAttribute('data-mgd-active-module');
    delete document.body.dataset.mgdActiveModule;
  }

  function triggerOriginal(moduleId) {
    const source = sourceFor(moduleId);
    if (!(source instanceof HTMLElement)) return false;
    source.click();
    return true;
  }

  function triggerHashRoute(moduleId) {
    const id = normalize(moduleId);
    const wanted = `#${id}`;
    if (location.hash !== wanted) {
      location.hash = id;
    } else {
      window.dispatchEvent(new Event('hashchange'));
    }
  }

  function hardRetry(moduleId, token) {
    if (token !== navigationToken) return;
    const id = normalize(moduleId);
    const root = workspace();
    if (!root) return;

    // Solo después de haber intentado la navegación normal permitimos limpiar.
    // Así nunca bloqueamos al router original por adelantarle un activeModule falso.
    root.replaceChildren();
    prepareAttempt();

    const before = {
      previousId: '',
      firstElement: null,
      fingerprint: ''
    };

    triggerOriginal(id);
    triggerHashRoute(id);

    window.setTimeout(() => {
      if (token !== navigationToken) return;
      if (rendered(id, before)) markRendered(id);
    }, 80);
  }

  function verify(moduleId, token, before, attempt = 0) {
    const id = normalize(moduleId);
    if (token !== navigationToken) return;

    if (rendered(id, before)) {
      markRendered(id);
      return;
    }

    if (attempt >= RETRY_DELAYS.length) {
      hardRetry(id, token);
      return;
    }

    window.setTimeout(() => {
      if (token !== navigationToken) return;

      if (rendered(id, before)) {
        markRendered(id);
        return;
      }

      // Cubrimos ambos tipos de router existentes: los que escuchan el enlace
      // original y los que reaccionan al hash. Seguimos sin marcar el módulo antes.
      prepareAttempt();
      triggerOriginal(id);
      triggerHashRoute(id);
      verify(id, token, before, attempt + 1);
    }, RETRY_DELAYS[attempt]);
  }

  function openModule(moduleId) {
    const id = normalize(moduleId);
    if (!id) return;

    const root = workspace();
    const previousId = currentModule();
    const token = ++navigationToken;
    const before = {
      previousId,
      firstElement: root?.firstElementChild || null,
      fingerprint: fingerprint(root)
    };

    syncActive(id);
    prepareAttempt();

    // Siempre ejecutamos la entrada original. Se puede ir, volver y repetir cualquier
    // módulo sin depender de la secuencia previa ni de que el hash ya coincida.
    triggerOriginal(id);

    requestAnimationFrame(() => {
      if (token !== navigationToken) return;
      if (rendered(id, before)) {
        markRendered(id);
        return;
      }

      triggerHashRoute(id);
      verify(id, token, before, 0);
    });
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
