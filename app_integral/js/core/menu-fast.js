(() => {
  'use strict';

  const VERSION = '20260814-1622-menufast4';
  let passthrough = false;
  let queuedClick = false;
  let authPoll = 0;

  function setMenu(open) {
    const body = document.body;
    const button = document.getElementById('menuButton');
    const drawer = document.getElementById('mainDrawer');
    const backdrop = document.getElementById('backdrop');
    if (!body || !button || !drawer || !backdrop) return;

    body.classList.toggle('menu-open', Boolean(open));
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.removeAttribute('aria-busy');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function authState() {
    // auth-hydrating solo se activa después de que Firebase ya identificó
    // una sesión válida. El contenido privado sigue protegido por auth-guard.css.
    if (document.body?.classList.contains('auth-hydrating')) {
      return { ready: true, authenticated: true, hydrating: true };
    }
    const guard = window.WeddingPlannerAuthGuard;
    if (!guard || !guard.ready) return { ready: false, authenticated: false, hydrating: false };
    return { ready: true, authenticated: Boolean(guard.authenticated), hydrating: false };
  }

  function keepHydratingMenuResponsive() {
    const button = document.getElementById('menuButton');
    if (!button) return;
    if (document.body.classList.contains('auth-hydrating')) {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  function releaseQueuedClick() {
    if (!queuedClick) return;
    const state = authState();
    if (!state.ready) return;

    queuedClick = false;
    const button = document.getElementById('menuButton');
    button?.removeAttribute('aria-busy');

    if (state.authenticated) {
      setMenu(true);
      return;
    }

    if (button) {
      passthrough = true;
      button.click();
      passthrough = false;
    }
  }

  function startAuthPoll() {
    if (authPoll) return;
    authPoll = window.setInterval(() => {
      keepHydratingMenuResponsive();
      releaseQueuedClick();
      if (!queuedClick || authState().ready) {
        clearInterval(authPoll);
        authPoll = 0;
      }
    }, 60);
    window.setTimeout(() => {
      if (authPoll) {
        clearInterval(authPoll);
        authPoll = 0;
      }
    }, 10000);
  }

  function bind() {
    const button = document.getElementById('menuButton');
    const backdrop = document.getElementById('backdrop');
    if (!button || !backdrop || button.dataset.mgdFastMenu === VERSION) return false;

    button.dataset.mgdFastMenu = VERSION;

    new MutationObserver(() => {
      keepHydratingMenuResponsive();
      releaseQueuedClick();
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    button.addEventListener('click', (event) => {
      if (passthrough) return;

      const state = authState();
      if (!state.ready) {
        event.preventDefault();
        event.stopImmediatePropagation();
        queuedClick = true;
        button.setAttribute('aria-busy', 'true');
        startAuthPoll();
        return;
      }

      if (!state.authenticated) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      setMenu(!document.body.classList.contains('menu-open'));
    }, true);

    backdrop.addEventListener('click', (event) => {
      if (!document.body.classList.contains('menu-open')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setMenu(false);
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
    });

    window.addEventListener('migrandia:wedding-context', releaseQueuedClick);
    keepHydratingMenuResponsive();
    return true;
  }

  if (!bind()) document.addEventListener('DOMContentLoaded', bind, { once: true });
})();
