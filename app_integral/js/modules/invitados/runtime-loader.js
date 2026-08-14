(() => {
  'use strict';

  const VERSION = '20260814-1633-invitadoslegacy2';
  let loading = null;

  function moduleUrl(file, version) {
    return new URL(`js/modules/invitados/${file}?v=${version}`, document.baseURI).href;
  }

  function loadInvitadosRuntime() {
    if (loading) return loading;
    loading = Promise.all([
      import(moduleUrl('index.js', '20260814-1242-rsvp2')),
      import(moduleUrl('ui-copy.js', '20260814-1532-uicopy3')),
      import(moduleUrl('tables-lazy-loader.js', '20260814-1633-legacyskin2'))
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
      if (!frame.dataset.mgdInvitadosRuntimeLoad) {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindWorkspace();
      if (location.hash.toLowerCase().includes('invitados')) loadInvitadosRuntime();
    }, { once: true });
  } else {
    bindWorkspace();
    if (location.hash.toLowerCase().includes('invitados')) loadInvitadosRuntime();
  }
})();
