from pathlib import Path

OLD_VERSION = '20260814-1047-auth3'
NEW_VERSION = '20260814-1136-collab1'
ROOT = Path('app_integral')


def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f'No se encontró bloque para {label}')
    return text.replace(old, new, 1)

# 1. Servicio Firebase
path = ROOT / 'js/services/firebase.js'
text = path.read_text(encoding='utf-8')

text = replace_once(
    text,
    "function normalizeRole(role) {\n  return ['owner', 'editor', 'viewer'].includes(role) ? role : 'viewer';\n}",
    "function normalizeRole(role) {\n  return ['owner', 'admin', 'editor', 'provider', 'viewer'].includes(role) ? role : 'viewer';\n}\n\nfunction canManageTeamRole(role = activeWeddingRole) {\n  return ['owner', 'admin'].includes(normalizeRole(role));\n}\n\nfunction canEditPlannerRole(role = activeWeddingRole) {\n  return ['owner', 'admin', 'editor'].includes(normalizeRole(role));\n}\n\nfunction normalizeCollaboratorRole(role, fallback = 'editor') {\n  const clean = String(role || '').trim().toLowerCase();\n  return ['admin', 'editor', 'provider', 'viewer'].includes(clean) ? clean : fallback;\n}",
    'normalizeRole'
)

text = text.replace(
    "if (!legacyMode && (!activeWeddingId || activeWeddingRole === 'viewer')) return;",
    "if (!legacyMode && (!activeWeddingId || !canEditPlannerRole())) return;"
)
text = text.replace(
    "if (!auth.currentUser || !hydrated || activeWeddingRole === 'viewer') return;",
    "if (!auth.currentUser || !hydrated || !canEditPlannerRole()) return;"
)
text = text.replace(
    "if (activeWeddingId && hydrated && activeWeddingRole !== 'viewer') {",
    "if (activeWeddingId && hydrated && canEditPlannerRole()) {"
)

text = replace_once(
    text,
    "  return items.sort((a, b) => {\n    if (a.role === 'owner' && b.role !== 'owner') return -1;\n    if (a.role !== 'owner' && b.role === 'owner') return 1;\n    return String(a.name || '').localeCompare(String(b.name || ''), 'es');\n  });",
    "  const roleRank = { owner: 0, admin: 1, editor: 2, provider: 3, viewer: 4 };\n  return items.sort((a, b) => {\n    const rankDiff = (roleRank[a.role] ?? 9) - (roleRank[b.role] ?? 9);\n    if (rankDiff) return rankDiff;\n    return String(a.name || '').localeCompare(String(b.name || ''), 'es');\n  });",
    'orden de bodas'
)

text = replace_once(
    text,
    "  if (activeWeddingRole !== 'owner') {\n    throw new Error('Solo el propietario puede invitar personas.');\n  }",
    "  if (!canManageTeamRole()) {\n    throw new Error('Solo el propietario o un administrador puede invitar personas.');\n  }",
    'permiso invitar'
)

text = replace_once(
    text,
    "  const cleanRole = role === 'viewer' ? 'viewer' : 'editor';\n  const inviteId = safeInviteId(activeWeddingId, normalizedEmail);",
    "  const cleanRole = normalizeCollaboratorRole(role);\n  if (activeWeddingRole === 'admin' && cleanRole === 'admin') {\n    throw new Error('Solo el propietario puede asignar el rol Administrador.');\n  }\n  const inviteId = safeInviteId(activeWeddingId, normalizedEmail);",
    'rol invitación'
)

text = text.replace(
    "if (!auth.currentUser || !activeWeddingId || legacyMode || activeWeddingRole !== 'owner') {",
    "if (!auth.currentUser || !activeWeddingId || legacyMode || !canManageTeamRole()) {"
)
text = text.replace(
    "throw new Error('Solo el propietario puede cancelar invitaciones.');",
    "throw new Error('Solo el propietario o un administrador puede cancelar invitaciones.');"
)

text = replace_once(
    text,
    "  const role = invite.role === 'viewer' ? 'viewer' : 'editor';",
    "  const role = normalizeCollaboratorRole(invite.role);",
    'aceptar rol'
)

old_update = """export async function updateWeddingMemberRole(uid, role) {
  if (!auth.currentUser || activeWeddingRole !== 'owner' || legacyMode) {
    throw new Error('Solo el propietario puede cambiar permisos.');
  }
  const targetUid = String(uid || '');
  if (!targetUid || targetUid === auth.currentUser.uid) {
    throw new Error('No puedes cambiar tu rol de propietario.');
  }
  const cleanRole = role === 'viewer' ? 'viewer' : 'editor';
  await setDoc(
    doc(db, 'weddings', activeWeddingId, 'members', targetUid),
    { role: cleanRole, updatedAt: serverTimestamp() },
    { merge: true }
  );
  return cleanRole;
}
"""
new_update = """export async function updateWeddingMemberRole(uid, role) {
  if (!auth.currentUser || !canManageTeamRole() || legacyMode) {
    throw new Error('Solo el propietario o un administrador puede cambiar permisos.');
  }
  const targetUid = String(uid || '');
  if (!targetUid || targetUid === auth.currentUser.uid) {
    throw new Error('No puedes cambiar tu propio rol desde aquí.');
  }

  const memberRef = doc(db, 'weddings', activeWeddingId, 'members', targetUid);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) throw new Error('Ese miembro ya no pertenece a la boda.');

  const currentRole = normalizeRole(memberSnap.data()?.role);
  if (currentRole === 'owner') throw new Error('El rol del propietario no se puede modificar.');

  const cleanRole = normalizeCollaboratorRole(role);
  if (activeWeddingRole === 'admin' && (currentRole === 'admin' || cleanRole === 'admin')) {
    throw new Error('Solo el propietario puede administrar el rol Administrador.');
  }

  await setDoc(
    memberRef,
    { role: cleanRole, updatedAt: serverTimestamp() },
    { merge: true }
  );
  return cleanRole;
}
"""
text = replace_once(text, old_update, new_update, 'updateWeddingMemberRole')

old_remove = """export async function removeWeddingMember(uid) {
  if (!auth.currentUser || activeWeddingRole !== 'owner' || legacyMode) {
    throw new Error('Solo el propietario puede retirar accesos.');
  }
  const targetUid = String(uid || '');
  if (!targetUid || targetUid === auth.currentUser.uid) {
    throw new Error('No puedes retirarte como propietario.');
  }
  await setDoc(
    doc(db, 'weddings', activeWeddingId, 'members', targetUid),
    {
      status: 'removed',
      removedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
"""
new_remove = """export async function removeWeddingMember(uid) {
  if (!auth.currentUser || !canManageTeamRole() || legacyMode) {
    throw new Error('Solo el propietario o un administrador puede retirar accesos.');
  }
  const targetUid = String(uid || '');
  if (!targetUid || targetUid === auth.currentUser.uid) {
    throw new Error('No puedes retirar tu propio acceso desde aquí.');
  }

  const memberRef = doc(db, 'weddings', activeWeddingId, 'members', targetUid);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) return;
  const currentRole = normalizeRole(memberSnap.data()?.role);
  if (currentRole === 'owner') throw new Error('No se puede retirar al propietario.');
  if (activeWeddingRole === 'admin' && currentRole === 'admin') {
    throw new Error('Solo el propietario puede retirar a otro administrador.');
  }

  await setDoc(
    memberRef,
    {
      status: 'removed',
      removedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
"""
text = replace_once(text, old_remove, new_remove, 'removeWeddingMember')
text = text.replace(OLD_VERSION, NEW_VERSION)
path.write_text(text, encoding='utf-8')

# 2. UI principal de colaboración
path = ROOT / 'js/modules/configuracion/weddings-legacy.js'
text = path.read_text(encoding='utf-8')
text = text.replace(OLD_VERSION, NEW_VERSION)
text = replace_once(
    text,
    "const ROLE_LABELS = {\n  owner: 'Propietario',\n  editor: 'Editor',\n  viewer: 'Lector'\n};",
    "const ROLE_LABELS = {\n  owner: 'Propietario',\n  admin: 'Administrador',\n  editor: 'Editor',\n  provider: 'Proveedor',\n  viewer: 'Solo lectura'\n};\n\nfunction canManageTeam(role) {\n  return role === 'owner' || role === 'admin';\n}\n\nfunction isReadOnlyRole(role) {\n  return role === 'viewer' || role === 'provider';\n}",
    'ROLE_LABELS'
)
text = replace_once(
    text,
    "                  <option value=\"editor\">Editor</option>\n                  <option value=\"viewer\">Lector</option>",
    "                  <option value=\"admin\">Administrador</option>\n                  <option value=\"editor\">Editor</option>\n                  <option value=\"provider\">Proveedor</option>\n                  <option value=\"viewer\">Solo lectura</option>",
    'selector invitación'
)
text = text.replace("if (shareButton) shareButton.hidden = context.role !== 'owner';", "if (shareButton) shareButton.hidden = !canManageTeam(context.role);")
text = text.replace("document.body.classList.toggle('wedding-readonly', context.role === 'viewer');", "document.body.classList.toggle('wedding-readonly', isReadOnlyRole(context.role));\n  document.body.classList.toggle('wedding-provider', context.role === 'provider');")
text = replace_once(
    text,
    "      : context.role === 'owner'\n        ? 'Como propietario puedes invitar personas y cambiar sus permisos.'\n        : 'Solo el propietario puede invitar personas o modificar permisos.';",
    "      : context.role === 'owner'\n        ? 'Como propietario tienes control total: puedes invitar, asignar administradores y cambiar permisos.'\n        : context.role === 'admin'\n          ? 'Como administrador puedes gestionar colaboradores y editar la boda. Solo el propietario puede crear o modificar administradores.'\n          : context.role === 'provider'\n            ? 'Acceso de proveedor: por seguridad, la edición global queda bloqueada hasta asignar permisos por módulo.'\n            : 'Tu rol no permite administrar el equipo de esta boda.';",
    'aviso roles'
)
text = text.replace("form.hidden = context.role !== 'owner';", "form.hidden = !canManageTeam(context.role);")

old_groups = """  const own = state.weddings.filter((item) => item.role === 'owner');
  const shared = state.weddings.filter((item) => item.role !== 'owner');
"""
new_groups = """  const own = state.weddings.filter((item) => item.role === 'owner');
  const managed = state.weddings.filter((item) => item.role === 'admin');
  const shared = state.weddings.filter((item) => !['owner', 'admin'].includes(item.role));
"""
text = replace_once(text, old_groups, new_groups, 'grupos bodas')
text = text.replace(
    "host.innerHTML = renderGroup('Mis bodas', own) + renderGroup('Compartidas conmigo', shared);",
    "host.innerHTML = renderGroup('Mis bodas', own) + renderGroup('Bodas que administras', managed) + renderGroup('Otras compartidas contigo', shared);"
)
text = text.replace("if (context.role !== 'owner' || context.legacyMode) {", "if (!canManageTeam(context.role) || context.legacyMode) {")

old_member = """    const owner = member.role === 'owner';
    const editable = context.role === 'owner' && !owner && member.uid !== auth.currentUser?.uid;
"""
new_member = """    const owner = member.role === 'owner';
    const adminProtected = context.role === 'admin' && member.role === 'admin';
    const editable = canManageTeam(context.role) && !owner && !adminProtected && member.uid !== auth.currentUser?.uid;
    const roleOptions = context.role === 'owner'
      ? [
          ['admin', 'Administrador'],
          ['editor', 'Editor'],
          ['provider', 'Proveedor'],
          ['viewer', 'Solo lectura']
        ]
      : [
          ['editor', 'Editor'],
          ['provider', 'Proveedor'],
          ['viewer', 'Solo lectura']
        ];
"""
text = replace_once(text, old_member, new_member, 'edición miembros')
text = replace_once(
    text,
    "          <select class=\"member-role-select\" data-member-role=\"${escapeHtml(member.uid)}\">\n            <option value=\"editor\" ${member.role === 'editor' ? 'selected' : ''}>Editor</option>\n            <option value=\"viewer\" ${member.role === 'viewer' ? 'selected' : ''}>Lector</option>\n          </select>",
    "          <select class=\"member-role-select\" data-member-role=\"${escapeHtml(member.uid)}\">\n            ${roleOptions.map(([value, label]) => `<option value=\"${value}\" ${member.role === value ? 'selected' : ''}>${label}</option>`).join('')}\n          </select>",
    'opciones miembro'
)
text = text.replace("context.role === 'owner' ? listWeddingInvitations() : Promise.resolve([])", "canManageTeam(context.role) ? listWeddingInvitations() : Promise.resolve([])")
path.write_text(text, encoding='utf-8')

# 3. Controlador estable de invitaciones
path = ROOT / 'js/modules/configuracion/weddings.js'
text = path.read_text(encoding='utf-8').replace(OLD_VERSION, NEW_VERSION)
text = replace_once(
    text,
    "const STATUS_ID = 'inviteWeddingStatus';",
    "const STATUS_ID = 'inviteWeddingStatus';\nconst ROLE_LABELS = { admin: 'Administrador', editor: 'Editor', provider: 'Proveedor', viewer: 'Solo lectura' };\nconst canManageTeam = (role) => role === 'owner' || role === 'admin';",
    'mapa roles stable'
)
text = replace_once(
    text,
    "            <span>${item.role === 'viewer' ? 'Lector' : 'Editor'} · Pendiente de aceptar</span>",
    "            <span>${escapeHtml(ROLE_LABELS[item.role] || item.role || 'Editor')} · Pendiente de aceptar</span>",
    'rol pendiente stable'
)
text = replace_once(
    text,
    "  if (context.role !== 'owner') {\n    setStatus('Solo el propietario puede invitar personas.', 'error');\n    return;\n  }",
    "  if (!canManageTeam(context.role)) {\n    setStatus('Solo el propietario o un administrador puede invitar personas.', 'error');\n    return;\n  }\n  if (context.role === 'admin' && role === 'admin') {\n    setStatus('Solo el propietario puede asignar el rol Administrador.', 'error');\n    return;\n  }",
    'permiso stable'
)
path.write_text(text, encoding='utf-8')

# 4. Reglas Firestore actualizadas
rules = r'''rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function authEmail() {
      return signedIn() && request.auth.token.email is string
        ? request.auth.token.email.lower()
        : '';
    }

    function weddingPath(weddingId) {
      return /databases/$(database)/documents/weddings/$(weddingId);
    }

    function memberPath(weddingId) {
      return /databases/$(database)/documents/weddings/$(weddingId)/members/$(request.auth.uid);
    }

    function hasActiveMembership(weddingId) {
      return signedIn()
        && exists(memberPath(weddingId))
        && get(memberPath(weddingId)).data.get('status', 'active') == 'active';
    }

    function memberRole(weddingId) {
      return hasActiveMembership(weddingId)
        ? get(memberPath(weddingId)).data.get('role', 'viewer')
        : 'none';
    }

    function isOwner(weddingId) {
      return memberRole(weddingId) == 'owner';
    }

    function isAdmin(weddingId) {
      return memberRole(weddingId) == 'admin';
    }

    function canManageTeam(weddingId) {
      return memberRole(weddingId) in ['owner', 'admin'];
    }

    function canEditPlanner(weddingId) {
      return memberRole(weddingId) in ['owner', 'admin', 'editor'];
    }

    function isValidCollaboratorRole(role) {
      return role in ['admin', 'editor', 'provider', 'viewer'];
    }

    function invitationPath(weddingId) {
      return /databases/$(database)/documents/invitations/$(weddingId + '__' + authEmail());
    }

    function hasPendingInvitation(weddingId) {
      return signedIn()
        && authEmail() != ''
        && exists(invitationPath(weddingId))
        && get(invitationPath(weddingId)).data.get('status', '') == 'pending'
        && get(invitationPath(weddingId)).data.get('email', '') == authEmail();
    }

    function pendingInvitationRole(weddingId) {
      return hasPendingInvitation(weddingId)
        ? get(invitationPath(weddingId)).data.get('role', 'viewer')
        : 'none';
    }

    function isOwnerBootstrap(weddingId, memberUid) {
      return signedIn()
        && memberUid == request.auth.uid
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.role == 'owner'
        && request.resource.data.status == 'active'
        && getAfter(weddingPath(weddingId)).data.ownerUid == request.auth.uid;
    }

    match /users/{uid} {
      allow read, create, update, delete: if signedIn() && request.auth.uid == uid;

      match /{document=**} {
        allow read, write: if signedIn() && request.auth.uid == uid;
      }
    }

    match /weddings/{weddingId} {
      allow create: if signedIn()
        && request.resource.data.ownerUid == request.auth.uid;
      allow read: if hasActiveMembership(weddingId);
      allow update, delete: if isOwner(weddingId);

      match /members/{memberUid} {
        allow read: if hasActiveMembership(weddingId);

        allow create: if isOwner(weddingId)
          || isOwnerBootstrap(weddingId, memberUid)
          || (
            signedIn()
            && memberUid == request.auth.uid
            && hasPendingInvitation(weddingId)
            && request.resource.data.uid == request.auth.uid
            && request.resource.data.email == authEmail()
            && request.resource.data.role == pendingInvitationRole(weddingId)
            && isValidCollaboratorRole(request.resource.data.role)
            && request.resource.data.status == 'active'
          );

        allow update: if (
            isOwner(weddingId)
            && resource.data.role != 'owner'
            && isValidCollaboratorRole(request.resource.data.role)
          ) || (
            isAdmin(weddingId)
            && resource.data.role in ['editor', 'provider', 'viewer']
            && request.resource.data.role in ['editor', 'provider', 'viewer']
          );

        allow delete: if isOwner(weddingId)
          || (
            isAdmin(weddingId)
            && resource.data.role in ['editor', 'provider', 'viewer']
          )
          || (signedIn() && memberUid == request.auth.uid && resource.data.role != 'owner');
      }

      match /cloudSync/{syncId} {
        allow read: if hasActiveMembership(weddingId);
        allow write: if canEditPlanner(weddingId);
      }

      match /cloudChunks/{chunkId} {
        allow read: if hasActiveMembership(weddingId);
        allow write: if canEditPlanner(weddingId);
      }
    }

    match /invitations/{inviteId} {
      allow create: if signedIn()
        && request.resource.data.invitedBy == request.auth.uid
        && request.resource.data.email is string
        && request.resource.data.email == request.resource.data.email.lower()
        && isValidCollaboratorRole(request.resource.data.role)
        && request.resource.data.status == 'pending'
        && canManageTeam(request.resource.data.weddingId)
        && (request.resource.data.role != 'admin' || isOwner(request.resource.data.weddingId));

      allow read: if signedIn()
        && (
          resource.data.email == authEmail()
          || canManageTeam(resource.data.weddingId)
        );

      allow update: if signedIn()
        && (
          resource.data.email == authEmail()
          || canManageTeam(resource.data.weddingId)
        )
        && request.resource.data.weddingId == resource.data.weddingId
        && request.resource.data.email == resource.data.email
        && request.resource.data.role == resource.data.role;

      allow delete: if signedIn()
        && (
          resource.data.email == authEmail()
          || canManageTeam(resource.data.weddingId)
        );
    }
  }
}
'''
(ROOT / 'firebase/firestore.rules').write_text(rules, encoding='utf-8')

# 5. Versionar entrypoints para romper caché
for path in [ROOT / 'applu.html', Path('applu.html')]:
    html = path.read_text(encoding='utf-8')
    html = html.replace(OLD_VERSION, NEW_VERSION)
    path.write_text(html, encoding='utf-8')

# 6. Documentación funcional
collab = '''# Multi-boda y colaboración\n\n## Modelo\nCada cuenta Firebase es independiente. Los datos pertenecen a una boda (`weddings/{weddingId}`), no al usuario. Un usuario puede crear varias bodas y participar en varias bodas de terceros.\n\n## Roles\n- **Propietario (`owner`)**: control total, administra equipo, puede asignar administradores y es el único que puede modificar/eliminar la boda.\n- **Administrador (`admin`)**: edita el planificador y gestiona editores, proveedores y lectores. No puede modificar al propietario ni crear/quitar otros administradores.\n- **Editor (`editor`)**: puede modificar la información operativa de la boda, sin administrar accesos.\n- **Proveedor (`provider`)**: rol externo. Actualmente queda sin escritura global; los permisos por módulo se habilitarán al separar cada dominio de datos.\n- **Solo lectura (`viewer`)**: consulta sin escritura.\n\n## Wedding planner\nUn wedding planner debe usar normalmente el rol **Administrador**. Su cuenta puede tener múltiples bodas de clientes y cambiar entre ellas desde “Mis bodas y accesos”.\n\n## Seguridad\nLas reglas Firestore autorizan escritura global del planificador solo a `owner`, `admin` y `editor`. `provider` y `viewer` no pueden escribir la copia global.\n'''
(ROOT / 'COLLABORATION.md').write_text(collab, encoding='utf-8')

print('COLLABORATION_UPGRADE_OK')
