(() => {
  'use strict';

  const VERSION = '20260819-tab-resume1';
  let passthrough = false;
  let queuedClick = false;
  const MODULE_HASHES = new Set([
    'checklist','presupuesto','proveedores','invitados','distribucion',
    'cronograma','invitaciones','musica','documentos','configuracion'
  ]);
  let resumeQueued = 0;

  function preloadAuthCore() {
    if (document.querySelector('link[data-mgd-auth-preload]')) return;
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = new URL('js/services/firebase-core.js?v=20260818-auth-perf1', document.baseURI).href;
    link.dataset.mgdAuthPreload = VERSION;
    document.head.appendChild(link);
  }

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

    if (!document.querySelector('script[data-mgd-master-theme-runtime]')) {
      const script = document.createElement('script');
      script.src = new URL(`js/core/master-theme-runtime.js?v=${VERSION}`, document.baseURI).href;
      script.dataset.mgdMasterThemeRuntime = VERSION;
      script.defer = true;
      document.head.appendChild(script);
    }

    if (!document.querySelector('script[data-mgd-autosave-ui]')) {
      const script = document.createElement('script');
      script.src = new URL(`js/core/autosave-ui.js?v=${VERSION}`, document.baseURI).href;
      script.dataset.mgdAutosaveUi = VERSION;
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

  function currentModule() {
    return String(location.hash || '').replace(/^#/, '').split(/[/?&]/)[0].trim().toLowerCase();
  }

  function restoreVisibleSurface(reason = 'resume') {
    if (document.hidden || resumeQueued) return;
    resumeQueued = requestAnimationFrame(() => {
      resumeQueued = requestAnimationFrame(() => {
        resumeQueued = 0;
        const moduleId = currentModule();
        const workspace = document.getElementById('unifiedWorkspace');
        const loader = document.getElementById('unifiedLoader');
        const hasModuleContent = Boolean(workspace?.children.length);
        const authenticated = window.WeddingPlannerAuthGuard?.authenticated === true;

        if (authenticated && MODULE_HASHES.has(moduleId)) {
          if (hasModuleContent) {
            document.body.classList.add('module-view');
            workspace.removeAttribute('hidden');
            workspace.setAttribute('aria-hidden', 'false');
            ['display','visibility','opacity'].forEach((name) => workspace.style.removeProperty(name));
            loader?.classList.remove('show');
            loader?.setAttribute('aria-hidden', 'true');
            workspace.querySelectorAll('iframe').forEach((frame) => {
              frame.removeAttribute('hidden');
              frame.setAttribute('aria-hidden', 'false');
              ['display','visibility','opacity'].forEach((name) => frame.style.removeProperty(name));
              try {
                frame.contentWindow?.postMessage({ type:'migrandia:resume', module:moduleId, reason }, location.origin);
              } catch (_) {}
            });
          } else {
            // Solo reconstruye la vista si el navegador realmente descartó su contenido.
            window.dispatchEvent(new Event('hashchange'));
          }
        } else if (!moduleId) {
          document.body.classList.remove('module-view');
          loader?.classList.remove('show');
          loader?.setAttribute('aria-hidden', 'true');
        }

        const video = document.getElementById('heroVideo');
        if (video && !document.body.classList.contains('module-view')) {
          video.style.removeProperty('visibility');
          video.style.removeProperty('opacity');
          if (video.readyState === 0 || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) video.load();
          const playback = video.play();
          playback?.catch?.(() => {});
        }

        window.dispatchEvent(new CustomEvent('migrandia:resume', {
          detail: { reason, module: moduleId, preserved: hasModuleContent }
        }));
      });
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) restoreVisibleSurface('visibilitychange');
  });
  window.addEventListener('pageshow', (event) => restoreVisibleSurface(event.persisted ? 'bfcache' : 'pageshow'));
  window.addEventListener('focus', () => restoreVisibleSurface('focus'));

  preloadAuthCore();
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
    button.disabled = false;
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function authState() {
    const guard = window.WeddingPlannerAuthGuard;
    if (!guard?.ready) return { ready: false, authenticated: false };
    return { ready: true, authenticated: Boolean(guard.authenticated) };
  }

  function requestAuthNow(button) {
    const requestAuth = window.WeddingPlannerRequestAuth;
    if (typeof requestAuth !== 'function') return false;
    queuedClick = false;
    button?.removeAttribute('aria-busy');
    requestAuth();
    return true;
  }

  function queueUntilAuthController(button) {
    queuedClick = true;
    button?.setAttribute('aria-busy', 'true');
  }

  function releaseQueuedClick() {
    if (!queuedClick) return;
    const button = document.getElementById('menuButton');
    const state = authState();

    if (state.ready && state.authenticated) {
      queuedClick = false;
      button?.removeAttribute('aria-busy');
      setMenu(true);
      return;
    }

    if (requestAuthNow(button)) return;
  }

  function bind() {
    const button = document.getElementById('menuButton');
    const backdrop = document.getElementById('backdrop');
    if (!button || !backdrop || button.dataset.mgdFastMenu === VERSION) return false;

    button.dataset.mgdFastMenu = VERSION;
    button.disabled = false;
    initHeroVideo();

    button.addEventListener('click', (event) => {
      if (passthrough) return;

      const state = authState();
      if (!state.ready) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!requestAuthNow(button)) queueUntilAuthController(button);
        return;
      }

      if (!state.authenticated) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (requestAuthNow(button)) return;

        passthrough = true;
        button.click();
        passthrough = false;
        return;
      }

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

    window.addEventListener('migrandia:auth-controller-ready', releaseQueuedClick);
    window.addEventListener('migrandia:auth', releaseQueuedClick);
    return true;
  }

  if (!bind()) {
    document.addEventListener('DOMContentLoaded', () => {
      initHeroVideo();
      bind();
    }, { once: true });
  }
})();
