from pathlib import Path

firebase = Path('app_integral/js/services/firebase.js')
s = firebase.read_text(encoding='utf-8')
marker = "export async function listPendingInvitations() {"
addition = r'''export async function listWeddingInvitations() {
  if (!auth.currentUser || !activeWeddingId || legacyMode || activeWeddingRole !== 'owner') {
    return [];
  }

  const q = query(
    collection(db, 'invitations'),
    where('weddingId', '==', activeWeddingId)
  );
  const snaps = await getDocs(q);
  return snaps.docs
    .map((snap) => ({ id: snap.id, ...snap.data() }))
    .filter((item) => item.status === 'pending')
    .sort((a, b) => String(a.email || '').localeCompare(String(b.email || ''), 'es'));
}

export async function cancelWeddingInvitation(inviteId) {
  if (!auth.currentUser || !activeWeddingId || legacyMode || activeWeddingRole !== 'owner') {
    throw new Error('Solo el propietario puede cancelar invitaciones.');
  }
  const ref = doc(db, 'invitations', String(inviteId || ''));
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() || {};
  if (String(data.weddingId || '') !== activeWeddingId) {
    throw new Error('La invitación no pertenece a esta boda.');
  }
  await deleteDoc(ref);
}

'''
if 'export async function listWeddingInvitations()' not in s:
    if marker not in s:
        raise SystemExit('No se encontro marker listPendingInvitations')
    s = s.replace(marker, addition + marker, 1)
firebase.write_text(s, encoding='utf-8')

weddings = Path('app_integral/js/modules/configuracion/weddings.js')
w = weddings.read_text(encoding='utf-8')
w = w.replace(
    "  inviteWeddingMember,\n  listWeddingMembers,",
    "  inviteWeddingMember,\n  listWeddingInvitations,\n  cancelWeddingInvitation,\n  listWeddingMembers,"
)
w = w.replace(
    "  members: [],\n  activeTab:",
    "  members: [],\n  sentInvitations: [],\n  activeTab:"
)
w = w.replace(
    '            <div id="teamOwnerNotice" class="team-owner-notice"></div>\n            <div id="weddingMembersList" class="members-list"></div>',
    '            <div id="inviteWeddingStatus" class="invite-wedding-status" aria-live="polite"></div>\n            <div id="teamOwnerNotice" class="team-owner-notice"></div>\n            <div id="pendingWeddingInvitations" class="pending-wedding-invitations"></div>\n            <div id="weddingMembersList" class="members-list"></div>'
)
marker2 = "function renderMembers() {"
helper = r'''function setInviteStatus(message = '', type = '') {
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

'''
if 'function setInviteStatus(' not in w:
    if marker2 not in w:
        raise SystemExit('No se encontro renderMembers')
    w = w.replace(marker2, helper + marker2, 1)

old_context = """  if (notice) {\n    notice.textContent = context.role === 'owner'\n      ? 'Como propietario puedes invitar personas y cambiar sus permisos.'\n      : 'Solo el propietario puede invitar personas o modificar permisos.';\n  }\n  if (form) form.hidden = context.role !== 'owner';"""
new_context = """  if (notice) {\n    notice.textContent = context.legacyMode\n      ? 'El acceso compartido está pendiente de habilitarse en las reglas de Firestore.'\n      : context.role === 'owner'\n        ? 'Como propietario puedes invitar personas y cambiar sus permisos.'\n        : 'Solo el propietario puede invitar personas o modificar permisos.';\n  }\n  if (form) {\n    form.hidden = context.role !== 'owner';\n    form.querySelectorAll('input, select, button').forEach((control) => {\n      control.disabled = Boolean(context.legacyMode);\n    });\n  }\n  if (context.legacyMode) {\n    setInviteStatus('Firebase aún está usando las reglas anteriores; por eso no puede crear invitaciones compartidas.', 'error');\n  } else if (document.getElementById('inviteWeddingStatus')?.classList.contains('is-error')) {\n    setInviteStatus('');\n  }"""
if old_context in w:
    w = w.replace(old_context, new_context, 1)

old_refresh = """async function refreshMembers() {\n  if (!auth.currentUser || !getWeddingContext().id) return;\n  try {\n    state.members = await listWeddingMembers();\n    renderMembers();\n  } catch (error) {"""
new_refresh = """async function refreshMembers() {\n  if (!auth.currentUser || !getWeddingContext().id) return;\n  try {\n    const context = getWeddingContext();\n    const [members, sentInvitations] = await Promise.all([\n      listWeddingMembers(),\n      context.role === 'owner' ? listWeddingInvitations() : Promise.resolve([])\n    ]);\n    state.members = members;\n    state.sentInvitations = sentInvitations;\n    renderSentInvitations();\n    renderMembers();\n  } catch (error) {"""
if old_refresh not in w:
    raise SystemExit('No se encontro refreshMembers original')
w = w.replace(old_refresh, new_refresh, 1)

old_submit = """    const submit = event.submitter;\n    if (submit) submit.disabled = true;\n    try {\n      await inviteWeddingMember(email, role);\n      event.currentTarget.reset();\n      toast(`Invitación preparada para ${email}.`);\n      await refreshMembers();\n    } catch (error) {\n      console.error(error);\n      toast(error?.message || 'No se pudo crear la invitación.');\n    } finally {\n      if (submit) submit.disabled = false;\n    }"""
new_submit = """    const submit = event.submitter || event.currentTarget.querySelector('button[type=\"submit\"]');\n    if (submit) submit.disabled = true;\n    setInviteStatus(`Enviando invitación a ${email}…`, 'loading');\n    try {\n      const invitation = await inviteWeddingMember(email, role);\n      event.currentTarget.reset();\n      setInviteStatus(`Invitación pendiente para ${invitation.email}.`, 'success');\n      toast(`Invitación preparada para ${invitation.email}.`);\n      await refreshMembers();\n    } catch (error) {\n      console.error(error);\n      const code = String(error?.code || '');\n      const raw = String(error?.message || '');\n      const message = code.includes('permission-denied') || raw.toLowerCase().includes('permission')\n        ? 'Firebase rechazó la invitación por permisos. Las reglas de acceso compartido todavía no están publicadas.'\n        : (raw || 'No se pudo crear la invitación.');\n      setInviteStatus(message, 'error');\n      toast(message);\n    } finally {\n      if (submit) submit.disabled = false;\n    }"""
if old_submit not in w:
    raise SystemExit('No se encontro submit de invitacion')
w = w.replace(old_submit, new_submit, 1)

close_marker = "  document.getElementById('weddingMembersList')?.addEventListener('change', async (event) => {"
cancel_listener = r'''  document.getElementById('pendingWeddingInvitations')?.addEventListener('click', async (event) => {
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

'''
if "pendingWeddingInvitations')?.addEventListener" not in w:
    if close_marker not in w:
        raise SystemExit('No se encontro marker para listener cancelar')
    w = w.replace(close_marker, cancel_listener + close_marker, 1)
weddings.write_text(w, encoding='utf-8')

css = Path('app_integral/css/modules/weddings.css')
c = css.read_text(encoding='utf-8')
extra = r'''
/* Feedback visible para invitaciones dentro del modal */
body.wedding-modal-open > .toast{z-index:10200!important;visibility:visible!important}
.invite-wedding-status{display:none;margin:-2px 0 12px;padding:10px 12px;border-radius:12px;font-size:12px;line-height:1.4}
.invite-wedding-status:not(:empty){display:block}
.invite-wedding-status.is-loading{background:#eef1ed;color:#566158;border:1px solid #dce2da}
.invite-wedding-status.is-success{background:#eaf4ea;color:#35613d;border:1px solid #cfe4d0}
.invite-wedding-status.is-error{background:#f9e9e7;color:#8b4740;border:1px solid #edcfcb}
.pending-wedding-invitations{display:grid;gap:8px;margin-bottom:16px}
.pending-invitations-title{margin:3px 2px 0;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#7d837f}
.pending-invite-card{display:flex;align-items:center;gap:11px;padding:12px 13px;border:1px dashed #cfd7cc;border-radius:14px;background:#f4f7f2}
.pending-invite-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:50%;background:#e5ece2;color:#566653;flex:0 0 auto}
.pending-invite-info{display:grid;gap:2px;min-width:0;flex:1}
.pending-invite-info strong{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pending-invite-info span{font-size:10px;color:#7b827c}
.pending-invite-card button{border:0;border-radius:9px;padding:7px 9px;background:#fff;color:#7b504c;font-size:10px;font-weight:700;cursor:pointer}
'''
if 'Feedback visible para invitaciones dentro del modal' not in c:
    c += extra
css.write_text(c, encoding='utf-8')
