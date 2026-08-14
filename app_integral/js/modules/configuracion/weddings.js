// Control estable para "Equipo y accesos".
// Carga la interfaz anterior y conecta el botón Invitar usando la MISMA
// instancia canónica de firebase.js que utiliza esa interfaz.

await import('./weddings-legacy.js?v=20260814-1047-auth3');
const firebaseApi = await import('../../services/firebase.js?v=20260814-1047-auth3');

const FORM_ID = 'inviteWeddingMemberForm';
const BUTTON_ID = 'inviteWeddingButton';
const STATUS_ID = 'inviteWeddingStatus';

function setStatus(message = '', type = '') {
  const el = document.getElementById(STATUS_ID);
  if (!el) return;
  el.textContent = message;
  el.className = `invite-wedding-status${type ? ` is-${type}` : ''}`;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function renderPending() {
  const host = document.getElementById('pendingWeddingInvitations');
  if (!host) return;
  try {
    const items = await firebaseApi.listWeddingInvitations();
    if (!items.length) {
      host.innerHTML = '';
      return;
    }
    host.innerHTML = `
      <div class="pending-invitations-title">Invitaciones pendientes</div>
      ${items.map((item) => `
        <article class="pending-invite-card">
          <div class="pending-invite-icon">✉</div>
          <div class="pending-invite-info">
            <strong>${escapeHtml(item.email || '')}</strong>
            <span>${item.role === 'viewer' ? 'Lector' : 'Editor'} · Pendiente de aceptar</span>
          </div>
        </article>
      `).join('')}
    `;
  } catch (error) {
    console.warn('No se pudo refrescar la lista de invitaciones:', error);
  }
}

async function sendInvitation(form, button) {
  if (!form || !button || button.dataset.inviteBusy === '1') return;

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

  const context = firebaseApi.getWeddingContext();
  if (!context?.id) {
    setStatus('No hay una boda activa para compartir.', 'error');
    return;
  }
  if (context.legacyMode) {
    setStatus('Firebase aún no tiene habilitado el modelo compartido para esta cuenta.', 'error');
    return;
  }
  if (context.role !== 'owner') {
    setStatus('Solo el propietario puede invitar personas.', 'error');
    return;
  }

  button.dataset.inviteBusy = '1';
  button.disabled = true;
  button.textContent = 'Enviando…';
  setStatus(`Enviando invitación a ${email}…`, 'loading');

  try {
    const invitation = await firebaseApi.inviteWeddingMember(email, role);
    form.reset();
    setStatus(`Invitación creada para ${invitation.email}. Quedó pendiente de aceptar.`, 'success');
    await renderPending();
  } catch (error) {
    console.error('Error real al crear invitación:', error);
    const code = String(error?.code || '');
    const raw = String(error?.message || '');
    if (code.includes('permission-denied') || /permission|permis/i.test(raw)) {
      setStatus('Firestore rechazó la escritura por permisos. Hay que publicar las reglas nuevas de Firestore o revisar App Check.', 'error');
    } else {
      setStatus(`${code ? `[${code}] ` : ''}${raw || 'No se pudo crear la invitación.'}`, 'error');
    }
  } finally {
    delete button.dataset.inviteBusy;
    button.disabled = false;
    button.textContent = 'Invitar';
  }
}

function bindInviteController() {
  const form = document.getElementById(FORM_ID);
  if (!form) return false;

  let button = document.getElementById(BUTTON_ID);
  if (!button) {
    button = form.querySelector('button');
    if (button) button.id = BUTTON_ID;
  }
  if (!button) return false;
  if (button.dataset.inviteController === 'stable-v2') return true;

  // El antiguo controlador dependía del submit. Lo convertimos en botón normal
  // para que el clic solo pase por este flujo estable.
  button.type = 'button';
  button.dataset.inviteController = 'stable-v2';
  button.title = 'Control de invitaciones activo';

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    sendInvitation(form, button);
  }, true);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    sendInvitation(form, button);
  }, true);

  setStatus('Control de invitaciones activo.', 'success');
  return true;
}

if (!bindInviteController()) {
  const observer = new MutationObserver(() => {
    if (bindInviteController()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

window.addEventListener('migrandia:wedding-context', () => {
  bindInviteController();
  renderPending();
});
