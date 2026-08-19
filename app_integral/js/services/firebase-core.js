import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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

const VERSION = '20260819-mobile-popup-gesture1';
const FINAL_SAVE_BUDGET_MS = 650;
const CHUNK_SIZE = 180000;
const LOCAL_OWNER_KEY = 'migrandia_local_owner_uid_v1';

const firebaseConfig = {
  apiKey: 'AIzaSyDCRuQgMjnm7KcAN_qo8AHPD3ueyis4-LY',
  authDomain: 'migrandia.firebaseapp.com',
  projectId: 'migrandia',
  storageBucket: 'migrandia.firebasestorage.app',
  messagingSenderId: '7432985765',
  appId: '1:7432985765:web:b3a4844f41ac2a1376c14c'
};

const app = getApps()[0] || initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const persistenceReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('No se pudo fijar persistencia local de Firebase:', error);
});

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
const mainDrawer = document.getElementById('mainDrawer');
const backdrop = document.getElementById('backdrop');
const unifiedLoader = document.getElementById('unifiedLoader');

let pendingOpenMenu = false;
let activeUid = '';
let cloudBusy = false;
let cloudTimer = 0;
let cloudDirty = false;
let hydrated = false;
let authResolved = false;
let activeWeddingId = '';
let activeWeddingRole = '';
let activeWeddingName = '';
let legacyMode = false;
let authTransitioning = false;
let logoutInProgress = false;
let authEpoch = 0;
let switchStartedAt = 0;

window.WeddingPlannerAuthGuard ||= { ready: false, authenticated: false, uid: '' };

const perfStore = (window.MiGranDiaPerf ||= {
  version: VERSION,
  samples: [],
  baseline: {
    menuDisabledDuringHydration: true,
    duplicateFirebaseModuleRisk: true,
    logoutBlockingStages: ['cloud-backup', 'local-clear', 'firebase-signout'],
    weddingContextReads: 'sequential'
  },
  report() {
    const groups = this.samples.reduce((acc, item) => {
      (acc[item.name] ||= []).push(item.durationMs);
      return acc;
    }, {});
    const metrics = {};
    for (const [name, values] of Object.entries(groups)) {
      const sorted = [...values].sort((a, b) => a - b);
      const sum = sorted.reduce((total, value) => total + value, 0);
      metrics[name] = {
        count: sorted.length,
        latestMs: sorted.at(-1) ?? 0,
        avgMs: Math.round((sum / sorted.length) * 10) / 10,
        p95Ms: Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] * 10) / 10
      };
    }
    return {
      version: this.version,
      structuralBefore: this.baseline,
      structuralAfter: {
        menuDisabledDuringHydration: false,
        duplicateFirebaseModuleRisk: false,
        logoutBlockingStages: [`cloud-backup capped at ${FINAL_SAVE_BUDGET_MS}ms`, 'firebase-signout'],
        localClear: 'single background pass',
        weddingContextReads: 'parallel where independent'
      },
      metrics
    };
  }
});

function metric(name, startedAt, detail = {}) {
  const durationMs = Math.max(0, performance.now() - startedAt);
  const sample = {
    name,
    durationMs: Math.round(durationMs * 10) / 10,
    at: new Date().toISOString(),
    ...detail
  };
  perfStore.samples.push(sample);
  if (perfStore.samples.length > 120) perfStore.samples.splice(0, perfStore.samples.length - 120);
  window.dispatchEvent(new CustomEvent('migrandia:performance', { detail: sample }));
  console.info(`[Mi Gran Día perf] ${name}: ${sample.durationMs}ms`, detail);
  return sample.durationMs;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeRole(role) {
  return ['owner', 'admin', 'editor', 'provider', 'viewer'].includes(role) ? role : 'viewer';
}

function canManageTeamRole(role = activeWeddingRole) {
  return ['owner', 'admin'].includes(normalizeRole(role));
}

function canEditPlannerRole(role = activeWeddingRole) {
  return ['owner', 'admin', 'editor'].includes(normalizeRole(role));
}

function normalizeCollaboratorRole(role, fallback = 'editor') {
  const clean = String(role || '').trim().toLowerCase();
  return ['admin', 'editor', 'provider', 'viewer'].includes(clean) ? clean : fallback;
}

function currentContext() {
  return { id: activeWeddingId, role: activeWeddingRole, name: activeWeddingName, legacyMode };
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
  if (!normalized || normalized.includes('/')) throw new Error('Correo no válido para invitación.');
  return `${weddingId}__${normalized}`;
}

function setAuthControlsBusy(busy) {
  authTransitioning = Boolean(busy);
  [googleLoginButton, emailLoginButton, emailRegisterButton].forEach((button) => {
    if (button) button.disabled = Boolean(busy);
  });
  authOverlay?.toggleAttribute('data-auth-busy', Boolean(busy));
}

function closePrivatePanels() {
  document.body.classList.remove('menu-open', 'module-view', 'wedding-modal-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir menú');
  mainDrawer?.setAttribute('aria-hidden', 'true');
  backdrop?.setAttribute('aria-hidden', 'true');
  unifiedLoader?.classList.remove('show');

  document.querySelectorAll('.module.open').forEach((module) => {
    module.classList.remove('open');
    module.querySelector('.module-toggle')?.setAttribute('aria-expanded', 'false');
  });

  const weddingsModal = document.getElementById('weddingWorkspaceModal');
  weddingsModal?.classList.remove('show');
  weddingsModal?.setAttribute('aria-hidden', 'true');
  const createWeddingSheet = document.getElementById('createWeddingSheet');
  createWeddingSheet?.classList.remove('show');
  createWeddingSheet?.setAttribute('aria-hidden', 'true');
}

function closeAuth(force = false) {
  authOverlay?.classList.remove('show');
  authOverlay?.setAttribute('aria-hidden', 'true');
  if (force && authStatus) authStatus.textContent = '';
}

function showAuthTransition(message) {
  closePrivatePanels();
  authOverlay?.classList.add('show');
  authOverlay?.setAttribute('aria-hidden', 'false');
  if (authStatus) authStatus.textContent = message;
  setAuthControlsBusy(true);
}

function openAuth() {
  pendingOpenMenu = true;
  closePrivatePanels();
  authOverlay?.classList.add('show');
  authOverlay?.setAttribute('aria-hidden', 'false');
  if (authStatus) authStatus.textContent = '';
  setAuthControlsBusy(false);
  setTimeout(() => googleLoginButton?.focus(), 40);
}

window.WeddingPlannerRequestAuth = () => {
  if (logoutInProgress) {
    pendingOpenMenu = true;
    showAuthTransition('Cambiando de cuenta…');
    return;
  }
  if (auth.currentUser) {
    pendingOpenMenu = true;
    closeAuth(true);
    return;
  }
  openAuth();
};
window.dispatchEvent(new Event('migrandia:auth-controller-ready'));

function lockPlanner() {
  document.body.classList.add('auth-locked');
  document.body.classList.remove('auth-hydrating');
  closePrivatePanels();
  if (menuButton) menuButton.disabled = false;
  window.WeddingPlannerAuthGuard.ready = authResolved;
  window.WeddingPlannerAuthGuard.authenticated = false;
  window.WeddingPlannerAuthGuard.uid = '';
  closeAuth(true);
  if (location.hash) history.replaceState({ module: 'home' }, '', location.pathname + location.search);
}

function showAuthenticatedShell(user) {
  window.WeddingPlannerAuthGuard.ready = true;
  window.WeddingPlannerAuthGuard.authenticated = true;
  window.WeddingPlannerAuthGuard.uid = user.uid;
  document.body.classList.remove('auth-locked');
  document.body.classList.add('auth-hydrating');
  if (menuButton) menuButton.disabled = false;
  closeAuth(true);
}

function finishHydration(user) {
  if (auth.currentUser?.uid !== user.uid) return;
  document.body.classList.remove('auth-hydrating');
  if (menuButton) menuButton.disabled = false;
  window.dispatchEvent(new Event('hashchange'));
}

function renderAccount(user) {
  accountCard?.classList.add('show');
  if (accountName) accountName.textContent = user.displayName || 'Mi Gran Día';
  if (accountEmail) accountEmail.textContent = user.email || '';
  if (accountAvatar) {
    if (user.photoURL) {
      accountAvatar.src = user.photoURL;
      accountAvatar.classList.add('show');
    } else {
      accountAvatar.removeAttribute('src');
      accountAvatar.classList.remove('show');
    }
  }
}

function clearAccount() {
  accountCard?.classList.remove('show');
  if (accountName) accountName.textContent = '';
  if (accountEmail) accountEmail.textContent = '';
  accountAvatar?.removeAttribute('src');
  accountAvatar?.classList.remove('show');
}

function friendlyAuthError(error) {
  const code = String(error?.code || '');
  if (code.includes('invalid-credential')) return 'Correo o contraseña incorrectos.';
  if (code.includes('email-already-in-use')) return 'Ese correo ya tiene una cuenta.';
  if (code.includes('weak-password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (code.includes('invalid-email')) return 'Revisa el correo electrónico.';
  if (code.includes('popup-closed')) return 'La ventana de Google se cerró antes de terminar. Vuelve a intentarlo.';
  if (code.includes('popup-blocked')) return 'El navegador bloqueó la ventana de Google. Permite ventanas emergentes y vuelve a intentarlo.';
  if (code.includes('cancelled-popup-request')) return 'Ya hay una ventana de acceso abierta. Termínala o vuelve a intentarlo.';
  if (code.includes('unauthorized-domain')) return `Firebase no tiene autorizado este dominio (${location.hostname}).`;
  if (code.includes('operation-not-allowed')) return 'Activa este método de acceso en Firebase Authentication.';
  return 'No se pudo iniciar sesión. Inténtalo nuevamente.';
}

function splitText(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) chunks.push(text.slice(i, i + CHUNK_SIZE));
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
  const text = parts.map((snap) => (snap.exists() ? String(snap.data().data || '') : '')).join('');
  return text ? JSON.parse(text) : null;
}

function readLegacyCloudBackup(uid) {
  return readBackup(
    doc(db, 'users', uid, 'cloudSync', 'main'),
    (index) => doc(db, 'users', uid, 'cloudChunks', String(index).padStart(5, '0'))
  );
}

function readWeddingCloudBackup(weddingId) {
  if (!weddingId) return Promise.resolve(null);
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
    const [indexSnap, membership] = await Promise.all([
      getDoc(doc(db, 'users', user.uid, 'weddings', requestedId)),
      getWeddingMembership(requestedId, user.uid)
    ]);
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
  const candidates = await Promise.all(
    indexSnaps.docs.map(async (item) => ({ item, membership: await getWeddingMembership(item.id, user.uid) }))
  );

  for (const { item, membership } of candidates) {
    if (!membership) {
      deleteDoc(item.ref).catch(() => {});
      continue;
    }
    const data = item.data() || {};
    setWeddingContext({
      id: item.id,
      name: membership.weddingName || data.name || 'Mi boda',
      role: membership.role || data.role,
      legacyMode: false
    });
    setDoc(profileRef, { activeWeddingId: item.id, lastSeenAt: serverTimestamp() }, { merge: true }).catch(() => {});
    return currentContext();
  }

  const weddingId = `wedding_${user.uid}`;
  const weddingName = user.displayName ? `Boda de ${user.displayName}` : 'Mi boda';
  const batch = writeBatch(db);
  batch.set(doc(db, 'weddings', weddingId), {
    name: weddingName,
    ownerUid: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    version: 1
  }, { merge: true });
  batch.set(doc(db, 'weddings', weddingId, 'members', user.uid), {
    uid: user.uid,
    email: String(user.email || '').toLowerCase(),
    displayName: user.displayName || '',
    role: 'owner',
    status: 'active',
    weddingName,
    joinedAt: serverTimestamp()
  }, { merge: true });
  batch.set(doc(db, 'users', user.uid, 'weddings', weddingId), {
    weddingId,
    name: weddingName,
    role: 'owner',
    ownerUid: user.uid,
    addedAt: serverTimestamp()
  }, { merge: true });
  batch.set(profileRef, {
    email: user.email || '',
    displayName: user.displayName || '',
    activeWeddingId: weddingId,
    lastSeenAt: serverTimestamp()
  }, { merge: true });
  await batch.commit();
  setWeddingContext({ id: weddingId, name: weddingName, role: 'owner', legacyMode: false });
  return currentContext();
}

async function writeCloudBackup(user, silent = false, force = false) {
  if (!user || cloudBusy || !hydrated) return;
  if (!force && !cloudDirty) return;
  if (!legacyMode && (!activeWeddingId || !canEditPlannerRole())) return;
  const bridge = window.WeddingPlannerBridge;
  if (!bridge) return;

  cloudBusy = true;
  if (!silent && cloudState) cloudState.textContent = 'Guardando en la nube…';

  try {
    const backup = await bridge.buildCloudBackup();
    const text = JSON.stringify(backup);
    const chunks = splitText(text);
    const metaRef = legacyMode
      ? doc(db, 'users', user.uid, 'cloudSync', 'main')
      : doc(db, 'weddings', activeWeddingId, 'cloudSync', 'main');
    const previous = await getDoc(metaRef);
    const oldCount = previous.exists() ? Number(previous.data().chunkCount || 0) : 0;
    const chunkRef = (index) => legacyMode
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
    batch.set(doc(db, 'users', user.uid), {
      email: user.email || '',
      displayName: user.displayName || '',
      activeWeddingId: activeWeddingId || '',
      lastSeenAt: serverTimestamp()
    }, { merge: true });
    ops++;
    await commitIfNeeded(true);

    if (cloudState) cloudState.textContent = legacyMode ? 'Guardado en la nube' : 'Boda sincronizada';
    localStorage.setItem('migrandia_cloud_sync_meta_v1', new Date().toISOString());
    cloudDirty = false;
  } catch (error) {
    console.error('Firebase sync error:', error);
    if (cloudState) cloudState.textContent = 'No se pudo sincronizar';
    if (!silent) bridge.showToast?.('No se pudo guardar en Firebase. Revisa las reglas de Firestore.');
  } finally {
    cloudBusy = false;
  }
}

function scheduleCloudSave(delayMs = 2500) {
  if (!auth.currentUser || !hydrated || !canEditPlannerRole()) return;
  cloudDirty = true;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => writeCloudBackup(auth.currentUser, true), delayMs);
}

async function hydrateUser(user, epoch) {
  const startedAt = performance.now();
  const bridge = window.WeddingPlannerBridge;
  if (!bridge) return;
  hydrated = false;
  if (cloudState) cloudState.textContent = 'Cargando tu boda…';

  try {
    const localOwner = localStorage.getItem(LOCAL_OWNER_KEY) || '';
    if (localOwner && localOwner !== user.uid) {
      await bridge.clearLocalUserData?.();
      if (epoch !== authEpoch) return;
    }

    try {
      await ensureWeddingContext(user);
    } catch (workspaceError) {
      console.warn('Espacios compartidos aún no habilitados en Firestore; se conserva el modo anterior.', workspaceError);
      setWeddingContext({ id: '', name: 'Mi boda', role: 'owner', legacyMode: true });
    }
    if (epoch !== authEpoch) return;

    let cloudBackup = legacyMode
      ? await readLegacyCloudBackup(user.uid)
      : await readWeddingCloudBackup(activeWeddingId);
    let migratedLegacy = false;
    if (epoch !== authEpoch) return;

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
    if (epoch !== authEpoch) return;

    if (cloudBackup) {
      await bridge.restoreCloudBackup?.(cloudBackup);
    } else if (localOwner !== user.uid) {
      // A new/different account must never inherit planner data left in this
      // browser. When the owner is the same, however, keep its existing local
      // data and use it to create the first cloud backup instead of erasing it.
      await bridge.clearLocalUserData?.();
    }
    if (epoch !== authEpoch) return;

    localStorage.setItem(LOCAL_OWNER_KEY, user.uid);
    hydrated = true;
    if (cloudState) {
      cloudState.textContent = cloudBackup
        ? (legacyMode ? 'Sincronizado' : 'Boda sincronizada')
        : 'Preparando primera copia…';
    }

    metric('auth_hydration', startedAt, { uid: user.uid, restored: Boolean(cloudBackup), legacyMode });

    if (!cloudBackup || migratedLegacy) {
      setTimeout(() => {
        if (auth.currentUser?.uid === user.uid && hydrated) writeCloudBackup(user, true, true);
      }, 0);
    }
  } catch (error) {
    console.error('Firebase load error:', error);
    hydrated = true;
    if (cloudState) cloudState.textContent = 'Sincronización pendiente';
    bridge.showToast?.('Sesión iniciada, pero Firestore todavía no permite guardar.');
    metric('auth_hydration_error', startedAt, { code: String(error?.code || '') });
  }
}

export { auth, db };

export function getWeddingContext() {
  return currentContext();
}

export async function listUserWeddings() {
  const user = auth.currentUser;
  if (!user || legacyMode) return [];
  const snaps = await getDocs(collection(db, 'users', user.uid, 'weddings'));
  const rows = await Promise.all(snaps.docs.map(async (snap) => {
    const data = snap.data() || {};
    const membership = await getWeddingMembership(snap.id, user.uid);
    if (!membership) {
      deleteDoc(snap.ref).catch(() => {});
      return null;
    }
    const role = normalizeRole(membership.role || data.role);
    const name = membership.weddingName || data.name || 'Mi boda';
    if (role !== data.role || name !== data.name) setDoc(snap.ref, { role, name }, { merge: true }).catch(() => {});
    return { id: snap.id, ...data, name, role };
  }));
  const roleRank = { owner: 0, admin: 1, editor: 2, provider: 3, viewer: 4 };
  return rows.filter(Boolean).sort((a, b) => {
    const rankDiff = (roleRank[a.role] ?? 9) - (roleRank[b.role] ?? 9);
    return rankDiff || String(a.name || '').localeCompare(String(b.name || ''), 'es');
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

  if (activeWeddingId && hydrated && canEditPlannerRole()) {
    await Promise.race([writeCloudBackup(user, true, true), delay(FINAL_SAVE_BUDGET_MS)]).catch(() => {});
  }

  const [indexSnap, membership] = await Promise.all([
    getDoc(doc(db, 'users', user.uid, 'weddings', targetId)),
    getWeddingMembership(targetId, user.uid)
  ]);
  if (!indexSnap.exists() || !membership) {
    if (indexSnap.exists()) deleteDoc(indexSnap.ref).catch(() => {});
    throw new Error('Ya no tienes acceso a esta boda.');
  }

  const data = indexSnap.data() || {};
  hydrated = false;
  document.body.classList.add('auth-hydrating');
  await window.WeddingPlannerBridge?.clearLocalUserData?.();
  setWeddingContext({
    id: targetId,
    name: membership.weddingName || data.name || 'Mi boda',
    role: membership.role || data.role,
    legacyMode: false
  });
  setDoc(doc(db, 'users', user.uid), { activeWeddingId: targetId, lastSeenAt: serverTimestamp() }, { merge: true }).catch(() => {});
  const epoch = ++authEpoch;
  await hydrateUser(user, epoch);
  finishHydration(user);
  return currentContext();
}

export async function inviteWeddingMember(email, role = 'editor') {
  const user = auth.currentUser;
  if (!user || !activeWeddingId || legacyMode) throw new Error('La función de compartir todavía no está disponible en Firestore.');
  if (!canManageTeamRole()) throw new Error('Solo el propietario o un administrador puede invitar personas.');
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('Escribe un correo válido.');
  if (normalizedEmail === String(user.email || '').toLowerCase()) throw new Error('Ya eres propietario de esta boda.');
  const cleanRole = normalizeCollaboratorRole(role);
  if (activeWeddingRole === 'admin' && cleanRole === 'admin') throw new Error('Solo el propietario puede asignar el rol Administrador.');
  const inviteId = safeInviteId(activeWeddingId, normalizedEmail);
  await setDoc(doc(db, 'invitations', inviteId), {
    weddingId: activeWeddingId,
    weddingName: activeWeddingName || 'Boda compartida',
    email: normalizedEmail,
    role: cleanRole,
    status: 'pending',
    invitedBy: user.uid,
    invitedByEmail: String(user.email || '').toLowerCase(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  return { id: inviteId, email: normalizedEmail, role: cleanRole };
}

export async function listWeddingInvitations() {
  if (!auth.currentUser || !activeWeddingId || legacyMode || !canManageTeamRole()) return [];
  const q = query(collection(db, 'invitations'), where('weddingId', '==', activeWeddingId));
  const snaps = await getDocs(q);
  return snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() }))
    .filter((item) => item.status === 'pending')
    .sort((a, b) => String(a.email || '').localeCompare(String(b.email || ''), 'es'));
}

export async function cancelWeddingInvitation(inviteId) {
  if (!auth.currentUser || !activeWeddingId || legacyMode || !canManageTeamRole()) throw new Error('Solo el propietario o un administrador puede cancelar invitaciones.');
  const ref = doc(db, 'invitations', String(inviteId || ''));
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  if (String(snap.data()?.weddingId || '') !== activeWeddingId) throw new Error('La invitación no pertenece a esta boda.');
  await deleteDoc(ref);
}

export async function listPendingInvitations() {
  const user = auth.currentUser;
  if (!user?.email || legacyMode) return [];
  const email = String(user.email).toLowerCase();
  const q = query(collection(db, 'invitations'), where('email', '==', email));
  const snaps = await getDocs(q);
  return snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() })).filter((item) => item.status === 'pending');
}

export async function acceptWeddingInvitation(inviteId) {
  const user = auth.currentUser;
  if (!user?.email || legacyMode) throw new Error('Debes iniciar sesión.');
  const inviteRef = doc(db, 'invitations', String(inviteId || ''));
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) throw new Error('La invitación ya no existe.');
  const invite = inviteSnap.data() || {};
  if (String(invite.email || '').toLowerCase() !== String(user.email).toLowerCase()) throw new Error('Esta invitación pertenece a otra cuenta.');
  if (invite.status !== 'pending') throw new Error('Esta invitación ya fue utilizada.');
  const weddingId = String(invite.weddingId || '');
  const role = normalizeCollaboratorRole(invite.role);
  const weddingName = String(invite.weddingName || 'Boda compartida');
  const batch = writeBatch(db);
  batch.set(doc(db, 'weddings', weddingId, 'members', user.uid), {
    uid: user.uid,
    email: String(user.email).toLowerCase(),
    displayName: user.displayName || '',
    role,
    status: 'active',
    weddingName,
    joinedAt: serverTimestamp()
  }, { merge: true });
  batch.set(doc(db, 'users', user.uid, 'weddings', weddingId), {
    weddingId,
    name: weddingName,
    role,
    ownerUid: invite.invitedBy || '',
    addedAt: serverTimestamp()
  }, { merge: true });
  batch.set(inviteRef, {
    status: 'accepted',
    acceptedBy: user.uid,
    acceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  await batch.commit();
  return { id: weddingId, name: weddingName, role };
}

export async function listWeddingMembers() {
  if (!activeWeddingId || !auth.currentUser || legacyMode) return [];
  const snaps = await getDocs(collection(db, 'weddings', activeWeddingId, 'members'));
  return snaps.docs.map((snap) => ({ uid: snap.id, ...snap.data() }))
    .filter((member) => member.status !== 'removed')
    .sort((a, b) => {
      if (a.role === 'owner') return -1;
      if (b.role === 'owner') return 1;
      return String(a.displayName || a.email || '').localeCompare(String(b.displayName || b.email || ''), 'es');
    });
}

export async function updateWeddingMemberRole(uid, role) {
  if (!auth.currentUser || !canManageTeamRole() || legacyMode) throw new Error('Solo el propietario o un administrador puede cambiar permisos.');
  const targetUid = String(uid || '');
  if (!targetUid || targetUid === auth.currentUser.uid) throw new Error('No puedes cambiar tu propio rol desde aquí.');
  const memberRef = doc(db, 'weddings', activeWeddingId, 'members', targetUid);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) throw new Error('Ese miembro ya no pertenece a la boda.');
  const currentRole = normalizeRole(memberSnap.data()?.role);
  if (currentRole === 'owner') throw new Error('El rol del propietario no se puede modificar.');
  const cleanRole = normalizeCollaboratorRole(role);
  if (activeWeddingRole === 'admin' && (currentRole === 'admin' || cleanRole === 'admin')) throw new Error('Solo el propietario puede administrar el rol Administrador.');
  await setDoc(memberRef, { role: cleanRole, updatedAt: serverTimestamp() }, { merge: true });
  return cleanRole;
}

export async function removeWeddingMember(uid) {
  if (!auth.currentUser || !canManageTeamRole() || legacyMode) throw new Error('Solo el propietario o un administrador puede retirar accesos.');
  const targetUid = String(uid || '');
  if (!targetUid || targetUid === auth.currentUser.uid) throw new Error('No puedes retirar tu propio acceso desde aquí.');
  const memberRef = doc(db, 'weddings', activeWeddingId, 'members', targetUid);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) return;
  const currentRole = normalizeRole(memberSnap.data()?.role);
  if (currentRole === 'owner') throw new Error('No se puede retirar al propietario.');
  if (activeWeddingRole === 'admin' && currentRole === 'admin') throw new Error('Solo el propietario puede retirar a otro administrador.');
  await setDoc(memberRef, {
    status: 'removed',
    removedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

let googleAttemptToken = 0;
let googleStartedAt = 0;

function reactivateGoogleButton(message = '') {
  setAuthControlsBusy(false);
  googleLoginButton?.removeAttribute('aria-busy');
  if (message !== undefined && authStatus) authStatus.textContent = message;
}

googleLoginButton?.addEventListener('click', async () => {
  if (authTransitioning || logoutInProgress) return;
  const token = ++googleAttemptToken;
  googleStartedAt = performance.now();
  setAuthControlsBusy(true);
  googleLoginButton.setAttribute('aria-busy', 'true');
  if (authStatus) authStatus.textContent = 'Elige la cuenta de Google que deseas usar…';
  const attemptProvider = new GoogleAuthProvider();
  attemptProvider.setCustomParameters({ prompt: 'select_account' });
  try {
    // Keep the popup creation in the original trusted click. In iOS browsers,
    // awaiting persistence here can consume the transient user activation and
    // make Firebase open its helper as a detached tab without its initial
    // sessionStorage state. Persistence is already queued during module startup;
    // Firebase serializes the auth operation without delaying this popup call.
    const result = await signInWithPopup(auth, attemptProvider);
    if (token !== googleAttemptToken) return;
    metric('google_popup', googleStartedAt, { uid: result?.user?.uid || '' });
    if (result?.user) {
      if (authStatus) authStatus.textContent = 'Acceso correcto. Preparando tu boda…';
      closeAuth(true);
    }
  } catch (error) {
    if (token !== googleAttemptToken) return;
    console.error('Google sign-in error:', error);
    const code = String(error?.code || '');
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/user-cancelled') {
      if (authStatus) authStatus.textContent = 'Ventana de Google cerrada. Puedes intentarlo nuevamente.';
    } else if (authStatus) authStatus.textContent = friendlyAuthError(error);
  } finally {
    googleLoginButton.removeAttribute('aria-busy');
    if (token === googleAttemptToken && !auth.currentUser) setAuthControlsBusy(false);
  }
});

emailLoginButton?.addEventListener('click', async () => {
  if (authTransitioning || logoutInProgress) return;
  if (authStatus) authStatus.textContent = 'Ingresando…';
  setAuthControlsBusy(true);
  try {
    await persistenceReady;
    const result = await signInWithEmailAndPassword(auth, authEmail.value.trim(), authPassword.value);
    if (result?.user) closeAuth(true);
  } catch (error) {
    if (authStatus) authStatus.textContent = friendlyAuthError(error);
    setAuthControlsBusy(false);
  }
});

emailRegisterButton?.addEventListener('click', async () => {
  if (authTransitioning || logoutInProgress) return;
  if (authStatus) authStatus.textContent = 'Creando tu cuenta…';
  setAuthControlsBusy(true);
  try {
    await persistenceReady;
    const result = await createUserWithEmailAndPassword(auth, authEmail.value.trim(), authPassword.value);
    if (result?.user) closeAuth(true);
  } catch (error) {
    if (authStatus) authStatus.textContent = friendlyAuthError(error);
    setAuthControlsBusy(false);
  }
});

authPassword?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') emailLoginButton?.click();
});

function cancelAuthDialog() {
  pendingOpenMenu = false;
  googleAttemptToken++;
  reactivateGoogleButton('');
  closeAuth(true);
  closePrivatePanels();
  if (!auth.currentUser) lockPlanner();
}

authCloseButton?.addEventListener('click', cancelAuthDialog);
authOverlay?.addEventListener('click', (event) => {
  if (event.target === authOverlay) cancelAuthDialog();
});

async function performLogout(button) {
  const currentUser = auth.currentUser;
  if (!currentUser || logoutInProgress) return;
  const startedAt = performance.now();
  switchStartedAt = startedAt;
  logoutInProgress = true;
  pendingOpenMenu = false;
  googleAttemptToken++;
  if (button) button.disabled = true;

  authResolved = true;
  lockPlanner();
  showAuthTransition('Cambiando de cuenta…');
  if (cloudState) cloudState.textContent = 'Cerrando sesión…';

  try {
    clearTimeout(cloudTimer);
    const saveStartedAt = performance.now();
    if (hydrated && canEditPlannerRole()) {
      await Promise.race([writeCloudBackup(currentUser, true, true), delay(FINAL_SAVE_BUDGET_MS)]);
      metric('logout_final_save_budget', saveStartedAt, { budgetMs: FINAL_SAVE_BUDGET_MS });
    }
    hydrated = false;
    await signOut(auth);
    metric('logout_auth_release', startedAt);
    history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo(0, 0);
  } catch (error) {
    console.error('Logout failed:', error);
    if (auth.currentUser) {
      showAuthenticatedShell(auth.currentUser);
      finishHydration(auth.currentUser);
      window.WeddingPlannerBridge?.showToast?.('No se pudo cerrar la sesión. Inténtalo nuevamente.');
    }
  } finally {
    logoutInProgress = false;
    if (button) button.disabled = false;
    if (!auth.currentUser) openAuth();
  }
}

logoutButton?.addEventListener('click', () => performLogout(logoutButton));
moduleSessionLogout?.addEventListener('click', () => performLogout(moduleSessionLogout));

window.addEventListener('storage', (event) => {
  if (event.key && (event.key.startsWith('planificador_bodas_') || event.key.startsWith('eventPlanner'))) scheduleCloudSave();
});
window.addEventListener('message', (event) => {
  const message = event.data;
  if (!message || typeof message !== 'object') return;
  if (
    message.type === 'PLANIFICADOR_BODAS_UPDATE' ||
    message.type === 'MIGRANDIA_RSVP_SYNC' ||
    (message.source === 'planificador-bodas-respaldo-general' && message.action === 'save-all')
  ) scheduleCloudSave(3500);
});
window.addEventListener('migrandia:datachange', () => scheduleCloudSave(400));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && cloudDirty) {
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(() => writeCloudBackup(auth.currentUser, true), 0);
  }
});
setInterval(() => {
  if (!document.hidden && cloudDirty && auth.currentUser && hydrated) writeCloudBackup(auth.currentUser, true);
}, 15000);

onAuthStateChanged(auth, (user) => {
  const observerStartedAt = performance.now();
  const epoch = ++authEpoch;
  authResolved = true;

  if (user) {
    // Firebase puede volver a notificar el mismo usuario al reactivarse una pestaña.
    // Esa notificación no es un nuevo inicio de sesión: conservar el módulo y su DOM.
    if (
      user.uid === activeUid &&
      hydrated &&
      window.WeddingPlannerAuthGuard?.authenticated === true &&
      !logoutInProgress
    ) {
      setAuthControlsBusy(false);
      authOverlay?.classList.remove('show');
      authOverlay?.setAttribute('aria-hidden', 'true');
      renderAccount(user);
      window.dispatchEvent(new CustomEvent('migrandia:auth-resume', {
        detail: { authenticated: true, uid: user.uid, preserved: true }
      }));
      return;
    }

    setAuthControlsBusy(false);
    closePrivatePanels();
    renderAccount(user);
    activeUid = user.uid;
    showAuthenticatedShell(user);
    metric('auth_shell_ready', observerStartedAt, { uid: user.uid });

    window.dispatchEvent(new CustomEvent('migrandia:auth', {
      detail: { authenticated: true, hydrating: true, uid: user.uid }
    }));

    if (switchStartedAt) {
      metric('user_switch_shell_ready', switchStartedAt, { uid: user.uid });
      switchStartedAt = 0;
    }

    if (pendingOpenMenu) {
      pendingOpenMenu = false;
      setTimeout(() => {
        if (window.WeddingPlannerAuthGuard?.authenticated === true) menuButton?.click();
      }, 0);
    }

    hydrateUser(user, epoch).then(() => {
      if (epoch !== authEpoch || auth.currentUser?.uid !== user.uid) return;
      finishHydration(user);
      window.dispatchEvent(new CustomEvent('migrandia:auth', {
        detail: { authenticated: true, hydrating: false, uid: user.uid }
      }));
    });
    return;
  }

  lockPlanner();
  setAuthControlsBusy(false);
  const hadAuthenticatedUser = Boolean(activeUid);
  activeUid = '';
  hydrated = false;
  clearAccount();
  if (cloudState) cloudState.textContent = 'Inicia sesión para sincronizar';
  setWeddingContext({ id: '', name: '', role: 'viewer', legacyMode: false });
  window.dispatchEvent(new CustomEvent('migrandia:auth', { detail: { authenticated: false } }));

  if (hadAuthenticatedUser || localStorage.getItem(LOCAL_OWNER_KEY)) {
    setTimeout(async () => {
      try {
        await window.WeddingPlannerBridge?.clearLocalUserData?.();
        localStorage.removeItem(LOCAL_OWNER_KEY);
      } catch (error) {
        console.warn('No se pudo limpiar el estado local al cerrar sesión:', error);
      }
    }, 0);
  }
});

if (!document.querySelector('link[data-weddings-style]')) {
  const weddingsStyle = document.createElement('link');
  weddingsStyle.rel = 'stylesheet';
  weddingsStyle.href = 'css/modules/weddings.css';
  weddingsStyle.dataset.weddingsStyle = 'true';
  document.head.appendChild(weddingsStyle);
}

import('../modules/configuracion/weddings.js?v=20260819-module-context1').catch((error) => {
  console.error('No se pudo cargar el módulo de bodas compartidas:', error);
});
