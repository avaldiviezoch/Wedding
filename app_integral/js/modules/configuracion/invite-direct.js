(() => {
  'use strict';

  const FORM_ID = 'inviteWeddingMemberForm';
  const STATUS_ID = 'inviteWeddingStatus';
  const ACCOUNT_STYLE_VERSION = '20260814-1121-account1';
  const INVITATIONS_MODULE_VERSION = '20260817-native-invitaciones-2';
  let invitationsModulePromise = null;

  if (!document.querySelector('link[data-account-card-style]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `css/modules/account-card.css?v=${ACCOUNT_STYLE_VERSION}`;
    link.dataset.accountCardStyle = 'true';
    document.head.appendChild(link);
  }

  function organizeAccountCard() {
    const card = document.getElementById('accountCard');
    const activeWedding = document.getElementById('activeWeddingButton');
    if (!card || !activeWedding) return false;
    if (activeWedding.parentElement !== card) card.appendChild(activeWedding);
    card.dataset.accountLayout = 'premium-v1';
    return true;
  }

  if (!organizeAccountCard()) {
    const observer = new MutationObserver(() => {
      if (organizeAccountCard()) observer.disconnect();
    });
    observer.observe(document.body || document.documentElement, { childList: true });
  }

  function setStatus(message = '', type = '') {
    const el = document.getElementById(STATUS_ID);
    if (!el) return;
    el.textContent = message;
    el.className = `invite-wedding-status${type ? ` is-${type}` : ''}`;
  }

  function loadInvitationsModule() {
    if (!invitationsModulePromise) {
      const url = new URL(`js/modules/invitaciones/index.js?v=${INVITATIONS_MODULE_VERSION}`, document.baseURI).href;
      invitationsModulePromise = import(url).catch((error) => {
        invitationsModulePromise = null;
        console.error('No se pudo cargar Invitaciones:', error);
        throw error;
      });
    }
    return invitationsModulePromise;
  }

  // Ruta nativa de Invitaciones. Se captura en window antes del router histórico.
  window.addEventListener('click', (event) => {
    const trigger = event.target instanceof Element
      ? event.target.closest('[data-module="invitaciones"],[data-quick-module="invitaciones"]')
      : null;
    if (!trigger) return;

    const guard = window.WeddingPlannerAuthGuard;
    if (guard?.ready && !guard.authenticated) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    loadInvitationsModule().then(() => {
      // El módulo escucha #invitaciones y también expone su UI al cargarse.
      history.replaceState({ module: 'invitaciones' }, '', `${location.pathname}${location.search}#invitaciones`);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }).catch(() => {});
  }, true);

  // Precalentamos el módulo cuando el navegador esté libre para que el primer clic sea inmediato.
  const warm = () => loadInvitationsModule().catch(() => {});
  if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 1800 });
  else setTimeout(warm, 700);

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest(`#${FORM_ID} button`) : null;
    if (!target || target.dataset.inviteController === 'stable-v2') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setStatus('El controlador de invitaciones todavía no terminó de cargar. Recarga esta pantalla e inténtalo nuevamente.', 'error');
  }, true);
})();
