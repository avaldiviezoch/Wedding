import {
  auth,
  getWeddingContext,
  listUserWeddings,
  createWedding,
  switchWedding,
  listPendingInvitations,
  acceptWeddingInvitation,
  inviteWeddingMember,
  listWeddingInvitations,
  cancelWeddingInvitation,
  listWeddingMembers,
  updateWeddingMemberRole,
  removeWeddingMember
} from '../../services/firebase.js?v=20260814-1047-auth3';

const ROLE_LABELS = {
  owner: 'Propietario',
  editor: 'Editor',
  viewer: 'Lector'
};

const state = {
  weddings: [],
  invitations: [],
  members: [],
  sentInvitations: [],
  activeTab: 'weddings',
  loading: false
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toast(message) {
  if (window.WeddingPlannerBridge?.showToast) {
    window.WeddingPlannerBridge.showToast(message);
    return;
  }
  console.info(message);
}

function ensureUI() {
  if (document.getElementById('weddingWorkspaceModal')) return;

  const accountCopy = document.querySelector('.account-copy');
  if (accountCopy) {
    const active = document.createElement('button');
    active.type = 'button';
    active.id = 'activeWeddingButton';
    active.className = 'active-wedding-button';
    active.innerHTML = `
      <span class="active-wedding-caption">Boda actual</span>
      <strong id="activeWeddingName">Mi boda</strong>
      <span id="activeWeddingRole" class="active-wedding-role">Propietario</span>
    `;
    accountCopy.appendChild(active);
  }

  const actionsHost = document.querySelector('.account-card');
  if (actionsHost) {
    const teamButton = document.createElement('button');
    teamButton.type = 'button';
    teamButton.id = 'shareWeddingButton';
    teamButton.className = 'share-wedding-button';
    teamButton.textContent = 'Compartir boda';
    actionsHost.appendChild(teamButton);
  }

  document.body.insertAdjacentHTML('beforeend', `
    <div class="wedding-workspace-modal" id="weddingWorkspaceModal" aria-hidden="true">
      <div class="wedding-workspace-backdrop" data-close-weddings></div>
      <section class="wedding-workspace-panel" role="dialog" aria-modal="true" aria-labelledby="weddingWorkspaceTitle">
        <header class="wedding-workspace-header">
          <div>
            <span class="wedding-workspace-eyebrow">Mi Gran Día</span>
            <h2 id="weddingWorkspaceTitle">Mis bodas y accesos</h2>
            <p>Cada persona usa su propia cuenta. Aquí eliges sobre qué boda trabajar.</p>
          </div>
          <button type="button" class="wedding-workspace-close" data-close-weddings aria-label="Cerrar">×</button>
        </header>

        <nav class="wedding-workspace-tabs" aria-label="Gestión de bodas">
          <button type="button" data-wedding-tab="weddings" class="is-active">Mis bodas</button>
          <button type="button" data-wedding-tab="invitations">Invitaciones <span id="weddingInviteCount" class="tab-count">0</span></button>
          <button type="button" data-wedding-tab="team">Equipo y accesos</button>
        </nav>

        <div class="wedding-workspace-content">
          <section data-wedding-pane="weddings" class="wedding-pane is-active">
            <div class="wedding-pane-head">
              <div>
                <h3>Tus espacios de trabajo</h3>
                <p>Incluye bodas propias y bodas compartidas contigo.</p>
              </div>
              <button type="button" id="newWeddingButton" class="wedding-primary-action">+ Crear boda</button>
            </div>
            <div id="weddingsList" class="weddings-list"></div>
          </section>

          <section data-wedding-pane="invitations" class="wedding-pane">
            <div class="wedding-pane-head">
              <div>
                <h3>Invitaciones pendientes</h3>
                <p>Acepta el acceso para que esa boda aparezca en tu cuenta.</p>
              </div>
            </div>
            <div id="weddingInvitationsList" class="weddings-list"></div>
          </section>

          <section data-wedding-pane="team" class="wedding-pane">
            <div class="wedding-pane-head">
              <div>
                <h3>Equipo y accesos</h3>
                <p id="teamWeddingName">Gestiona quién puede entrar a la boda actual.</p>
              </div>
            </div>

            <form id="inviteWeddingMemberForm" class="invite-member-form">
              <label>
                <span>Correo de la persona</span>
                <input id="inviteWeddingEmail" type="email" autocomplete="email" placeholder="persona@correo.com" required>
              </label>
              <label>
                <span>Permiso</span>
                <select id="inviteWeddingRole">
                  <option value="editor">Editor</option>
                  <option value="viewer">Lector</option>
                </select>
              </label>
              <button type="submit" class="wedding-primary-action">Invitar</button>
            </form>

            <div id="inviteWeddingStatus" class="invite-wedding-status" aria-live="polite"></div>
            <div id="teamOwnerNotice" class="team-owner-notice"></div>
            <div id="pendingWeddingInvitations" class="pending-wedding-invitations"></div>
            <div id="weddingMembersList" class="members-list"></div>
          </section>
        </div>

        <div class="create-wedding-sheet" id="createWeddingSheet" aria-hidden="true">
          <form id="createWeddingForm" class="create-wedding-card">
            <h3>Crear una nueva boda</h3>
            <label>
              <span>Nombre de la boda</span>
              <input id="newWeddingName" type="text" maxlength="90" placeholder="Ej. Antonio & Lucero" required>
            </label>
            <label>
              <span>Fecha</span>
              <input id="newWeddingDate" type="date">
            </label>
            <div class="create-wedding-actions">
              <button type="button" id="cancelCreateWedding">Cancelar</button>
              <button type="submit" class="wedding-primary-action">Crear y abrir</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  `);

  bindUI();
}

function setOpen(open) {
  const modal = document.getElementById('weddingWorkspaceModal');
  if (!modal) return;
  modal.classList.toggle('show', open);
  modal.setAttribute('aria-hidden', open ? 'false' : 'true');
  document.body.classList.toggle('wedding-modal-open', open);
  if (open) refreshAll();
}

function setTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('[data-wedding-tab]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.weddingTab === tab);
  });
  document.querySelectorAll('[data-wedding-pane]').forEach((pane) => {
    pane.classList.toggle('is-active', pane.dataset.weddingPane === tab);
  });
  if (tab === 'team') refreshMembers();
  if (tab === 'invitations') refreshInvitations();
}

function showCreateWedding(open) {
  const sheet = document.getElementById('createWeddingSheet');
  if (!sheet) return;
  sheet.classList.toggle('show', open);
  sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (open) setTimeout(() => document.getElementById('newWeddingName')?.focus(), 40);
}

function renderContext() {
  const context = getWeddingContext();
  const name = document.getElementById('activeWeddingName');
  const role = document.getElementById('activeWeddingRole');
  const teamName = document.getElementById('teamWeddingName');
  const shareButton = document.getElementById('shareWeddingButton');

  if (name) name.textContent = context.name || 'Mi boda';
  if (role) role.textContent = ROLE_LABELS[context.role] || context.role || '';
  if (teamName) teamName.textContent = context.name ? `Accesos de ${context.name}` : 'Gestiona quién puede entrar a la boda actual.';
  if (shareButton) shareButton.hidden = context.role !== 'owner';

  document.body.classList.toggle('wedding-readonly', context.role === 'viewer');
  document.body.dataset.weddingRole = context.role || '';
  document.body.dataset.weddingId = context.id || '';

  const notice = document.getElementById('teamOwnerNotice');
  const form = document.getElementById('inviteWeddingMemberForm');
  if (notice) {
    notice.textContent = context.legacyMode
      ? 'El acceso compartido está pendiente de habilitarse en las reglas de Firestore.'
      : context.role === 'owner'
        ? 'Como propietario puedes invitar personas y cambiar sus permisos.'
        : 'Solo el propietario puede invitar personas o modificar permisos.';
  }
  if (form) {
    form.hidden = context.role !== 'owner';
    form.querySelectorAll('input, select, button').forEach((control) => {
      control.disabled = Boolean(context.legacyMode);
    });
  }
  if (context.legacyMode) {
    setInviteStatus('Firebase aún está usando las reglas anteriores; por eso no puede crear invitaciones compartidas.', 'error');
  } else if (document.getElementById('inviteWeddingStatus')?.classList.contains('is-error')) {
    setInviteStatus('');
  }
}

function renderWeddings() {
  const host = document.getElementById('weddingsList');
  if (!host) return;
  const context = getWeddingContext();
  if (!state.weddings.length) {
    host.innerHTML = '<div class="wedding-empty">Todavía no tienes bodas disponibles.</div>';
    return;
  }

  const own = state.weddings.filter((item) => item.role === 'owner');
  const shared = state.weddings.filter((item) => item.role !== 'owner');
  const renderGroup = (title, items) => {
    if (!items.length) return '';
    return `
      <div class="wedding-list-group">
        <h4>${title}</h4>
        ${items.map((item) => `
          <article class="wedding-card ${item.id === context.id ? 'is-current' : ''}">
            <div class="wedding-card-main">
              <span class="wedding-card-icon">♡</span>
              <div>
                <strong>${escapeHtml(item.name || 'Mi boda')}</strong>
                <span>${escapeHtml(ROLE_LABELS[item.role] || item.role || '')}${item.date ? ` · ${escapeHtml(item.date)}` : ''}</span>
              </div>
            </div>
            ${item.id === context.id
              ? '<span class="wedding-current-pill">Actual</span>'
              : `<button type="button" class="wedding-open-button" data-open-wedding="${escapeHtml(item.id)}">Abrir</button>`}
          </article>
        `).join('')}
      </div>
    `;
  };
  host.innerHTML = renderGroup('Mis bodas', own) + renderGroup('Compartidas conmigo', shared);
}

function renderInvitations() {
  const host = document.getElementById('weddingInvitationsList');
  const count = document.getElementById('weddingInviteCount');
  if (count) count.textContent = String(state.invitations.length);
  if (!host) return;
  if (!state.invitations.length) {
    host.innerHTML = '<div class="wedding-empty">No tienes invitaciones pendientes.</div>';
    return;
  }
  host.innerHTML = state.invitations.map((invite) => `
    <article class="wedding-card invitation-card">
      <div class="wedding-card-main">
        <span class="wedding-card-icon">✉</span>
        <div>
          <strong>${escapeHtml(invite.weddingName || 'Boda compartida')}</strong>
          <span>Te invitaron como ${escapeHtml(ROLE_LABELS[invite.role] || invite.role)}</span>
        </div>
      </div>
      <button type="button" class="wedding-open-button" data-accept-invite="${escapeHtml(invite.id)}">Aceptar</button>
    </article>
  `).join('');
}

function setInviteStatus(message = '', type = '') {
  const status = document.getElementById('inviteWeddingStatus');
  if (!status) return;
  status.textContent = message;
  status.className = `invite-wedding-status${type ? ` is-${type}` : ''}`;
}

function renderSentInvitations() {
  const host = document.getElementById('pendingWeddingInvitations');
  if (!host) return;
  const context = getWeddingContext();
  if (context.role !== 'owner' || context.legacyMode) {
    host.innerHTML = '';
    return;
  }
  if (!state.sentInvitations.length) {
    host.innerHTML = '';
    return;
  }
  host.innerHTML = `
    <div class="pending-invitations-title">Invitaciones pendientes</div>
    ${state.sentInvitations.map((invite) => `
      <article class="pending-invite-card">
        <div class="pending-invite-icon">✉</div>
        <div class="pending-invite-info">
          <strong>${escapeHtml(invite.email || '')}</strong>
          <span>${escapeHtml(ROLE_LABELS[invite.role] || invite.role || '')} · Pendiente de aceptar</span>
        </div>
        <button type="button" data-cancel-invite="${escapeHtml(invite.id)}">Cancelar</button>
      </article>
    `).join('')}
  `;
}

function renderMembers() {
  const host = document.getElementById('weddingMembersList');
  if (!host) return;
  const context = getWeddingContext();
  if (!context.id) {
    host.innerHTML = '<div class="wedding-empty">Abre una boda para ver su equipo.</div>';
    return;
  }
  if (!state.members.length) {
    host.innerHTML = '<div class="wedding-empty">No hay miembros registrados.</div>';
    return;
  }

  host.innerHTML = state.members.map((member) => {
    const owner = member.role === 'owner';
    const editable = context.role === 'owner' && !owner && member.uid !== auth.currentUser?.uid;
    return `
      <article class="member-card">
        <div class="member-avatar">${escapeHtml((member.displayName || member.email || '?').trim().charAt(0).toUpperCase())}</div>
        <div class="member-info">
          <strong>${escapeHtml(member.displayName || member.email || 'Miembro')}</strong>
          <span>${escapeHtml(member.email || '')}</span>
        </div>
        ${editable ? `
          <select class="member-role-select" data-member-role="${escapeHtml(member.uid)}">
            <option value="editor" ${member.role === 'editor' ? 'selected' : ''}>Editor</option>
            <option value="viewer" ${member.role === 'viewer' ? 'selected' : ''}>Lector</option>
          </select>
          <button type="button" class="member-remove" data-remove-member="${escapeHtml(member.uid)}">Quitar</button>
        ` : `<span class="member-role-pill">${escapeHtml(ROLE_LABELS[member.role] || member.role || '')}</span>`}
      </article>
    `;
  }).join('');
}

async function refreshWeddings() {
  if (!auth.currentUser) return;
  try {
    state.weddings = await listUserWeddings();
    renderWeddings();
  } catch (error) {
    console.error('No se pudieron listar las bodas:', error);
  }
}

async function refreshInvitations() {
  if (!auth.currentUser) return;
  try {
    state.invitations = await listPendingInvitations();
    renderInvitations();
  } catch (error) {
    console.error('No se pudieron listar invitaciones:', error);
  }
}

async function refreshMembers() {
  if (!auth.currentUser || !getWeddingContext().id) return;
  try {
    const context = getWeddingContext();
    const [members, sentInvitations] = await Promise.all([
      listWeddingMembers(),
      context.role === 'owner' ? listWeddingInvitations() : Promise.resolve([])
    ]);
    state.members = members;
    state.sentInvitations = sentInvitations;
    renderSentInvitations();
    renderMembers();
  } catch (error) {
    console.error('No se pudo cargar el equipo:', error);
    const host = document.getElementById('weddingMembersList');
    if (host) host.innerHTML = '<div class="wedding-empty">No se pudo cargar el equipo de esta boda.</div>';
  }
}

async function refreshAll() {
  renderContext();
  await Promise.all([refreshWeddings(), refreshInvitations()]);
  if (state.activeTab === 'team') await refreshMembers();
}

function bindUI() {
  document.getElementById('activeWeddingButton')?.addEventListener('click', () => setOpen(true));
  document.getElementById('shareWeddingButton')?.addEventListener('click', () => {
    setOpen(true);
    setTab('team');
  });
  document.querySelectorAll('[data-close-weddings]').forEach((el) => el.addEventListener('click', () => setOpen(false)));
  document.querySelectorAll('[data-wedding-tab]').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.weddingTab)));
  document.getElementById('newWeddingButton')?.addEventListener('click', () => showCreateWedding(true));
  document.getElementById('cancelCreateWedding')?.addEventListener('click', () => showCreateWedding(false));

  document.getElementById('createWeddingForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('newWeddingName')?.value.trim();
    const date = document.getElementById('newWeddingDate')?.value || '';
    if (!name) return;
    const submit = event.submitter;
    if (submit) submit.disabled = true;
    try {
      const wedding = await createWedding({ name, date });
      showCreateWedding(false);
      event.currentTarget.reset();
      await switchWedding(wedding.id);
      await refreshAll();
      toast('Nueva boda creada.');
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast('No se pudo crear la boda. Revisa los permisos de Firestore.');
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  document.getElementById('inviteWeddingMemberForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('inviteWeddingEmail')?.value.trim();
    const role = document.getElementById('inviteWeddingRole')?.value || 'editor';
    if (!email) return;
    const submit = event.submitter || event.currentTarget.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    setInviteStatus(`Enviando invitación a ${email}…`, 'loading');
    try {
      const invitation = await inviteWeddingMember(email, role);
      event.currentTarget.reset();
      setInviteStatus(`Invitación pendiente para ${invitation.email}.`, 'success');
      toast(`Invitación preparada para ${invitation.email}.`);
      await refreshMembers();
    } catch (error) {
      console.error(error);
      const code = String(error?.code || '');
      const raw = String(error?.message || '');
      const message = code.includes('permission-denied') || raw.toLowerCase().includes('permission')
        ? 'Firebase rechazó la invitación por permisos. Las reglas de acceso compartido todavía no están publicadas.'
        : (raw || 'No se pudo crear la invitación.');
      setInviteStatus(message, 'error');
      toast(message);
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  document.getElementById('weddingsList')?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-open-wedding]');
    if (!button) return;
    button.disabled = true;
    try {
      await switchWedding(button.dataset.openWedding);
      await refreshAll();
      setOpen(false);
      toast('Boda activa actualizada.');
    } catch (error) {
      console.error(error);
      toast('No se pudo abrir esa boda.');
      button.disabled = false;
    }
  });

  document.getElementById('weddingInvitationsList')?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-accept-invite]');
    if (!button) return;
    button.disabled = true;
    try {
      const wedding = await acceptWeddingInvitation(button.dataset.acceptInvite);
      await switchWedding(wedding.id);
      await refreshAll();
      setTab('weddings');
      toast(`Ya tienes acceso a ${wedding.name}.`);
    } catch (error) {
      console.error(error);
      toast('No se pudo aceptar la invitación.');
      button.disabled = false;
    }
  });

  document.getElementById('pendingWeddingInvitations')?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-cancel-invite]');
    if (!button) return;
    button.disabled = true;
    try {
      await cancelWeddingInvitation(button.dataset.cancelInvite);
      setInviteStatus('Invitación cancelada.', 'success');
      await refreshMembers();
    } catch (error) {
      console.error(error);
      setInviteStatus(error?.message || 'No se pudo cancelar la invitación.', 'error');
      button.disabled = false;
    }
  });

  document.getElementById('weddingMembersList')?.addEventListener('change', async (event) => {
    const select = event.target.closest('[data-member-role]');
    if (!select) return;
    select.disabled = true;
    try {
      await updateWeddingMemberRole(select.dataset.memberRole, select.value);
      toast('Permiso actualizado.');
      await refreshMembers();
    } catch (error) {
      console.error(error);
      toast('No se pudo actualizar el permiso.');
      select.disabled = false;
    }
  });

  document.getElementById('weddingMembersList')?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-remove-member]');
    if (!button) return;
    if (!confirm('¿Quitar a esta persona de la boda?')) return;
    button.disabled = true;
    try {
      await removeWeddingMember(button.dataset.removeMember);
      toast('Acceso retirado.');
      await refreshMembers();
    } catch (error) {
      console.error(error);
      toast('No se pudo retirar el acceso.');
      button.disabled = false;
    }
  });
}

window.addEventListener('migrandia:wedding-context', () => {
  renderContext();
  refreshWeddings();
  if (state.activeTab === 'team') refreshMembers();
});

window.addEventListener('migrandia:auth', () => refreshAll());

document.addEventListener('DOMContentLoaded', () => {
  ensureUI();
  renderContext();
  if (auth.currentUser) refreshAll();
});

if (document.readyState !== 'loading') {
  ensureUI();
  renderContext();
  if (auth.currentUser) refreshAll();
}
