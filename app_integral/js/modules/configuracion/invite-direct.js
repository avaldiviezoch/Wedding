(() => {
  'use strict';

  const FORM_ID = 'inviteWeddingMemberForm';
  const STATUS_ID = 'inviteWeddingStatus';
  const ACCOUNT_STYLE_VERSION = '20260814-1121-account1';
  const INVITATIONS_MODULE_VERSION = '20260817-native-invitaciones-1';

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

  // El módulo Invitaciones ahora es nativo. No clonamos elementos, no observamos
  // el workspace y no reescribimos su DOM desde este archivo.
  import(new URL(`../invitaciones/index.js?v=${INVITATIONS_MODULE_VERSION}`, import.meta?.url || document.baseURI).href)
    .catch((error) => console.error('No se pudo cargar el módulo nativo de Invitaciones:', error));

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest(`#${FORM_ID} button`) : null;
    if (!target || target.dataset.inviteController === 'stable-v2') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setStatus('El controlador de invitaciones todavía no terminó de cargar. Recarga esta pantalla e inténtalo nuevamente.', 'error');
  }, true);
})();
