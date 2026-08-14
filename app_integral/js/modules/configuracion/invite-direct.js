(() => {
  // Capa ligera de soporte visual y diagnóstico. No crea otra instancia Firebase.
  const FORM_ID = 'inviteWeddingMemberForm';
  const STATUS_ID = 'inviteWeddingStatus';
  const ACCOUNT_STYLE_VERSION = '20260814-1121-account1';

  // El enlace oficial y app_integral usan la misma hoja de estilo.
  if (!document.querySelector('link[data-account-card-style]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = `css/modules/account-card.css?v=${ACCOUNT_STYLE_VERSION}`;
    style.dataset.accountCardStyle = 'true';
    document.head.appendChild(style);
  }

  // weddings.js crea la tarjeta de boda activa dentro de .account-copy.
  // Para el nuevo diseño la movemos al nivel principal de #accountCard.
  // Mover un nodo conserva sus listeners, id y comportamiento Firebase.
  function organizeAccountCard() {
    const card = document.getElementById('accountCard');
    const activeWedding = document.getElementById('activeWeddingButton');
    if (!card || !activeWedding) return false;

    if (activeWedding.parentElement !== card) {
      card.appendChild(activeWedding);
    }
    card.dataset.accountLayout = 'premium-v1';
    return true;
  }

  if (!organizeAccountCard()) {
    const observer = new MutationObserver(() => {
      if (organizeAccountCard()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function setStatus(message = '', type = '') {
    const el = document.getElementById(STATUS_ID);
    if (!el) return;
    el.textContent = message;
    el.className = `invite-wedding-status${type ? ` is-${type}` : ''}`;
  }

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest(`#${FORM_ID} button`)
      : null;
    if (!target) return;

    // Si el módulo estable está conectado, no tocamos el evento.
    if (target.dataset.inviteController === 'stable-v2') return;

    event.preventDefault();
    event.stopImmediatePropagation();
    setStatus('El controlador de invitaciones todavía no terminó de cargar. Recarga esta pantalla e inténtalo nuevamente.', 'error');
  }, true);
})();
