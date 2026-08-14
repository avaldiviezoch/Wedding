import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc
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
const db = getFirestore(app);
const params = new URLSearchParams(location.search);
const token = String(params.get('token') || '').trim();

const root = document.getElementById('rsvpPublicRoot');
let config = null;
let session = null;

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function makeId() {
  return crypto?.randomUUID?.() || `rsvp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function getSession() {
  const key = `migrandia_rsvp_session_${token}`;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved?.id && saved?.editToken) return saved;
  } catch (_) {}
  const next = { id: makeId(), editToken: `${makeId()}${makeId()}`.replaceAll('-', '') };
  localStorage.setItem(key, JSON.stringify(next));
  return next;
}

function fieldLabel(field, fallback) {
  return escapeHtml(field?.label || fallback);
}

function requiredMark(required) {
  return required ? ' <em>*</em>' : '';
}

function builtInField(key) {
  return config?.fields?.[key] || { enabled: false, required: false };
}

function customFieldHtml(field) {
  const key = escapeHtml(field.key || makeId());
  const label = `${escapeHtml(field.label || 'Dato adicional')}${requiredMark(field.required)}`;
  const required = field.required ? 'required' : '';
  if (field.type === 'textarea') {
    return `<label class="rsvp-field"><span>${label}</span><textarea class="rsvp-textarea" data-custom-key="${key}" ${required}></textarea></label>`;
  }
  if (field.type === 'select') {
    return `<label class="rsvp-field"><span>${label}</span><select class="rsvp-select" data-custom-key="${key}" ${required}><option value="">Selecciona</option>${(field.options || []).map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}</select></label>`;
  }
  if (field.type === 'yesno') {
    return `<label class="rsvp-field"><span>${label}</span><select class="rsvp-select" data-custom-key="${key}" ${required}><option value="">Selecciona</option><option value="Sí">Sí</option><option value="No">No</option></select></label>`;
  }
  return `<label class="rsvp-field"><span>${label}</span><input class="rsvp-input" data-custom-key="${key}" maxlength="180" ${required}></label>`;
}

function optionalFieldsHtml() {
  const parts = [];
  const email = builtInField('email');
  const phone = builtInField('phone');
  const menu = builtInField('menu');
  const restriction = builtInField('restriction');
  const notes = builtInField('notes');

  if (email.enabled) parts.push(`<label class="rsvp-field"><span>${fieldLabel(email, 'Correo')}${requiredMark(email.required)}</span><input class="rsvp-input" id="rsvpEmail" type="email" maxlength="120" ${email.required ? 'required' : ''}></label>`);
  if (phone.enabled) parts.push(`<label class="rsvp-field"><span>${fieldLabel(phone, 'Teléfono / WhatsApp')}${requiredMark(phone.required)}</span><input class="rsvp-input" id="rsvpPhone" type="tel" maxlength="50" ${phone.required ? 'required' : ''}></label>`);
  if (menu.enabled) {
    const options = config.menuOptions || [];
    const control = options.length
      ? `<select class="rsvp-select" id="rsvpMenu" ${menu.required ? 'required' : ''}><option value="">Selecciona</option>${options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}</select>`
      : `<input class="rsvp-input" id="rsvpMenu" maxlength="100" ${menu.required ? 'required' : ''}>`;
    parts.push(`<label class="rsvp-field"><span>${fieldLabel(menu, 'Menú / plato')}${requiredMark(menu.required)}</span>${control}</label>`);
  }
  if (restriction.enabled) parts.push(`<label class="rsvp-field"><span>${fieldLabel(restriction, 'Restricción alimentaria')}${requiredMark(restriction.required)}</span><input class="rsvp-input" id="rsvpRestriction" maxlength="150" ${restriction.required ? 'required' : ''}></label>`);
  if (notes.enabled) parts.push(`<label class="rsvp-field"><span>${fieldLabel(notes, 'Observaciones')}${requiredMark(notes.required)}</span><textarea class="rsvp-textarea" id="rsvpNotes" maxlength="700" ${notes.required ? 'required' : ''}></textarea></label>`);

  return parts.join('');
}

function renderForm() {
  const maxGuests = Math.max(1, Math.min(20, Number(config.maxGuests || 1)));
  const tentative = config.allowTentative !== false
    ? `<label class="rsvp-choice"><input type="radio" name="attendance" value="tentative"><span>Por confirmar</span></label>`
    : '';
  root.innerHTML = `
    <article class="rsvp-public-card">
      <header class="rsvp-public-head">
        <span class="rsvp-brand">Mi Gran Día · RSVP</span>
        <h1>${escapeHtml(config.formTitle || 'Confirma tu asistencia')}</h1>
        <div class="rsvp-wedding-name">${escapeHtml(config.weddingName || 'Nuestra boda')}</div>
        <p class="rsvp-welcome">${escapeHtml(config.welcomeText || '')}</p>
      </header>
      <div class="rsvp-public-body" id="rsvpFormBody">
        <form class="rsvp-form" id="rsvpPublicForm">
          <div class="rsvp-date-note">La fecha de tu confirmación se registrará automáticamente.</div>
          <section class="rsvp-section">
            <h2 class="rsvp-section-title">Tu confirmación</h2>
            <label class="rsvp-field"><span>Nombre completo <em>*</em></span><input class="rsvp-input" id="rsvpName" maxlength="120" autocomplete="name" required></label>
            <div class="rsvp-field">
              <span>Asistencia <em>*</em></span>
              <div class="rsvp-attendance">
                <label class="rsvp-choice"><input type="radio" name="attendance" value="confirmed" required><span>Sí, asistiré</span></label>
                <label class="rsvp-choice"><input type="radio" name="attendance" value="declined"><span>No asistiré</span></label>
                ${tentative}
              </div>
            </div>
            <label class="rsvp-field" id="rsvpQuantityField"><span>Cantidad total de asistentes <em>*</em></span><select class="rsvp-select" id="rsvpQuantity">${Array.from({ length: maxGuests }, (_, index) => `<option value="${index + 1}">${index + 1}</option>`).join('')}</select></label>
          </section>

          <section class="rsvp-section hidden" id="rsvpCompanionSection">
            <h2 class="rsvp-section-title">Acompañantes</h2>
            <div class="rsvp-companions" id="rsvpCompanions"></div>
          </section>

          <section class="rsvp-section" id="rsvpOptionalSection">
            <h2 class="rsvp-section-title">Datos adicionales</h2>
            <div class="rsvp-grid">${optionalFieldsHtml()}</div>
            <div class="rsvp-custom-grid">${(config.customFields || []).map(customFieldHtml).join('')}</div>
          </section>

          <button class="rsvp-submit" type="submit" id="rsvpSubmitButton">Enviar confirmación</button>
          <div class="rsvp-status" id="rsvpPublicStatus" role="status" aria-live="polite"></div>
        </form>
      </div>
      <section class="rsvp-success" id="rsvpSuccess">
        <div class="rsvp-success-icon">✓</div>
        <h2>Gracias por confirmar</h2>
        <p id="rsvpSuccessText">Recibimos tu respuesta.</p>
        <div class="rsvp-success-summary" id="rsvpSuccessSummary"></div>
        <button class="rsvp-edit-button" id="rsvpEditResponse" type="button">Modificar respuesta</button>
      </section>
      <footer class="rsvp-footer">Confirmación protegida por Mi Gran Día</footer>
    </article>`;

  bindForm();
  postHeight();
}

function renderCompanions() {
  const field = builtInField('companions');
  const attendance = document.querySelector('input[name="attendance"]:checked')?.value || '';
  const quantity = attendance === 'declined' ? 0 : Math.max(1, Number(document.getElementById('rsvpQuantity')?.value || 1));
  const count = Math.max(0, quantity - 1);
  const section = document.getElementById('rsvpCompanionSection');
  const host = document.getElementById('rsvpCompanions');
  if (!section || !host) return;
  section.classList.toggle('hidden', !field.enabled || attendance !== 'confirmed' || count === 0);
  const previous = [...host.querySelectorAll('input')].map((input) => input.value);
  host.innerHTML = field.enabled && attendance === 'confirmed'
    ? Array.from({ length: count }, (_, index) => `
      <label class="rsvp-companion">
        <span class="rsvp-companion-index">${index + 1}</span>
        <input class="rsvp-input" data-companion-name maxlength="120" placeholder="Nombre del acompañante ${index + 1}" value="${escapeHtml(previous[index] || '')}" ${field.required ? 'required' : ''}>
      </label>`).join('')
    : '';
  postHeight();
}

function attendanceChanged() {
  const attendance = document.querySelector('input[name="attendance"]:checked')?.value || '';
  const quantityField = document.getElementById('rsvpQuantityField');
  const optional = document.getElementById('rsvpOptionalSection');
  quantityField?.classList.toggle('hidden', attendance === 'declined');
  optional?.classList.toggle('hidden', attendance === 'declined');
  renderCompanions();
}

function collectCustomData() {
  const data = {};
  document.querySelectorAll('[data-custom-key]').forEach((control) => {
    data[control.dataset.customKey] = String(control.value || '').trim().slice(0, 500);
  });
  return data;
}

function validateCompanions() {
  const field = builtInField('companions');
  if (!field.enabled || !field.required) return true;
  return [...document.querySelectorAll('[data-companion-name]')].every((input) => input.value.trim());
}

async function submitResponse(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  if (!validateCompanions()) {
    const status = document.getElementById('rsvpPublicStatus');
    status.textContent = 'Completa los nombres de tus acompañantes.';
    status.className = 'rsvp-status error';
    return;
  }

  const attendance = document.querySelector('input[name="attendance"]:checked')?.value || '';
  if (!attendance) return;
  const quantity = attendance === 'declined'
    ? 0
    : Math.max(1, Math.min(Number(config.maxGuests || 1), Number(document.getElementById('rsvpQuantity').value || 1)));
  const companions = attendance === 'confirmed'
    ? [...document.querySelectorAll('[data-companion-name]')].map((input) => input.value.trim()).filter(Boolean).slice(0, Math.max(0, quantity - 1))
    : [];

  const payload = {
    version: 1,
    name: String(document.getElementById('rsvpName').value || '').trim().slice(0, 120),
    attendance,
    quantity,
    companions,
    menu: String(document.getElementById('rsvpMenu')?.value || '').trim().slice(0, 120),
    email: String(document.getElementById('rsvpEmail')?.value || '').trim().slice(0, 120),
    phone: String(document.getElementById('rsvpPhone')?.value || '').trim().slice(0, 60),
    restriction: String(document.getElementById('rsvpRestriction')?.value || '').trim().slice(0, 160),
    notes: String(document.getElementById('rsvpNotes')?.value || '').trim().slice(0, 700),
    customData: collectCustomData(),
    editToken: session.editToken,
    clientDate: new Date().toISOString(),
    source: 'public-rsvp',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const button = document.getElementById('rsvpSubmitButton');
  const status = document.getElementById('rsvpPublicStatus');
  button.disabled = true;
  button.textContent = 'Enviando…';
  status.textContent = '';
  status.className = 'rsvp-status';

  try {
    await setDoc(doc(db, 'publicRsvp', token, 'responses', session.id), payload, { merge: true });
    showSuccess(payload);
  } catch (error) {
    console.error('RSVP submit error:', error);
    status.textContent = error?.code === 'permission-denied'
      ? 'El formulario todavía no tiene habilitados los permisos de recepción. Comunícate con los novios.'
      : 'No se pudo enviar tu confirmación. Intenta nuevamente.';
    status.className = 'rsvp-status error';
    button.disabled = false;
    button.textContent = 'Enviar confirmación';
  }
}

function showSuccess(payload) {
  document.getElementById('rsvpFormBody').classList.add('hidden');
  const success = document.getElementById('rsvpSuccess');
  success.classList.add('show');
  const attendanceText = payload.attendance === 'confirmed'
    ? 'Asistiré'
    : payload.attendance === 'declined'
      ? 'No asistiré'
      : 'Por confirmar';
  document.getElementById('rsvpSuccessText').textContent = payload.attendance === 'confirmed'
    ? '¡Qué alegría! Recibimos tu confirmación. Los novios revisarán el grupo de asistentes.'
    : 'Tu respuesta quedó registrada. Puedes modificarla desde este mismo enlace.';
  document.getElementById('rsvpSuccessSummary').innerHTML = `
    <div class="rsvp-success-item"><small>Nombre</small><strong>${escapeHtml(payload.name)}</strong></div>
    <div class="rsvp-success-item"><small>Asistencia</small><strong>${escapeHtml(attendanceText)}</strong></div>
    <div class="rsvp-success-item"><small>Cantidad</small><strong>${payload.attendance === 'declined' ? 0 : payload.quantity}</strong></div>
    <div class="rsvp-success-item"><small>Fecha</small><strong>${escapeHtml(new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date()))}</strong></div>`;
  postHeight();
}

function bindForm() {
  document.querySelectorAll('input[name="attendance"]').forEach((radio) => radio.addEventListener('change', attendanceChanged));
  document.getElementById('rsvpQuantity')?.addEventListener('change', renderCompanions);
  document.getElementById('rsvpPublicForm')?.addEventListener('submit', submitResponse);
  document.getElementById('rsvpEditResponse')?.addEventListener('click', () => {
    document.getElementById('rsvpSuccess').classList.remove('show');
    document.getElementById('rsvpFormBody').classList.remove('hidden');
    const button = document.getElementById('rsvpSubmitButton');
    button.disabled = false;
    button.textContent = 'Actualizar confirmación';
    postHeight();
  });
}

function renderLoading() {
  root.innerHTML = `<article class="rsvp-public-card"><div class="rsvp-loading"><div class="rsvp-loading-spinner"></div><strong>Cargando confirmación…</strong></div></article>`;
}

function renderError(message) {
  root.innerHTML = `<article class="rsvp-public-card"><div class="rsvp-error-card"><h2>No pudimos abrir este RSVP</h2><p>${escapeHtml(message)}</p></div></article>`;
  postHeight();
}

async function loadConfig() {
  if (!token || token.length < 20) throw new Error('El enlace de confirmación no es válido.');
  const snap = await getDoc(doc(db, 'publicRsvp', token));
  if (!snap.exists()) throw new Error('Este formulario no existe o el enlace fue reemplazado.');
  const data = snap.data() || {};
  if (data.active !== true) throw new Error('Las confirmaciones están pausadas en este momento.');
  return {
    ...data,
    maxGuests: Math.max(1, Math.min(20, Number(data.maxGuests || 1))),
    fields: data.fields || {},
    customFields: Array.isArray(data.customFields) ? data.customFields : [],
    menuOptions: Array.isArray(data.menuOptions) ? data.menuOptions : []
  };
}

function postHeight() {
  requestAnimationFrame(() => {
    const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    window.parent?.postMessage({ type: 'MIGRANDIA_RSVP_HEIGHT', height }, '*');
  });
}

new ResizeObserver(postHeight).observe(document.documentElement);

(async () => {
  renderLoading();
  try {
    config = await loadConfig();
    session = getSession();
    document.title = `${config.weddingName || 'Nuestra boda'} · RSVP`;
    renderForm();
  } catch (error) {
    console.error(error);
    renderError(error?.message || 'No fue posible cargar el formulario.');
  }
})();
