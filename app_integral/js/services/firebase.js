import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDCRuQgMjnm7KcAN_qo8AHPD3ueyis4-LY',
  authDomain: 'migrandia.firebaseapp.com',
  projectId: 'migrandia',
  storageBucket: 'migrandia.firebasestorage.app',
  messagingSenderId: '7432985765',
  appId: '1:7432985765:web:b3a4844f41ac2a1376c14c'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
await setPersistence(auth, browserLocalPersistence);

const menuButton = document.getElementById('menuButton');
const authOverlay = document.getElementById('authOverlay');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authStatus = document.getElementById('authStatus');
const googleLoginButton = document.getElementById('googleLoginButton');
const emailLoginButton = document.getElementById('emailLoginButton');
const emailRegisterButton = document.getElementById('emailRegisterButton');
const authCloseButton = document.getElementById('authCloseButton');
const accountCard = document.getElementById('accountCard');
const accountAvatar = document.getElementById('accountAvatar');
const accountName = document.getElementById('accountName');
const accountEmail = document.getElementById('accountEmail');
const cloudState = document.getElementById('cloudState');
const logoutButton = document.getElementById('logoutButton');
const moduleSessionLogout = document.getElementById('moduleSessionLogout');

let pendingOpenMenu = false;
let activeUid = '';
let cloudBusy = false;
let cloudTimer = 0;
let hydrated = false;
let authResolved = false;
let activeWeddingId = '';
let activeWeddingRole = '';
let activeWeddingName = '';
let legacyMode = false;

const CHUNK_SIZE = 180000;
const LOCAL_OWNER_KEY = 'migrandia_local_owner_uid_v1';

function normalizeRole(role) {
  return ['owner', 'editor', 'viewer'].includes(role) ? role : 'viewer';
}

function currentContext() {
  return {
    id: activeWeddingId,
    role: activeWeddingRole,
    name: activeWeddingName,
    legacyMode
  };
}

function emitWeddingContext() {
  const detail = currentContext();
  window.WeddingPlannerWeddingContext = detail;
  window.dispatchEvent(new CustomEvent('migrandia:wedding-context', { detail }));
}

function setWeddingContext(data = {}) {
  activeWeddingId = String(data.id || data.weddingId || '');
  activeWeddingRole = normalizeRole(data.role || 'viewer');
  activeWeddingName = String(data.name || 'Mi boda');
  legacyMode = Boolean(data.legacyMode);
  emitWeddingContext();
}

function safeInviteId(weddingId, email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || normalized.includes('/')) {
    throw new Error('Correo no válido para invitación.');
  }
  return `${weddingId}__${normalized}`;
}

function openAuth() {
  pendingOpenMenu = true;
  authOverlay.classList.add('show');
  authOverlay.setAttribute('aria-hidden', 'false');
  authStatus.textContent = '';
  googleLoginButton.disabled = false;
  emailLoginButton.disabled = false;
  emailRegisterButton.disabled = false;
  setTimeout(() => googleLoginButton.focus(), 40);
}

window.WeddingPlannerRequestAuth = () => {
  if (auth.currentUser) {
    pendingOpenMenu = false;
    menuButton.click();
    return;
  }
  openAuth();
};

function closeAuth(force = false) {
  if (!force && auth.currentUser && pendingOpenMenu) return;
  authOverlay.classList.remove('show');
  authOverlay.setAttribute('aria-hidden', 'true');
}

function lockPlanner() {
  document.body.classList.add('auth-locked');
  document.body.classList.remove('menu-open', 'module-view');
  window.WeddingPlannerAuthGuard.ready = authResolved;
  window.WeddingPlannerAuthGuard.authenticated = false;
  window.WeddingPlannerAuthGuard.uid = '';
  closeAuth(true);
  if (location.hash) {
    history.replaceState({ module: 'home' }, '', location.pathname + location.search);
  }
}

function unlockPlanner(user) {
  window.WeddingPlannerAuthGuard.ready = true;
  window.WeddingPlannerAuthGuard.authenticated = true;
  window.WeddingPlannerAuthGuard.uid = user.uid;
  document.body.classList.remove('auth-locked');
  closeAuth(true);
  window.dispatchEvent(new Event('hashchange'));
}

function friendlyAuthError(error) {
  const code = String(error?.code || '');
  if (code.includes('invalid-credential')) return 'Correo o contraseña incorrectos.';
  if (code.includes('email-already-in-use')) return 'Ese correo ya tiene una cuenta.';
  if (code.includes('weak-password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (code.includes('invalid-email')) return 'Revisa el correo electrónico.';
  if (code.includes('popup-closed')) return 'La ventana de Google se cerró antes de terminar. Vuelve a intentarlo.';
  if (code.includes('popup-blocked')) return 'El navegador bloqueó la ventana de Google. Permite ventanas emergentes para este sitio y vuelve a intentarlo.';
  if (code.includes('cancelled-popup-request')) return 'Ya hay una ventana de acceso abierta. Termina ese acceso o vuelve a intentarlo.';
  if (code.includes('unauthorized-domain')) return `Firebase no tiene autorizado este dominio (${location.hostname}). Agrégalo en Authentication → Configuración → Dominios autorizados.`;
  if (code.includes('operation-not-allowed')) return 'Activa este método de acceso en Firebase Authentication.';
  return 'No se pudo iniciar sesión. Inténtalo nuevamente.';
}

function splitText(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  return chunks.length ? chunks : [''];
}

async function readBackup(metaRef, chunkRefFactory) {
  const metaSnap = await getDoc(metaRef);
  if (!metaSnap.exists()) return null;
  const count = Number(metaSnap.data().chunkCount || 0);
  if (!count) return null;
  const parts = await Promise.all(
    Array.from({ length: count }, (_, index) => getDoc(chunkRefFactory(index)))
  );
  const text = parts
    .map((snap) => (snap.exists() ? String(snap.data().data || '') : ''))
    .join('');
  return text ? JSON.parse(text) : null;
}

async function readLegacyCloudBackup(uid) {
  return readBackup(
    doc(db, 'users', uid, 'cloudSync', 'main'),
    (index) => doc(db, 'users', uid, 'cloudChunks', String(index).padStart(5, '0'))
  );
}

async function readWeddingCloudBackup(weddingId) {
  if (!weddingId) return null;
  return readBackup(
    doc(db, 'weddings', weddingId, 'cloudSync', 'main'),
    (index) => doc(db, 'weddings', weddingId, 'cloudChunks', String(index).padStart(5, '0'))
  );
}

async function getWeddingMembership(weddingId, uid) {
  if (!weddingId || !uid) return null;
  const snap = await getDoc(doc(db, 'weddings', weddingId, 'members', uid));
  if (!snap.exists()) return null;
  const data = snap.data() || {};
  return data.status === 'removed' ? null : data;
}

async function ensureWeddingContext(user) {
  if (!user) return null;
  const profileRef = doc(db, 'users', user.uid);
  const profileSnap = await getDoc(profileRef);
  const profile = profileSnap.exists() ? profileSnap.data() : {};
  const requestedId = String(profile.activeWeddingId || '');

  if (requestedId) {
    const indexSnap = await getDoc(doc(db, 'users', user.uid, 'weddings', requestedId));
    const membership = await getWeddingMembership(requestedId, user.uid);
    if (indexSnap.exists() && membership) {
      const index = indexSnap.data() || {};
      setWeddingContext({
        id: requestedId,
        name: membership.weddingName || index.name || 'Mi boda',
        role: membership.role || index.role,
        legacyMode: false
      });
      return currentContext();
    }
  }

  const indexSnaps = await getDocs(collection(db, 'users', user.uid, 'weddings'));
  for (const item of indexSnaps.docs) {
    const membership = await getWeddingMembership(item.id, user.uid);
    if (!membership) {
      try {
        await deleteDoc(item.ref);
      } catch (_) {}
      continue;
    }
    const data = item.data() || {};
    setWeddingContext({
      id: item.id,
      name: membership.weddingName || data.name || 'Mi boda',
      role: membership.role || data.role,
      legacyMode: false
    });
    await setDoc(
      profileRef,
      { activeWeddingId: item.id, lastSeenAt: serverTimestamp() },
      { merge: true }
    );
    return currentContext();
  }

  const weddingId = `wedding_${user.uid}`;
  const weddingName = user.displayName ? `Boda de ${user.displayName}` : 'Mi boda';
  const batch = writeBatch(db);
  batch.set(
    doc(db, 'weddings', weddingId),
    {
      name: weddingName,
      ownerUid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1
    },
    { merge: true }
  );
  batch.set(
    doc(db, 'weddings', weddingId, 'members', user.uid),
    {
      uid: user.uid,
      email: String(user.email || '').toLowerCase(),
      displayName: user.displayName || '',
      role: 'owner',
      status: 'active',
      weddingName,
      joinedAt: serverTimestamp()
    },
    { merge: true }
  );
  batch.set(
    doc(db, 'users', user.uid, 'weddings', weddingId),
    {
      weddingId,
      name: weddingName,
      role: 'owner',
      ownerUid: user.uid,
      addedAt: serverTimestamp()
    },
    { merge: true }
  );
  batch.set(
    profileRef,
    {
      email: user.email || '',
      displayName: user.displayName || '',
      activeWeddingId: weddingId,
      lastSeenAt: serverTimestamp()
    },
    { merge: true }
  );
  await batch.commit();
  setWeddingContext({ id: weddingId, name: weddingName, role: 'owner', legacyMode: false });
  return currentContext();
}

async function writeCloudBackup(user, silent = false) {
  if (!user || cloudBusy || !hydrated) return;
  if (!legacyMode && (!activeWeddingId || activeWeddingRole === 'viewer')) return;
  const bridge = window.WeddingPlannerBridge;
  if (!bridge) return;

  cloudBusy = true;
  if (!silent) cloudState.textContent = 'Guardando en la nube…';

  try {
    const backup = await bridge.buildCloudBackup();
    const text = JSON.stringify(backup);
    const chunks = splitText(text);
    const metaRef = legacyMode
      ? doc(db, 'users', user.uid, 'cloudSync', 'main')
      : doc(db, 'weddings', activeWeddingId, 'cloudSync', 'main');
    const previous = await getDoc(metaRef);
    const oldCount = previous.exists() ? Number(previous.data().chunkCount || 0) : 0;

    const chunkRef = (index) =>
      legacyMode
        ? doc(db, 'users', user.uid, 'cloudChunks', String(index).padStart(5, '0'))
        : doc(db, 'weddings', activeWeddingId, 'cloudChunks', String(index).padStart(5, '0'));

    let batch = writeBatch(db);
    let ops = 0;
    async function commitIfNeeded(force = false) {
      if (ops >= 430 || (force && ops)) {
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    }

    for (let index = 0; index < chunks.length; index++) {
      batch.set(chunkRef(index), { index, data: chunks[index] });
      ops++;
      await commitIfNeeded();
    }
    for (let index = chunks.length; index < oldCount; index++) {
      batch.delete(chunkRef(index));
      ops++;
      await commitIfNeeded();
    }

    batch.set(metaRef, {
      chunkCount: chunks.length,
      bytes: text.length,
      updatedAt: serverTimestamp(),
      version: legacyMode ? 1 : 2
    });
    ops++;
    batch.set(
      doc(db, 'users', user.uid),
      {
        email: user.email || '',
        displayName: user.displayName || '',
        activeWeddingId: activeWeddingId || '',
        lastSeenAt: serverTimestamp()
      },
      { merge: true }
    );
    ops++;
    await commitIfNeeded(true);

    cloudState.textContent = legacyMode ? 'Guardado en la nube' : 'Boda sincronizada';
    localStorage.setItem('migrandia_cloud_sync_meta_v1', new Date().toISOString());
  } catch (error) {
    console.error('Firebase sync error:', error);
    cloudState.textContent = 'No se pudo sincronizar';
    if (!silent) {
      bridge.showToast('No se pudo guardar en Firebase. Revisa las reglas de Firestore.');
    }
  } finally {
    cloudBusy = false;
  }
}

function scheduleCloudSave(delay = 2500) {
  if (!auth.currentUser || !hydrated || activeWeddingRole === 'viewer') return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => writeCloudBackup(auth.currentUser, true), delay);
}

async function hydrateUser(user) {
  const bridge = window.WeddingPlannerBridge;
  if (!bridge) return;
  hydrated = false;
  cloudState.textContent = 'Cargando tu boda…';

  try {
    try {
      await ensureWeddingContext(user);
    } catch (workspaceError) {
      console.warn('Espacios compartidos aún no habilitados en Firestore; se conserva el modo anterior.', workspaceError);
      setWeddingContext({
        id: '',
        name: 'Mi boda',
        role: 'owner',
        legacyMode: true
      });
    }

    let cloudBackup = legacyMode
      ? await readLegacyCloudBackup(user.uid)
      : await readWeddingCloudBackup(activeWeddingId);
    let migratedLegacy = false;
    const localOwner = localStorage.getItem(LOCAL_OWNER_KEY) || '';

    if (!legacyMode && !cloudBackup && activeWeddingRole === 'owner') {
      try {
        const legacyBackup = await readLegacyCloudBackup(user.uid);
        if (legacyBackup) {
          cloudBackup = legacyBackup;
          migratedLegacy = true;
        }
      } catch (legacyError) {
        console.warn('No se pudo leer la copia anterior:', legacyError);
      }
    }

    if (cloudBackup) {
      await bridge.restoreCloudBackup(cloudBackup);
    } else if (localOwner && localOwner !== user.uid) {
      await bridge.clearLocalUserData();
    } else if (!cloudBackup) {
      await bridge.clearLocalUserData();
    }

    localStorage.setItem(LOCAL_OWNER_KEY, user.uid);
    hydrated = true;
    cloudState.textContent = cloudBackup
      ? legacyMode
        ? 'Sincronizado'
        : 'Boda sincronizada'
      : 'Preparando primera copia…';

    if (!cloudBackup || migratedLegacy) {
      await writeCloudBackup(user);
    }
  } catch (error) {
    console.error('Firebase load error:', error);
    hydrated = true;
    cloudState.textContent = 'Sincronización pendiente';
    bridge.showToast('Sesión iniciada, pero Firestore todavía no permite guardar.');
  }
}

export { auth, db };

export function getWeddingContext() {
  return currentContext();
}

export async function listUserWeddings() {
  const user = auth.currentUser;
  if (!user) return [];
  if (legacyMode) return [];

  const snaps = await getDocs(collection(db, 'users', user.uid, 'weddings'));
  const items = [];

  for (const snap of snaps.docs) {
    const data = snap.data() || {};
    const membership = await getWeddingMembership(snap.id, user.uid);
    if (!membership) {
      try {
        await deleteDoc(snap.ref);
      } catch (_) {}
      continue;
    }

    const role = normalizeRole(membership.role || data.role);
    const name = membership.weddingName || data.name || 'Mi boda';
    if (role !== data.role || name !== data.name) {
      try {
        await setDoc(snap.ref, { role, name }, { merge: true });
      } catch (_) {}
    }

    items.push({ id: snap.id, ...data, name, role });
  }

  return items.sort((a, b) => {
    if (a.role === 'owner' && b.role !== 'owner') return -1;
    if (a.role !== 'owner' && b.role === 'owner') return 1;
    return String(a.name || '').localeCompare(String(b.name || ''), 'es');
  });
}

export async function createWedding({ name, date = '' } = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión.');
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('Escribe un nombre para la boda.');

  const weddingRef = doc(collection(db, 'weddings'));
  const weddingId = weddingRef.id;
  const batch = writeBatch(db);

  batch.set(weddingRef, {
    name: cleanName,
    date: String(date || ''),
    ownerUid: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    version: 1
  });
  batch.set(doc(db, 'weddings', weddingId, 'members', user.uid), {
    uid: user.uid,
    email: String(user.email || '').toLowerCase(),
    displayName: user.displayName || '',
    role: 'owner',
    status: 'active',
    weddingName: cleanName,
    joinedAt: serverTimestamp()
  });
  batch.set(doc(db, 'users', user.uid, 'weddings', weddingId), {
    weddingId,
    name: cleanName,
    date: String(date || ''),
    role: 'owner',
    ownerUid: user.uid,
    addedAt: serverTimestamp()
  });
  await batch.commit();

  return { id: weddingId, name: cleanName, date: String(date || ''), role: 'owner' };
}

export async function switchWedding(weddingId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión.');
  if (legacyMode) throw new Error('Activa las reglas de Firestore para usar varias bodas.');

  const targetId = String(weddingId || '');
  if (!targetId) throw new Error('Boda no válida.');
  if (activeWeddingId === targetId && hydrated) return currentContext();

  if (activeWeddingId && hydrated && activeWeddingRole !== 'viewer') {
    try {
      await writeCloudBackup(user, true);
    } catch (_) {}
  }

  const indexSnap = await getDoc(doc(db, 'users', user.uid, 'weddings', targetId));
  const membership = await getWeddingMembership(targetId, user.uid);
  if (!indexSnap.exists() || !membership) {
    if (indexSnap.exists()) {
      try {
        await deleteDoc(indexSnap.ref);
      } catch (_) {}
    }
    throw new Error('Ya no tienes acceso a esta boda.');
  }

  const data = indexSnap.data() || {};
  hydrated = false;
  await window.WeddingPlannerBridge?.clearLocalUserData?.();
  setWeddingContext({
    id: targetId,
    name: membership.weddingName || data.name || 'Mi boda',
    role: membership.role || data.role,
    legacyMode: false
  });
  await setDoc(
    doc(db, 'users', user.uid),
    { activeWeddingId: targetId, lastSeenAt: serverTimestamp() },
    { merge: true }
  );
  await hydrateUser(user);
  return currentContext();
}

export async function inviteWeddingMember(email, role = 'editor') {
  const user = auth.currentUser;
  if (!user || !activeWeddingId || legacyMode) {
    throw new Error('La función de compartir todavía no está disponible en Firestore.');
  }
  if (activeWeddingRole !== 'owner') {
    throw new Error('Solo el propietario puede invitar personas.');
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Escribe un correo válido.');
  }
  if (normalizedEmail === String(user.email || '').toLowerCase()) {
    throw new Error('Ya eres propietario de esta boda.');
  }

  const cleanRole = role === 'viewer' ? 'viewer' : 'editor';
  const inviteId = safeInviteId(activeWeddingId, normalizedEmail);
  await setDoc(
    doc(db, 'invitations', inviteId),
    {
      weddingId: activeWeddingId,
      weddingName: activeWeddingName || 'Boda compartida',
      email: normalizedEmail,
      role: cleanRole,
      status: 'pending',
      invitedBy: user.uid,
      invitedByEmail: String(user.email || '').toLowerCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return { id: inviteId, email: normalizedEmail, role: cleanRole };
}

export async function listWeddingInvitations() {
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

export async function listPendingInvitations() {
  const user = auth.currentUser;
  if (!user?.email || legacyMode) return [];
  const email = String(user.email).toLowerCase();
  const q = query(collection(db, 'invitations'), where('email', '==', email));
  const snaps = await getDocs(q);
  return snaps.docs
    .map((snap) => ({ id: snap.id, ...snap.data() }))
    .filter((item) => item.status === 'pending');
}

export async function acceptWeddingInvitation(inviteId) {
  const user = auth.currentUser;
  if (!user?.email || legacyMode) throw new Error('Debes iniciar sesión.');

  const inviteRef = doc(db, 'invitations', String(inviteId || ''));
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) throw new Error('La invitación ya no existe.');

  const invite = inviteSnap.data() || {};
  if (String(invite.email || '').toLowerCase() !== String(user.email).toLowerCase()) {
    throw new Error('Esta invitación pertenece a otra cuenta.');
  }
  if (invite.status !== 'pending') throw new Error('Esta invitación ya fue utilizada.');

  const weddingId = String(invite.weddingId || '');
  const role = invite.role === 'viewer' ? 'viewer' : 'editor';
  const weddingName = String(invite.weddingName || 'Boda compartida');
  const batch = writeBatch(db);

  batch.set(
    doc(db, 'weddings', weddingId, 'members', user.uid),
    {
      uid: user.uid,
      email: String(user.email).toLowerCase(),
      displayName: user.displayName || '',
      role,
      status: 'active',
      weddingName,
      joinedAt: serverTimestamp()
    },
    { merge: true }
  );
  batch.set(
    doc(db, 'users', user.uid, 'weddings', weddingId),
    {
      weddingId,
      name: weddingName,
      role,
      ownerUid: invite.invitedBy || '',
      addedAt: serverTimestamp()
    },
    { merge: true }
  );
  batch.set(
    inviteRef,
    {
      status: 'accepted',
      acceptedBy: user.uid,
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
  await batch.commit();

  return { id: weddingId, name: weddingName, role };
}

export async function listWeddingMembers() {
  if (!activeWeddingId || !auth.currentUser || legacyMode) return [];
  const snaps = await getDocs(collection(db, 'weddings', activeWeddingId, 'members'));
  return snaps.docs
    .map((snap) => ({ uid: snap.id, ...snap.data() }))
    .filter((member) => member.status !== 'removed')
    .sort((a, b) => {
      if (a.role === 'owner') return -1;
      if (b.role === 'owner') return 1;
      return String(a.displayName || a.email || '').localeCompare(
        String(b.displayName || b.email || ''),
        'es'
      );
    });
}

export async function updateWeddingMemberRole(uid, role) {
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

export async function removeWeddingMember(uid) {
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

let googleAttemptToken = 0;

function reactivateGoogleButton(message = '') {
  googleLoginButton.disabled = false;
  googleLoginButton.removeAttribute('aria-busy');
  if (message !== undefined) authStatus.textContent = message;
}

googleLoginButton.addEventListener('click', async () => {
  const token = ++googleAttemptToken;
  googleLoginButton.disabled = false;
  googleLoginButton.setAttribute('aria-busy', 'true');
  authStatus.textContent = 'Elige la cuenta de Google que deseas usar…';

  const attemptProvider = new GoogleAuthProvider();
  attemptProvider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, attemptProvider);
    if (token !== googleAttemptToken) return;
    if (result?.user) {
      authStatus.textContent = 'Acceso correcto. Abriendo tu planificador…';
    }
  } catch (error) {
    if (token !== googleAttemptToken) return;
    console.error('Google sign-in error:', error);
    const code = String(error?.code || '');
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/user-cancelled'
    ) {
      authStatus.textContent = 'Ventana de Google cerrada. Puedes pulsar “Continuar con Google” otra vez.';
    } else {
      authStatus.textContent = friendlyAuthError(error);
    }
  } finally {
    if (token === googleAttemptToken && !auth.currentUser) {
      reactivateGoogleButton(authStatus.textContent);
    }
  }
});

emailLoginButton.addEventListener('click', async () => {
  authStatus.textContent = 'Ingresando…';
  try {
    await signInWithEmailAndPassword(auth, authEmail.value.trim(), authPassword.value);
  } catch (error) {
    authStatus.textContent = friendlyAuthError(error);
  }
});

emailRegisterButton.addEventListener('click', async () => {
  authStatus.textContent = 'Creando tu cuenta…';
  try {
    await createUserWithEmailAndPassword(auth, authEmail.value.trim(), authPassword.value);
  } catch (error) {
    authStatus.textContent = friendlyAuthError(error);
  }
});

authPassword.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') emailLoginButton.click();
});

authCloseButton.addEventListener('click', () => {
  pendingOpenMenu = false;
  googleAttemptToken++;
  reactivateGoogleButton('');
  authStatus.textContent = '';
  closeAuth(true);
});

authOverlay.addEventListener('click', (event) => {
  if (event.target === authOverlay) {
    pendingOpenMenu = false;
    googleAttemptToken++;
    reactivateGoogleButton('');
    authStatus.textContent = '';
    closeAuth(true);
  }
});

async function performLogout(button) {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  if (button) button.disabled = true;
  cloudState.textContent = 'Cerrando sesión…';
  try {
    await writeCloudBackup(currentUser);
  } catch (error) {
    console.error('Final cloud save before logout failed:', error);
  }
  hydrated = false;
  try {
    await window.WeddingPlannerBridge?.clearLocalUserData?.();
    localStorage.removeItem(LOCAL_OWNER_KEY);
  } finally {
    await signOut(auth);
    if (button) button.disabled = false;
    document.body.classList.remove('menu-open', 'module-view');
    history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo(0, 0);
  }
}

logoutButton?.addEventListener('click', () => performLogout(logoutButton));
moduleSessionLogout?.addEventListener('click', () => performLogout(moduleSessionLogout));

window.addEventListener('storage', (event) => {
  if (
    event.key &&
    (event.key.startsWith('planificador_bodas_') || event.key.startsWith('eventPlanner'))
  ) {
    scheduleCloudSave();
  }
});
window.addEventListener('message', () => scheduleCloudSave(3500));
window.addEventListener('migrandia:datachange', () => scheduleCloudSave(400));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') scheduleCloudSave(0);
});
setInterval(() => {
  if (auth.currentUser && hydrated) writeCloudBackup(auth.currentUser, true);
}, 15000);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    document.body.classList.remove('menu-open', 'module-view');
    if (location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  authResolved = true;
  if (user) {
    accountCard.classList.add('show');
    accountName.textContent = user.displayName || 'Mi Gran Día';
    accountEmail.textContent = user.email || '';
    if (user.photoURL) {
      accountAvatar.src = user.photoURL;
      accountAvatar.classList.add('show');
    } else {
      accountAvatar.removeAttribute('src');
      accountAvatar.classList.remove('show');
    }

    if (activeUid && activeUid !== user.uid) {
      await window.WeddingPlannerBridge?.clearLocalUserData?.();
    }
    activeUid = user.uid;
    await hydrateUser(user);
    unlockPlanner(user);
    window.dispatchEvent(
      new CustomEvent('migrandia:auth', {
        detail: { authenticated: true, uid: user.uid }
      })
    );

    if (pendingOpenMenu) {
      pendingOpenMenu = false;
      setTimeout(() => menuButton.click(), 80);
    }
  } else {
    const hadAuthenticatedUser = Boolean(activeUid);
    activeUid = '';
    hydrated = false;
    if (hadAuthenticatedUser) {
      await window.WeddingPlannerBridge?.clearLocalUserData?.();
      localStorage.removeItem(LOCAL_OWNER_KEY);
    }
    accountCard.classList.remove('show');
    accountName.textContent = '';
    accountEmail.textContent = '';
    accountAvatar.removeAttribute('src');
    accountAvatar.classList.remove('show');
    cloudState.textContent = 'Inicia sesión para sincronizar';
    pendingOpenMenu = false;
    setWeddingContext({ id: '', name: '', role: 'viewer', legacyMode: false });
    lockPlanner();
    window.dispatchEvent(
      new CustomEvent('migrandia:auth', { detail: { authenticated: false } })
    );
  }
});

if (!document.querySelector('link[data-weddings-style]')) {
  const weddingsStyle = document.createElement('link');
  weddingsStyle.rel = 'stylesheet';
  weddingsStyle.href = 'css/modules/weddings.css';
  weddingsStyle.dataset.weddingsStyle = 'true';
  document.head.appendChild(weddingsStyle);
}

import('../modules/configuracion/weddings.js').catch((error) => {
  console.error('No se pudo cargar el módulo de bodas compartidas:', error);
});
