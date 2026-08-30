import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION = '20260830-lucero-full-restore1';
const CHUNK_SIZE = 180000;
const SNAPSHOT_ID = 'lucero-pre-full-restore-20260830';
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

const statusEl = document.getElementById('restoreStatus');
const detailEl = document.getElementById('restoreDetail');
const spinnerEl = document.getElementById('restoreSpinner');
const summaryEl = document.getElementById('restoreSummary');
const cardEl = document.getElementById('restoreCard');
const targetEl = document.getElementById('restoreTarget');
const metaEl = document.getElementById('restoreMeta');
const explanationEl = document.getElementById('restoreExplanation');
const restoreButton = document.getElementById('restoreFullButton');

let prepared = null;
let restoring = false;

function formatKb(value) {
  return `${(Number(value || 0) / 1024).toFixed(1)} KB`;
}

function parseJson(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string' || !value.trim()) return null;
  try { return JSON.parse(value); } catch (_) { return null; }
}

function guestCount(backup) {
  const storage = backup?.localStorage || {};
  const canonical = parseJson(storage.planificador_bodas_invitados_v1);
  const shared = parseJson(storage.planificador_bodas_datos_compartidos_v1);
  return Math.max(
    Array.isArray(canonical?.guests) ? canonical.guests.length : 0,
    Array.isArray(shared?.guests) ? shared.guests.length : 0
  );
}

function checklistStats(backup) {
  const parsed = parseJson(backup?.localStorage?.planificador_bodas_checklist_v1);
  const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
  const advanced = tasks.filter((task) => {
    const status = String(task?.status || '').toLowerCase();
    return status && !['pending', 'pendiente'].includes(status);
  }).length;
  return { total: tasks.length, advanced };
}

function storageKeyCount(backup) {
  return backup?.localStorage && typeof backup.localStorage === 'object'
    ? Object.keys(backup.localStorage).length
    : 0;
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
  const chunkCount = Number(meta.chunkCount || 0);
  if (!Number.isFinite(chunkCount) || chunkCount <= 0 || chunkCount > 500) return null;
  const snaps = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) => getDoc(chunkFactory(index)))
  );
  const raw = snaps.map((snap) => snap.exists() ? String(snap.data()?.data || '') : '').join('');
  if (!raw) return null;
  return {
    raw,
    data: JSON.parse(raw),
    meta: {
      bytes: Number(meta.bytes || raw.length || 0),
      chunkCount,
      updatedAt: meta.updatedAt?.toDate?.()?.toISOString?.() || null,
      version: Number(meta.version || 0)
    }
  };
}

function isWeddingStorageKey(key) {
  return key.startsWith('planificador_bodas_') || key.startsWith('eventPlanner');
}

function restoreLocalStorageFromBackup(backup, uid) {
  const keysToRemove = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) || '';
    if (isWeddingStorageKey(key)) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  Object.entries(backup?.localStorage || {}).forEach(([key, value]) => {
    if (isWeddingStorageKey(key)) localStorage.setItem(key, String(value));
  });
  localStorage.setItem(LOCAL_OWNER_KEY, uid);
}

async function prepare(user) {
  prepared = null;
  restoreButton.disabled = true;
  summaryEl.hidden = true;
  cardEl.hidden = true;
  spinnerEl.classList.remove('is-done');
  statusEl.textContent = 'Verificando la boda de Lucero y tu respaldo histórico…';
  detailEl.textContent = 'Solo lectura. Todavía no se modifica ningún dato.';

  const profileSnap = await getDoc(doc(db, 'users', user.uid));
  if (!profileSnap.exists()) throw new Error('No se encontró tu perfil de Mi Gran Día.');
  const activeWeddingId = String(profileSnap.data()?.activeWeddingId || '');
  if (!activeWeddingId) throw new Error('No hay una boda activa identificada.');

  const [indexSnap, memberSnap, activeBackup, historicalBackup] = await Promise.all([
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
  const index = indexSnap.exists() ? indexSnap.data() || {} : {};
  const role = String(membership.role || index.role || '').toLowerCase();
  const weddingName = String(membership.weddingName || index.name || '');

  if (!['owner', 'admin', 'editor'].includes(role)) {
    throw new Error(`Tu rol ${role || 'desconocido'} no permite restaurar el planificador.`);
  }
  if (!weddingName.toLocaleLowerCase('es').includes('lucero')) {
    throw new Error(`La boda activa es “${weddingName || 'Sin nombre'}”. Se detiene para no restaurar sobre la boda equivocada.`);
  }
  if (!activeBackup?.data) throw new Error('No se pudo leer la copia actual de la boda de Lucero.');
  if (!historicalBackup?.data) throw new Error('No se encontró tu respaldo histórico de la cuenta.');
  if (historicalBackup.data.type !== 'migrandia_cloud_backup') {
    throw new Error('El respaldo histórico no tiene el formato completo esperado.');
  }

  const historicalGuests = guestCount(historicalBackup.data);
  const activeGuests = guestCount(activeBackup.data);
  const historicalChecklist = checklistStats(historicalBackup.data);
  const activeChecklist = checklistStats(activeBackup.data);

  if (historicalGuests <= activeGuests && historicalBackup.raw.length <= activeBackup.raw.length) {
    throw new Error('El respaldo histórico no es claramente más rico que la copia actual. Se detiene por seguridad.');
  }

  prepared = {
    user,
    activeWeddingId,
    weddingName,
    role,
    activeBackup,
    historicalBackup,
    historicalGuests,
    activeGuests,
    historicalChecklist,
    activeChecklist
  };

  summaryEl.innerHTML = `
    <div class="recovery-summary-grid">
      <div class="recovery-kpi"><span>Respaldo a recuperar</span><strong>${formatKb(historicalBackup.raw.length)}</strong></div>
      <div class="recovery-kpi"><span>Invitados en respaldo</span><strong>${historicalGuests}</strong></div>
      <div class="recovery-kpi"><span>Claves del planificador</span><strong>${storageKeyCount(historicalBackup.data)}</strong></div>
    </div>
  `;
  summaryEl.hidden = false;
  cardEl.hidden = false;
  targetEl.textContent = weddingName;
  metaEl.textContent = `Rol: ${role} · copia actual ${formatKb(activeBackup.raw.length)} · respaldo histórico ${formatKb(historicalBackup.raw.length)}`;
  explanationEl.textContent = `Se restaurará el respaldo histórico completo de tu cuenta dentro de esta boda. La copia actual se guardará primero como snapshot privado. RSVP y sus respuestas no se modifican.`;
  restoreButton.textContent = `Restaurar respaldo completo en ${weddingName}`;
  restoreButton.disabled = false;
  spinnerEl.classList.add('is-done');
  statusEl.textContent = 'Respaldo histórico localizado y listo.';
  detailEl.textContent = `Histórico: ${historicalGuests} invitados y ${historicalChecklist.total} tareas detectadas. Cierra las demás pestañas de Mi Gran Día antes de restaurar.`;
}

async function saveSafetySnapshot(state) {
  await setDoc(doc(db, 'users', state.user.uid, 'incidentSnapshots', SNAPSHOT_ID), {
    version: VERSION,
    weddingId: state.activeWeddingId,
    weddingName: state.weddingName,
    role: state.role,
    bytes: state.activeBackup.raw.length,
    raw: state.activeBackup.raw,
    capturedAt: serverTimestamp()
  });
}

async function writeHistoricalBackup(state) {
  const sourceRaw = state.historicalBackup.raw;
  const chunks = splitText(sourceRaw);
  const oldCount = Number(state.activeBackup.meta.chunkCount || 0);
  const batch = writeBatch(db);

  for (let index = 0; index < chunks.length; index += 1) {
    batch.set(
      doc(db, 'weddings', state.activeWeddingId, 'cloudChunks', String(index).padStart(5, '0')),
      { index, data: chunks[index] }
    );
  }
  for (let index = chunks.length; index < oldCount; index += 1) {
    batch.delete(doc(db, 'weddings', state.activeWeddingId, 'cloudChunks', String(index).padStart(5, '0')));
  }
  batch.set(doc(db, 'weddings', state.activeWeddingId, 'cloudSync', 'main'), {
    chunkCount: chunks.length,
    bytes: sourceRaw.length,
    updatedAt: serverTimestamp(),
    version: 2,
    recoverySource: 'admin-historical-backup',
    recoveryVersion: VERSION
  });
  await batch.commit();

  const verified = await readBackup(
    doc(db, 'weddings', state.activeWeddingId, 'cloudSync', 'main'),
    (index) => doc(db, 'weddings', state.activeWeddingId, 'cloudChunks', String(index).padStart(5, '0'))
  );
  if (!verified || verified.raw !== sourceRaw) {
    throw new Error('La verificación byte a byte no coincide. La restauración se detuvo.');
  }
  return verified;
}

restoreButton.addEventListener('click', async () => {
  if (!prepared || restoring) return;
  restoring = true;
  restoreButton.disabled = true;
  spinnerEl.classList.remove('is-done');
  statusEl.textContent = 'Guardando snapshot de seguridad…';
  detailEl.textContent = 'No abras Mi Gran Día en otra pestaña durante este proceso.';

  try {
    await saveSafetySnapshot(prepared);
    statusEl.textContent = 'Restaurando el respaldo histórico completo…';
    const verified = await writeHistoricalBackup(prepared);
    restoreLocalStorageFromBackup(verified.data, prepared.user.uid);
    spinnerEl.classList.add('is-done');
    statusEl.textContent = 'Restauración completa verificada.';
    detailEl.textContent = `Firebase contiene ahora exactamente el respaldo histórico (${formatKb(verified.raw.length)}). Ya puedes cerrar esta pestaña y abrir Mi Gran Día normal.`;
    restoreButton.textContent = '✓ Respaldo restaurado y verificado';
  } catch (error) {
    console.error('[Mi Gran Día] Full Lucero restore failed:', error);
    statusEl.textContent = 'La restauración no se completó.';
    detailEl.textContent = String(error?.code || error?.message || error);
    restoreButton.disabled = false;
  } finally {
    restoring = false;
  }
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    statusEl.textContent = 'No se detectó tu sesión de administrador.';
    detailEl.textContent = 'Abre Mi Gran Día con tu cuenta, luego vuelve aquí sin cerrar sesión.';
    spinnerEl.classList.add('is-done');
    return;
  }
  prepare(user).catch((error) => {
    console.error('[Mi Gran Día] Full restore preparation failed:', error);
    statusEl.textContent = 'La reparación se detuvo antes de escribir.';
    detailEl.textContent = String(error?.code || error?.message || error);
    spinnerEl.classList.add('is-done');
    restoreButton.disabled = true;
  });
});
