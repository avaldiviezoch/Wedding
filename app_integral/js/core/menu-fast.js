(() => {
  'use strict';

  const VERSION = '20260918-navigation-refresh1';
  let passthrough = false;
  let queuedClick = false;
  const MODULE_HASHES = new Set([
    'checklist','presupuesto','proveedores','invitados','distribucion',
    'cronograma','invitaciones','musica','documentos','configuracion'
  ]);
  let resumeQueued = false;
  let resumeReason = '';
  let routeRepairQueued = false;

  function preloadAuthCore() {
    if (document.querySelector('link[data-mgd-auth-preload]')) return;
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = new URL('js/services/firebase-core.js?v=20260819-mobile-popup-gesture1', document.baseURI).href;
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
    if (MODULE_HASHES.has(currentModule())) {
      video.pause?.();
      return;
    }
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

  const DISTRIBUTION_URL = 'https://avaldiviezoch.github.io/invitaciones/mi-gran-dia/distribucion-limpia/index.html?v=20260918-nav1';

  function getDistributionFrame(workspace = document.getElementById('unifiedWorkspace')) {
    return workspace?.querySelector('iframe[data-mgd-distribution-frame="true"]') || null;
  }

  function hideNonDistributionSurfaces(workspace, distributionFrame) {
    [...workspace.children].forEach((node) => {
      if (node === distributionFrame) return;
      node.hidden = true;
      node.setAttribute('aria-hidden', 'true');
    });
  }

  function showLegacySurfaceFor(moduleId, workspace) {
    const distributionFrame = getDistributionFrame(workspace);
    if (distributionFrame) {
      distributionFrame.hidden = true;
      distributionFrame.setAttribute('aria-hidden', 'true');
    }
    workspace?.removeAttribute('data-mgd-distribution-active');
    document.documentElement.classList.remove('mgd-distribucion-host-active');

    if (!moduleId) {
      document.documentElement.classList.remove('mgd-deep-module');
      return;
    }

    // El router legacy conserva el resto de módulos. Solo dejamos de ocultarlos
    // cuando Distribución ya no está activa para evitar destruir sus estados.
    [...(workspace?.children || [])].forEach((node) => {
      if (node === distributionFrame) return;
      if (node.hasAttribute('data-mgd-suppressed-by-distribution')) {
        node.hidden = node.dataset.mgdWasHiddenBeforeDistribution === 'true';
        if (!node.hidden) node.removeAttribute('aria-hidden');
        node.removeAttribute('data-mgd-suppressed-by-distribution');
        delete node.dataset.mgdWasHiddenBeforeDistribution;
      }
    });
  }

  function mountDistribution() {
    if (currentModule() !== 'distribucion') return false;
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return false;

    document.documentElement.classList.add('mgd-deep-module', 'mgd-distribucion-host-active');
    document.body.classList.add('module-view');
    document.documentElement.classList.add('mgd-module-surface-active');
    workspace.removeAttribute('hidden');
    workspace.setAttribute('aria-hidden', 'false');
    workspace.dataset.mgdDistributionActive = 'true';

    let frame = getDistributionFrame(workspace);
    if (!frame) {
      frame = document.createElement('iframe');
      frame.dataset.mgdDistributionFrame = 'true';
      frame.className = 'unified-frame';
      frame.title = 'Distribución y diseño';
      frame.src = DISTRIBUTION_URL;
      frame.setAttribute('loading', 'eager');
      frame.setAttribute('referrerpolicy', 'same-origin');
      frame.style.width = '100%';
      frame.style.height = '100%';
      frame.style.border = '0';
      workspace.appendChild(frame);
    }

    [...workspace.children].forEach((node) => {
      if (node === frame) return;
      if (!node.hasAttribute('data-mgd-suppressed-by-distribution')) {
        node.dataset.mgdWasHiddenBeforeDistribution = node.hidden ? 'true' : 'false';
        node.setAttribute('data-mgd-suppressed-by-distribution', 'true');
      }
    });
    hideNonDistributionSurfaces(workspace, frame);

    frame.hidden = false;
    frame.removeAttribute('aria-hidden');

    const loader = document.getElementById('unifiedLoader');
    const finish = () => {
      frame.dataset.loaded = 'true';
      loader?.classList.remove('show');
      loader?.setAttribute('aria-hidden', 'true');
    };

    if (frame.dataset.loaded === 'true') {
      finish();
    } else {
      loader?.classList.add('show');
      loader?.setAttribute('aria-hidden', 'false');
      if (frame.dataset.mgdLoadBound !== VERSION) {
        frame.dataset.mgdLoadBound = VERSION;
        frame.addEventListener('load', finish);
      }
    }
    return true;
  }

  function restoreVisibleSurface(reason = 'resume') {
    if (document.hidden) return;
    const moduleId = currentModule();
    if (moduleId === 'distribucion') mountDistribution();
    else showLegacySurfaceFor(moduleId, document.getElementById('unifiedWorkspace'));
    const workspace = document.getElementById('unifiedWorkspace');
    const loader = document.getElementById('unifiedLoader');
    const moduleRequested = MODULE_HASHES.has(moduleId);
    const guard = window.WeddingPlannerAuthGuard;
    const sessionAllowsModule = guard?.authenticated !== false || guard?.ready !== true;

    if (moduleRequested && sessionAllowsModule && workspace) {
      if (!document.body.classList.contains('module-view')) document.body.classList.add('module-view');
      if (!document.documentElement.classList.contains('mgd-module-surface-active')) document.documentElement.classList.add('mgd-module-surface-active');
      if (workspace.hidden) workspace.removeAttribute('hidden');
      if (workspace.getAttribute('aria-hidden') !== 'false') workspace.setAttribute('aria-hidden', 'false');
      const distributionFrame = getDistributionFrame(workspace);
      const distributionStillLoading = moduleId === 'distribucion' && distributionFrame?.dataset.loaded !== 'true';
      if (workspace.children.length && !distributionStillLoading) {
        loader?.classList.remove('show');
        loader?.setAttribute('aria-hidden', 'true');
      }

      const frames = [...workspace.querySelectorAll('iframe')];
      const visibleFrame = frames.some((frame) => !frame.hidden);
      const visibleNativePanel = [...workspace.children].some((node) =>
        node.tagName !== 'IFRAME' && !node.hidden && getComputedStyle(node).display !== 'none'
      );
      if (frames.length && !visibleFrame && !visibleNativePanel && !routeRepairQueued) {
        routeRepairQueued = true;
        setTimeout(() => {
          window.dispatchEvent(new Event('hashchange'));
          setTimeout(() => { routeRepairQueued = false; }, 60);
        }, 0);
      }
    } else if (!moduleId) {
      document.documentElement.classList.remove('mgd-deep-module');
      document.body.classList.remove('module-view');
      document.documentElement.classList.remove('mgd-module-surface-active');
      loader?.classList.remove('show');
      loader?.setAttribute('aria-hidden', 'true');
    }

    const video = document.getElementById('heroVideo');
    if (video) {
      if (moduleRequested) video.pause?.();
      else if (video.paused) video.play()?.catch?.(() => {});
    }
    window.dispatchEvent(new CustomEvent('migrandia:resume', {
      detail: { reason, module: moduleId, preserved: Boolean(workspace?.children.length) }
    }));
  }

  function scheduleSurfaceRestore(reason) {
    if (document.hidden) return;
    resumeReason = reason;
    if (resumeQueued) return;
    resumeQueued = true;
    queueMicrotask(() => {
      resumeQueued = false;
      restoreVisibleSurface(resumeReason);
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleSurfaceRestore('visibilitychange');
  });
  window.addEventListener('pageshow', (event) => scheduleSurfaceRestore(event.persisted ? 'bfcache' : 'pageshow'));
  window.addEventListener('focus', () => scheduleSurfaceRestore('focus'));
  window.addEventListener('migrandia:auth-resume', () => scheduleSurfaceRestore('auth-resume'));
  window.addEventListener('hashchange', () => scheduleSurfaceRestore('hashchange'));

  // Restaura una ruta profunda desde el primer ciclo de JS. Así F5 en
  // #distribucion no cae visualmente a la portada ni reinicia el video.
  if (MODULE_HASHES.has(currentModule())) {
    document.documentElement.classList.add('mgd-deep-module');
    queueMicrotask(() => restoreVisibleSurface('initial-route'));
  }

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
