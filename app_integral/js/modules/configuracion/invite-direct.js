(() => {
  // Puente de diagnóstico. El flujo real vive en weddings.js y usa una sola
  // instancia canónica de firebase.js. Este archivo ya NO importa Firebase ni
  // intercepta un botón que tenga el controlador estable activo.
  const FORM_ID = 'inviteWeddingMemberForm';
  const STATUS_ID = 'inviteWeddingStatus';

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
