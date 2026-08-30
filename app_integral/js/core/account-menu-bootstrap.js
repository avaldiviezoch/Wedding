(() => {
  'use strict';

  const VERSION = '20260830-account-menu5';
  let controllerPromise = null;

  function ensureStyles() {
    const href = new URL(`css/core/module-context-bar.css?v=${VERSION}`, document.baseURI).href;
    const existing = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .find((link) => String(link.href || '').includes('module-context-bar.css'));

    if (existing) {
      if (existing.href !== href) existing.href = href;
      existing.dataset.mgdContextBar = VERSION;
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.mgdContextBar = VERSION;
    document.head.appendChild(link);
  }

  function accountMarkup() {
    const wrap = document.createElement('div');
    wrap.className = 'module-account-wrap';
    wrap.id = 'moduleAccountWrap';
    wrap.innerHTML = `
      <button class="module-account-chip" id="moduleAccountButton" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Abrir cuenta">
        <img class="module-account-avatar" id="moduleAccountAvatar" alt="Foto de perfil">
        <span class="module-account-initials" id="moduleAccountInitials">MGD</span>
      </button>
      <div class="module-account-popover" role="dialog" aria-label="Cuenta activa">
        <strong id="moduleAccountName">Mi cuenta</strong>
        <span id="moduleAccountEmail"></span>
        <button class="module-account-logout" id="moduleContextLogout" type="button">Cerrar sesión</button>
      </div>`;
    return wrap;
  }

  function removeLegacyGlobalHost() {
    const legacyHost = document.getElementById('globalAccountActions');
    if (!legacyHost) return;

    const accountWrap = legacyHost.querySelector('#moduleAccountWrap');
    const navActions = document.querySelector('#moduleQuickNav .module-context-actions');
    if (accountWrap && navActions) navActions.appendChild(accountWrap);
    legacyHost.remove();
  }

  function ensureMarkup() {
    const nav = document.getElementById('moduleQuickNav');
    if (!nav) return false;

    const home = document.getElementById('moduleQuickHome');
    if (home && !home.querySelector('.module-home-arrow')) {
      home.setAttribute('aria-label', 'Volver al menú');
      home.innerHTML = '<span class="module-home-arrow" aria-hidden="true">←</span><span class="module-home-label">Menú</span>';
    }

    if (!document.getElementById('moduleMobileTabs')) {
      const mobileTabs = document.createElement('button');
      mobileTabs.className = 'module-mobile-tabs';
      mobileTabs.id = 'moduleMobileTabs';
      mobileTabs.type = 'button';
      mobileTabs.setAttribute('aria-label', 'Mostrar módulos');
      mobileTabs.textContent = 'Módulos';
      home?.insertAdjacentElement('afterend', mobileTabs);
    }

    nav.querySelector('.module-quick-scroll')?.setAttribute('aria-label', 'Cambiar de módulo');

    let actions = nav.querySelector('.module-context-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'module-context-actions';
      nav.appendChild(actions);
    }

    if (!document.getElementById('moduleWeddingButton')) {
      const weddingButton = document.createElement('button');
      weddingButton.className = 'module-context-chip';
      weddingButton.id = 'moduleWeddingButton';
      weddingButton.type = 'button';
      weddingButton.setAttribute('aria-label', 'Cambiar boda o administrar accesos');
      weddingButton.innerHTML = `
        <span class="module-context-label">Tu boda</span>
        <strong class="module-context-name" id="moduleWeddingName">Mi boda</strong>
        <span class="module-context-role" id="moduleWeddingRole">Propietario</span>`;
      actions.appendChild(weddingButton);
    }

    removeLegacyGlobalHost();

    let accountWrap = document.getElementById('moduleAccountWrap');
    if (!accountWrap) accountWrap = accountMarkup();
    if (accountWrap.parentElement !== actions) actions.appendChild(accountWrap);

    document.querySelectorAll('#globalAccountActions').forEach((host) => host.remove());
    nav.setAttribute('aria-label', 'Navegación y contexto de la boda');
    return true;
  }

  function ensureController() {
    const nav = document.getElementById('moduleQuickNav');
    if (!nav || nav.dataset.mgdContextBar) return Promise.resolve();
    if (controllerPromise) return controllerPromise;

    const controllerUrl = new URL(`./module-context-bar.js?v=${VERSION}`, import.meta.url).href;
    controllerPromise = import(controllerUrl).catch((error) => {
      controllerPromise = null;
      console.error('No se pudo activar el menú de cuenta de módulos:', error);
    });
    return controllerPromise;
  }

  function init() {
    ensureStyles();
    if (!ensureMarkup()) return;
    ensureController();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
