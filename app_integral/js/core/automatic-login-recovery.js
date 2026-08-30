import { getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { collection, doc, getDoc, getDocs, getFirestore } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION = '20260830-auto-recovery1';
const CORE_URL = '../services/firebase-core.js?v=20260819-empty-onboarding2';
const MIN_MEANINGFUL_BYTES = 8_000;
const STRONG_RATIO = 1.8;

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

let running = false;
let lastSignature = '';

function toast(message) {
  window.WeddingPlannerBridge?.showToast?.(message);
}

function metricBytes(meta = {}) {
  const bytes = Number(meta.bytes || 0);
  return Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
}

async function readMeta(ref) {
  try {
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() || {}) : null;
  } catch (_) {
    return null;
  }
}

async function readWeddingRsvp(weddingId) {
  try {
    const configSnap = await getDoc(doc(db, 'weddings', weddingId, 'rsvpConfig', 'main'));
    if (!configSnap.exists()) return { hasConfig: false, responses: 0 };
    const token = String(configSnap.data()?.token || '');
    if (!token) return { hasConfig: true, responses: 0 };
    try {
      const responses = await getDocs(collection(db, 'publicRsvp', token, 'responses'));
      return { hasConfig: true, responses: responses.size };
    } catch (_) {
      return { hasConfig: true, responses: 0 };
    }
  } catch (_) {
    return { hasConfig: false, responses: 0 };
  }
}

async function listWeddingCandidates(user) {
  const indexSnaps = await getDocs(collection(db, 'users', user.uid, 'weddings'));
  const rows = [];

  for (const indexSnap of indexSnaps.docs) {
    const weddingId = indexSnap.id;
    const index = indexSnap.data() || {};
    const memberSnap = await getDoc(doc(db, 'weddings', weddingId, 'members', user.uid)).catch(() => null);
    if (!memberSnap?.exists?.()) continue;
    const membership = memberSnap.data() || {};
    if (membership.status === 'removed') continue;

    const [meta, rsvp] = await Promise.all([
      readMeta(doc(db, 'weddings', weddingId, 'cloudSync', 'main')),
      readWeddingRsvp(weddingId)
    ]);

    rows.push({
      id: weddingId,
      name: String(membership.weddingName || index.name || 'Mi boda'),
      role: String(membership.role || index.role || ''),
      bytes: metricBytes(meta || {}),
      rsvpResponses: Number(rsvp.responses || 0),
      hasRsvpConfig: Boolean(rsvp.hasConfig)
    });
  }

  return rows;
}

function candidateScore(item) {
  return item.bytes + (item.rsvpResponses * 100_000) + (item.hasRsvpConfig ? 20_000 : 0);
}

function isClearlyBetter(best, current) {
  if (!best || !current || best.id === current.id) return false;
  if (best.rsvpResponses > current.rsvpResponses && best.bytes >= current.bytes) return true;
  if (best.bytes < MIN_MEANINGFUL_BYTES) return false;
  if (current.bytes === 0) return true;
  return best.bytes >= Math.ceil(current.bytes * STRONG_RATIO) && candidateScore(best) > candidateScore(current);
}

async function readBackup(metaRef, chunkFactory) {
  const metaSnap = await getDoc(metaRef);
  if (!metaSnap.exists()) return null;
  const count = Number(metaSnap.data()?.chunkCount || 0);
  if (!Number.isFinite(count) || count <= 0 || count > 500) return null;
  const parts = [];
  for (let start = 0; start < count; start += 20) {
    const batch = [];
    for (let index = start; index < Math.min(count, start + 20); index += 1) {
      batch.push(getDoc(chunkFactory(index)));
    }
    const snaps = await Promise.all(batch);
    snaps.forEach((snap) => parts.push(snap.exists() ? String(snap.data()?.data || '') : ''));
  }
  const raw = parts.join('');
  return raw ? JSON.parse(raw) : null;
}

async function tryLegacyFallback(user, current) {
  if (!['admin', 'owner'].includes(String(current?.role || ''))) return false;

  const legacyMeta = await readMeta(doc(db, 'users', user.uid, 'cloudSync', 'main'));
  const legacyBytes = metricBytes(legacyMeta || {});
  if (legacyBytes < MIN_MEANINGFUL_BYTES) return false;
  if (current.bytes > 0 && legacyBytes < Math.ceil(current.bytes * STRONG_RATIO)) return false;

  const bridge = window.WeddingPlannerBridge;
  if (!bridge?.restoreCloudBackup) return false;

  let localBytes = 0;
  try {
    if (bridge.buildCloudBackup) {
      const local = await bridge.buildCloudBackup();
      localBytes = JSON.stringify(local || {}).length;
    }
  } catch (_) {
    localBytes = 0;
  }

  if (localBytes >= Math.floor(legacyBytes * 0.75)) return false;

  const legacyBackup = await readBackup(
    doc(db, 'users', user.uid, 'cloudSync', 'main'),
    (index) => doc(db, 'users', user.uid, 'cloudChunks', String(index).padStart(5, '0'))
  );
  if (!legacyBackup) return false;

  toast('Recuperando la información guardada de tu boda…');
  await bridge.restoreCloudBackup(legacyBackup);
  window.dispatchEvent(new CustomEvent('migrandia:recovery-restored', {
    detail: { source: 'legacy', version: VERSION }
  }));
  toast('Tu información guardada volvió a cargarse.');
  return true;
}

async function recoverAfterLogin() {
  if (running || !auth.currentUser) return;
  const context = window.WeddingPlannerWeddingContext || {};
  if (!context.id || context.legacyMode) return;

  const signature = `${auth.currentUser.uid}:${context.id}`;
  if (lastSignature === signature) return;
  lastSignature = signature;
  running = true;

  try {
    const candidates = await listWeddingCandidates(auth.currentUser);
    const current = candidates.find((item) => item.id === context.id) || {
      id: context.id,
      name: context.name || 'Mi boda',
      role: context.role || '',
      bytes: 0,
      rsvpResponses: 0,
      hasRsvpConfig: false
    };
    const best = [...candidates].sort((a, b) => candidateScore(b) - candidateScore(a))[0] || current;

    if (isClearlyBetter(best, current)) {
      toast('Recuperando el espacio de boda que contiene tus datos…');
      const core = await import(CORE_URL);
      await core.switchWedding(best.id);
      toast('Tus datos guardados volvieron a cargarse.');
      return;
    }

    await tryLegacyFallback(auth.currentUser, current);
  } catch (error) {
    console.error('[Mi Gran Día] Recuperación automática no completada:', error);
  } finally {
    running = false;
  }
}

window.addEventListener('migrandia:auth', (event) => {
  const detail = event.detail || {};
  if (detail.authenticated !== true || detail.hydrating !== false) return;
  setTimeout(recoverAfterLogin, 0);
});

window.addEventListener('migrandia:wedding-context', () => {
  lastSignature = '';
});
