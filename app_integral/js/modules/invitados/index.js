import {
  RSVP_ATTENDANCE,
  RSVP_DEFAULT_FIELDS,
  RSVP_MESSAGE_PRESETS,
  deleteRsvpResponse,
  loadRsvpConfig,
  listRsvpResponses,
  publicRsvpUrl,
  regenerateRsvpToken,
  rsvpEmbedCode,
  saveRsvpConfig,
  subscribeRsvpResponses
} from './rsvp-service.js?v=20260819-2100-rsvp-guide1';
import { db, getWeddingContext } from '../../services/firebase.js?v=20260814-1136-collab1';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

export const moduleId = 'invitados';

const RSVP_WIDGET_URL = 'https://avaldiviezoch.github.io/Wedding/app_integral/js/modules/invitados/rsvp-native-widget.js?v=20260819-2100-rsvp-guide1';

function musicEmbedCode(token) {
  const cleanToken = String(token || '').trim();
  return cleanToken ? `<div\n  data-mgd-music-token="${cleanToken}"\n  style="--mgd-accent:#6d7559;--mgd-surface:rgba(255,255,255,.12);--mgd-border:rgba(109,117,89,.24);"\n></div>\n<script type="module" src="${RSVP_WIDGET_URL}"></script>` : '';
}

function combinedEmbedCode(token) {
  const cleanToken = String(token || '').trim();
  return cleanToken ? `<div\n  data-mgd-rsvp-token="${cleanToken}"\n  style="--mgd-accent:#6d7559;--mgd-surface:rgba(255,255,255,.12);--mgd-border:rgba(109,117,89,.24);"\n></div>\n<div\n  data-mgd-music-token="${cleanToken}"\n  style="--mgd-accent:#6d7559;--mgd-surface:rgba(255,255,255,.12);--mgd-border:rgba(109,117,89,.24);margin-top:24px;"\n></div>\n<script type="module" src="${RSVP_WIDGET_URL}"></script>` : '';
}

function messagePresetOptions(messages = []) {
  return messages.map((message, index) => `<option value="${escapeHtml(message)}">Opción ${index + 1} · ${escapeHtml(message)}</option>`).join('');
}

const VERSION = '20260819-2300-rsvp-live-preview1';
const GUEST_STORAGE_KEY = 'planificador_bodas_invitados_v1';
const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';
const RSVP_CSS_URL = new URL(`css/modules/invitados-rsvp.css?v=${VERSION}`, document.baseURI).href;
const RSVP_MANAGEMENT_CSS_URL = new URL(`css/modules/invitados-rsvp-management.css?v=${VERSION}`, document.baseURI).href;

const SIDE_LABELS = Object.freeze({
  novio: 'Del novio',
  novia: 'De la novia',
  ambos: 'De ambos'
});

const GROUP_LABELS = Object.freeze({
  familia: 'Familia',
  amigos: 'Amigos',
  trabajo: 'Trabajo',
  otros: 'Otros'
});

let guestFrame = null;
let guestDocument = null;
let rsvpConfig = null;
let responses = [];
let responseManagement = new Map();
let unsubscribeResponses = null;
let unsubscribeManagement = null;
let attachTimer = 0;

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function cleanText(value = '', max = 160) {
  return String(value ?? '').trim().slice(0, max);
}

function formatDate(value) {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date);
}

function statusLabel(status) {
  return RSVP_ATTENDANCE[status] || status || 'Pendiente';
}

function currentWedding() {
  const context = getWeddingContext();
  if (!context?.id || context.legacyMode) throw new Error('No hay una boda activa para administrar el RSVP.');
  return context;
}

function canEditWedding() {
  const role = getWeddingContext()?.role || 'viewer';
  return ['owner', 'admin', 'editor'].includes(role);
}

function managementCollection() {
  const context = currentWedding();
  return collection(db, 'weddings', context.id, 'rsvpManagement');
}

function managementDocId(token, responseId) {
  return `${cleanText(token, 180)}__${cleanText(responseId, 180)}`;
}

async function listManagement(token) {
  if (!token) return [];
  const snaps = await getDocs(managementCollection());
  return snaps.docs
    .map((snap) => ({ id: snap.id, ...(snap.data() || {}) }))
    .filter((item) => item.token === token);
}

function subscribeManagement(token, onData, onError = console.error) {
  if (!token) {
    onData?.([]);
    return () => {};
  }
  return onSnapshot(managementCollection(), (snaps) => {
    onData?.(
      snaps.docs
        .map((snap) => ({ id: snap.id, ...(snap.data() || {}) }))
        .filter((item) => item.token === token)
    );
  }, onError);
}

async function saveManagement(token, responseId, input = {}) {
  if (!canEditWedding()) throw new Error('Tu rol no permite clasificar ni vincular respuestas RSVP.');
  const context = currentWedding();
  const linkedGuestIds = Array.isArray(input.linkedGuestIds)
    ? [...new Set(input.linkedGuestIds.map((item) => cleanText(item, 180)).filter(Boolean))].slice(0, 40)
    : [];
  const side = ['novio', 'novia', 'ambos'].includes(input.side) ? input.side : '';
  const group = ['familia', 'amigos', 'trabajo', 'otros'].includes(input.group) ? input.group : '';
  const payload = {
    version: 1,
    token,
    responseId,
    weddingId: context.id,
    side,
    group,
    familyLabel: cleanText(input.familyLabel, 100),
    linkedGuestIds,
    reviewed: true,
    updatedAt: serverTimestamp()
  };
  await setDoc(
    doc(db, 'weddings', context.id, 'rsvpManagement', managementDocId(token, responseId)),
    payload,
    { merge: true }
  );
  return payload;
}

async function deleteManagement(token, responseId) {
  const context = currentWedding();
  await deleteDoc(doc(db, 'weddings', context.id, 'rsvpManagement', managementDocId(token, responseId)));
}

function readGuestState() {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      ...parsed,
      guests: Array.isArray(parsed.guests) ? parsed.guests : [],
      tables: Array.isArray(parsed.tables) ? parsed.tables : []
    };
  } catch (error) {
    console.error('No se pudo leer la lista de invitados:', error);
    return { guests: [], tables: [] };
  }
}

function buildSharedState(data) {
  const guests = Array.isArray(data.guests) ? data.guests : [];
  const tables = Array.isArray(data.tables) ? data.tables : [];
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    source: 'invitados',
    guests: guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      status: guest.status,
      invitationSent: Boolean(guest.invitationSent),
      side: guest.side || 'ambos',
      relation: guest.relation || '',
      restriction: guest.restriction || 'Ninguna',
      tableId: guest.tableId || '',
      seatNumber: guest.seatNumber ?? null,
      photoId: guest.photoId || '',
      photoThumb: guest.photoThumb || '',
      notes: guest.notes || '',
      rsvpResponseId: guest.rsvpResponseId || '',
      rsvpResponseName: guest.rsvpResponseName || '',
      rsvpGroup: guest.rsvpGroup || '',
      rsvpFamilyLabel: guest.rsvpFamilyLabel || '',
      rsvpTags: Array.isArray(guest.rsvpTags) ? guest.rsvpTags : []
    })),
    tables: tables.map((table) => ({
      ...table,
      guestIds: guests
        .filter((guest) => guest.tableId === table.id)
        .sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999))
        .map((guest) => guest.id)
    }))
  };
}

function writeGuestState(data, source = 'rsvp-manual-link') {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
  const shared = buildSharedState(data);
  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(shared));

  try {
    guestFrame?.contentWindow?.postMessage({
      type: 'MIGRANDIA_RSVP_SYNC',
      payload: { guests: data.guests || [], tables: data.tables || [] }
    }, '*');
  } catch (error) {
    console.warn('No se pudo refrescar Invitados en caliente:', error);
  }

  window.dispatchEvent(new CustomEvent('migrandia:datachange', {
    detail: { source, guests: (data.guests || []).length }
  }));
}

function effectiveResponses(items = responses) {
  return [...items].sort((a, b) => {
    const ta = a.submittedAtDate?.getTime?.() || a.updatedAtDate?.getTime?.() || new Date(a.clientDate || 0).getTime() || 0;
    const tb = b.submittedAtDate?.getTime?.() || b.updatedAtDate?.getTime?.() || new Date(b.clientDate || 0).getTime() || 0;
    return tb - ta;
  });
}

function responseById(responseId) {
  return responses.find((item) => String(item.id) === String(responseId));
}

function guestStatusFromAttendance(attendance) {
  if (attendance === 'confirmed') return 'confirmed';
  if (attendance === 'declined') return 'declined';
  return 'pending';
}

function responseTags(response, meta = {}) {
  const tags = [statusLabel(response?.attendance)];
  if (meta.group && GROUP_LABELS[meta.group]) tags.push(GROUP_LABELS[meta.group]);
  if (meta.side && SIDE_LABELS[meta.side]) tags.push(SIDE_LABELS[meta.side]);
  if (meta.familyLabel) tags.push(meta.familyLabel);
  return [...new Set(tags.filter(Boolean))];
}

function suggestedGuestIds(response) {
  const data = readGuestState();
  const wantedNames = [response?.name, ...(Array.isArray(response?.companions) ? response.companions : [])]
    .map(normalizeName)
    .filter(Boolean);
  if (!wantedNames.length) return [];
  const wanted = new Set(wantedNames);
  return (data.guests || [])
    .filter((guest) => wanted.has(normalizeName(guest.name)))
    .map((guest) => guest.id);
}

function applyResponseToGuests(response, meta) {
  if (!response) throw new Error('No se encontró la respuesta RSVP.');
  const selected = new Set(Array.isArray(meta.linkedGuestIds) ? meta.linkedGuestIds : []);
  if (!selected.size) throw new Error('Selecciona al menos un invitado de tu lista antes de aplicar.');

  const data = readGuestState();
  const previous = responseManagement.get(response.id) || {};
  const previousLinked = new Set(Array.isArray(previous.linkedGuestIds) ? previous.linkedGuestIds : []);
  const tags = responseTags(response, meta);
  const status = guestStatusFromAttendance(response.attendance);
  const timestamp = new Date().toISOString();

  const guests = (data.guests || []).map((guest) => {
    const next = { ...guest };

    if (previousLinked.has(next.id) && !selected.has(next.id) && next.rsvpResponseId === response.id) {
      delete next.rsvpResponseId;
      delete next.rsvpResponseName;
      delete next.rsvpGroup;
      delete next.rsvpFamilyLabel;
      delete next.rsvpTags;
      delete next.rsvpLinkedAt;
    }

    if (!selected.has(next.id)) return next;

    next.status = status;
    if (meta.side) next.side = meta.side;
    next.rsvpResponseId = response.id;
    next.rsvpResponseName = cleanText(response.name, 120);
    next.rsvpGroup = meta.group || '';
    next.rsvpFamilyLabel = meta.familyLabel || '';
    next.rsvpTags = tags;
    next.rsvpLinkedAt = timestamp;

    if (meta.familyLabel && !String(next.relation || '').trim()) {
      next.relation = meta.familyLabel;
    }

    const rsvpLine = `[RSVP] ${tags.join(' · ')} · respuesta de ${cleanText(response.name, 120)}`;
    const previousNotes = String(next.notes || '')
      .split('\n')
      .filter((line) => !line.trim().startsWith('[RSVP]'))
      .join('\n')
      .trim();
    next.notes = [previousNotes, rsvpLine].filter(Boolean).join('\n');
    return next;
  });

  writeGuestState({ ...data, guests });
  return selected.size;
}

function calculateKpis() {
  const latest = effectiveResponses();
  const confirmed = latest.filter((item) => item.attendance === 'confirmed');
  const declined = latest.filter((item) => item.attendance === 'declined');
  const peopleConfirmed = confirmed.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0);
  const unreviewed = latest.filter((item) => !responseManagement.get(item.id)?.reviewed).length;
  return {
    responses: latest.length,
    confirmed: confirmed.length,
    peopleConfirmed,
    unreviewed,
    declined: declined.length
  };
}

function ensureStyles(doc) {
  [
    ['rsvpNativeCss', RSVP_CSS_URL],
    ['rsvpManagementCss', RSVP_MANAGEMENT_CSS_URL]
  ].forEach(([key, href]) => {
    if (doc.querySelector(`link[data-${key}]`)) return;
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset[key] = 'true';
    doc.head.appendChild(link);
  });
}

function panelMarkup() {
  return `
    <div class="rsvp-admin-shell">
      <section class="rsvp-admin-hero">
        <div>
          <span class="rsvp-admin-eyebrow">Confirmaciones · Firebase</span>
          <h2>RSVP nativo</h2>
          <p>Funciona para invitaciones digitales sin alterar automáticamente tu lista. Cada respuesta entra primero a una bandeja de revisión y el administrador decide a qué invitados o grupo familiar corresponde.</p>
          <span class="rsvp-publish-state" id="rsvpPublishState">Sin publicar</span>
        </div>
        <div class="rsvp-admin-actions">
          <button class="rsvp-btn" id="rsvpRefreshButton" type="button">Actualizar</button>
          <button class="rsvp-btn dark" id="rsvpOpenPublicButton" type="button">Abrir formulario</button>
        </div>
      </section>

      <div class="rsvp-safety-note">
        <strong>Control manual.</strong> Si una persona escribe cualquier nombre, su respuesta se conserva tal cual. Si coincide con alguien de tu lista, Mi Gran Día solo lo sugiere; no crea, elimina ni cambia invitados hasta que tú pulses “Aplicar a invitados”.
      </div>

      <section class="rsvp-kpis">
        <article class="rsvp-kpi"><span>Respuestas</span><strong id="rsvpKpiResponses">0</strong></article>
        <article class="rsvp-kpi"><span>Confirmaciones</span><strong id="rsvpKpiConfirmed">0</strong></article>
        <article class="rsvp-kpi"><span>Personas confirmadas</span><strong id="rsvpKpiPeople">0</strong></article>
        <article class="rsvp-kpi"><span>Por revisar</span><strong id="rsvpKpiPending">0</strong></article>
        <article class="rsvp-kpi"><span>No asistirán</span><strong id="rsvpKpiDeclined">0</strong></article>
      </section>

      <nav class="rsvp-admin-tabs" aria-label="RSVP">
        <button class="rsvp-admin-tab is-active" type="button" data-rsvp-pane-tab="responses">Bandeja RSVP</button>
        <button class="rsvp-admin-tab" type="button" data-rsvp-pane-tab="form">Formulario</button>
        <button class="rsvp-admin-tab" type="button" data-rsvp-pane-tab="integrate">&lt;/&gt; Integrar</button>
      </nav>

      <section class="rsvp-pane is-active" data-rsvp-pane="responses">
        <div class="rsvp-card">
          <div class="rsvp-card-head">
            <div>
              <h3>Respuestas recibidas</h3>
              <p>Clasifica cada respuesta como Familia, Amigos, Trabajo u Otros; indica si corresponde al novio, a la novia o a ambos y vincúlala con uno o varios invitados existentes.</p>
            </div>
            <span class="rsvp-sync-state" id="rsvpSyncState">Esperando respuestas</span>
          </div>
          <div class="rsvp-responses-list" id="rsvpResponsesList"></div>
        </div>
      </section>

      <section class="rsvp-pane" data-rsvp-pane="form">
        <div class="rsvp-card">
          <div class="rsvp-card-head"><div><h3>Campos del formulario</h3><p>Nombre, Asistencia y Cantidad son la base. El nombre identifica la respuesta, pero no obliga a que exista en la lista de invitados.</p></div></div>
          <div class="rsvp-base-fields">
            <div class="rsvp-base-field"><small>Base</small><strong>Fecha automática</strong></div>
            <div class="rsvp-base-field"><small>Base</small><strong>Nombre</strong></div>
            <div class="rsvp-base-field"><small>Base</small><strong>Asistencia</strong></div>
            <div class="rsvp-base-field"><small>Base</small><strong>Cantidad</strong></div>
          </div>
          <div class="rsvp-form-grid">
            <label class="rsvp-field"><span>Máximo de asistentes por respuesta</span><input id="rsvpMaxGuests" type="number" min="1" max="20" value="4"></label>
            <label class="rsvp-field"><span>Estado público</span><select id="rsvpActive"><option value="true">Activo</option><option value="false">Pausado</option></select></label>
            <label class="rsvp-field wide"><span>Título</span><input id="rsvpFormTitle" maxlength="100" value="Confirma tu asistencia"></label>
            <label class="rsvp-field wide"><span>Mensaje</span><textarea id="rsvpWelcomeText" maxlength="500"></textarea></label>
          </div>
          <label class="rsvp-toggle-row" style="margin-top:12px;max-width:420px"><input id="rsvpAllowTentative" type="checkbox"><span class="rsvp-toggle-copy"><strong>Permitir “Por confirmar”</strong><span>Además de Confirmado y No asistiré</span></span></label>
        </div>

        <div class="rsvp-card">
          <div class="rsvp-card-head"><div><h3>Respuesta final según lo que elija</h3><p>El invitado primero elige si asistirá. La cantidad aparece únicamente cuando responde “Sí”. Después de enviar verá el mensaje correspondiente.</p></div></div>
          <div class="rsvp-form-grid">
            <label class="rsvp-field wide"><span>Mensaje si confirma que sí asistirá</span><select id="rsvpConfirmedMessage">${messagePresetOptions(RSVP_MESSAGE_PRESETS.confirmed)}</select></label>
            <label class="rsvp-field wide"><span>Mensaje si responde que no asistirá</span><select id="rsvpDeclinedMessage">${messagePresetOptions(RSVP_MESSAGE_PRESETS.declined)}</select></label>
          </div>
          <label class="rsvp-toggle-row" style="margin-top:12px;max-width:520px"><input id="rsvpAllowEditResponse" type="checkbox"><span class="rsvp-toggle-copy"><strong>Mostrar “Modificar respuesta”</strong><span>Permite cambiar posteriormente de Sí a No, o viceversa, desde el mismo dispositivo.</span></span></label>
        </div>

        <div class="rsvp-card">
          <div class="rsvp-card-head"><div><h3>Datos opcionales</h3><p>Activa solo los campos que realmente necesita esta boda.</p></div></div>
          <div class="rsvp-toggle-list" id="rsvpBuiltInFields"></div>
          <label class="rsvp-field wide" id="rsvpMenuOptionsField" style="margin-top:12px;display:none"><span>Opciones de menú · una por línea</span><textarea id="rsvpMenuOptions" placeholder="Carne\nPollo\nVegetariano"></textarea></label>
        </div>

        <div class="rsvp-card">
          <div class="rsvp-card-head"><div><h3>Campos personalizados</h3><p>Agrega preguntas propias como movilidad, canción favorita, transporte u otros datos.</p></div><button class="rsvp-btn" id="rsvpAddCustomField" type="button">+ Agregar campo</button></div>
          <div class="rsvp-custom-list" id="rsvpCustomFields"></div>
          <div class="rsvp-live-preview-wrap">
            <div class="rsvp-preview-heading"><div><small>VISTA PREVIA EN VIVO</small><strong>Así verá la confirmación tu invitado</strong><span>Es solo una simulación: no guarda respuestas ni modifica el token.</span></div><span class="rsvp-preview-safe">Sin publicar</span></div>
            <div class="rsvp-live-preview" id="rsvpLivePreview"></div>
          </div>
          <div class="rsvp-config-footer"><button class="rsvp-btn primary" id="rsvpSaveConfig" type="button">Guardar y publicar RSVP</button></div>
        </div>
      </section>

      <section class="rsvp-pane" data-rsvp-pane="integrate">
        <div class="rsvp-card">
          <div class="rsvp-card-head"><div><h3>Elige qué quieres publicar</h3><p>Puedes usar Confirmación y Música por separado o mostrar ambos juntos. Cada opción tiene su propio enlace, vista previa y código para insertar.</p></div></div>
          <div class="rsvp-integrate-grid">
            <div class="rsvp-code-box">
              <label>1. Solo Confirmación RSVP</label>
              <p>Para que el invitado confirme asistencia. No muestra la encuesta musical.</p>
              <input id="rsvpPublicUrl" readonly placeholder="Guarda el formulario para generar el enlace">
              <div class="rsvp-copy-actions"><button class="rsvp-btn" id="rsvpCopyUrl" type="button">Copiar enlace RSVP</button><button class="rsvp-btn dark" id="rsvpOpenUrl" type="button">Abrir Confirmación</button></div>
              <textarea id="rsvpEmbedCode" readonly placeholder="Aquí aparecerá el código para Confirmación"></textarea>
              <div class="rsvp-copy-actions"><button class="rsvp-btn" id="rsvpCopyEmbed" type="button">Copiar código RSVP</button></div>
            </div>
            <div class="rsvp-code-box mgd-music-integrate-box">
              <label>2. Solo Música</label>
              <p>Para pedir canciones sin mostrar el formulario de confirmación.</p>
              <input id="mgdMusicPublicUrl" readonly placeholder="Guarda el formulario para generar el enlace">
              <div class="rsvp-copy-actions"><button class="rsvp-btn" id="mgdCopyMusicUrl" type="button">Copiar enlace Música</button><button class="rsvp-btn dark" id="mgdOpenMusicUrl" type="button">Abrir Música</button></div>
              <textarea id="mgdMusicEmbedCode" readonly placeholder="Aquí aparecerá el código para Música"></textarea>
              <div class="rsvp-copy-actions"><button class="rsvp-btn" id="mgdCopyMusicEmbed" type="button">Copiar código Música</button></div>
            </div>
            <div class="rsvp-code-box">
              <label>3. Confirmación + Música</label>
              <p>Muestra los dos formularios juntos en una sola vista.</p>
              <input id="rsvpCombinedUrl" readonly placeholder="Guarda el formulario para generar el enlace">
              <div class="rsvp-copy-actions"><button class="rsvp-btn" id="rsvpCopyCombinedUrl" type="button">Copiar enlace completo</button><button class="rsvp-btn dark" id="rsvpOpenCombinedUrl" type="button">Abrir ambos</button></div>
              <textarea id="rsvpCombinedEmbedCode" readonly placeholder="Aquí aparecerá el código combinado"></textarea>
              <div class="rsvp-copy-actions"><button class="rsvp-btn" id="rsvpCopyCombinedEmbed" type="button">Copiar código combinado</button><button class="rsvp-btn danger" id="rsvpRegenerateLink" type="button">Regenerar token</button></div>
            </div>
          </div>
          <div class="rsvp-note"><strong>Los tres usan el mismo token de la boda.</strong> Así puedes publicarlos por separado sin perder la relación entre quién confirmó y qué canción pidió. Regenerar el token cambia las tres opciones.</div>
        </div>

        <div class="rsvp-card rsvp-integration-guide">
          <div class="rsvp-card-head"><div><h3>Cómo integrarlo dentro de la invitación</h3><p>El formulario puede abrirse detrás de una imagen o GIF y aparecer como parte natural de la invitación. No necesitas crear otro index ni usar iframe.</p></div></div>
          <ol class="rsvp-guide-steps">
            <li><strong>Usa tu GIF o imagen como botón.</strong><span>Al hacer clic, abre un contenedor oculto dentro de la misma invitación.</span></li>
            <li><strong>Pega el DIV generado dentro de ese contenedor.</strong><span>Elige el DIV de Confirmación, Música o ambos según la experiencia que quieras.</span></li>
            <li><strong>Pega el script una sola vez.</strong><span>Aunque uses dos DIV, el archivo <code>rsvp-native-widget.js</code> solo debe cargarse una vez, al final de la invitación.</span></li>
            <li><strong>Muestra el contenedor al abrir.</strong><span>Puedes usar una clase como <code>is-open</code>; el formulario se dibuja dentro de tu diseño y conserva sus respuestas.</span></li>
          </ol>
          <div class="rsvp-case-grid">
            <article><strong>Antes de elegir</strong><p>No se muestra la cantidad. Primero debe responder Sí, No o Por confirmar.</p></article>
            <article><strong>Si responde Sí</strong><p>Aparecen cantidad y acompañantes. Al guardar verá el mensaje positivo que elegiste y podrá pedir música.</p></article>
            <article><strong>Si responde No</strong><p>La cantidad desaparece, se guarda 0 asistentes y se muestra el mensaje de ausencia. La música queda desactivada por ser exclusiva para asistentes.</p></article>
            <article><strong>Si modifica</strong><p>Con la opción activada puede volver al formulario. Si cambia de Sí a No, su acceso musical se cancela automáticamente.</p></article>
          </div>
          <div class="rsvp-note"><strong>Separado también queda relacionado:</strong> Confirmación y Música pueden estar en distintas partes de la invitación. Usa el mismo token en ambos DIV para identificar qué persona confirmó y qué canciones propuso.</div>
        </div>
      </section>
    </div>
  `;
}

function fieldRowMarkup(key, config) {
  return `
    <label class="rsvp-toggle-row" data-built-in-field="${escapeHtml(key)}">
      <input type="checkbox" data-field-enabled ${config.enabled ? 'checked' : ''}>
      <span class="rsvp-toggle-copy"><strong>${escapeHtml(config.label)}</strong><span>${key === 'companions' ? 'Nombres de quienes acompañan a quien responde' : key === 'menu' ? 'Selección de plato o menú' : 'Dato opcional del RSVP'}</span></span>
      <span class="rsvp-required"><input type="checkbox" data-field-required ${config.required ? 'checked' : ''}> obligatorio</span>
    </label>`;
}

function customFieldMarkup(field = {}, index = 0) {
  const type = field.type || 'text';
  return `
    <div class="rsvp-custom-row" data-custom-field data-type="${escapeHtml(type)}">
      <input data-custom-label maxlength="70" placeholder="Nombre del campo" value="${escapeHtml(field.label || '')}">
      <select data-custom-type>
        <option value="text" ${type === 'text' ? 'selected' : ''}>Texto</option>
        <option value="textarea" ${type === 'textarea' ? 'selected' : ''}>Texto largo</option>
        <option value="select" ${type === 'select' ? 'selected' : ''}>Lista</option>
        <option value="yesno" ${type === 'yesno' ? 'selected' : ''}>Sí / No</option>
      </select>
      <label class="rsvp-required"><input type="checkbox" data-custom-required ${field.required ? 'checked' : ''}> obligatorio</label>
      <button class="rsvp-btn danger" type="button" data-remove-custom>Quitar</button>
      <div class="rsvp-custom-options"><textarea data-custom-options placeholder="Opciones · una por línea">${escapeHtml((field.options || []).join('\n'))}</textarea></div>
      <input type="hidden" data-custom-key value="${escapeHtml(field.key || `custom_${index + 1}`)}">
    </div>`;
}

function renderConfig(doc) {
  if (!rsvpConfig) return;
  doc.getElementById('rsvpMaxGuests').value = String(rsvpConfig.maxGuests || 4);
  doc.getElementById('rsvpActive').value = rsvpConfig.active ? 'true' : 'false';
  doc.getElementById('rsvpFormTitle').value = rsvpConfig.formTitle || '';
  doc.getElementById('rsvpWelcomeText').value = rsvpConfig.welcomeText || '';
  doc.getElementById('rsvpAllowTentative').checked = rsvpConfig.allowTentative !== false;
  doc.getElementById('rsvpConfirmedMessage').value = rsvpConfig.confirmedMessage || RSVP_MESSAGE_PRESETS.confirmed[0];
  doc.getElementById('rsvpDeclinedMessage').value = rsvpConfig.declinedMessage || RSVP_MESSAGE_PRESETS.declined[0];
  doc.getElementById('rsvpAllowEditResponse').checked = rsvpConfig.allowEditResponse !== false;
  doc.getElementById('rsvpBuiltInFields').innerHTML = Object.entries(rsvpConfig.fields || RSVP_DEFAULT_FIELDS)
    .map(([key, config]) => fieldRowMarkup(key, config)).join('');
  doc.getElementById('rsvpMenuOptions').value = (rsvpConfig.menuOptions || []).join('\n');
  doc.getElementById('rsvpCustomFields').innerHTML = (rsvpConfig.customFields || []).map(customFieldMarkup).join('');
  updateMenuVisibility(doc);
  renderRsvpPreview(doc);
  renderIntegration(doc);
  renderPublishState(doc);
}

function renderPublishState(doc) {
  const state = doc.getElementById('rsvpPublishState');
  if (!state) return;
  const published = Boolean(rsvpConfig?.token);
  state.textContent = !published ? 'Sin publicar' : rsvpConfig.active ? 'Formulario activo' : 'Formulario pausado';
  state.classList.toggle('is-active', published && rsvpConfig.active);
}

function renderIntegration(doc) {
  const token = rsvpConfig?.token || '';
  const url = publicRsvpUrl(token, 'rsvp');
  const code = rsvpEmbedCode(token);
  const musicUrl = publicRsvpUrl(token, 'music');
  const combinedUrl = publicRsvpUrl(token, 'all');
  const urlInput = doc.getElementById('rsvpPublicUrl');
  const codeInput = doc.getElementById('rsvpEmbedCode');
  if (urlInput) urlInput.value = url;
  if (codeInput) codeInput.value = code;
  const musicUrlInput = doc.getElementById('mgdMusicPublicUrl');
  const musicCodeInput = doc.getElementById('mgdMusicEmbedCode');
  const combinedUrlInput = doc.getElementById('rsvpCombinedUrl');
  const combinedCodeInput = doc.getElementById('rsvpCombinedEmbedCode');
  if (musicUrlInput) musicUrlInput.value = musicUrl;
  if (musicCodeInput) musicCodeInput.value = musicEmbedCode(token);
  if (combinedUrlInput) combinedUrlInput.value = combinedUrl;
  if (combinedCodeInput) combinedCodeInput.value = combinedEmbedCode(token);
  ['rsvpCopyUrl', 'rsvpOpenUrl', 'rsvpCopyEmbed', 'mgdCopyMusicUrl', 'mgdOpenMusicUrl', 'mgdCopyMusicEmbed', 'rsvpCopyCombinedUrl', 'rsvpOpenCombinedUrl', 'rsvpCopyCombinedEmbed', 'rsvpRegenerateLink'].forEach((id) => {
    const button = doc.getElementById(id);
    if (button) button.disabled = !token;
  });
}

function renderKpis(doc) {
  const kpi = calculateKpis();
  const values = {
    rsvpKpiResponses: kpi.responses,
    rsvpKpiConfirmed: kpi.confirmed,
    rsvpKpiPeople: kpi.peopleConfirmed,
    rsvpKpiPending: kpi.unreviewed,
    rsvpKpiDeclined: kpi.declined
  };
  Object.entries(values).forEach(([id, value]) => {
    const el = doc.getElementById(id);
    if (el) el.textContent = String(value);
  });
}

function optionMarkup(guest, selectedIds) {
  const selected = selectedIds.has(guest.id) ? 'selected' : '';
  const detail = [guest.status ? statusLabel(guest.status) : '', guest.relation || ''].filter(Boolean).join(' · ');
  return `<option value="${escapeHtml(guest.id)}" ${selected}>${escapeHtml(guest.name || 'Sin nombre')}${detail ? ` — ${escapeHtml(detail)}` : ''}</option>`;
}

function renderResponseTags(item, meta) {
  const tags = responseTags(item, meta);
  if (meta.reviewed) tags.push('Revisado');
  if (Array.isArray(meta.linkedGuestIds) && meta.linkedGuestIds.length) tags.push(`${meta.linkedGuestIds.length} vinculado(s)`);
  else tags.push('Sin vincular');
  return tags.map((tag) => `<span class="rsvp-chip rsvp-admin-tag">${escapeHtml(tag)}</span>`).join('');
}

function renderResponses(doc) {
  const host = doc.getElementById('rsvpResponsesList');
  if (!host) return;
  const latest = effectiveResponses();
  const roster = readGuestState().guests || [];

  if (!latest.length) {
    host.innerHTML = '<div class="rsvp-empty">Todavía no hay respuestas. Cuando alguien use el formulario digital, aparecerá aquí exactamente como la persona lo escribió.</div>';
    renderKpis(doc);
    return;
  }

  host.innerHTML = latest.map((item) => {
    const meta = responseManagement.get(item.id) || {};
    const selectedIds = new Set(Array.isArray(meta.linkedGuestIds) ? meta.linkedGuestIds : []);
    const suggestions = suggestedGuestIds(item);
    const companions = Array.isArray(item.companions) ? item.companions.filter(Boolean) : [];
    const detailChips = [];
    if (item.menu) detailChips.push(`Menú: ${item.menu}`);
    if (item.restriction) detailChips.push(`Restricción: ${item.restriction}`);
    if (companions.length) detailChips.push(`Acompañantes: ${companions.join(', ')}`);
    if (item.notes) detailChips.push(`Nota: ${item.notes}`);

    return `
      <article class="rsvp-response rsvp-response-v2" data-rsvp-response-id="${escapeHtml(item.id)}">
        <div class="rsvp-response-main">
          <div class="rsvp-response-name">
            <strong>${escapeHtml(item.name || 'Sin nombre')}</strong>
            <span>${escapeHtml(item.email || item.phone || 'Respuesta sin datos de contacto')}</span>
          </div>
          <div class="rsvp-response-summary">
            <span class="rsvp-status ${escapeHtml(item.attendance || 'pending')}">${escapeHtml(statusLabel(item.attendance))}</span>
            <span class="rsvp-qty">${item.attendance === 'declined' ? '0' : Math.max(1, Number(item.quantity || 1))} pers.</span>
            <span class="rsvp-response-date">${escapeHtml(formatDate(item.submittedAtDate || item.clientDate))}</span>
          </div>
          <div class="rsvp-detail-chips">${detailChips.map((chip) => `<span class="rsvp-chip">${escapeHtml(chip)}</span>`).join('')}</div>
          <div class="rsvp-admin-tags">${renderResponseTags(item, meta)}</div>
        </div>

        <details class="rsvp-review-panel">
          <summary>Clasificar y vincular</summary>
          <div class="rsvp-review-grid">
            <label class="rsvp-field">
              <span>Tipo / grupo</span>
              <select data-rsvp-group>
                <option value="">Sin etiqueta</option>
                <option value="familia" ${meta.group === 'familia' ? 'selected' : ''}>Familia</option>
                <option value="amigos" ${meta.group === 'amigos' ? 'selected' : ''}>Amigos</option>
                <option value="trabajo" ${meta.group === 'trabajo' ? 'selected' : ''}>Trabajo</option>
                <option value="otros" ${meta.group === 'otros' ? 'selected' : ''}>Otros</option>
              </select>
            </label>
            <label class="rsvp-field">
              <span>Lado</span>
              <select data-rsvp-side>
                <option value="">Sin definir</option>
                <option value="novio" ${meta.side === 'novio' ? 'selected' : ''}>Del novio</option>
                <option value="novia" ${meta.side === 'novia' ? 'selected' : ''}>De la novia</option>
                <option value="ambos" ${meta.side === 'ambos' ? 'selected' : ''}>De ambos</option>
              </select>
            </label>
            <label class="rsvp-field rsvp-family-field">
              <span>Etiqueta familiar / grupo</span>
              <input data-rsvp-family-label maxlength="100" placeholder="Ej. Familia García" value="${escapeHtml(meta.familyLabel || '')}">
            </label>
          </div>

          <div class="rsvp-match-box">
            <div>
              <strong>Vincular con tu lista de invitados</strong>
              <p>Selecciona una o varias personas que ya existen en tu lista. Una respuesta de “Papá” puede vincularse, por ejemplo, con padre, madre e hija.</p>
            </div>
            ${suggestions.length ? `<button class="rsvp-btn" type="button" data-use-rsvp-suggestions data-suggestions="${escapeHtml(suggestions.join(','))}">Usar ${suggestions.length} coincidencia(s)</button>` : '<span class="rsvp-no-match">Sin coincidencia exacta por nombre · selección manual disponible</span>'}
          </div>

          <select class="rsvp-guest-link-select" data-rsvp-linked-guests multiple size="${Math.min(7, Math.max(4, roster.length || 4))}">
            ${roster.length ? roster.map((guest) => optionMarkup(guest, selectedIds)).join('') : '<option disabled>No hay invitados cargados todavía</option>'}
          </select>
          <div class="rsvp-link-help">Ctrl/Cmd + clic permite elegir varias personas. La cantidad del RSVP es informativa: tú decides exactamente a quién vincular.</div>

          <div class="rsvp-review-actions">
            <button class="rsvp-btn" type="button" data-save-rsvp-management>Guardar etiquetas</button>
            <button class="rsvp-btn primary" type="button" data-apply-rsvp-guests>Aplicar a invitados</button>
            <button class="rsvp-btn danger" type="button" data-delete-rsvp="${escapeHtml(item.id)}">Eliminar respuesta</button>
          </div>
        </details>
      </article>`;
  }).join('');

  renderKpis(doc);
}

function updateMenuVisibility(doc) {
  const row = doc.querySelector('[data-built-in-field="menu"]');
  const enabled = row?.querySelector('[data-field-enabled]')?.checked;
  const field = doc.getElementById('rsvpMenuOptionsField');
  if (field) field.style.display = enabled ? '' : 'none';
}

function collectConfig(doc) {
  const fields = {};
  doc.querySelectorAll('[data-built-in-field]').forEach((row) => {
    const key = row.dataset.builtInField;
    const previous = rsvpConfig?.fields?.[key] || RSVP_DEFAULT_FIELDS[key] || {};
    fields[key] = {
      enabled: Boolean(row.querySelector('[data-field-enabled]')?.checked),
      required: Boolean(row.querySelector('[data-field-required]')?.checked),
      label: previous.label || key
    };
  });
  const customFields = [...doc.querySelectorAll('[data-custom-field]')].map((row, index) => ({
    key: row.querySelector('[data-custom-key]')?.value || `custom_${index + 1}`,
    label: row.querySelector('[data-custom-label]')?.value.trim() || `Campo ${index + 1}`,
    type: row.querySelector('[data-custom-type]')?.value || 'text',
    required: Boolean(row.querySelector('[data-custom-required]')?.checked),
    options: String(row.querySelector('[data-custom-options]')?.value || '').split('\n').map((item) => item.trim()).filter(Boolean)
  }));
  return {
    token: rsvpConfig?.token || '',
    active: doc.getElementById('rsvpActive').value === 'true',
    formTitle: doc.getElementById('rsvpFormTitle').value.trim(),
    welcomeText: doc.getElementById('rsvpWelcomeText').value.trim(),
    maxGuests: Number(doc.getElementById('rsvpMaxGuests').value || 1),
    allowTentative: doc.getElementById('rsvpAllowTentative').checked,
    confirmedMessage: doc.getElementById('rsvpConfirmedMessage').value,
    declinedMessage: doc.getElementById('rsvpDeclinedMessage').value,
    allowEditResponse: doc.getElementById('rsvpAllowEditResponse').checked,
    fields,
    menuOptions: doc.getElementById('rsvpMenuOptions').value.split('\n').map((item) => item.trim()).filter(Boolean),
    customFields
  };
}

function renderRsvpPreview(doc) {
  const host = doc.getElementById('rsvpLivePreview');
  if (!host) return;
  const config = collectConfig(doc);
  const enabledFields = Object.entries(config.fields).filter(([, field]) => field.enabled);
  host.innerHTML = `
    <div class="rsvp-preview-media"><span>✦</span><strong>Tu foto, imagen o GIF</strong><small>Aquí irá el elemento que abre la confirmación</small></div>
    <div class="rsvp-preview-form">
      <div class="rsvp-preview-eyebrow">CONFIRMACIÓN DE ASISTENCIA</div>
      <h4>${escapeHtml(config.formTitle || 'Confirma tu asistencia')}</h4>
      <p>${escapeHtml(config.welcomeText || 'Nos encantará compartir este día contigo.')}</p>
      <label><span>Nombre completo</span><i>Escribe tu nombre</i></label>
      <div class="rsvp-preview-label">Asistencia</div>
      <div class="rsvp-preview-attendance"><button type="button" data-preview-attendance="confirmed">Sí, asistiré</button><button type="button" data-preview-attendance="declined">No asistiré</button>${config.allowTentative ? '<button type="button" data-preview-attendance="tentative">Por confirmar</button>' : ''}</div>
      <div class="rsvp-preview-conditional" data-preview-conditional><label><span>Cantidad de asistentes</span><i>1</i></label></div>
      <div class="rsvp-preview-fields">${enabledFields.filter(([key]) => key !== 'companions').map(([, field]) => `<label><span>${escapeHtml(field.label)}${field.required ? ' *' : ''}</span><i>Respuesta del invitado</i></label>`).join('')}${config.customFields.map((field) => `<label><span>${escapeHtml(field.label)}${field.required ? ' *' : ''}</span><i>${field.type === 'select' ? escapeHtml(field.options[0] || 'Selecciona una opción') : field.type === 'yesno' ? 'Sí / No' : 'Respuesta del invitado'}</i></label>`).join('')}</div>
      <button class="rsvp-preview-submit" type="button">Enviar confirmación</button>
    </div>`;
  const conditional = host.querySelector('[data-preview-conditional]');
  host.querySelectorAll('[data-preview-attendance]').forEach((button) => button.addEventListener('click', () => {
    host.querySelectorAll('[data-preview-attendance]').forEach((item) => item.classList.toggle('is-selected', item === button));
    conditional.classList.toggle('is-visible', button.dataset.previewAttendance === 'confirmed');
  }));
}

function collectManagementFromCard(card) {
  return {
    group: card.querySelector('[data-rsvp-group]')?.value || '',
    side: card.querySelector('[data-rsvp-side]')?.value || '',
    familyLabel: card.querySelector('[data-rsvp-family-label]')?.value.trim() || '',
    linkedGuestIds: [...(card.querySelector('[data-rsvp-linked-guests]')?.selectedOptions || [])].map((option) => option.value)
  };
}

async function copyText(doc, text, button) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const previous = button.textContent;
    button.textContent = 'Copiado ✓';
    setTimeout(() => { button.textContent = previous; }, 1300);
  } catch (_) {
    const area = doc.createElement('textarea');
    area.value = text;
    doc.body.appendChild(area);
    area.select();
    doc.execCommand('copy');
    area.remove();
  }
}

function setSyncState(doc, message, type = '') {
  const el = doc.getElementById('rsvpSyncState');
  if (!el) return;
  el.textContent = message;
  el.className = `rsvp-sync-state${type ? ` is-${type}` : ''}`;
}

async function persistCardManagement(doc, card, applyToGuests = false) {
  if (!rsvpConfig?.token) throw new Error('Publica primero el formulario RSVP.');
  const responseId = card.dataset.rsvpResponseId;
  const response = responseById(responseId);
  if (!response) throw new Error('No se encontró la respuesta RSVP.');
  const meta = collectManagementFromCard(card);
  const saved = await saveManagement(rsvpConfig.token, responseId, meta);

  if (applyToGuests) {
    const linked = applyResponseToGuests(response, saved);
    setSyncState(doc, `${linked} invitado(s) actualizados desde esta respuesta`, 'success');
  } else {
    setSyncState(doc, 'Clasificación RSVP guardada', 'success');
  }
}

function bindPanel(doc) {
  doc.querySelectorAll('[data-rsvp-pane-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      doc.querySelectorAll('[data-rsvp-pane-tab]').forEach((item) => item.classList.toggle('is-active', item === button));
      doc.querySelectorAll('[data-rsvp-pane]').forEach((pane) => pane.classList.toggle('is-active', pane.dataset.rsvpPane === button.dataset.rsvpPaneTab));
    });
  });

  doc.getElementById('rsvpBuiltInFields')?.addEventListener('change', (event) => {
    if (event.target.matches('[data-field-enabled]')) updateMenuVisibility(doc);
    renderRsvpPreview(doc);
  });

  doc.getElementById('rsvpCustomFields')?.addEventListener('change', (event) => {
    if (event.target.matches('[data-custom-type]')) event.target.closest('[data-custom-field]').dataset.type = event.target.value;
    renderRsvpPreview(doc);
  });

  doc.querySelector('[data-rsvp-pane="form"]')?.addEventListener('input', (event) => {
    if (!event.target.closest('#rsvpLivePreview')) renderRsvpPreview(doc);
  });

  doc.getElementById('rsvpCustomFields')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-custom]');
    button?.closest('[data-custom-field]')?.remove();
    if (button) renderRsvpPreview(doc);
  });

  doc.getElementById('rsvpAddCustomField')?.addEventListener('click', () => {
    const host = doc.getElementById('rsvpCustomFields');
    const index = host.children.length;
    host.insertAdjacentHTML('beforeend', customFieldMarkup({ key: `custom_${Date.now()}` }, index));
    renderRsvpPreview(doc);
  });

  doc.getElementById('rsvpSaveConfig')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Guardando…';
    try {
      rsvpConfig = await saveRsvpConfig(collectConfig(doc));
      renderConfig(doc);
      restartSubscriptions(doc);
      setSyncState(doc, 'Configuración publicada en Firebase', 'success');
    } catch (error) {
      console.error(error);
      setSyncState(doc, error?.message || 'No se pudo guardar el RSVP.', 'error');
    } finally {
      button.disabled = false;
      button.textContent = 'Guardar y publicar RSVP';
    }
  });

  doc.getElementById('rsvpRefreshButton')?.addEventListener('click', () => refreshPanel(doc));

  const openPublic = () => {
    const url = publicRsvpUrl(rsvpConfig?.token || '');
    if (url) window.open(url, '_blank', 'noopener');
  };
  doc.getElementById('rsvpOpenPublicButton')?.addEventListener('click', openPublic);
  doc.getElementById('rsvpOpenUrl')?.addEventListener('click', openPublic);
  doc.getElementById('rsvpCopyUrl')?.addEventListener('click', (event) => copyText(doc, publicRsvpUrl(rsvpConfig?.token || '', 'rsvp'), event.currentTarget));
  doc.getElementById('rsvpCopyEmbed')?.addEventListener('click', (event) => copyText(doc, rsvpEmbedCode(rsvpConfig?.token || ''), event.currentTarget));
  doc.getElementById('rsvpCopyCombinedUrl')?.addEventListener('click', (event) => copyText(doc, publicRsvpUrl(rsvpConfig?.token || '', 'all'), event.currentTarget));
  doc.getElementById('rsvpCopyCombinedEmbed')?.addEventListener('click', (event) => copyText(doc, combinedEmbedCode(rsvpConfig?.token || ''), event.currentTarget));
  doc.getElementById('rsvpOpenCombinedUrl')?.addEventListener('click', () => {
    const url = publicRsvpUrl(rsvpConfig?.token || '', 'all');
    if (url) window.open(url, '_blank', 'noopener');
  });

  doc.getElementById('rsvpRegenerateLink')?.addEventListener('click', async (event) => {
    if (!confirm('¿Regenerar el enlace RSVP? El enlace anterior dejará de aceptar respuestas.')) return;
    const button = event.currentTarget;
    button.disabled = true;
    try {
      rsvpConfig = await regenerateRsvpToken(collectConfig(doc));
      responses = [];
      responseManagement = new Map();
      renderConfig(doc);
      renderResponses(doc);
      restartSubscriptions(doc);
      setSyncState(doc, 'Nuevo enlace generado. La bandeja corresponde ahora al nuevo formulario.', 'success');
    } catch (error) {
      setSyncState(doc, error?.message || 'No se pudo regenerar el enlace.', 'error');
    } finally {
      button.disabled = false;
    }
  });

  doc.getElementById('rsvpResponsesList')?.addEventListener('click', async (event) => {
    const suggestionButton = event.target.closest('[data-use-rsvp-suggestions]');
    if (suggestionButton) {
      const card = suggestionButton.closest('[data-rsvp-response-id]');
      const ids = String(suggestionButton.dataset.suggestions || '').split(',').filter(Boolean);
      const select = card?.querySelector('[data-rsvp-linked-guests]');
      if (select) [...select.options].forEach((option) => { option.selected = ids.includes(option.value); });
      return;
    }

    const saveButton = event.target.closest('[data-save-rsvp-management]');
    if (saveButton) {
      const card = saveButton.closest('[data-rsvp-response-id]');
      saveButton.disabled = true;
      try {
        await persistCardManagement(doc, card, false);
      } catch (error) {
        console.error(error);
        setSyncState(doc, error?.message || 'No se pudo guardar la clasificación.', 'error');
      } finally {
        saveButton.disabled = false;
      }
      return;
    }

    const applyButton = event.target.closest('[data-apply-rsvp-guests]');
    if (applyButton) {
      const card = applyButton.closest('[data-rsvp-response-id]');
      applyButton.disabled = true;
      applyButton.textContent = 'Aplicando…';
      try {
        await persistCardManagement(doc, card, true);
      } catch (error) {
        console.error(error);
        setSyncState(doc, error?.message || 'No se pudo aplicar la respuesta a invitados.', 'error');
      } finally {
        applyButton.disabled = false;
        applyButton.textContent = 'Aplicar a invitados';
      }
      return;
    }

    const deleteButton = event.target.closest('[data-delete-rsvp]');
    if (deleteButton && rsvpConfig?.token) {
      if (!confirm('¿Eliminar esta respuesta RSVP? La lista de invitados no se eliminará ni se revertirá automáticamente.')) return;
      deleteButton.disabled = true;
      try {
        await deleteRsvpResponse(rsvpConfig.token, deleteButton.dataset.deleteRsvp);
        await deleteManagement(rsvpConfig.token, deleteButton.dataset.deleteRsvp).catch(() => {});
      } catch (error) {
        setSyncState(doc, error?.message || 'No se pudo eliminar la respuesta.', 'error');
        deleteButton.disabled = false;
      }
    }
  });
}

function restartSubscriptions(doc) {
  unsubscribeResponses?.();
  unsubscribeManagement?.();
  unsubscribeResponses = null;
  unsubscribeManagement = null;

  if (!rsvpConfig?.token) {
    responses = [];
    responseManagement = new Map();
    renderResponses(doc);
    return;
  }

  const token = rsvpConfig.token;
  unsubscribeResponses = subscribeRsvpResponses(token, (items) => {
    responses = items;
    renderResponses(doc);
    setSyncState(doc, 'Bandeja RSVP conectada · revisión manual', 'success');
  }, async (error) => {
    console.error('RSVP snapshot error:', error);
    try {
      responses = await listRsvpResponses(token);
      renderResponses(doc);
      setSyncState(doc, 'Respuestas actualizadas', 'success');
    } catch (fallbackError) {
      setSyncState(doc, fallbackError?.message || 'No se pudieron leer las respuestas.', 'error');
    }
  });

  unsubscribeManagement = subscribeManagement(token, (items) => {
    responseManagement = new Map(items.map((item) => [item.responseId, item]));
    renderResponses(doc);
  }, (error) => {
    console.error('RSVP management snapshot error:', error);
    setSyncState(doc, error?.message || 'No se pudieron leer las clasificaciones RSVP.', 'error');
  });
}

async function refreshPanel(doc) {
  setSyncState(doc, 'Cargando RSVP…');
  try {
    rsvpConfig = await loadRsvpConfig();
    renderConfig(doc);
    if (rsvpConfig.token) {
      const [responseItems, managementItems] = await Promise.all([
        listRsvpResponses(rsvpConfig.token),
        listManagement(rsvpConfig.token)
      ]);
      responses = responseItems;
      responseManagement = new Map(managementItems.map((item) => [item.responseId, item]));
    } else {
      responses = [];
      responseManagement = new Map();
    }
    renderResponses(doc);
    restartSubscriptions(doc);
    setSyncState(doc, rsvpConfig.token ? 'Bandeja RSVP conectada · revisión manual' : 'Configura y publica tu formulario');
  } catch (error) {
    console.error('No se pudo cargar RSVP:', error);
    setSyncState(doc, error?.message || 'No se pudo cargar RSVP.', 'error');
  }
}

function activateRsvpView(doc) {
  ['listView', 'tablesView', 'mapView'].forEach((id) => {
    const element = doc.getElementById(id);
    if (element) element.hidden = true;
  });
  doc.querySelectorAll('[data-view]').forEach((button) => button.classList.remove('active'));
  const panel = doc.getElementById('rsvpNativeView');
  if (panel) panel.hidden = false;
  doc.getElementById('rsvpNativeTab')?.classList.add('active');
  refreshPanel(doc);
}

function leaveRsvpView(doc) {
  const panel = doc.getElementById('rsvpNativeView');
  if (panel) panel.hidden = true;
  doc.getElementById('rsvpNativeTab')?.classList.remove('active');
}

function injectRsvpIntoFrame(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  if (!doc?.body || !doc.getElementById('guestList') || !doc.querySelector('.view-tabs')) return false;

  if (doc.getElementById('rsvpNativeView')) {
    guestFrame = frame;
    guestDocument = doc;
    return true;
  }

  guestFrame = frame;
  guestDocument = doc;
  ensureStyles(doc);

  const tabs = doc.querySelector('.view-tabs');
  const tab = doc.createElement('button');
  tab.className = 'view-tab';
  tab.id = 'rsvpNativeTab';
  tab.type = 'button';
  tab.textContent = 'RSVP';
  tab.addEventListener('click', () => activateRsvpView(doc));
  tabs.appendChild(tab);

  doc.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => leaveRsvpView(doc));
  });

  const panel = doc.createElement('section');
  panel.id = 'rsvpNativeView';
  panel.hidden = true;
  panel.innerHTML = panelMarkup();
  const mapView = doc.getElementById('mapView');
  mapView?.insertAdjacentElement('afterend', panel);
  bindPanel(doc);
  refreshPanel(doc);
  return true;
}

function scanFrames() {
  clearTimeout(attachTimer);
  attachTimer = setTimeout(() => {
    const frames = [...document.querySelectorAll('#unifiedWorkspace iframe, iframe')];
    for (const frame of frames) {
      if (injectRsvpIntoFrame(frame)) {
        if (!frame.dataset.rsvpNativeBound) {
          frame.dataset.rsvpNativeBound = '1';
          frame.addEventListener('load', () => {
            setTimeout(() => injectRsvpIntoFrame(frame), 60);
          });
        }
        break;
      }
    }
  }, 60);
}

const observer = new MutationObserver(scanFrames);
observer.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', scanFrames);
window.addEventListener('load', scanFrames);
window.addEventListener('migrandia:wedding-context', () => {
  unsubscribeResponses?.();
  unsubscribeManagement?.();
  unsubscribeResponses = null;
  unsubscribeManagement = null;
  responses = [];
  responseManagement = new Map();
  rsvpConfig = null;
  if (guestDocument?.getElementById('rsvpNativeView')) refreshPanel(guestDocument);
  scanFrames();
});

if (document.readyState !== 'loading') scanFrames();
