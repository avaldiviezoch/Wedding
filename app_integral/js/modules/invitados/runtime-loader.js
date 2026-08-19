(() => {
  'use strict';

  const VERSION = '20260819-2450-rsvp-layout1';
  let baseRuntime = null;
  let rsvpRuntime = null;

  function moduleUrl(file, version) {
    return new URL(`js/modules/invitados/${file}?v=${version}`, document.baseURI).href;
  }

  // Distribución: solo se carga el vínculo de datos. La capa visual dinámica queda
  // fuera del flujo activo para evitar que una interfaz se pinte sobre otra.
  import(new URL('js/modules/distribucion/index.js?v=20260817-1648-link3', document.baseURI).href)
    .catch((error) => console.warn('No se pudo iniciar el vínculo Invitados ↔ Distribución:', error));

  function ensureSharedShellStyles() {
    const id = 'mgdModuleTopbarPremiumCss';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = new URL(`css/modules/module-topbar-premium.css?v=${VERSION}`, document.baseURI).href;
    document.head.appendChild(link);
  }

  function loadBaseRuntime() {
    ensureSharedShellStyles();
    if (baseRuntime) return baseRuntime;
    baseRuntime = Promise.all([
      import(moduleUrl('index.js', '20260819-2450-rsvp-layout1')),
      import(moduleUrl('ui-copy.js', '20260814-1532-uicopy3')),
      import(moduleUrl('tables-lazy-loader.js', '20260816-1916-idle1'))
    ]).catch((error) => {
      console.error('No se pudo iniciar Invitados:', error);
      baseRuntime = null;
      throw error;
    });
    return baseRuntime;
  }

  function loadRsvpRuntime() {
    if (rsvpRuntime) return rsvpRuntime;
    rsvpRuntime = Promise.all([
      import(moduleUrl('rsvp-admin-music.js', '20260819-2430-rsvp-style1')),
      import(moduleUrl('rsvp-admin-music-builder-fix.js', '20260816-1920-music-fast1')),
      import(moduleUrl('rsvp-native-admin-patch.js', '20260816-1918-native-fast1'))
    ]).catch((error) => {
      console.error('No se pudo iniciar RSVP:', error);
      rsvpRuntime = null;
      throw error;
    });
    return rsvpRuntime;
  }

  function looksLikeInvitadosFrame(frame) {
    try {
      const doc = frame.contentDocument;
      return Boolean(doc?.getElementById('guestList') && doc?.getElementById('tablesView'));
    } catch (_) {
      return false;
    }
  }

  function isRsvpControl(node) {
    const control = node?.closest?.('[data-view],[data-tab],[data-rsvp-tab],#rsvpTab,#rsvpAdminTab,button,a');
    if (!control) return false;
    const values = [control.dataset?.view, control.dataset?.tab, control.id, control.textContent]
      .map((value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase());
    return values.some((value) => value === 'rsvp' || value.includes('rsvp') || value.includes('confirmacion'));
  }

  function bindGuestFrame(frame) {
    if (!looksLikeInvitadosFrame(frame)) return;
    loadBaseRuntime();
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return; }
    if (!doc || doc.documentElement.dataset.mgdRsvpLazyBound === VERSION) return;
    doc.documentElement.dataset.mgdRsvpLazyBound = VERSION;
    doc.addEventListener('click', (event) => {
      if (isRsvpControl(event.target)) loadRsvpRuntime();
    }, true);
    if (doc.querySelector('.rsvp-admin-shell,[data-rsvp-pane].is-active')) loadRsvpRuntime();
  }

  function scanFrames() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;
    workspace.querySelectorAll('iframe').forEach((frame) => {
      if (frame.dataset.mgdInvitadosRuntimeLoad !== VERSION) {
        frame.dataset.mgdInvitadosRuntimeLoad = VERSION;
        frame.addEventListener('load', () => bindGuestFrame(frame));
      }
      bindGuestFrame(frame);
    });
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-module="invitados"],[data-quick-module="invitados"]');
    if (target) loadBaseRuntime();
  }, true);

  window.addEventListener('hashchange', () => {
    if (location.hash.toLowerCase().includes('invitados')) loadBaseRuntime();
  });

  function bindWorkspace() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace || workspace.dataset.mgdInvitadosRuntimeObserver === VERSION) return;
    workspace.dataset.mgdInvitadosRuntimeObserver = VERSION;
    new MutationObserver(scanFrames).observe(workspace, { childList: true });
    scanFrames();
  }

  ensureSharedShellStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindWorkspace, { once: true });
  else bindWorkspace();
})();
