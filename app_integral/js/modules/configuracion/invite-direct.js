(() => {
  'use strict';

  const FORM_ID = 'inviteWeddingMemberForm';
  const STATUS_ID = 'inviteWeddingStatus';
  const ACCOUNT_STYLE_VERSION = '20260814-1121-account1';

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

  // Este controlador ya no interviene en el módulo Invitaciones.
  // Invitaciones se carga de forma nativa desde applu.html.
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest(`#${FORM_ID} button`) : null;
    if (!target || target.dataset.inviteController === 'stable-v2') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setStatus('El controlador de invitaciones todavía no terminó de cargar. Recarga esta pantalla e inténtalo nuevamente.', 'error');
  }, true);
})();
