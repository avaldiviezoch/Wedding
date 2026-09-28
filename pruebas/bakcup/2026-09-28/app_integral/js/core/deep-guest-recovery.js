import { getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { collection, doc, getDoc, getDocs, getFirestore } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION = '20260830-deep-guest-recovery1';
const GUEST_KEY = 'planificador_bodas_invitados_v1';
const SHARED_KEY = 'planificador_bodas_datos_compartidos_v1';
const DB_NAME = 'AntonioEventPlannerMemory';
const PROPOSAL_STORE = 'proposals';

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

function parseMaybe(value) {
  let current = value;
  for (let i = 0; i < 4 && typeof current === 'string'; i += 1) {
    const text = current.trim();
    if (!text || (!text.startsWith('{') && !text.startsWith('['))) break;
    try { current = JSON.parse(text); } catch (_) { break; }
  }
  return current;
}

function currentGuestCount() {
  try {
    const state = parseMaybe(localStorage.getItem(GUEST_KEY));
    return Array.isArray(state?.guests) ? state.guests.length : 0;
  } catch (_) {
    return 0;
  }
}

async function readBackup(metaRef, chunkFactory) {
  const metaSnap = await getDoc(metaRef);
  if (!metaSnap.exists()) return null;
  const count = Number(metaSnap.data()?.chunkCount || 0);
  if (!Number.isFinite(count) || count <= 0 || count > 500) return null;
  const parts = [];
  for (let start = 0; start < count; start += 20) {
    const pending = [];
    for (let i = start; i < Math.min(start + 20, count); i += 1) pending.push(getDoc(chunkFactory(i)));
    const snaps = await Promise.all(pending);
    snaps.forEach((snap) => parts.push(snap.exists() ? String(snap.data()?.data || '') : ''));
  }
  const raw = parts.join('');
  return raw ? JSON.parse(raw) : null;
}

function findExactKey(root, wantedKey) {
  const seen = new WeakSet();
  let visited = 0;
  function walk(value, depth = 0) {
    if (depth > 14 || visited > 30000 || value == null) return undefined;
    visited += 1;
    const parsed = parseMaybe(value);
    if (parsed !== value) return walk(parsed, depth + 1);
    if (!parsed || typeof parsed !== 'object') return undefined;
    if (seen.has(parsed)) return undefined;
    seen.add(parsed);
    if (!Array.isArray(parsed) && Object.prototype.hasOwnProperty.call(parsed, wantedKey)) {
      return parseMaybe(parsed[wantedKey]);
    }
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (Array.isArray(item) && item[0] === wantedKey) return parseMaybe(item[1]);
        if (item && typeof item === 'object' && item.key === wantedKey && 'value' in item) return parseMaybe(item.value);
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

function canonicalGuest(raw, index, source) {
  const name = String(raw?.name || raw?.nombre || '').trim();
  if (!name) return null;
  const originalId = raw?.sourceGuestId ?? raw?.id;
  const id = typeof originalId === 'string' && originalId.trim()
    ? originalId.trim()
    : `guest_recovered_${source}_${String(originalId ?? index)}`;
  const rawStatus = String(raw?.status || raw?.rsvpStatus || 'pending').toLowerCase();
  const status = ['confirmed', 'declined', 'pending'].includes(rawStatus) ? rawStatus : 'pending';
  return {
    ...raw,
    id,
    name,
    status,
    invitationSent: Boolean(raw?.invitationSent),
    side: ['novio', 'novia', 'ambos'].includes(String(raw?.side || '').toLowerCase()) ? String(raw.side).toLowerCase() : 'ambos',
    relation: String(raw?.relation || ''),
    restriction: String(raw?.restriction || 'Ninguna'),
    tableId: String(raw?.tableId || ''),
    seatId: String(raw?.seatId || ''),
    seatNumber: Number.isFinite(Number(raw?.seatNumber)) ? Number(raw.seatNumber) : null,
    photoId: String(raw?.photoId || ''),
    photoThumb: String(raw?.photoThumb || ''),
    notes: String(raw?.notes || ''),
    rsvpResponseId: String(raw?.rsvpResponseId || ''),
    rsvpResponseName: String(raw?.rsvpResponseName || ''),
    rsvpGroup: String(raw?.rsvpGroup || ''),
    rsvpFamilyLabel: String(raw?.rsvpFamilyLabel || ''),
    rsvpTags: Array.isArray(raw?.rsvpTags) ? raw.rsvpTags : []
  };
}

function candidateFromState(value, label, quality = 5) {
  const parsed = parseMaybe(value);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.guests) || !parsed.guests.length) return null;
  const guests = parsed.guests.map((guest, index) => canonicalGuest(guest, index, label)).filter(Boolean);
  if (!guests.length) return null;
  const tables = Array.isArray(parsed.tables) ? parsed.tables.map((table) => ({ ...table })) : [];
  return { label, quality, guests, tables, raw: parsed };
}

function scanAnyGuestObjects(root, label) {
  const found = [];
  const seen = new WeakSet();
  let visited = 0;
  function walk(value, path = label, depth = 0) {
    if (depth > 14 || visited > 30000 || value == null) return;
    visited += 1;
    const parsed = parseMaybe(value);
    if (parsed !== value) return walk(parsed, `${path}:json`, depth + 1);
    if (!parsed || typeof parsed !== 'object') return;
    if (seen.has(parsed)) return;
    seen.add(parsed);
    const candidate = candidateFromState(parsed, path, 2);
    if (candidate) found.push(candidate);
    if (Array.isArray(parsed)) parsed.forEach((item, index) => walk(item, `${path}[${index}]`, depth + 1));
    else Object.entries(parsed).forEach(([key, child]) => walk(child, `${path}.${key}`, depth + 1));
  }
  walk(root);
  return found;
}

async function cloudCandidates(user) {
  const candidates = [];
  const index = await getDocs(collection(db, 'users', user.uid, 'weddings')).catch(() => null);
  for (const item of index?.docs || []) {
    try {
      const backup = await readBackup(
        doc(db, 'weddings', item.id, 'cloudSync', 'main'),
        (i) => doc(db, 'weddings', item.id, 'cloudChunks', String(i).padStart(5, '0'))
      );
      if (!backup) continue;
      const exact = candidateFromState(findExactKey(backup, GUEST_KEY), `firebase:${item.id}:guest`, 6);
      if (exact) candidates.push(exact);
      const shared = candidateFromState(findExactKey(backup, SHARED_KEY), `firebase:${item.id}:shared`, 5);
      if (shared) candidates.push(shared);
      candidates.push(...scanAnyGuestObjects(backup, `firebase:${item.id}`));
    } catch (_) {}
  }
  try {
    const legacy = await readBackup(
      doc(db, 'users', user.uid, 'cloudSync', 'main'),
      (i) => doc(db, 'users', user.uid, 'cloudChunks', String(i).padStart(5, '0'))
    );
    if (legacy) {
      const exact = candidateFromState(findExactKey(legacy, GUEST_KEY), 'firebase:legacy:guest', 6);
      if (exact) candidates.push(exact);
      const shared = candidateFromState(findExactKey(legacy, SHARED_KEY), 'firebase:legacy:shared', 5);
      if (shared) candidates.push(shared);
      candidates.push(...scanAnyGuestObjects(legacy, 'firebase:legacy'));
    }
  } catch (_) {}
  return candidates;
}

function openPlannerDb() {
  return new Promise((resolve) => {
    if (!window.indexedDB) return resolve(null);
    const request = indexedDB.open(DB_NAME);
    let upgraded = false;
    request.onupgradeneeded = () => { upgraded = true; try { request.transaction.abort(); } catch (_) {} };
    request.onsuccess = () => {
      if (upgraded) { request.result.close(); resolve(null); return; }
      resolve(request.result);
    };
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

async function indexedDbCandidates() {
  const dbi = await openPlannerDb();
  if (!dbi || !dbi.objectStoreNames.contains(PROPOSAL_STORE)) return [];
  try {
    const records = await new Promise((resolve) => {
      const tx = dbi.transaction(PROPOSAL_STORE, 'readonly');
      const request = tx.objectStore(PROPOSAL_STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
    const out = [];
    records.forEach((record, index) => {
      const source = record?.data || record?.snapshot || record;
      const candidate = candidateFromState(source, `indexeddb:${record?.name || record?.id || index}`, 4);
      if (candidate) out.push(candidate);
      out.push(...scanAnyGuestObjects(source, `indexeddb:${record?.name || record?.id || index}`));
    });
    return out;
  } finally {
    dbi.close();
  }
}

function localPlannerCandidates() {
  const out = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || '';
    if (!key.startsWith('eventPlanner') && key !== SHARED_KEY) continue;
    const value = parseMaybe(localStorage.getItem(key));
    const candidate = candidateFromState(value, `local:${key}`, 4);
    if (candidate) out.push(candidate);
    out.push(...scanAnyGuestObjects(value, `local:${key}`));
  }
  return out;
}

function chooseBest(candidates) {
  const valid = candidates.filter((item) => item?.guests?.length);
  valid.sort((a, b) => {
    if (b.guests.length !== a.guests.length) return b.guests.length - a.guests.length;
    return b.quality - a.quality;
  });
  return valid[0] || null;
}

function restoreCandidate(candidate) {
  if (!candidate || currentGuestCount() > 0) return false;
  const state = { version: 2, updatedAt: new Date().toISOString(), source: `deep-recovery:${candidate.label}`, guests: candidate.guests, tables: candidate.tables || [] };
  localStorage.setItem(GUEST_KEY, JSON.stringify(state));
  localStorage.setItem(SHARED_KEY, JSON.stringify(state));
  document.getElementById('unifiedWorkspace')?.querySelectorAll('iframe').forEach((frame) => {
    try { frame.contentWindow?.postMessage({ type: 'MIGRANDIA_RSVP_SYNC', payload: { guests: state.guests, tables: state.tables } }, '*'); } catch (_) {}
  });
  window.dispatchEvent(new CustomEvent('migrandia:datachange', { detail: { source: 'deep-guest-recovery', guests: state.guests.length } }));
  window.dispatchEvent(new CustomEvent('migrandia:guests-recovered', { detail: { source: candidate.label, guests: state.guests.length, version: VERSION } }));
  window.WeddingPlannerBridge?.showToast?.(`Se recuperaron ${state.guests.length} invitados guardados.`);
  return true;
}

async function runDeepRecovery() {
  if (running || currentGuestCount() > 0 || !auth.currentUser) return;
  running = true;
  try {
    const [cloud, indexed] = await Promise.all([
      cloudCandidates(auth.currentUser),
      indexedDbCandidates()
    ]);
    const local = localPlannerCandidates();
    const best = chooseBest([...cloud, ...indexed, ...local]);
    restoreCandidate(best);
  } catch (error) {
    console.error('[Mi Gran Día] Recuperación profunda de Invitados no completada:', error);
  } finally {
    running = false;
  }
}

window.addEventListener('migrandia:auth', (event) => {
  const detail = event.detail || {};
  if (detail.authenticated !== true || detail.hydrating !== false) return;
  setTimeout(runDeepRecovery, 1200);
});

window.addEventListener('migrandia:recovery-restored', () => setTimeout(runDeepRecovery, 500));
window.addEventListener('migrandia:wedding-context', () => setTimeout(runDeepRecovery, 1200));
