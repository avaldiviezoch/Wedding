(() => {
  'use strict';

  const VERSION = '20260816-2117-responsive-modules1';
  let passthrough = false;
  let queuedClick = false;
  let authPoll = 0;

  function loadResponsiveCss() {
    if (!document.querySelector('link[data-mgd-home-responsive]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = new URL(`css/core/home-responsive.css?v=${VERSION}`, document.baseURI).href;
      link.dataset.mgdHomeResponsive = VERSION;
      document.head.appendChild(link);
    }

    if (!document.querySelector('script[data-mgd-module-responsive]')) {
      const script = document.createElement('script');
      script.src = new URL(`js/core/module-responsive.js?v=${VERSION}`, document.baseURI).href;
      script.dataset.mgdModuleResponsive = VERSION;
      script.defer = true;
      document.head.appendChild(script);
    }
  }

  function initHeroVideo() {
    const video = document.getElementById('heroVideo');
    if (!video || video.dataset.mgdHeroVideo === VERSION) return;
    video.dataset.mgdHeroVideo = VERSION;

    const localUrl = new URL('anillo_loop_planifcador.mp4', document.baseURI).href;
    const fallbackUrl = 'https://avaldiviezoch.github.io/Wedding/anillo_loop_planifcador.mp4';
    let fallbackTried = false;

    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.preload = 'auto';

    const tryPlay = () => {
      if (!video.paused && !video.ended) return;
      const promise = video.play();
      if (promise?.catch) promise.catch(() => {});
    };

    const loadLocal = () => {
      if (video.currentSrc === localUrl || video.src === localUrl) return;
      video.src = localUrl;
      video.load();
    };

    video.addEventListener('loadedmetadata', tryPlay);
    video.addEventListener('loadeddata', tryPlay);
    video.addEventListener('canplay', tryPlay);
    video.addEventListener('playing', () => {
      document.getElementById('videoRecovery')?.classList.remove('show');
    });
    video.addEventListener('error', () => {
      if (fallbackTried) {
        document.getElementById('videoRecovery')?.classList.add('show');
        return;
      }
      fallbackTried = true;
      video.src = fallbackUrl;
      video.load();
      tryPlay();
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tryPlay();
    });
    window.addEventListener('pageshow', tryPlay);
    window.addEventListener('focus', tryPlay);
    document.addEventListener('pointerdown', tryPlay, { once: true, passive: true });
    document.addEventListener('touchstart', tryPlay, { once: true, passive: true });

    loadLocal();
    tryPlay();
  }

  loadResponsiveCss();

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
    initHeroVideo();

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

  if (!bind()) {
    document.addEventListener('DOMContentLoaded', () => {
      initHeroVideo();
      bind();
    }, { once: true });
  }
})();
