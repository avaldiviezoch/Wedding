import {
  RSVP_ATTENDANCE,
  RSVP_DEFAULT_FIELDS,
  deleteRsvpResponse,
  loadRsvpConfig,
  listRsvpResponses,
  publicRsvpUrl,
  regenerateRsvpToken,
  rsvpEmbedCode,
  saveRsvpConfig,
  subscribeRsvpResponses
} from './rsvp-service.js?v=20260814-1205-rsvp1';

export const moduleId = 'invitados';

const VERSION = '20260814-1205-rsvp1';
const GUEST_STORAGE_KEY = 'planificador_bodas_invitados_v1';
const SHARED_STORAGE_KEY = 'planificador_bodas_datos_compartidos_v1';
const RSVP_CSS_URL = new URL(`css/modules/invitados-rsvp.css?v=${VERSION}`, document.baseURI).href;

let guestFrame = null;
let guestDocument = null;
let rsvpConfig = null;
let responses = [];
let unsubscribeResponses = null;
let attachTimer = 0;
let lastSyncSignature = '';

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
    version: 1,
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
      notes: guest.notes || ''
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

function effectiveResponses(items = responses) {
  const byName = new Map();
  [...items]
    .sort((a, b) => {
      const ta = a.submittedAtDate?.getTime?.() || a.updatedAtDate?.getTime?.() || 0;
      const tb = b.submittedAtDate?.getTime?.() || b.updatedAtDate?.getTime?.() || 0;
      return tb - ta;
    })
    .forEach((item) => {
      const key = normalizeName(item.name);
      if (!key || byName.has(key)) return;
      byName.set(key, item);
    });
  return [...byName.values()];
}

function responseNote(response) {
  const parts = [];
  if (response.menu) parts.push(`Menú: ${response.menu}`);
  if (response.quantity) parts.push(`Cantidad RSVP: ${response.quantity}`);
  if (response.customData && typeof response.customData === 'object') {
    const custom = Object.entries(response.customData)
      .filter(([, value]) => String(value ?? '').trim())
      .slice(0, 4)
      .map(([key, value]) => `${key}: ${value}`);
    parts.push(...custom);
  }
  return parts.length ? `[RSVP] ${parts.join(' · ')}` : '';
}

function mergeRsvpIntoGuests(items = responses) {
  const data = readGuestState();
  const originalGuests = data.guests || [];
  let guests = originalGuests.map((guest) => ({ ...guest }));
  const latest = effectiveResponses(items);

  latest.forEach((response) => {
    const attendance = ['confirmed', 'declined', 'tentative'].includes(response.attendance)
      ? response.attendance
      : 'pending';
    const guestStatus = attendance === 'confirmed'
      ? 'confirmed'
      : attendance === 'declined'
        ? 'declined'
        : 'pending';
    const mainName = String(response.name || '').trim();
    if (!mainName) return;

    const responsePrefix = `rsvp_${String(response.id || '').replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const mainKey = normalizeName(mainName);
    let mainGuest = guests.find((guest) => normalizeName(guest.name) === mainKey);
    if (!mainGuest) {
      mainGuest = {
        id: `${responsePrefix}_main`,
        name: mainName,
        status: 'pending',
        invitationSent: true,
        side: 'ambos',
        relation: '',
        phone: '',
        email: '',
        restriction: 'Ninguna',
        tableId: '',
        seatNumber: null,
        photoId: '',
        photoThumb: '',
        notes: '',
        order: guests.length,
        createdAt: new Date().toISOString()
      };
      guests.push(mainGuest);
    }

    mainGuest.name = mainName;
    mainGuest.status = guestStatus;
    mainGuest.invitationSent = true;
    if (response.phone) mainGuest.phone = String(response.phone).trim();
    if (response.email) mainGuest.email = String(response.email).trim();
    if (response.restriction) mainGuest.restriction = String(response.restriction).trim();
    const note = responseNote(response);
    if (note) {
      const previous = String(mainGuest.notes || '')
        .split('\n')
        .filter((line) => !line.trim().startsWith('[RSVP]'))
        .join('\n')
        .trim();
      mainGuest.notes = [previous, note].filter(Boolean).join('\n');
    }

    const desiredCompanions = attendance === 'confirmed'
      ? Math.max(0, Math.min(19, Number(response.quantity || 1) - 1))
      : 0;
    const companionNames = Array.isArray(response.companions) ? response.companions : [];
    const desiredIds = new Set();

    for (let index = 0; index < desiredCompanions; index++) {
      const companionName = String(companionNames[index] || '').trim()
        || `Acompañante de ${mainName} ${index + 1}`;
      const companionKey = normalizeName(companionName);
      let companion = guests.find((guest) => normalizeName(guest.name) === companionKey);
      const generatedId = `${responsePrefix}_c${index + 1}`;
      desiredIds.add(generatedId);

      if (!companion) {
        companion = {
          id: generatedId,
          name: companionName,
          status: 'confirmed',
          invitationSent: true,
          side: mainGuest.side || 'ambos',
          relation: mainGuest.relation || `Acompañante de ${mainName}`,
          phone: '',
          email: '',
          restriction: 'Ninguna',
          tableId: '',
          seatNumber: null,
          photoId: '',
          photoThumb: '',
          notes: `[RSVP] Acompañante de ${mainName}`,
          order: guests.length,
          createdAt: new Date().toISOString()
        };
        guests.push(companion);
      } else {
        companion.status = 'confirmed';
        companion.invitationSent = true;
      }
    }

    guests = guests.filter((guest) => {
      if (!String(guest.id || '').startsWith(`${responsePrefix}_c`)) return true;
      return desiredIds.has(guest.id);
    });
  });

  guests.forEach((guest, index) => { guest.order = index; });
  return { ...data, guests };
}

function guestSyncSignature(data) {
  return JSON.stringify((data.guests || []).map((guest) => [
    guest.id, guest.name, guest.status, guest.invitationSent, guest.email, guest.phone,
    guest.restriction, guest.tableId, guest.seatNumber, guest.notes
  ]));
}

function synchronizeResponsesWithGuests(force = false) {
  if (!responses.length) return false;
  const merged = mergeRsvpIntoGuests(responses);
  const signature = guestSyncSignature(merged);
  if (!force && signature === lastSyncSignature) return false;
  lastSyncSignature = signature;

  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(merged));
  const shared = buildSharedState(merged);
  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(shared));

  try {
    guestFrame?.contentWindow?.postMessage({
      type: 'MIGRANDIA_RSVP_SYNC',
      payload: { guests: merged.guests, tables: merged.tables }
    }, '*');
  } catch (error) {
    console.warn('No se pudo refrescar Invitados en caliente:', error);
  }

  window.dispatchEvent(new CustomEvent('migrandia:datachange', {
    detail: { source: 'rsvp', guests: merged.guests.length }
  }));
  return true;
}

function calculateKpis() {
  const roster = readGuestState().guests || [];
  const latest = effectiveResponses();
  const confirmed = latest.filter((item) => item.attendance === 'confirmed');
  const declined = latest.filter((item) => item.attendance === 'declined');
  const tentative = latest.filter((item) => item.attendance === 'tentative');
  const peopleConfirmed = confirmed.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0);
  const pending = roster.filter((guest) => guest.status === 'pending').length;
  return {
    responses: latest.length,
    confirmed: confirmed.length,
    peopleConfirmed,
    pending,
    declined: declined.length,
    tentative: tentative.length
  };
}

function ensureStyles(doc) {
  if (doc.querySelector('link[data-rsvp-native-css]')) return;
  const link = doc.createElement('link');
  link.rel = 'stylesheet';
  link.href = RSVP_CSS_URL;
  link.dataset.rsvpNativeCss = 'true';
  doc.head.appendChild(link);
}

function panelMarkup() {
  return `
    <div class="rsvp-admin-shell">
      <section class="rsvp-admin-hero">
        <div>
          <span class="rsvp-admin-eyebrow">Confirmaciones · Firebase</span>
          <h2>RSVP nativo</h2>
          <p>Recibe confirmaciones directamente en tu boda, controla cupos y campos, y sincroniza automáticamente los estados con Invitados, Mesas y Distribución.</p>
          <span class="rsvp-publish-state" id="rsvpPublishState">Sin publicar</span>
        </div>
        <div class="rsvp-admin-actions">
          <button class="rsvp-btn" id="rsvpRefreshButton" type="button">Actualizar</button>
          <button class="rsvp-btn dark" id="rsvpOpenPublicButton" type="button">Abrir formulario</button>
        </div>
      </section>

      <section class="rsvp-kpis">
        <article class="rsvp-kpi"><span>Respondieron</span><strong id="rsvpKpiResponses">0</strong></article>
        <article class="rsvp-kpi"><span>Confirmaciones</span><strong id="rsvpKpiConfirmed">0</strong></article>
        <article class="rsvp-kpi"><span>Personas confirmadas</span><strong id="rsvpKpiPeople">0</strong></article>
        <article class="rsvp-kpi"><span>Pendientes en lista</span><strong id="rsvpKpiPending">0</strong></article>
        <article class="rsvp-kpi"><span>No asistirán</span><strong id="rsvpKpiDeclined">0</strong></article>
      </section>

      <nav class="rsvp-admin-tabs" aria-label="RSVP">
        <button class="rsvp-admin-tab is-active" type="button" data-rsvp-pane-tab="responses">Respuestas</button>
        <button class="rsvp-admin-tab" type="button" data-rsvp-pane-tab="form">Formulario</button>
        <button class="rsvp-admin-tab" type="button" data-rsvp-pane-tab="integrate">&lt;/&gt; Integrar</button>
      </nav>

      <section class="rsvp-pane is-active" data-rsvp-pane="responses">
        <div class="rsvp-card">
          <div class="rsvp-card-head">
            <div><h3>Confirmaciones recibidas</h3><p>La respuesta más reciente de cada nombre alimenta automáticamente la lista de invitados.</p></div>
            <span class="rsvp-sync-state" id="rsvpSyncState">Esperando respuestas</span>
          </div>
          <div class="rsvp-responses-list" id="rsvpResponsesList"></div>
        </div>
      </section>

      <section class="rsvp-pane" data-rsvp-pane="form">
        <div class="rsvp-card">
          <div class="rsvp-card-head"><div><h3>Campos del formulario</h3><p>Fecha, Nombre, Asistencia y Cantidad son la base. Tú eliges el resto.</p></div></div>
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
          <div class="rsvp-card-head"><div><h3>Datos opcionales</h3><p>Activa solo los campos que realmente necesita esta boda.</p></div></div>
          <div class="rsvp-toggle-list" id="rsvpBuiltInFields"></div>
          <label class="rsvp-field wide" id="rsvpMenuOptionsField" style="margin-top:12px;display:none"><span>Opciones de menú · una por línea</span><textarea id="rsvpMenuOptions" placeholder="Carne\nPollo\nVegetariano"></textarea></label>
        </div>

        <div class="rsvp-card">
          <div class="rsvp-card-head"><div><h3>Campos personalizados</h3><p>Agrega preguntas propias como movilidad, canción favorita, transporte u otros datos.</p></div><button class="rsvp-btn" id="rsvpAddCustomField" type="button">+ Agregar campo</button></div>
          <div class="rsvp-custom-list" id="rsvpCustomFields"></div>
          <div class="rsvp-config-footer"><button class="rsvp-btn primary" id="rsvpSaveConfig" type="button">Guardar y publicar RSVP</button></div>
        </div>
      </section>

      <section class="rsvp-pane" data-rsvp-pane="integrate">
        <div class="rsvp-card">
          <div class="rsvp-card-head"><div><h3>Integrar en tu invitación</h3><p>Usa el enlace directo o inserta el formulario como HTML dentro de cualquiera de tus invitaciones.</p></div></div>
          <div class="rsvp-integrate-grid">
            <div class="rsvp-code-box">
              <label>Enlace público</label>
              <input id="rsvpPublicUrl" readonly placeholder="Guarda el formulario para generar el enlace">
              <div class="rsvp-copy-actions"><button class="rsvp-btn" id="rsvpCopyUrl" type="button">Copiar enlace</button><button class="rsvp-btn dark" id="rsvpOpenUrl" type="button">Abrir</button></div>
            </div>
            <div class="rsvp-code-box">
              <label>Código HTML &lt;/&gt;</label>
              <textarea id="rsvpEmbedCode" readonly placeholder="Aquí aparecerá el iframe para integrar"></textarea>
              <div class="rsvp-copy-actions"><button class="rsvp-btn" id="rsvpCopyEmbed" type="button">Copiar HTML</button><button class="rsvp-btn danger" id="rsvpRegenerateLink" type="button">Regenerar enlace</button></div>
            </div>
          </div>
          <div class="rsvp-note">El enlace contiene un token largo y no requiere que el invitado tenga cuenta. Las respuestas se guardan en Firestore y solo los colaboradores autorizados de la boda pueden leerlas.</div>
        </div>
      </section>
    </div>
  `;
}

function fieldRowMarkup(key, config) {
  return `
    <label class="rsvp-toggle-row" data-built-in-field="${escapeHtml(key)}">
      <input type="checkbox" data-field-enabled ${config.enabled ? 'checked' : ''}>
      <span class="rsvp-toggle-copy"><strong>${escapeHtml(config.label)}</strong><span>${key === 'companions' ? 'Nombres de quienes acompañan al invitado' : key === 'menu' ? 'Selección de plato o menú' : 'Dato opcional del RSVP'}</span></span>
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
  doc.getElementById('rsvpBuiltInFields').innerHTML = Object.entries(rsvpConfig.fields || RSVP_DEFAULT_FIELDS)
    .map(([key, config]) => fieldRowMarkup(key, config)).join('');
  doc.getElementById('rsvpMenuOptions').value = (rsvpConfig.menuOptions || []).join('\n');
  doc.getElementById('rsvpCustomFields').innerHTML = (rsvpConfig.customFields || [])
    .map(customFieldMarkup).join('');
  updateMenuVisibility(doc);
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
  const url = publicRsvpUrl(rsvpConfig?.token || '');
  const code = rsvpEmbedCode(rsvpConfig?.token || '');
  const urlInput = doc.getElementById('rsvpPublicUrl');
  const codeInput = doc.getElementById('rsvpEmbedCode');
  if (urlInput) urlInput.value = url;
  if (codeInput) codeInput.value = code;
  ['rsvpCopyUrl', 'rsvpOpenUrl', 'rsvpCopyEmbed', 'rsvpRegenerateLink'].forEach((id) => {
    const button = doc.getElementById(id);
    if (button) button.disabled = !rsvpConfig?.token;
  });
}

function renderKpis(doc) {
  const kpi = calculateKpis();
  const values = {
    rsvpKpiResponses: kpi.responses,
    rsvpKpiConfirmed: kpi.confirmed,
    rsvpKpiPeople: kpi.peopleConfirmed,
    rsvpKpiPending: kpi.pending,
    rsvpKpiDeclined: kpi.declined
  };
  Object.entries(values).forEach(([id, value]) => {
    const el = doc.getElementById(id);
    if (el) el.textContent = String(value);
  });
}

function renderResponses(doc) {
  const host = doc.getElementById('rsvpResponsesList');
  if (!host) return;
  const latest = effectiveResponses();
  if (!latest.length) {
    host.innerHTML = '<div class="rsvp-empty">Todavía no hay respuestas. Publica el enlace RSVP y las confirmaciones aparecerán aquí en tiempo real.</div>';
    renderKpis(doc);
    return;
  }
  host.innerHTML = latest.map((item) => {
    const chips = [];
    if (item.menu) chips.push(`Menú: ${escapeHtml(item.menu)}`);
    if (item.restriction) chips.push(escapeHtml(item.restriction));
    if (Array.isArray(item.companions) && item.companions.filter(Boolean).length) chips.push(`${item.companions.filter(Boolean).length} acompañante(s)`);
    return `
      <article class="rsvp-response">
        <div class="rsvp-response-name"><strong>${escapeHtml(item.name || 'Sin nombre')}</strong><span>${escapeHtml(item.email || item.phone || '')}</span></div>
        <span class="rsvp-status ${escapeHtml(item.attendance || 'pending')}">${escapeHtml(statusLabel(item.attendance))}</span>
        <span class="rsvp-qty">${item.attendance === 'declined' ? '0' : Math.max(1, Number(item.quantity || 1))} pers.</span>
        <div class="rsvp-detail-chips">${chips.map((chip) => `<span class="rsvp-chip">${chip}</span>`).join('')}</div>
        <button class="rsvp-btn danger" type="button" data-delete-rsvp="${escapeHtml(item.id)}">Eliminar</button>
        <span class="rsvp-response-date">${escapeHtml(formatDate(item.submittedAtDate || item.clientDate))}</span>
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
    fields,
    menuOptions: doc.getElementById('rsvpMenuOptions').value.split('\n').map((item) => item.trim()).filter(Boolean),
    customFields
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

function bindPanel(doc) {
  doc.querySelectorAll('[data-rsvp-pane-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      doc.querySelectorAll('[data-rsvp-pane-tab]').forEach((item) => item.classList.toggle('is-active', item === button));
      doc.querySelectorAll('[data-rsvp-pane]').forEach((pane) => pane.classList.toggle('is-active', pane.dataset.rsvpPane === button.dataset.rsvpPaneTab));
    });
  });

  doc.getElementById('rsvpBuiltInFields')?.addEventListener('change', (event) => {
    if (event.target.matches('[data-field-enabled]')) updateMenuVisibility(doc);
  });

  doc.getElementById('rsvpCustomFields')?.addEventListener('change', (event) => {
    if (event.target.matches('[data-custom-type]')) {
      event.target.closest('[data-custom-field]').dataset.type = event.target.value;
    }
  });
  doc.getElementById('rsvpCustomFields')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-custom]');
    button?.closest('[data-custom-field]')?.remove();
  });
  doc.getElementById('rsvpAddCustomField')?.addEventListener('click', () => {
    const host = doc.getElementById('rsvpCustomFields');
    const index = host.children.length;
    host.insertAdjacentHTML('beforeend', customFieldMarkup({ key: `custom_${Date.now()}` }, index));
  });

  doc.getElementById('rsvpSaveConfig')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Guardando…';
    try {
      rsvpConfig = await saveRsvpConfig(collectConfig(doc));
      renderConfig(doc);
      restartSubscription(doc);
      setSyncState(doc, 'Configuración publicada en Firebase', 'success');
    } catch (error) {
      console.error(error);
      setSyncState(doc, error?.message || 'No se pudo guardar el RSVP.', 'error');
    } finally {
      button.disabled = false;
      button.textContent = 'Guardar y publicar RSVP';
    }
  });

  doc.getElementById('rsvpRefreshButton')?.addEventListener('click', () => refreshPanel(doc, true));
  const openPublic = () => {
    const url = publicRsvpUrl(rsvpConfig?.token || '');
    if (url) window.open(url, '_blank', 'noopener');
  };
  doc.getElementById('rsvpOpenPublicButton')?.addEventListener('click', openPublic);
  doc.getElementById('rsvpOpenUrl')?.addEventListener('click', openPublic);
  doc.getElementById('rsvpCopyUrl')?.addEventListener('click', (event) => copyText(doc, publicRsvpUrl(rsvpConfig?.token || ''), event.currentTarget));
  doc.getElementById('rsvpCopyEmbed')?.addEventListener('click', (event) => copyText(doc, rsvpEmbedCode(rsvpConfig?.token || ''), event.currentTarget));
  doc.getElementById('rsvpRegenerateLink')?.addEventListener('click', async (event) => {
    if (!confirm('¿Regenerar el enlace RSVP? El enlace anterior dejará de aceptar respuestas.')) return;
    const button = event.currentTarget;
    button.disabled = true;
    try {
      rsvpConfig = await regenerateRsvpToken(collectConfig(doc));
      renderConfig(doc);
      restartSubscription(doc);
      setSyncState(doc, 'Nuevo enlace generado. Actualiza el enlace de tus invitaciones.', 'success');
    } catch (error) {
      setSyncState(doc, error?.message || 'No se pudo regenerar el enlace.', 'error');
    } finally {
      button.disabled = false;
    }
  });

  doc.getElementById('rsvpResponsesList')?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-rsvp]');
    if (!button || !rsvpConfig?.token) return;
    if (!confirm('¿Eliminar esta respuesta RSVP?')) return;
    button.disabled = true;
    try {
      await deleteRsvpResponse(rsvpConfig.token, button.dataset.deleteRsvp);
    } catch (error) {
      setSyncState(doc, error?.message || 'No se pudo eliminar la respuesta.', 'error');
      button.disabled = false;
    }
  });
}

function restartSubscription(doc) {
  unsubscribeResponses?.();
  unsubscribeResponses = null;
  if (!rsvpConfig?.token) {
    responses = [];
    renderResponses(doc);
    return;
  }
  unsubscribeResponses = subscribeRsvpResponses(rsvpConfig.token, (items) => {
    responses = items;
    const changed = synchronizeResponsesWithGuests();
    renderResponses(doc);
    setSyncState(doc, changed ? 'Lista de invitados y mesas sincronizada' : 'Firebase conectado · sincronizado', 'success');
  }, async (error) => {
    console.error('RSVP snapshot error:', error);
    try {
      responses = await listRsvpResponses(rsvpConfig.token);
      synchronizeResponsesWithGuests();
      renderResponses(doc);
      setSyncState(doc, 'Respuestas actualizadas', 'success');
    } catch (fallbackError) {
      setSyncState(doc, fallbackError?.message || 'No se pudieron leer las respuestas.', 'error');
    }
  });
}

async function refreshPanel(doc, forceSync = false) {
  setSyncState(doc, 'Cargando RSVP…');
  try {
    rsvpConfig = await loadRsvpConfig();
    renderConfig(doc);
    responses = rsvpConfig.token ? await listRsvpResponses(rsvpConfig.token) : [];
    if (forceSync) synchronizeResponsesWithGuests(true);
    renderResponses(doc);
    restartSubscription(doc);
    setSyncState(doc, rsvpConfig.token ? 'Firebase conectado · sincronizado' : 'Configura y publica tu formulario');
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
  unsubscribeResponses = null;
  responses = [];
  rsvpConfig = null;
  lastSyncSignature = '';
  if (guestDocument?.getElementById('rsvpNativeView')) refreshPanel(guestDocument);
  scanFrames();
});

if (document.readyState !== 'loading') scanFrames();
