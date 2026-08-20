(() => {
  'use strict';

  const VERSION = '20260820-account-menu1';

  function ensureStyles() {
    if (document.querySelector('link[data-mgd-context-bar]')) return;
    if ([...document.styleSheets].some((sheet) => String(sheet.href || '').includes('module-context-bar.css'))) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL(`css/core/module-context-bar.css?v=${VERSION}`, document.baseURI).href;
    link.dataset.mgdContextBar = VERSION;
    document.head.appendChild(link);
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

    if (!document.getElementById('moduleAccountButton')) {
      const actions = document.createElement('div');
      actions.className = 'module-context-actions';
      actions.innerHTML = `
        <button class="module-context-chip" id="moduleWeddingButton" type="button" aria-label="Cambiar boda o administrar accesos">
          <span class="module-context-label">Tu boda</span>
          <strong class="module-context-name" id="moduleWeddingName">Mi boda</strong>
          <span class="module-context-role" id="moduleWeddingRole">Propietario</span>
        </button>
        <div class="module-account-wrap" id="moduleAccountWrap">
          <button class="module-account-chip" id="moduleAccountButton" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Abrir cuenta">
            <img class="module-account-avatar" id="moduleAccountAvatar" alt="Foto de perfil">
            <span class="module-account-initials" id="moduleAccountInitials">MGD</span>
          </button>
          <div class="module-account-popover" role="dialog" aria-label="Cuenta activa">
            <strong id="moduleAccountName">Mi cuenta</strong>
            <span id="moduleAccountEmail"></span>
            <button class="module-account-logout" id="moduleContextLogout" type="button">Cerrar sesión</button>
          </div>
        </div>`;
      nav.appendChild(actions);
    }

    nav.setAttribute('aria-label', 'Navegación y contexto de la boda');
    return true;
  }

  function ensureController() {
    if (document.querySelector('script[data-mgd-context-controller]')) return;
    if (document.getElementById('moduleQuickNav')?.dataset.mgdContextBar) return;

    const script = document.createElement('script');
    script.src = new URL(`js/core/module-context-bar.js?v=${VERSION}`, document.baseURI).href;
    script.dataset.mgdContextController = VERSION;
    script.defer = true;
    document.head.appendChild(script);
  }

  function init() {
    ensureStyles();
    if (!ensureMarkup()) return;
    ensureController();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
