import {
  inviteWeddingMember,
  listWeddingInvitations,
  getWeddingContext
} from '../../services/firebase.js';

function getStatus() {
  return document.getElementById('inviteWeddingStatus');
}

function setStatus(message = '', type = '') {
  const status = getStatus();
  if (!status) return;
  status.textContent = message;
  status.className = `invite-wedding-status${type ? ` is-${type}` : ''}`;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function roleLabel(role) {
  return role === 'viewer' ? 'Lector' : 'Editor';
}

async function renderPendingInvitations() {
  const host = document.getElementById('pendingWeddingInvitations');
  if (!host) return;

  const context = getWeddingContext();
  if (!context.id || context.role !== 'owner' || context.legacyMode) {
    host.innerHTML = '';
    return;
  }

  try {
    const invitations = await listWeddingInvitations();
    if (!invitations.length) {
      host.innerHTML = '';
      return;
    }

    host.innerHTML = `
      <div class="pending-invitations-title">Invitaciones pendientes</div>
      ${invitations.map((invite) => `
        <article class="pending-invite-card">
          <div class="pending-invite-icon">✉</div>
          <div class="pending-invite-info">
            <strong>${escapeHtml(invite.email || '')}</strong>
            <span>${roleLabel(invite.role)} · Pendiente de aceptar</span>
          </div>
        </article>
      `).join('')}
    `;
  } catch (error) {
    console.error('No se pudieron refrescar las invitaciones pendientes:', error);
  }
}

async function sendInvitation(form, button) {
  if (!form || form.dataset.inviteBusy === '1') return;

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

  const context = getWeddingContext();
  if (context.legacyMode) {
    setStatus('Firebase aún no tiene habilitadas las reglas para compartir bodas.', 'error');
    return;
  }
  if (!context.id) {
    setStatus('No hay una boda activa para compartir.', 'error');
    return;
  }
  if (context.role !== 'owner') {
    setStatus('Solo el propietario puede invitar personas.', 'error');
    return;
  }

  form.dataset.inviteBusy = '1';
  if (button) {
    button.disabled = true;
    button.dataset.originalText = button.textContent || 'Invitar';
    button.textContent = 'Enviando…';
  }
  setStatus(`Enviando invitación a ${email}…`, 'loading');

  try {
    const invitation = await inviteWeddingMember(email, role);
    form.reset();
    setStatus(`Invitación creada para ${invitation.email}. Quedó pendiente de aceptar.`, 'success');
    await renderPendingInvitations();
  } catch (error) {
    console.error('Error al invitar:', error);
    const code = String(error?.code || '');
    const raw = String(error?.message || '');
    const permissionDenied =
      code.includes('permission-denied') ||
      raw.toLowerCase().includes('permission') ||
      raw.toLowerCase().includes('permis');

    setStatus(
      permissionDenied
        ? 'Firebase rechazó la invitación por permisos. Hay que publicar las reglas nuevas de Firestore.'
        : (raw || 'No se pudo crear la invitación.'),
      'error'
    );
  } finally {
    delete form.dataset.inviteBusy;
    if (button) {
      button.disabled = false;
      button.textContent = button.dataset.originalText || 'Invitar';
      delete button.dataset.originalText;
    }
  }
}

// Capturamos el clic antes que cualquier listener anterior del formulario.
document.addEventListener('click', (event) => {
  const button = event.target.closest('#inviteWeddingMemberForm button[type="submit"]');
  if (!button) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  sendInvitation(button.closest('form'), button);
}, true);

// También cubre Enter desde el campo de correo.
document.addEventListener('submit', (event) => {
  const form = event.target.closest?.('#inviteWeddingMemberForm');
  if (!form) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  const button = form.querySelector('button[type="submit"]');
  sendInvitation(form, button);
}, true);

window.addEventListener('migrandia:wedding-context', () => {
  renderPendingInvitations();
});
