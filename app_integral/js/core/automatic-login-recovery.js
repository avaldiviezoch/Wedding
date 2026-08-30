import { getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { collection, doc, getDoc, getDocs, getFirestore } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION = '20260830-auto-recovery2';
const CORE_URL = '../services/firebase-core.js?v=20260819-empty-onboarding2';
const MIN_MEANINGFUL_BYTES = 8_000;
const STRONG_RATIO = 1.8;
const GUEST_STORAGE_KEY = 'planificador_bodas_invitados_v1';
const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';

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

function parseStoragePayload(value) {
  let current = value;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (typeof current !== 'string') break;
    const trimmed = current.trim();
    if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) return current;
    try {
      current = JSON.parse(trimmed);
    } catch (_) {
      return value;
    }
  }
  return current;
}

function findStoredValue(root, wantedKey) {
  const visited = new WeakSet();
  let nodes = 0;

  function walk(value, depth = 0) {
    if (depth > 12 || nodes > 20_000 || value == null) return undefined;
    nodes += 1;

    const parsed = parseStoragePayload(value);
    if (parsed !== value) return walk(parsed, depth + 1);
    if (!parsed || typeof parsed !== 'object') return undefined;
    if (visited.has(parsed)) return undefined;
    visited.add(parsed);

    if (!Array.isArray(parsed) && Object.prototype.hasOwnProperty.call(parsed, wantedKey)) {
      return parseStoragePayload(parsed[wantedKey]);
    }

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (Array.isArray(item) && item[0] === wantedKey) return parseStoragePayload(item[1]);
        if (item && typeof item === 'object' && item.key === wantedKey && 'value' in item) {
          return parseStoragePayload(item.value);
        }
        const found = walk(item, depth + 1);
        if (found !== undefined) return found;
      }
      return undefined;
    }

    for (const child of Object.values(parsed)) {
      const found = walk(child, depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  return walk(root);
}

function normalizeGuestState(value) {
  const parsed = parseStoragePayload(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const guests = Array.isArray(parsed.guests) ? parsed.guests : [];
  const tables = Array.isArray(parsed.tables) ? parsed.tables : [];
  if (!guests.length) return null;
  return { ...parsed, guests, tables };
}

function currentGuestCount() {
  try {
    const current = normalizeGuestState(localStorage.getItem(GUEST_STORAGE_KEY));
    return current?.guests?.length || 0;
  } catch (_) {
    return 0;
  }
}

function buildSharedGuestState(data) {
  const guests = Array.isArray(data?.guests) ? data.guests : [];
  const tables = Array.isArray(data?.tables) ? data.tables : [];
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    source: 'automatic-recovery',
    guests: guests.map((guest) => ({ ...guest })),
    tables: tables.map((table) => ({ ...table }))
  };
}

async function recoverGuestsFromBackups(user, candidates) {
  if (currentGuestCount() > 0) return false;

  const sources = [];
  for (const candidate of candidates) {
    try {
      const backup = await readBackup(
        doc(db, 'weddings', candidate.id, 'cloudSync', 'main'),
        (index) => doc(db, 'weddings', candidate.id, 'cloudChunks', String(index).padStart(5, '0'))
      );
      if (backup) sources.push({ label: candidate.name, backup });
    } catch (_) {
      // Continue searching the remaining backups.
    }
  }

  try {
    const legacyBackup = await readBackup(
      doc(db, 'users', user.uid, 'cloudSync', 'main'),
      (index) => doc(db, 'users', user.uid, 'cloudChunks', String(index).padStart(5, '0'))
    );
    if (legacyBackup) sources.push({ label: 'respaldo anterior', backup: legacyBackup });
  } catch (_) {
    // A missing legacy copy must not block the normal application.
  }

  const matches = [];
  for (const source of sources) {
    const guestState = normalizeGuestState(findStoredValue(source.backup, GUEST_STORAGE_KEY));
    if (!guestState) continue;
    const sharedState = parseStoragePayload(findStoredValue(source.backup, SHARED_STORAGE_KEY));
    matches.push({
      ...source,
      guestState,
      sharedState: sharedState && typeof sharedState === 'object' ? sharedState : null,
      guestCount: guestState.guests.length
    });
  }

  matches.sort((a, b) => b.guestCount - a.guestCount);
  const best = matches[0];
  if (!best || !best.guestCount || currentGuestCount() > 0) return false;

  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(best.guestState));
  localStorage.setItem(
    SHARED_STORAGE_KEY,
    JSON.stringify(best.sharedState || buildSharedGuestState(best.guestState))
  );

  window.dispatchEvent(new CustomEvent('migrandia:datachange', {
    detail: { source: 'automatic-guest-recovery', guests: best.guestCount }
  }));
  window.dispatchEvent(new CustomEvent('migrandia:guests-recovered', {
    detail: { guests: best.guestCount, source: best.label, version: VERSION }
  }));

  toast(`Se recuperaron ${best.guestCount} invitados guardados.`);
  return true;
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
    await recoverGuestsFromBackups(auth.currentUser, candidates);
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
