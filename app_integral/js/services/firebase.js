import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
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
let hydrated = false;
let authResolved = false;
let activeWeddingId = '';
let activeWeddingRole = '';
let activeWeddingName = '';
let legacyMode = false;
let authTransitioning = false;
let logoutInProgress = false;
let hydrationToken = 0;

const CHUNK_SIZE = 180000;
const LOCAL_OWNER_KEY = 'migrandia_local_owner_uid_v1';
const PERF_LIMIT = 30;

const perf = window.WeddingPlannerAuthPerf = window.WeddingPlannerAuthPerf || {
  version: '20260818-auth-performance-v1',
  baseline: {
    blockingLegacyBytes: 10457449,
    authFlow: 'Firebase auth + Firestore context + cloud restore were serialized before interactive unlock',
    menuBlockedDuringHydration: true
  },
  samples: []
};

function recordPerf(name, startedAt, detail = {}) {
  const duration = Math.max(0, performance.now() - startedAt);
  const sample = {
    name,
    durationMs: Math.round(duration * 10) / 10,
    at: new Date().toISOString(),
    ...detail
  };
  perf.samples.push(sample);
  if (perf.samples.length > PERF_LIMIT) perf.samples.splice(0, perf.samples.length - PERF_LIMIT);
  window.dispatchEvent(new CustomEvent('migrandia:perf', { detail: sample }));
  return sample;
}

window.WeddingPlannerAuthPerfReport = () => {
  const grouped = {};
  perf.samples.forEach((sample) => {
    (grouped[sample.name] ||= []).push(sample.durationMs);
  });
  const metrics = Object.fromEntries(
    Object.entries(grouped).map(([name, values]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
      const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
      return [name, {
        count: values.length,
        avgMs: Math.round(avg * 10) / 10,
        p95Ms: Math.round(p95 * 10) / 10,
        lastMs: values[values.length - 1]
      }];
    })
  );
  return { version: perf.version, baseline: perf.baseline, metrics };
};

function nextPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function yieldToMain() {
  return new Promise((resolve) => {
    if ('scheduler' in window && typeof window.scheduler?.postTask === 'function') {
      window.scheduler.postTask(resolve, { priority: 'user-visible' }).catch(() => setTimeout(resolve, 0));
      return;
    }
    setTimeout(resolve, 0);
  });
}

async function waitForBridge(timeoutMs = 8000) {
  if (window.WeddingPlannerBridge) return window.WeddingPlannerBridge;
  const startedAt = performance.now();
  while (performance.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 40));
    if (window.WeddingPlannerBridge) return window.WeddingPlannerBridge;
  }
  return null;
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

function openAuth() {
  if (logoutInProgress) return;
  pendingOpenMenu = true;
  closePrivatePanels();
  authOverlay?.classList.add('show');
  authOverlay?.setAttribute('aria-hidden', 'false');
  if (authStatus) authStatus.textContent = '';
  setAuthControlsBusy(false);
  setTimeout(() => googleLoginButton?.focus(), 40);
}

window.WeddingPlannerRequestAuth = () => {
  if (logoutInProgress) return;
  if (auth.currentUser) {
    pendingOpenMenu = true;
    closeAuth(true);
    if (window.WeddingPlannerAuthGuard?.authenticated) {
      requestAnimationFrame(() => menuButton?.click());
    }
    return;
  }
  openAuth();
};

function closeAuth(force = false) {
  authOverlay?.classList.remove('show');
  authOverlay?.setAttribute('aria-hidden', 'true');
  if (force && authStatus) authStatus.textContent = '';
}

function setGuard(user, { hydrating = false } = {}) {
  const guard = window.WeddingPlannerAuthGuard;
  if (guard) {
    guard.ready = true;
    guard.authenticated = Boolean(user);
    guard.uid = user?.uid || '';
    guard.hydrated = Boolean(user) && !hydrating;
  }

  if (user) {
    document.body.classList.add('auth-hydrating');
    document.body.classList.toggle('auth-locked', hydrating);
    menuButton && (menuButton.disabled = false);
    closeAuth(true);
  } else {
    document.body.classList.add('auth-locked');
    document.body.classList.remove('auth-hydrating');
    menuButton && (menuButton.disabled = false);
    closeAuth(true);
  }
}

function lockPlanner() {
  setGuard(null);
  closePrivatePanels();
  if (location.hash) {
    history.replaceState({ module: 'home' }, '', location.pathname + location.search);
  }
}

function unlockPlanner(user) {
  const guard = window.WeddingPlannerAuthGuard;
  if (guard) {
    guard.ready = true;
    guard.authenticated = true;
    guard.uid = user.uid;
    guard.hydrated = true;
  }
  document.body.classList.remove('auth-locked', 'auth-hydrating');
  menuButton && (menuButton.disabled = false);
  closeAuth(true);
  window.dispatchEvent(new Event('hashchange'));
}

function renderAccount(user) {
  accountCard?.classList.toggle('show', Boolean(user));
  if (!user) {
    if (accountName) accountName.textContent = '';
    if (accountEmail) accountEmail.textContent = '';
    accountAvatar?.removeAttribute('src');
    accountAvatar?.classList.remove('show');
    return;
  }
  if (accountName) accountName.textContent = user.displayName || 'Mi Gran Día';
  if (accountEmail) accountEmail.textContent = user.email || '';
  if (user.photoURL && accountAvatar) {
    accountAvatar.src = user.photoURL;
    accountAvatar.classList.add('show');
  } else {
    accountAvatar?.removeAttribute('src');
    accountAvatar?.classList.remove('show');
  }
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
  for (let i = 0; i < text.length; i += CHUNK_SIZE) chunks.push(text.slice(i, i + CHUNK_SIZE));
  return chunks.length ? chunks : [''];
}

async function readBackup(metaRef, chunkRefFactory) {
  const startedAt = performance.now();
  const metaSnap = await getDoc(metaRef);
  if (!metaSnap.exists()) {
    recordPerf('cloudBackupRead', startedAt, { chunks: 0 });
    return null;
  }
  const count = Number(metaSnap.data().chunkCount || 0);
  if (!count) {
    recordPerf('cloudBackupRead', startedAt, { chunks: 0 });
    return null;
  }
  const parts = await Promise.all(
    Array.from({ length: count }, (_, index) => getDoc(chunkRefFactory(index)))
  );
  const text = parts.map((snap) => (snap.exists() ? String(snap.data().data || '') : '')).join('');
  recordPerf('cloudBackupRead', startedAt, { chunks: count, bytes: text.length });
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
  const startedAt = performance.now();
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
      recordPerf('weddingContext', startedAt, { path: 'active' });
      return currentContext();
    }
  }

  const indexSnaps = await getDocs(collection(db, 'users', user.uid, 'weddings'));
  const candidates = await Promise.all(
    indexSnaps.docs.map(async (item) => ({
      item,
      membership: await getWeddingMembership(item.id, user.uid)
    }))
  );

  const valid = candidates.find(({ membership }) => Boolean(membership));
  const stale = candidates.filter(({ membership }) => !membership);
  if (stale.length) {
    Promise.allSettled(stale.map(({ item }) => deleteDoc(item.ref))).catch(() => {});
  }

  if (valid) {
    const data = valid.item.data() || {};
    setWeddingContext({
      id: valid.item.id,
      name: valid.membership.weddingName || data.name || 'Mi boda',
      role: valid.membership.role || data.role,
      legacyMode: false
    });
    setDoc(
      profileRef,
      { activeWeddingId: valid.item.id, lastSeenAt: serverTimestamp() },
      { merge: true }
    ).catch(() => {});
    recordPerf('weddingContext', startedAt, { path: 'fallback', candidates: candidates.length });
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
  recordPerf('weddingContext', startedAt, { path: 'created' });
  return currentContext();
}

async function writeCloudBackup(user, silent = false) {
  if (!user || cloudBusy || !hydrated) return;
  if (!legacyMode && (!activeWeddingId || !canEditPlannerRole())) return;
  const bridge = window.WeddingPlannerBridge;
  if (!bridge) return;

  const startedAt = performance.now();
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
    recordPerf('cloudBackupWrite', startedAt, { chunks: chunks.length, bytes: text.length });
  } catch (error) {
    console.error('Firebase sync error:', error);
    if (cloudState) cloudState.textContent = 'No se pudo sincronizar';
    if (!silent) bridge.showToast?.('No se pudo guardar en Firebase. Revisa las reglas de Firestore.');
  } finally {
    cloudBusy = false;
  }
}

function scheduleCloudSave(delay = 2500) {
  if (!auth.currentUser || !hydrated || !canEditPlannerRole()) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => writeCloudBackup(auth.currentUser, true), delay);
}

async function hydrateUser(user, { clearFirst = false } = {}) {
  const token = ++hydrationToken;
  const startedAt = performance.now();
  const bridge = await waitForBridge();
  if (token !== hydrationToken) return;
  if (!bridge) {
    hydrated = true;
    if (cloudState) cloudState.textContent = 'Sincronización pendiente';
    unlockPlanner(user);
    recordPerf('hydration', startedAt, { error: 'bridge-timeout' });
    return;
  }

  hydrated = false;
  if (cloudState) cloudState.textContent = 'Sincronizando tu boda…';

  try {
    await yieldToMain();

    if (clearFirst) {
      const clearStartedAt = performance.now();
      await bridge.clearLocalUserData?.();
      recordPerf('localClear', clearStartedAt, { reason: 'user-change' });
      if (token !== hydrationToken) return;
    }

    try {
      await ensureWeddingContext(user);
    } catch (workspaceError) {
      console.warn('Espacios compartidos aún no habilitados en Firestore; se conserva el modo anterior.', workspaceError);
      setWeddingContext({ id: '', name: 'Mi boda', role: 'owner', legacyMode: true });
    }
    if (token !== hydrationToken) return;

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
    if (token !== hydrationToken) return;

    await yieldToMain();

    if (cloudBackup) {
      const restoreStartedAt = performance.now();
      await bridge.restoreCloudBackup(cloudBackup);
      recordPerf('cloudRestore', restoreStartedAt);
    } else if (localOwner !== user.uid) {
      const clearStartedAt = performance.now();
      await bridge.clearLocalUserData?.();
      recordPerf('localClear', clearStartedAt, { reason: localOwner ? 'owner-mismatch' : 'empty-cloud' });
    }

    if (token !== hydrationToken) return;

    localStorage.setItem(LOCAL_OWNER_KEY, user.uid);
    hydrated = true;
    if (cloudState) {
      cloudState.textContent = cloudBackup
        ? (legacyMode ? 'Sincronizado' : 'Boda sincronizada')
        : 'Preparando primera copia…';
    }

    unlockPlanner(user);
    recordPerf('hydration', startedAt, {
      cloudBackup: Boolean(cloudBackup),
      migratedLegacy
    });

    if (!cloudBackup || migratedLegacy) {
      setTimeout(() => writeCloudBackup(user, true), 800);
    }
  } catch (error) {
    if (token !== hydrationToken) return;
    console.error('Firebase load error:', error);
    hydrated = true;
    if (cloudState) cloudState.textContent = 'Sincronización pendiente';
    unlockPlanner(user);
    bridge.showToast?.('Sesión iniciada, pero la sincronización quedó pendiente.');
    recordPerf('hydration', startedAt, { error: String(error?.message || error) });
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
  const entries = await Promise.all(
    snaps.docs.map(async (snap) => {
      const data = snap.data() || {};
      const membership = await getWeddingMembership(snap.id, user.uid);
      return { snap, data, membership };
    })
  );

  const items = [];
  const cleanup = [];
  const repairs = [];
  for (const { snap, data, membership } of entries) {
    if (!membership) {
      cleanup.push(deleteDoc(snap.ref));
      continue;
    }
    const role = normalizeRole(membership.role || data.role);
    const name = membership.weddingName || data.name || 'Mi boda';
    if (role !== data.role || name !== data.name) {
      repairs.push(setDoc(snap.ref, { role, name }, { merge: true }));
    }
    items.push({ id: snap.id, ...data, name, role });
  }
  Promise.allSettled([...cleanup, ...repairs]).catch(() => {});

  const roleRank = { owner: 0, admin: 1, editor: 2, provider: 3, viewer: 4 };
  return items.sort((a, b) => {
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

  const startedAt = performance.now();
  const targetId = String(weddingId || '');
  if (!targetId) throw new Error('Boda no válida.');
  if (activeWeddingId === targetId && hydrated) return currentContext();

  const savePromise = activeWeddingId && hydrated && canEditPlannerRole()
    ? writeCloudBackup(user, true).catch(() => {})
    : Promise.resolve();

  const [indexSnap, membership] = await Promise.all([
    getDoc(doc(db, 'users', user.uid, 'weddings', targetId)),
    getWeddingMembership(targetId, user.uid)
  ]);

  if (!indexSnap.exists() || !membership) {
    if (indexSnap.exists()) deleteDoc(indexSnap.ref).catch(() => {});
    throw new Error('Ya no tienes acceso a esta boda.');
  }

  await savePromise;
  hydrated = false;
  setGuard(user, { hydrating: true });
  if (cloudState) cloudState.textContent = 'Cambiando de boda…';
  await nextPaint();

  const bridge = await waitForBridge();
  await bridge?.clearLocalUserData?.();

  const data = indexSnap.data() || {};
  setWeddingContext({
    id: targetId,
    name: membership.weddingName || data.name || 'Mi boda',
    role: membership.role || data.role,
    legacyMode: false
  });

  setDoc(
    doc(db, 'users', user.uid),
    { activeWeddingId: targetId, lastSeenAt: serverTimestamp() },
    { merge: true }
  ).catch(() => {});

  await hydrateUser(user);
  recordPerf('switchWedding', startedAt, { weddingId: targetId });
  return currentContext();
}

export async function inviteWeddingMember(email, role = 'editor') {
  const user = auth.currentUser;
  if (!user || !activeWeddingId || legacyMode) {
    throw new Error('La función de compartir todavía no está disponible en Firestore.');
  }
  if (!canManageTeamRole()) {
    throw new Error('Solo el propietario o un administrador puede invitar personas.');
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('Escribe un correo válido.');
  if (normalizedEmail === String(user.email || '').toLowerCase()) {
    throw new Error('Ya eres propietario de esta boda.');
  }

  const cleanRole = normalizeCollaboratorRole(role);
  if (activeWeddingRole === 'admin' && cleanRole === 'admin') {
    throw new Error('Solo el propietario puede asignar el rol Administrador.');
  }
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
  return snaps.docs
    .map((snap) => ({ id: snap.id, ...snap.data() }))
    .filter((item) => item.status === 'pending')
    .sort((a, b) => String(a.email || '').localeCompare(String(b.email || ''), 'es'));
}

export async function cancelWeddingInvitation(inviteId) {
  if (!auth.currentUser || !activeWeddingId || legacyMode || !canManageTeamRole()) {
    throw new Error('Solo el propietario o un administrador puede cancelar invitaciones.');
  }
  const ref = doc(db, 'invitations', String(inviteId || ''));
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  if (String(snap.data()?.weddingId || '') !== activeWeddingId) {
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
  return snaps.docs
    .map((snap) => ({ uid: snap.id, ...snap.data() }))
    .filter((member) => member.status !== 'removed')
    .sort((a, b) => {
      if (a.role === 'owner') return -1;
      if (b.role === 'owner') return 1;
      return String(a.displayName || a.email || '').localeCompare(String(b.displayName || b.email || ''), 'es');
    });
}

export async function updateWeddingMemberRole(uid, role) {
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

  await setDoc(memberRef, { role: cleanRole, updatedAt: serverTimestamp() }, { merge: true });
  return cleanRole;
}

export async function removeWeddingMember(uid) {
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

  await setDoc(memberRef, {
    status: 'removed',
    removedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

let googleAttemptToken = 0;

function reactivateGoogleButton(message = '') {
  setAuthControlsBusy(false);
  googleLoginButton?.removeAttribute('aria-busy');
  if (message !== undefined && authStatus) authStatus.textContent = message;
}

googleLoginButton?.addEventListener('click', async () => {
  if (authTransitioning || logoutInProgress) return;
  const startedAt = performance.now();
  const token = ++googleAttemptToken;
  setAuthControlsBusy(true);
  googleLoginButton.setAttribute('aria-busy', 'true');
  if (authStatus) authStatus.textContent = 'Elige la cuenta de Google que deseas usar…';

  const attemptProvider = new GoogleAuthProvider();
  attemptProvider.setCustomParameters({ prompt: 'select_account' });

  try {
    await persistenceReady;
    const result = await signInWithPopup(auth, attemptProvider);
    if (token !== googleAttemptToken) return;
    if (result?.user) {
      if (authStatus) authStatus.textContent = 'Acceso correcto. Abriendo tu espacio…';
      closeAuth(true);
      recordPerf('googlePopup', startedAt, { success: true });
    }
  } catch (error) {
    if (token !== googleAttemptToken) return;
    console.error('Google sign-in error:', error);
    const code = String(error?.code || '');
    if (authStatus) {
      authStatus.textContent = (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/user-cancelled'
      )
        ? 'Ventana de Google cerrada. Puedes pulsar “Continuar con Google” otra vez.'
        : friendlyAuthError(error);
    }
    recordPerf('googlePopup', startedAt, { success: false, code });
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
  logoutInProgress = true;
  pendingOpenMenu = false;
  googleAttemptToken++;
  if (button) button.disabled = true;

  authResolved = true;
  lockPlanner();
  renderAccount(null);
  if (cloudState) cloudState.textContent = 'Cerrando sesión…';

  try {
    const savePromise = writeCloudBackup(currentUser, true).catch((error) => {
      console.error('Final cloud save before logout failed:', error);
    });

    await nextPaint();
    await savePromise;

    hydrated = false;
    hydrationToken++;
    const bridge = await waitForBridge(3000);
    await bridge?.clearLocalUserData?.();
    localStorage.removeItem(LOCAL_OWNER_KEY);
    await signOut(auth);
    history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo(0, 0);
    recordPerf('logout', startedAt, { success: true });
  } catch (error) {
    console.error('Logout failed:', error);
    if (auth.currentUser) {
      unlockPlanner(auth.currentUser);
      window.WeddingPlannerBridge?.showToast?.('No se pudo cerrar la sesión. Inténtalo nuevamente.');
    }
    recordPerf('logout', startedAt, { success: false });
  } finally {
    logoutInProgress = false;
    if (button) button.disabled = false;
  }
}

logoutButton?.addEventListener('click', () => performLogout(logoutButton));
moduleSessionLogout?.addEventListener('click', () => performLogout(moduleSessionLogout));

window.addEventListener('storage', (event) => {
  if (event.key && (event.key.startsWith('planificador_bodas_') || event.key.startsWith('eventPlanner'))) {
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
  const authStartedAt = performance.now();
  authResolved = true;

  if (user) {
    closeAuth(true);
    setAuthControlsBusy(false);
    closePrivatePanels();
    renderAccount(user);

    const changedUser = Boolean(activeUid && activeUid !== user.uid);
    activeUid = user.uid;

    // La identidad ya es válida: desbloqueamos el shell de inmediato y dejamos
    // únicamente los enlaces de datos en estado de hidratación.
    setGuard(user, { hydrating: true });
    if (cloudState) cloudState.textContent = 'Sincronizando tu boda…';

    window.dispatchEvent(new CustomEvent('migrandia:auth', {
      detail: { authenticated: true, uid: user.uid, hydrating: true }
    }));

    if (pendingOpenMenu) {
      pendingOpenMenu = false;
      requestAnimationFrame(() => menuButton?.click());
    }

    await nextPaint();
    recordPerf('authToInteractive', authStartedAt, { changedUser });

    hydrateUser(user, { clearFirst: changedUser }).then(() => {
      window.dispatchEvent(new CustomEvent('migrandia:auth', {
        detail: { authenticated: true, uid: user.uid, hydrating: false }
      }));
    });
    return;
  }

  hydrationToken++;
  lockPlanner();
  setAuthControlsBusy(false);
  const hadAuthenticatedUser = Boolean(activeUid);
  activeUid = '';
  hydrated = false;
  renderAccount(null);

  if (hadAuthenticatedUser) {
    const bridge = await waitForBridge(3000);
    await bridge?.clearLocalUserData?.();
    localStorage.removeItem(LOCAL_OWNER_KEY);
  }

  if (cloudState) cloudState.textContent = 'Inicia sesión para sincronizar';
  pendingOpenMenu = false;
  setWeddingContext({ id: '', name: '', role: 'viewer', legacyMode: false });
  window.dispatchEvent(new CustomEvent('migrandia:auth', {
    detail: { authenticated: false }
  }));
});

if (!document.querySelector('link[data-weddings-style]')) {
  const weddingsStyle = document.createElement('link');
  weddingsStyle.rel = 'stylesheet';
  weddingsStyle.href = 'css/modules/weddings.css';
  weddingsStyle.dataset.weddingsStyle = 'true';
  document.head.appendChild(weddingsStyle);
}

import('../modules/configuracion/weddings.js?v=20260818-auth-performance-v1').catch((error) => {
  console.error('No se pudo cargar el módulo de bodas compartidas:', error);
});
