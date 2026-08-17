(() => {
  'use strict';

  const VERSION = '20260816-2112-menu-recovery1';
  let queuedClick = false;
  let authPoll = 0;

  function loadResponsiveCss() {
    if (document.querySelector('link[data-mgd-home-responsive]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL(`css/core/home-responsive.css?v=${VERSION}`, document.baseURI).href;
    link.dataset.mgdHomeResponsive = VERSION;
    document.head.appendChild(link);
  }

  function initHeroVideo() {
    const video = document.getElementById('heroVideo');
    if (!video || video.dataset.mgdHeroVideo === VERSION) return;
    video.dataset.mgdHeroVideo = VERSION;
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    const tryPlay = () => {
      try { video.play()?.catch?.(() => {}); } catch (_) {}
    };
    video.addEventListener('canplay', tryPlay);
    window.addEventListener('focus', tryPlay);
    document.addEventListener('pointerdown', tryPlay, { once: true, passive: true });
    tryPlay();
  }

  function setMenu(open) {
    const body = document.body;
    const button = document.getElementById('menuButton');
    const drawer = document.getElementById('mainDrawer');
    const backdrop = document.getElementById('backdrop');
    if (!body || !button || !drawer || !backdrop) return false;
    body.classList.toggle('menu-open', Boolean(open));
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.removeAttribute('aria-busy');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
    return true;
  }

  function plannerReadyForMenu() {
    if (!document.body) return false;
    if (document.body.classList.contains('auth-hydrating')) return true;
    if (!document.body.classList.contains('auth-locked')) return true;
    return Boolean(window.WeddingPlannerAuthGuard?.authenticated);
  }

  function requestAuth() {
    if (typeof window.WeddingPlannerRequestAuth === 'function') {
      window.WeddingPlannerRequestAuth();
      return true;
    }
    return false;
  }

  function resolveQueuedClick() {
    if (!queuedClick) return;
    const button = document.getElementById('menuButton');
    if (plannerReadyForMenu()) {
      queuedClick = false;
      button?.removeAttribute('aria-busy');
      setMenu(true);
      return;
    }
    if (window.WeddingPlannerAuthGuard?.ready && !window.WeddingPlannerAuthGuard?.authenticated) {
      queuedClick = false;
      button?.removeAttribute('aria-busy');
      requestAuth();
    }
  }

  function startAuthPoll() {
    if (authPoll) return;
    authPoll = window.setInterval(resolveQueuedClick, 80);
    window.setTimeout(() => {
      if (!queuedClick) return;
      queuedClick = false;
      document.getElementById('menuButton')?.removeAttribute('aria-busy');
      if (!plannerReadyForMenu()) requestAuth();
      clearInterval(authPoll);
      authPoll = 0;
    }, 5000);
  }

  function bind() {
    const button = document.getElementById('menuButton');
    const backdrop = document.getElementById('backdrop');
    if (!button || !backdrop) return false;
    if (button.dataset.mgdFastMenu === VERSION) return true;

    button.dataset.mgdFastMenu = VERSION;
    button.disabled = false;
    button.removeAttribute('aria-busy');
    initHeroVideo();

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (plannerReadyForMenu()) {
        setMenu(!document.body.classList.contains('menu-open'));
        return;
      }

      if (window.WeddingPlannerAuthGuard?.ready && !window.WeddingPlannerAuthGuard?.authenticated) {
        requestAuth();
        return;
      }

      queuedClick = true;
      button.setAttribute('aria-busy', 'true');
      startAuthPoll();
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

    new MutationObserver(resolveQueuedClick).observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
    window.addEventListener('migrandia:wedding-context', resolveQueuedClick);
    return true;
  }

  loadResponsiveCss();
  if (!bind()) document.addEventListener('DOMContentLoaded', bind, { once: true });
})();
