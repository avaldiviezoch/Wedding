import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { collection, doc, getDoc, getDocs, getFirestore } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

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

const statusEl = document.getElementById('recoveryStatus');
const detailEl = document.getElementById('recoveryDetail');
const spinnerEl = document.getElementById('recoverySpinner');
const actionsEl = document.getElementById('recoveryActions');
const summaryEl = document.getElementById('recoverySummary');
const resultsEl = document.getElementById('recoveryResults');
const scanAgainButton = document.getElementById('scanAgainButton');
const copyReportButton = document.getElementById('copyReportButton');

const backupCache = new Map();
let latestReport = null;
let scanRunning = false;

const SIGNAL_PATTERN = /(check|task|tarea|guest|invit|confirm|rsvp|mesa|table|seat|asiento|cron|presup|prove|music|musica|distrib|document|photo|foto)/i;

function isoTimestamp(value) {
  try {
    return value?.toDate?.()?.toISOString?.() || null;
  } catch (_) {
    return null;
  }
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function safeDate(value) {
  if (!value) return 'Sin fecha';
  try {
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  } catch (_) {
    return String(value);
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function describeValue(value) {
  if (Array.isArray(value)) return `${value.length} elementos`;
  if (value && typeof value === 'object') return `${Object.keys(value).length} campos`;
  if (typeof value === 'string') return `${value.length} caracteres`;
  if (value == null) return 'vacío';
  return typeof value;
}

function summarizeBackup(data) {
  const signals = [];
  const visited = new WeakSet();
  let nodes = 0;
  let arrays = 0;
  let arrayItems = 0;
  let objects = 0;

  function addSignal(path, value) {
    if (signals.length >= 80) return;
    signals.push({ path, detail: describeValue(value) });
  }

  function walk(value, path = 'backup', depth = 0) {
    if (depth > 12 || nodes > 18000) return;
    nodes += 1;

    if (typeof value === 'string') {
      const text = value.trim();
      if (text.length >= 2 && text.length <= 2_000_000 && (text.startsWith('{') || text.startsWith('['))) {
        try {
          walk(JSON.parse(text), `${path} (JSON)`, depth + 1);
        } catch (_) {
          // Some localStorage values are plain strings; ignore safely.
        }
      }
      return;
    }

    if (!value || typeof value !== 'object') return;
    if (visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      arrays += 1;
      arrayItems += value.length;
      value.slice(0, 600).forEach((item, index) => walk(item, `${path}[${index}]`, depth + 1));
      return;
    }

    objects += 1;
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      if (SIGNAL_PATTERN.test(key)) addSignal(childPath, child);
      walk(child, childPath, depth + 1);
    }
  }

  walk(data);
  return {
    topLevelKeys: data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data).slice(0, 80) : [],
    signals,
    nodes,
    arrays,
    arrayItems,
    objects
  };
}

async function readBackup(metaRef, chunkFactory) {
  const metaSnap = await getDoc(metaRef);
  if (!metaSnap.exists()) return null;

  const meta = metaSnap.data() || {};
  const chunkCount = Number(meta.chunkCount || 0);
  if (!Number.isFinite(chunkCount) || chunkCount < 0 || chunkCount > 500) {
    throw new Error(`Cantidad de fragmentos inesperada: ${chunkCount}`);
  }

  const parts = [];
  for (let start = 0; start < chunkCount; start += 20) {
    const batch = [];
    for (let index = start; index < Math.min(chunkCount, start + 20); index += 1) {
      batch.push(getDoc(chunkFactory(index)));
    }
    const snaps = await Promise.all(batch);
    snaps.forEach((snap) => parts.push(snap.exists() ? String(snap.data()?.data || '') : ''));
  }

  const raw = parts.join('');
  let data = null;
  let parseError = '';
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (error) {
      parseError = String(error?.message || error || 'JSON inválido');
    }
  }

  return {
    raw,
    data,
    parseError,
    meta: {
      bytes: Number(meta.bytes || raw.length || 0),
      chunkCount,
      updatedAt: isoTimestamp(meta.updatedAt),
      version: Number(meta.version || 0)
    },
    structure: data ? summarizeBackup(data) : null
  };
}

async function readWeddingRsvp(weddingId) {
  try {
    const configSnap = await getDoc(doc(db, 'weddings', weddingId, 'rsvpConfig', 'main'));
    if (!configSnap.exists()) return { configExists: false, hasToken: false, responses: 0 };
    const token = String(configSnap.data()?.token || '');
    if (!token) return { configExists: true, hasToken: false, responses: 0 };

    try {
      const responses = await getDocs(collection(db, 'publicRsvp', token, 'responses'));
      return { configExists: true, hasToken: true, responses: responses.size };
    } catch (error) {
      return {
        configExists: true,
        hasToken: true,
        responses: null,
        responseError: String(error?.code || error?.message || error)
      };
    }
  } catch (error) {
    return {
      configExists: null,
      hasToken: null,
      responses: null,
      error: String(error?.code || error?.message || error)
    };
  }
}

function localStorageSummary() {
  const rows = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) || '';
    if (!key) continue;
    if (!key.startsWith('planificador_bodas_') && !key.startsWith('eventPlanner')) continue;
    const value = localStorage.getItem(key) || '';
    rows.push({ key, bytes: value.length, signal: SIGNAL_PATTERN.test(key) });
  }
  return rows.sort((a, b) => b.bytes - a.bytes);
}

async function scan(user) {
  if (!user || scanRunning) return;
  scanRunning = true;
  backupCache.clear();
  latestReport = null;
  actionsEl.hidden = true;
  summaryEl.hidden = true;
  resultsEl.innerHTML = '';
  spinnerEl.classList.remove('is-done');
  statusEl.textContent = 'Buscando todas las copias disponibles…';
  detailEl.textContent = 'Lectura de metadatos, fragmentos y RSVP. No se realizará ninguna escritura.';

  try {
    const profileSnap = await getDoc(doc(db, 'users', user.uid));
    const profile = profileSnap.exists() ? profileSnap.data() || {} : {};
    const activeWeddingId = String(profile.activeWeddingId || '');
    const indexSnaps = await getDocs(collection(db, 'users', user.uid, 'weddings'));

    const sources = [];

    for (const indexSnap of indexSnaps.docs) {
      const weddingId = indexSnap.id;
      const index = indexSnap.data() || {};
      let membership = {};
      try {
        const memberSnap = await getDoc(doc(db, 'weddings', weddingId, 'members', user.uid));
        membership = memberSnap.exists() ? memberSnap.data() || {} : {};
      } catch (_) {
        membership = {};
      }

      let backup = null;
      let backupError = '';
      try {
        backup = await readBackup(
          doc(db, 'weddings', weddingId, 'cloudSync', 'main'),
          (chunkIndex) => doc(db, 'weddings', weddingId, 'cloudChunks', String(chunkIndex).padStart(5, '0'))
        );
      } catch (error) {
        backupError = String(error?.code || error?.message || error);
      }

      const rsvp = await readWeddingRsvp(weddingId);
      const sourceKey = `wedding:${weddingId}`;
      if (backup?.data) backupCache.set(sourceKey, {
        label: membership.weddingName || index.name || 'Mi boda',
        source: 'wedding',
        backup: backup.data
      });

      sources.push({
        sourceKey,
        type: 'wedding',
        name: String(membership.weddingName || index.name || 'Mi boda'),
        role: String(membership.role || index.role || ''),
        active: weddingId === activeWeddingId,
        backup: backup ? {
          meta: backup.meta,
          parseError: backup.parseError,
          structure: backup.structure
        } : null,
        backupError,
        rsvp
      });
    }

    let legacyBackup = null;
    let legacyError = '';
    try {
      legacyBackup = await readBackup(
        doc(db, 'users', user.uid, 'cloudSync', 'main'),
        (chunkIndex) => doc(db, 'users', user.uid, 'cloudChunks', String(chunkIndex).padStart(5, '0'))
      );
    } catch (error) {
      legacyError = String(error?.code || error?.message || error);
    }

    if (legacyBackup?.data) backupCache.set('legacy', {
      label: 'Respaldo anterior de la cuenta',
      source: 'legacy',
      backup: legacyBackup.data
    });

    sources.push({
      sourceKey: 'legacy',
      type: 'legacy',
      name: 'Respaldo anterior de la cuenta',
      role: '',
      active: false,
      backup: legacyBackup ? {
        meta: legacyBackup.meta,
        parseError: legacyBackup.parseError,
        structure: legacyBackup.structure
      } : null,
      backupError: legacyError,
      rsvp: null
    });

    sources.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return Number(b.backup?.meta?.bytes || 0) - Number(a.backup?.meta?.bytes || 0);
    });

    const local = localStorageSummary();
    latestReport = {
      capturedAt: new Date().toISOString(),
      activeWeddingName: sources.find((item) => item.active)?.name || 'No identificada',
      sources: sources.map((item) => ({
        type: item.type,
        name: item.name,
        role: item.role,
        active: item.active,
        backup: item.backup,
        backupError: item.backupError,
        rsvp: item.rsvp
      })),
      localStorage: local
    };

    renderReport(latestReport, sources, local);
    spinnerEl.classList.add('is-done');
    statusEl.textContent = 'Escaneo terminado. No se modificó ningún dato.';
    detailEl.textContent = 'Descarga primero cualquier copia que parezca contener tus datos. Luego haremos la restauración de forma controlada.';
    actionsEl.hidden = false;
  } catch (error) {
    console.error('Recovery audit failed:', error);
    statusEl.textContent = 'No se pudo completar el escaneo.';
    detailEl.textContent = `Error de lectura: ${String(error?.code || error?.message || error)}`;
    resultsEl.innerHTML = '<article class="recovery-card"><strong class="recovery-error">No se realizó ninguna escritura ni borrado.</strong></article>';
  } finally {
    scanRunning = false;
  }
}

function renderReport(report, sources, local) {
  const backupsFound = sources.filter((item) => item.backup?.structure).length;
  const totalCloudBytes = sources.reduce((sum, item) => sum + Number(item.backup?.meta?.bytes || 0), 0);
  const rsvpResponses = sources.reduce((sum, item) => sum + (Number.isFinite(item.rsvp?.responses) ? item.rsvp.responses : 0), 0);

  summaryEl.innerHTML = `
    <div class="recovery-summary-grid">
      <div class="recovery-kpi"><span>Copias cloud legibles</span><strong>${backupsFound}</strong></div>
      <div class="recovery-kpi"><span>Datos cloud localizados</span><strong>${escapeHtml(formatBytes(totalCloudBytes))}</strong></div>
      <div class="recovery-kpi"><span>Respuestas RSVP localizadas</span><strong>${rsvpResponses}</strong></div>
    </div>
  `;
  summaryEl.hidden = false;

  const cards = sources.map((source) => {
    const meta = source.backup?.meta;
    const structure = source.backup?.structure;
    const signals = structure?.signals || [];
    const shownSignals = signals.slice(0, 16);
    const rsvp = source.rsvp;
    const backupStatus = source.backupError
      ? `<span class="recovery-error">Error de lectura: ${escapeHtml(source.backupError)}</span>`
      : meta
        ? `${escapeHtml(formatBytes(meta.bytes))} · ${meta.chunkCount} fragmentos · ${escapeHtml(safeDate(meta.updatedAt))}`
        : 'No hay copia cloud en esta ubicación';
    const rsvpText = !rsvp
      ? 'No aplica'
      : rsvp.error
        ? 'No legible'
        : rsvp.hasToken
          ? (Number.isFinite(rsvp.responses) ? `${rsvp.responses} respuestas` : 'Token existe; respuestas no legibles')
          : (rsvp.configExists ? 'Configurado sin token' : 'Sin configuración');

    return `
      <article class="recovery-card${source.active ? ' is-active' : ''}">
        <div class="recovery-card-head">
          <div>
            <h2>${escapeHtml(source.name)}</h2>
            <div class="recovery-card-meta">${source.role ? `Rol: ${escapeHtml(source.role)} · ` : ''}${backupStatus}</div>
          </div>
          ${source.active ? '<span class="recovery-badge">Boda activa</span>' : source.type === 'legacy' ? '<span class="recovery-badge">Respaldo histórico</span>' : ''}
        </div>
        <div class="recovery-data-grid">
          <div class="recovery-data-item"><span>Tamaño</span><strong>${escapeHtml(formatBytes(meta?.bytes || 0))}</strong></div>
          <div class="recovery-data-item"><span>Señales de módulos</span><strong>${signals.length}</strong></div>
          <div class="recovery-data-item"><span>Elementos en arreglos</span><strong>${structure?.arrayItems ?? 0}</strong></div>
          <div class="recovery-data-item"><span>Confirmaciones RSVP</span><strong>${escapeHtml(rsvpText)}</strong></div>
        </div>
        ${shownSignals.length
          ? `<ul class="recovery-signals">${shownSignals.map((item) => `<li>${escapeHtml(item.path.replace(/^backup\./, ''))}: ${escapeHtml(item.detail)}</li>`).join('')}</ul>`
          : '<p class="recovery-empty">No se detectaron señales estructurales de módulos en esta copia.</p>'}
        ${backupCache.has(source.sourceKey)
          ? `<div class="recovery-card-actions"><button class="recovery-download" type="button" data-download-backup="${escapeHtml(source.sourceKey)}">Descargar esta copia JSON</button></div>`
          : ''}
      </article>
    `;
  });

  const localHtml = `
    <article class="recovery-card">
      <div class="recovery-card-head"><div><h2>Estado local que aún queda en este navegador</h2><div class="recovery-card-meta">Solo tamaños y nombres de claves; no se muestran contenidos.</div></div></div>
      ${local.length
        ? `<ul class="recovery-signals">${local.slice(0, 30).map((item) => `<li>${escapeHtml(item.key)}: ${escapeHtml(formatBytes(item.bytes))}</li>`).join('')}</ul>`
        : '<p class="recovery-empty">No quedan claves del planificador en localStorage.</p>'}
    </article>
  `;

  resultsEl.innerHTML = cards.join('') + localHtml;
}

function downloadBackup(sourceKey) {
  const entry = backupCache.get(sourceKey);
  if (!entry) return;
  const payload = {
    exportedAt: new Date().toISOString(),
    source: entry.source,
    label: entry.label,
    backup: entry.backup
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const slug = String(entry.label || 'respaldo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'respaldo';
  anchor.href = url;
  anchor.download = `mi-gran-dia-rescate-${slug}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

resultsEl.addEventListener('click', (event) => {
  const button = event.target instanceof Element ? event.target.closest('[data-download-backup]') : null;
  if (!button) return;
  downloadBackup(button.getAttribute('data-download-backup') || '');
});

scanAgainButton.addEventListener('click', () => {
  if (auth.currentUser) scan(auth.currentUser);
});

copyReportButton.addEventListener('click', async () => {
  if (!latestReport) return;
  const text = JSON.stringify(latestReport, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    copyReportButton.textContent = 'Informe copiado';
    setTimeout(() => { copyReportButton.textContent = 'Copiar informe'; }, 1600);
  } catch (_) {
    console.log('=== INFORME DE RECUPERACIÓN MGD ===');
    console.log(text);
    copyReportButton.textContent = 'Informe enviado a Consola';
  }
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    spinnerEl.classList.remove('is-done');
    statusEl.textContent = 'No hay una sesión activa disponible para el rescate.';
    detailEl.innerHTML = 'Abre <a href="applu.html">Mi Gran Día</a>, inicia sesión con la misma cuenta y luego vuelve a esta página. No cierres sesión después.';
    return;
  }
  scan(user);
});
