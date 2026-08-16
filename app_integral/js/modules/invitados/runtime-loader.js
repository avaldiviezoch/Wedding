(() => {
  'use strict';

  const VERSION = '20260816-1853-native1';
  let loading = null;

  function moduleUrl(file, version) {
    return new URL(`js/modules/invitados/${file}?v=${version}`, document.baseURI).href;
  }

  function ensureSharedShellStyles() {
    const id = 'mgdModuleTopbarPremiumCss';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = new URL(`css/modules/module-topbar-premium.css?v=${VERSION}`, document.baseURI).href;
    document.head.appendChild(link);
  }

  function loadInvitadosRuntime() {
    ensureSharedShellStyles();
    if (loading) return loading;
    loading = Promise.all([
      import(moduleUrl('index.js', '20260816-1853-native1')),
      import(moduleUrl('ui-copy.js', '20260814-1532-uicopy3')),
      import(moduleUrl('tables-lazy-loader.js', '20260816-1545-fast-tables1')),
      import(moduleUrl('rsvp-admin-music.js', '20260816-1615-rsvp-music-builder1')),
      import(moduleUrl('rsvp-admin-music-builder-fix.js', '20260816-1848-native1')),
      import(moduleUrl('rsvp-native-admin-patch.js', '20260816-1852-native1'))
    ]).catch((error) => {
      console.error('No se pudo iniciar Invitados:', error);
      loading = null;
      throw error;
    });
    return loading;
  }

  function looksLikeInvitadosFrame(frame) {
    try {
      const doc = frame.contentDocument;
      return Boolean(doc?.getElementById('guestList') && doc?.getElementById('tablesView'));
    } catch (_) {
      return false;
    }
  }

  function inspectFrames() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;
    workspace.querySelectorAll('iframe').forEach((frame) => {
      if (frame.dataset.mgdInvitadosRuntimeLoad !== VERSION) {
        frame.dataset.mgdInvitadosRuntimeLoad = VERSION;
        frame.addEventListener('load', () => {
          if (looksLikeInvitadosFrame(frame)) loadInvitadosRuntime();
        });
      }
      if (looksLikeInvitadosFrame(frame)) loadInvitadosRuntime();
    });
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-module="invitados"],[data-quick-module="invitados"]');
    if (target) loadInvitadosRuntime();
  }, true);

  window.addEventListener('hashchange', () => {
    if (location.hash.toLowerCase().includes('invitados')) loadInvitadosRuntime();
  });

  function bindWorkspace() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace || workspace.dataset.mgdInvitadosRuntimeObserver === VERSION) return;
    workspace.dataset.mgdInvitadosRuntimeObserver = VERSION;
    new MutationObserver(inspectFrames).observe(workspace, { childList: true, subtree: true });
    inspectFrames();
  }

  ensureSharedShellStyles();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureSharedShellStyles();
      bindWorkspace();
      if (location.hash.toLowerCase().includes('invitados')) loadInvitadosRuntime();
    }, { once: true });
  } else {
    bindWorkspace();
    if (location.hash.toLowerCase().includes('invitados')) loadInvitadosRuntime();
  }
})();