import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { doc, getDoc, getFirestore, serverTimestamp, writeBatch } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION = '20260830-controlled-guests1';
const CHUNK_SIZE = 180000;
const GUEST_KEY = 'planificador_bodas_invitados_v1';
const SHARED_KEY = 'planificador_bodas_datos_compartidos_v1';
const SAFETY_KEY = 'migrandia_recovery_pre_guest_restore_v1';

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

const statusEl = document.getElementById('restoreStatus');
const detailEl = document.getElementById('restoreDetail');
const spinnerEl = document.getElementById('restoreSpinner');
const summaryEl = document.getElementById('restoreSummary');
const cardEl = document.getElementById('restoreCard');
const targetEl = document.getElementById('restoreTarget');
const metaEl = document.getElementById('restoreMeta');
const explanationEl = document.getElementById('restoreExplanation');
const restoreButton = document.getElementById('restoreGuestsButton');

let prepared = null;
let restoring = false;

function parseJson(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (_) {
    return null;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function guestCount(state) {
  return Array.isArray(state?.guests) ? state.guests.length : 0;
}

function splitText(text) {
  const chunks = [];
  for (let index = 0; index < text.length; index += CHUNK_SIZE) {
    chunks.push(text.slice(index, index + CHUNK_SIZE));
  }
  return chunks.length ? chunks : [''];
}

async function readBackup(metaRef, chunkFactory) {
  const metaSnap = await getDoc(metaRef);
  if (!metaSnap.exists()) return null;
  const meta = metaSnap.data() || {};
  const count = Number(meta.chunkCount || 0);
  if (!Number.isFinite(count) || count <= 0 || count > 500) return null;

  const snaps = await Promise.all(
    Array.from({ length: count }, (_, index) => getDoc(chunkFactory(index)))
  );
  const raw = snaps.map((snap) => (snap.exists() ? String(snap.data()?.data || '') : '')).join('');
  if (!raw) return null;

  return {
    data: JSON.parse(raw),
    meta: {
      bytes: Number(meta.bytes || raw.length || 0),
      chunkCount: count,
      version: Number(meta.version || 2)
    }
  };
}

function extractGuestSource(backup) {
  const storage = backup?.localStorage;
  if (!storage || typeof storage !== 'object' || Array.isArray(storage)) return null;

  const canonical = parseJson(storage[GUEST_KEY]);
  const shared = parseJson(storage[SHARED_KEY]);
  const canonicalCount = guestCount(canonical);
  const sharedCount = guestCount(shared);

  if (!canonicalCount && !sharedCount) return null;
  const source = sharedCount >= canonicalCount ? shared : canonical;
  return {
    guests: clone(source.guests),
    count: guestCount(source),
    canonical,
    shared
  };
}

function activeGuestState(backup) {
  const storage = backup?.localStorage || {};
  return {
    canonical: parseJson(storage[GUEST_KEY]) || {},
    shared: parseJson(storage[SHARED_KEY]) || {}
  };
}

function formatKb(value) {
  return `${(Number(value || 0) / 1024).toFixed(1)} KB`;
}

async function prepare(user) {
  prepared = null;
  restoreButton.disabled = true;
  cardEl.hidden = true;
  summaryEl.hidden = true;
  spinnerEl.classList.remove('is-done');
  statusEl.textContent = 'Verificando boda activa y respaldo histórico…';
  detailEl.textContent = 'Lectura solamente. Todavía no se escribe ningún dato.';

  const profileSnap = await getDoc(doc(db, 'users', user.uid));
  if (!profileSnap.exists()) throw new Error('No se encontró el perfil de la cuenta.');
  const activeWeddingId = String(profileSnap.data()?.activeWeddingId || '');
  if (!activeWeddingId) throw new Error('La cuenta no tiene una boda activa identificada.');

  const [indexSnap, memberSnap, activeBackup, legacyBackup] = await Promise.all([
    getDoc(doc(db, 'users', user.uid, 'weddings', activeWeddingId)),
    getDoc(doc(db, 'weddings', activeWeddingId, 'members', user.uid)),
    readBackup(
      doc(db, 'weddings', activeWeddingId, 'cloudSync', 'main'),
      (index) => doc(db, 'weddings', activeWeddingId, 'cloudChunks', String(index).padStart(5, '0'))
    ),
    readBackup(
      doc(db, 'users', user.uid, 'cloudSync', 'main'),
      (index) => doc(db, 'users', user.uid, 'cloudChunks', String(index).padStart(5, '0'))
    )
  ]);

  if (!memberSnap.exists()) throw new Error('No tienes membresía válida en la boda activa.');
  const membership = memberSnap.data() || {};
  const role = String(membership.role || indexSnap.data()?.role || '');
  if (!['owner', 'admin', 'editor'].includes(role)) {
    throw new Error(`El rol ${role || 'desconocido'} no permite restaurar datos del planificador.`);
  }
  if (!activeBackup?.data) throw new Error('No existe una copia cloud legible de la boda activa.');
  if (!legacyBackup?.data) throw new Error('No existe un respaldo histórico legible de la cuenta.');

  const historical = extractGuestSource(legacyBackup.data);
  if (!historical?.count) throw new Error('El respaldo histórico no contiene invitados recuperables.');

  const activeStates = activeGuestState(activeBackup.data);
  const activeCanonicalCount = guestCount(activeStates.canonical);
  const activeSharedCount = guestCount(activeStates.shared);
  const currentGuestCount = Math.max(activeCanonicalCount, activeSharedCount);
  if (currentGuestCount > 0) {
    throw new Error(`La boda activa ya contiene ${currentGuestCount} invitados. Se detiene para no sobrescribirlos.`);
  }

  const activeCanonicalTables = Array.isArray(activeStates.canonical.tables) ? clone(activeStates.canonical.tables) : [];
  const activeSharedTables = Array.isArray(activeStates.shared.tables) ? clone(activeStates.shared.tables) : [];
  const weddingName = String(membership.weddingName || indexSnap.data()?.name || 'Boda activa');

  prepared = {
    user,
    activeWeddingId,
    weddingName,
    role,
    activeBackup,
    historical,
    activeStates,
    activeCanonicalTables,
    activeSharedTables
  };

  summaryEl.innerHTML = `
    <div class="recovery-summary-grid">
      <div class="recovery-kpi"><span>Invitados recuperables</span><strong>${historical.count}</strong></div>
      <div class="recovery-kpi"><span>Backup activo preservado</span><strong>${formatKb(activeBackup.meta.bytes)}</strong></div>
      <div class="recovery-kpi"><span>Mesas actuales preservadas</span><strong>${Math.max(activeCanonicalTables.length, activeSharedTables.length)}</strong></div>
    </div>
  `;
  summaryEl.hidden = false;
  cardEl.hidden = false;
  targetEl.textContent = weddingName;
  metaEl.textContent = `Rol: ${role} · backup activo ${formatKb(activeBackup.meta.bytes)} · operación manual`;
  explanationEl.textContent = `Se copiarán únicamente ${historical.count} invitados desde el respaldo histórico. Checklist, Presupuesto, Proveedores, Música, Distribución existente y RSVP no se reemplazarán.`;
  restoreButton.textContent = `Restaurar ${historical.count} invitados`;
  restoreButton.disabled = false;
  spinnerEl.classList.add('is-done');
  statusEl.textContent = 'Listo para una restauración controlada.';
  detailEl.textContent = 'Nada se ha escrito todavía. Pulsa el botón una sola vez para ejecutar la recuperación.';
}

async function writeActiveBackup(preparedState) {
  const {
    activeWeddingId,
    activeBackup,
    historical,
    activeStates,
    activeCanonicalTables,
    activeSharedTables
  } = preparedState;

  const mergedBackup = clone(activeBackup.data);
  if (!mergedBackup.localStorage || typeof mergedBackup.localStorage !== 'object' || Array.isArray(mergedBackup.localStorage)) {
    throw new Error('El backup activo no tiene la estructura localStorage esperada.');
  }

  const now = new Date().toISOString();
  const canonical = {
    ...clone(activeStates.canonical || {}),
    guests: clone(historical.guests),
    tables: activeCanonicalTables,
    updatedAt: now
  };
  const shared = {
    ...clone(activeStates.shared || {}),
    guests: clone(historical.guests),
    tables: activeSharedTables,
    updatedAt: now,
    source: 'controlled-recovery'
  };

  const canonicalText = JSON.stringify(canonical);
  const sharedText = JSON.stringify(shared);
  mergedBackup.localStorage[GUEST_KEY] = canonicalText;
  mergedBackup.localStorage[SHARED_KEY] = sharedText;

  localStorage.setItem(SAFETY_KEY, JSON.stringify({
    version: VERSION,
    savedAt: now,
    weddingId: activeWeddingId,
    backup: activeBackup.data
  }));

  const text = JSON.stringify(mergedBackup);
  const chunks = splitText(text);
  const oldCount = Number(activeBackup.meta.chunkCount || 0);
  const batch = writeBatch(db);

  for (let index = 0; index < chunks.length; index += 1) {
    batch.set(
      doc(db, 'weddings', activeWeddingId, 'cloudChunks', String(index).padStart(5, '0')),
      { index, data: chunks[index] }
    );
  }
  for (let index = chunks.length; index < oldCount; index += 1) {
    batch.delete(doc(db, 'weddings', activeWeddingId, 'cloudChunks', String(index).padStart(5, '0')));
  }
  batch.set(doc(db, 'weddings', activeWeddingId, 'cloudSync', 'main'), {
    chunkCount: chunks.length,
    bytes: text.length,
    updatedAt: serverTimestamp(),
    version: 2
  });

  await batch.commit();

  localStorage.setItem(GUEST_KEY, canonicalText);
  localStorage.setItem(SHARED_KEY, sharedText);

  const verified = await readBackup(
    doc(db, 'weddings', activeWeddingId, 'cloudSync', 'main'),
    (index) => doc(db, 'weddings', activeWeddingId, 'cloudChunks', String(index).padStart(5, '0'))
  );
  const verifiedCount = Math.max(
    guestCount(parseJson(verified?.data?.localStorage?.[GUEST_KEY])),
    guestCount(parseJson(verified?.data?.localStorage?.[SHARED_KEY]))
  );
  if (verifiedCount !== historical.count) {
    throw new Error(`La verificación devolvió ${verifiedCount} invitados en lugar de ${historical.count}.`);
  }

  return verifiedCount;
}

restoreButton.addEventListener('click', async () => {
  if (!prepared || restoring) return;
  restoring = true;
  restoreButton.disabled = true;
  spinnerEl.classList.remove('is-done');
  statusEl.textContent = 'Restaurando únicamente Invitados…';
  detailEl.textContent = 'Checklist, Presupuesto y RSVP permanecen intactos.';

  try {
    const count = await writeActiveBackup(prepared);
    spinnerEl.classList.add('is-done');
    statusEl.textContent = `Recuperación verificada: ${count} invitados.`;
    detailEl.textContent = 'La boda activa ya contiene los invitados recuperados. Abre Mi Gran Día normal en una pestaña nueva y verifica Invitados.';
    restoreButton.textContent = `✓ ${count} invitados restaurados`;
  } catch (error) {
    console.error('[Mi Gran Día] Controlled guest restore failed:', error);
    statusEl.textContent = 'La restauración no se completó.';
    detailEl.textContent = String(error?.code || error?.message || error);
    restoreButton.disabled = false;
  } finally {
    restoring = false;
  }
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    statusEl.textContent = 'No se detectó una sesión activa.';
    detailEl.textContent = 'Abre primero Mi Gran Día con tu cuenta y luego vuelve a esta página sin cerrar sesión.';
    spinnerEl.classList.add('is-done');
    return;
  }

  prepare(user).catch((error) => {
    console.error('[Mi Gran Día] Controlled guest restore preparation failed:', error);
    statusEl.textContent = 'La restauración se detuvo antes de escribir.';
    detailEl.textContent = String(error?.code || error?.message || error);
    spinnerEl.classList.add('is-done');
    restoreButton.disabled = true;
  });
});
