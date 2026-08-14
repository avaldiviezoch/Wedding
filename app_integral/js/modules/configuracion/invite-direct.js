(() => {
  const FORM_ID = 'inviteWeddingMemberForm';
  const STATUS_ID = 'inviteWeddingStatus';

  function setStatus(message, type = '') {
    const el = document.getElementById(STATUS_ID);
    if (!el) return;
    el.textContent = message;
    el.className = `invite-wedding-status${type ? ` is-${type}` : ''}`;
  }

  function isInviteButton(target) {
    return target instanceof Element && Boolean(target.closest(`#${FORM_ID} button`));
  }

  async function handle(button) {
    const form = button?.closest('form');
    if (!form || form.dataset.fallbackBusy === '1') return;

    const emailInput = form.querySelector('#inviteWeddingEmail');
    const roleInput = form.querySelector('#inviteWeddingRole');
    const email = String(emailInput?.value || '').trim();
    const role = String(roleInput?.value || 'editor');

    if (!email) {
      emailInput?.focus();
      emailInput?.reportValidity?.();
      setStatus('Escribe el correo de la persona que quieres invitar.', 'error');
      return;
    }
    if (emailInput && !emailInput.checkValidity()) {
      emailInput.reportValidity();
      setStatus('Revisa el correo electrónico.', 'error');
      return;
    }

    form.dataset.fallbackBusy = '1';
    button.disabled = true;
    button.dataset.oldText = button.textContent || 'Invitar';
    button.textContent = 'Enviando…';
    setStatus(`Enviando invitación a ${email}…`, 'loading');

    try {
      const firebaseUrl = new URL('js/services/firebase.js', document.baseURI).href;
      const api = await import(firebaseUrl);
      const context = api.getWeddingContext();

      if (!context?.id) throw new Error('No hay una boda activa para compartir.');
      if (context.legacyMode) throw new Error('Firebase todavía está usando las reglas anteriores para esta cuenta.');
      if (context.role !== 'owner') throw new Error('Solo el propietario puede invitar personas.');

      const invitation = await api.inviteWeddingMember(email, role);
      form.reset();
      setStatus(`Invitación creada para ${invitation.email}. Quedó pendiente de aceptar.`, 'success');

      try {
        const pending = await api.listWeddingInvitations();
        const host = document.getElementById('pendingWeddingInvitations');
        if (host && Array.isArray(pending)) {
          host.innerHTML = pending.map(item => `
            <article class="pending-invite-card">
              <div class="pending-invite-icon">✉</div>
              <div class="pending-invite-info">
                <strong>${String(item.email || '').replace(/[&<>"']/g, '')}</strong>
                <span>${item.role === 'viewer' ? 'Lector' : 'Editor'} · Pendiente de aceptar</span>
              </div>
            </article>`).join('');
        }
      } catch (refreshError) {
        console.warn('Invitación creada, pero no se pudo refrescar la lista:', refreshError);
      }
    } catch (error) {
      console.error('Fallback invitación:', error);
      const code = String(error?.code || '');
      const raw = String(error?.message || '');
      const denied = code.includes('permission-denied') || /permission|permis/i.test(raw);
      setStatus(
        denied
          ? 'Firebase rechazó la invitación por permisos. Las reglas nuevas de Firestore todavía no están publicadas.'
          : (raw || 'No se pudo crear la invitación.'),
        'error'
      );
    } finally {
      delete form.dataset.fallbackBusy;
      button.disabled = false;
      button.textContent = button.dataset.oldText || 'Invitar';
      delete button.dataset.oldText;
    }
  }

  document.addEventListener('click', (event) => {
    if (!isInviteButton(event.target)) return;
    const button = event.target.closest(`#${FORM_ID} button`);
    event.preventDefault();
    event.stopImmediatePropagation();
    handle(button);
  }, true);

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== FORM_ID) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const button = form.querySelector('button');
    if (button) handle(button);
  }, true);

  const arm = () => {
    const form = document.getElementById(FORM_ID);
    if (!form) return false;
    const button = form.querySelector('button');
    if (button) {
      button.type = 'button';
      button.dataset.inviteFallbackReady = '1';
    }
    return true;
  };

  if (!arm()) {
    const observer = new MutationObserver(() => {
      if (arm()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
