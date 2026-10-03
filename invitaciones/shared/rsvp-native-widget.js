import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION = '20260817-2315-shared-session1';
const firebaseConfig = {
  apiKey: 'AIzaSyDCRuQgMjnm7KcAN_qo8AHPD3ueyis4-LY',
  authDomain: 'migrandia.firebaseapp.com',
  projectId: 'migrandia',
  storageBucket: 'migrandia.firebasestorage.app',
  messagingSenderId: '7432985765',
  appId: '1:7432985765:web:b3a4844f41ac2a1376c14c'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const installed = new WeakSet();

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function clean(value = '', max = 180) {
  return String(value ?? '').trim().slice(0, max);
}

function makeId() {
  return crypto?.randomUUID?.() || `mgd_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function getSession(token) {
  const key = `migrandia_rsvp_session_${token}`;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved?.id && saved?.editToken) return saved;
  } catch (_) {}
  const next = {
    id: makeId(),
    editToken: `${makeId()}${makeId()}`.replaceAll('-', '')
  };
  localStorage.setItem(key, JSON.stringify(next));
  return next;
}

function musicKey(token, sessionId) {
  return `migrandia_rsvp_music_${token}_${sessionId}`;
}

function readLocalMusic(token, sessionId) {
  try {
    const value = JSON.parse(localStorage.getItem(musicKey(token, sessionId)) || 'null');
    return value && Array.isArray(value.songs) ? value : null;
  } catch (_) {
    return null;
  }
}

function saveLocalMusic(token, sessionId, value) {
  localStorage.setItem(musicKey(token, sessionId), JSON.stringify(value));
}

async function loadConfig(token) {
  const snap = await getDoc(doc(db, 'publicRsvp', token));
  if (!snap.exists()) throw new Error('Este formulario no existe.');
  const config = snap.data() || {};
  if (config.active !== true) throw new Error('Las confirmaciones están pausadas.');
  return config;
}

function fieldConfig(config, key) {
  return config?.fields?.[key] || { enabled: false, required: false, label: key };
}

function ensureCss() {
  if (document.getElementById('mgdNativeWidgetV2Css')) return;
  const style = document.createElement('style');
  style.id = 'mgdNativeWidgetV2Css';
  style.textContent = `
    .mgd-native-widget-v2{--mgd-accent:#6d7559;--mgd-text:#5d6552;--mgd-muted:#747b70;--mgd-border:rgba(109,117,89,.24);--mgd-surface:rgba(255,255,255,.42);font-family:Georgia,'Times New Roman',serif;color:var(--mgd-text);width:100%}
    .mgd-native-widget-v2 *{box-sizing:border-box}.mgd-v2-form{display:grid;gap:13px}.mgd-v2-field{display:grid;gap:6px}.mgd-v2-label{font-size:12px;line-height:1.35;font-weight:600;color:var(--mgd-muted)}
    .mgd-v2-input,.mgd-v2-select,.mgd-v2-textarea{width:100%;min-height:46px;border:1px solid var(--mgd-border);border-radius:14px;background:var(--mgd-surface);padding:11px 13px;color:var(--mgd-text);font:inherit;outline:none}.mgd-v2-textarea{min-height:88px;resize:vertical}.mgd-v2-input:focus,.mgd-v2-select:focus,.mgd-v2-textarea:focus{border-color:var(--mgd-accent);box-shadow:0 0 0 3px rgba(109,117,89,.10)}
    .mgd-v2-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.mgd-v2-choice{position:relative}.mgd-v2-choice input{position:absolute;opacity:0}.mgd-v2-choice span{display:grid;place-items:center;min-height:44px;padding:8px;border:1px solid var(--mgd-border);border-radius:14px;background:var(--mgd-surface);font-size:12px;font-weight:600;text-align:center;cursor:pointer}.mgd-v2-choice input:checked+span{background:var(--mgd-accent);border-color:var(--mgd-accent);color:white}
    .mgd-v2-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.mgd-v2-companions{display:grid;gap:8px}.mgd-v2-button{min-height:46px;border:0;border-radius:999px;padding:11px 16px;background:var(--mgd-accent);color:white;font:700 13px/1 Georgia,'Times New Roman',serif;cursor:pointer}.mgd-v2-button.secondary{background:var(--mgd-surface);color:var(--mgd-text);border:1px solid var(--mgd-border)}.mgd-v2-button:disabled{opacity:.55;cursor:wait}.mgd-v2-status{min-height:18px;text-align:center;font-size:12px;line-height:1.45;color:var(--mgd-muted)}.mgd-v2-status.success{color:#5f7353}.mgd-v2-status.error{color:#9b5353}
    .mgd-v2-success{text-align:center;padding:15px 3px}.mgd-v2-success-icon{width:52px;height:52px;margin:0 auto 10px;display:grid;place-items:center;border-radius:50%;background:rgba(109,117,89,.13);color:var(--mgd-accent);font-size:23px;font-weight:800}.mgd-v2-success h3{margin:0;color:var(--mgd-accent);font-size:28px;font-weight:400}.mgd-v2-success p{margin:8px auto 14px;max-width:420px;color:var(--mgd-muted);line-height:1.55}
    .mgd-v2-music-rows{display:grid;gap:9px}.mgd-v2-music-row{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end}.mgd-v2-remove{width:34px;height:34px;border:1px solid var(--mgd-border);border-radius:50%;background:var(--mgd-surface);color:var(--mgd-muted);cursor:pointer}.mgd-v2-actions{display:flex;gap:8px;flex-wrap:wrap}.mgd-v2-actions>*{flex:1 1 145px}
    @media(max-width:560px){.mgd-v2-grid,.mgd-v2-choices{grid-template-columns:1fr}.mgd-v2-music-row{grid-template-columns:1fr auto}.mgd-v2-music-row .mgd-v2-field{grid-column:1}.mgd-v2-remove{grid-column:2;grid-row:1 / span 2;align-self:center}}
  `;
  document.head.appendChild(style);
}

function optionalFields(config) {
  const parts = [];
  const add = (key, id, type = 'input') => {
    const field = fieldConfig(config, key);
    if (!field.enabled) return;
    const label = esc(field.label || key);
    const required = field.required ? 'required' : '';
    if (key === 'menu' && Array.isArray(config.menuOptions) && config.menuOptions.length) {
      parts.push(`<label class="mgd-v2-field"><span class="mgd-v2-label">${label}</span><select class="mgd-v2-select" id="${id}" ${required}><option value="">Selecciona</option>${config.menuOptions.map((item) => `<option>${esc(item)}</option>`).join('')}</select></label>`);
    } else if (type === 'textarea') {
      parts.push(`<label class="mgd-v2-field"><span class="mgd-v2-label">${label}</span><textarea class="mgd-v2-textarea" id="${id}" ${required}></textarea></label>`);
    } else {
      parts.push(`<label class="mgd-v2-field"><span class="mgd-v2-label">${label}</span><input class="mgd-v2-input" id="${id}" ${required}></label>`);
    }
  };
  add('email', 'mgdV2Email');
  add('phone', 'mgdV2Phone');
  add('menu', 'mgdV2Menu');
  add('restriction', 'mgdV2Restriction');
  add('notes', 'mgdV2Notes', 'textarea');
  return parts.join('');
}

function customFieldMarkup(field) {
  const key = esc(field?.key || makeId());
  const label = esc(field?.label || 'Dato adicional');
  const required = field?.required ? 'required' : '';
  if (field?.type === 'textarea') return `<label class="mgd-v2-field"><span class="mgd-v2-label">${label}</span><textarea class="mgd-v2-textarea" data-mgd-custom="${key}" ${required}></textarea></label>`;
  if (field?.type === 'select') return `<label class="mgd-v2-field"><span class="mgd-v2-label">${label}</span><select class="mgd-v2-select" data-mgd-custom="${key}" ${required}><option value="">Selecciona</option>${(field.options || []).map((item) => `<option>${esc(item)}</option>`).join('')}</select></label>`;
  if (field?.type === 'yesno') return `<label class="mgd-v2-field"><span class="mgd-v2-label">${label}</span><select class="mgd-v2-select" data-mgd-custom="${key}" ${required}><option value="">Selecciona</option><option>Sí</option><option>No</option></select></label>`;
  return `<label class="mgd-v2-field"><span class="mgd-v2-label">${label}</span><input class="mgd-v2-input" data-mgd-custom="${key}" ${required}></label>`;
}

async function installRsvp(host, token) {
  const config = await loadConfig(token);
  const session = getSession(token);
  const maxGuests = Math.max(1, Math.min(20, Number(config.maxGuests || 1)));
  host.innerHTML = `
    <form class="mgd-v2-form" data-rsvp-form>
      <label class="mgd-v2-field"><span class="mgd-v2-label">Nombre completo</span><input class="mgd-v2-input" id="mgdV2Name" maxlength="120" autocomplete="name" required></label>
      <div class="mgd-v2-field"><span class="mgd-v2-label">Asistencia</span><div class="mgd-v2-choices">
        <label class="mgd-v2-choice"><input type="radio" name="mgdV2Attendance" value="confirmed" required><span>Sí, asistiré</span></label>
        <label class="mgd-v2-choice"><input type="radio" name="mgdV2Attendance" value="declined"><span>No asistiré</span></label>
        ${config.allowTentative !== false ? '<label class="mgd-v2-choice"><input type="radio" name="mgdV2Attendance" value="tentative"><span>Por confirmar</span></label>' : ''}
      </div></div>
      <label class="mgd-v2-field" data-qty-wrap><span class="mgd-v2-label">Cantidad total de asistentes</span><select class="mgd-v2-select" id="mgdV2Qty">${Array.from({ length: maxGuests }, (_, index) => `<option value="${index + 1}">${index + 1}</option>`).join('')}</select></label>
      <div class="mgd-v2-companions" data-companions></div>
      <div class="mgd-v2-grid">${optionalFields(config)}</div>
      <div class="mgd-v2-grid">${(config.customFields || []).map(customFieldMarkup).join('')}</div>
      <button class="mgd-v2-button" type="submit">Enviar confirmación</button>
      <div class="mgd-v2-status" data-status></div>
    </form>`;

  const form = host.querySelector('[data-rsvp-form]');
  const quantity = host.querySelector('#mgdV2Qty');
  const companionHost = host.querySelector('[data-companions]');

  function renderCompanions() {
    const attendance = host.querySelector('input[name="mgdV2Attendance"]:checked')?.value || '';
    const qtyWrap = host.querySelector('[data-qty-wrap]');
    if (qtyWrap) qtyWrap.style.display = attendance === 'declined' ? 'none' : '';
    const field = fieldConfig(config, 'companions');
    const count = attendance === 'confirmed' && field.enabled ? Math.max(0, Number(quantity.value || 1) - 1) : 0;
    companionHost.innerHTML = Array.from({ length: count }, (_, index) => `<label class="mgd-v2-field"><span class="mgd-v2-label">Acompañante ${index + 1}</span><input class="mgd-v2-input" data-companion maxlength="120" ${field.required ? 'required' : ''}></label>`).join('');
  }

  host.querySelectorAll('input[name="mgdV2Attendance"]').forEach((radio) => radio.addEventListener('change', renderCompanions));
  quantity.addEventListener('change', renderCompanions);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const attendance = host.querySelector('input[name="mgdV2Attendance"]:checked')?.value || '';
    if (!attendance) return;
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[data-status]');
    button.disabled = true;
    button.textContent = 'Enviando…';
    status.textContent = '';
    status.className = 'mgd-v2-status';

    try {
      const customData = {};
      host.querySelectorAll('[data-mgd-custom]').forEach((control) => {
        customData[control.dataset.mgdCustom] = clean(control.value, 500);
      });
      const storedMusic = readLocalMusic(token, session.id);
      if (storedMusic) customData.mgdMusic = JSON.stringify(storedMusic);

      const qty = attendance === 'declined' ? 0 : Math.max(1, Math.min(maxGuests, Number(quantity.value || 1)));
      const payload = {
        version: 1,
        name: clean(host.querySelector('#mgdV2Name')?.value, 120),
        attendance,
        quantity: qty,
        companions: attendance === 'confirmed' ? [...host.querySelectorAll('[data-companion]')].map((input) => clean(input.value, 120)).filter(Boolean).slice(0, Math.max(0, qty - 1)) : [],
        menu: clean(host.querySelector('#mgdV2Menu')?.value, 120),
        email: clean(host.querySelector('#mgdV2Email')?.value, 120),
        phone: clean(host.querySelector('#mgdV2Phone')?.value, 60),
        restriction: clean(host.querySelector('#mgdV2Restriction')?.value, 160),
        notes: clean(host.querySelector('#mgdV2Notes')?.value, 700),
        customData,
        editToken: session.editToken,
        clientDate: new Date().toISOString(),
        source: 'public-rsvp',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'publicRsvp', token, 'responses', session.id), payload, { merge: true });
      host.innerHTML = `<div class="mgd-v2-success"><div class="mgd-v2-success-icon">✓</div><h3>Gracias por confirmar</h3><p>${attendance === 'confirmed' ? '¡Qué alegría! Hemos recibido tu confirmación.' : 'Tu respuesta quedó registrada correctamente.'}</p><button class="mgd-v2-button secondary" type="button" data-edit>Modificar respuesta</button></div>`;
      host.querySelector('[data-edit]')?.addEventListener('click', () => {
        installed.delete(host);
        install(host);
      });
    } catch (error) {
      console.error('Mi Gran Día RSVP:', error);
      status.textContent = error?.code === 'permission-denied' ? 'Firebase rechazó la confirmación. Revisa las reglas publicadas.' : 'No se pudo enviar tu confirmación. Intenta nuevamente.';
      status.className = 'mgd-v2-status error';
      button.disabled = false;
      button.textContent = 'Enviar confirmación';
    }
  });
}

function getMusicConfig(config) {
  const value = config?.musicConfig || {};
  return {
    enabled: value.enabled !== false,
    maxSongs: Math.max(1, Math.min(10, Number(value.maxSongs || 5))),
    askArtist: value.askArtist !== false,
    askMessage: value.askMessage !== false,
    messageLabel: clean(value.messageLabel || 'Comentario o dedicatoria (opcional)', 90)
  };
}

function musicRow(config, index, item = {}) {
  return `<div class="mgd-v2-music-row" data-music-row><label class="mgd-v2-field"><span class="mgd-v2-label">Canción</span><input class="mgd-v2-input" data-title maxlength="140" placeholder="Nombre de la canción" value="${esc(item.title || '')}"></label>${config.askArtist ? `<label class="mgd-v2-field"><span class="mgd-v2-label">Artista</span><input class="mgd-v2-input" data-artist maxlength="140" placeholder="Artista" value="${esc(item.artist || '')}"></label>` : ''}<button class="mgd-v2-remove" type="button" data-remove aria-label="Quitar canción ${index + 1}">×</button></div>`;
}

async function installMusic(host, token) {
  const publicConfig = await loadConfig(token);
  const config = getMusicConfig(publicConfig);
  if (!config.enabled) {
    host.innerHTML = '';
    return;
  }
  const session = getSession(token);
  const stored = readLocalMusic(token, session.id) || { version: 1, songs: [], message: '' };
  host.innerHTML = `<div class="mgd-v2-form"><div class="mgd-v2-music-rows" data-rows></div>${config.askMessage ? `<label class="mgd-v2-field"><span class="mgd-v2-label">${esc(config.messageLabel)}</span><textarea class="mgd-v2-textarea" data-message maxlength="500" placeholder="Comentario o dedicatoria (opcional)"></textarea></label>` : ''}<div class="mgd-v2-actions"><button class="mgd-v2-button secondary" type="button" data-add>+ Agregar canción</button><button class="mgd-v2-button" type="button" data-save>Guardar música</button></div><div class="mgd-v2-status" data-status></div></div>`;

  const rows = host.querySelector('[data-rows]');
  const message = host.querySelector('[data-message]');
  if (message) message.value = stored.message || '';

  function bindRemove() {
    rows.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => {
      const current = rows.querySelectorAll('[data-music-row]');
      if (current.length === 1) {
        current[0].querySelector('[data-title]').value = '';
        const artist = current[0].querySelector('[data-artist]');
        if (artist) artist.value = '';
      } else {
        button.closest('[data-music-row]')?.remove();
      }
      host.querySelector('[data-add]').disabled = rows.querySelectorAll('[data-music-row]').length >= config.maxSongs;
    }));
  }

  function render(items) {
    const list = items?.length ? items : [{}];
    rows.innerHTML = list.slice(0, config.maxSongs).map((item, index) => musicRow(config, index, item)).join('');
    bindRemove();
    host.querySelector('[data-add]').disabled = rows.querySelectorAll('[data-music-row]').length >= config.maxSongs;
  }

  function collect() {
    return {
      version: 1,
      songs: [...rows.querySelectorAll('[data-music-row]')].map((row) => ({
        title: clean(row.querySelector('[data-title]')?.value, 140),
        artist: config.askArtist ? clean(row.querySelector('[data-artist]')?.value, 140) : ''
      })).filter((item) => item.title || item.artist).slice(0, config.maxSongs),
      message: config.askMessage ? clean(message?.value, 500) : '',
      updatedAtClient: new Date().toISOString()
    };
  }

  render(stored.songs || []);

  host.querySelector('[data-add]').addEventListener('click', () => {
    const count = rows.querySelectorAll('[data-music-row]').length;
    if (count >= config.maxSongs) return;
    rows.insertAdjacentHTML('beforeend', musicRow(config, count, {}));
    bindRemove();
    host.querySelector('[data-add]').disabled = rows.querySelectorAll('[data-music-row]').length >= config.maxSongs;
  });

  host.querySelector('[data-save]').addEventListener('click', async () => {
    const value = collect();
    const status = host.querySelector('[data-status]');
    const button = host.querySelector('[data-save]');
    if (!value.songs.length) {
      status.textContent = 'Agrega al menos una canción.';
      status.className = 'mgd-v2-status error';
      return;
    }

    saveLocalMusic(token, session.id, value);
    button.disabled = true;
    button.textContent = 'Guardando…';
    status.textContent = '';
    status.className = 'mgd-v2-status';

    const responseRef = doc(db, 'publicRsvp', token, 'responses', session.id);
    const musicJson = JSON.stringify(value);

    try {
      try {
        await updateDoc(responseRef, {
          'customData.mgdMusic': musicJson,
          updatedAt: serverTimestamp()
        });
      } catch (updateError) {
        if (updateError?.code !== 'not-found') throw updateError;
        await setDoc(responseRef, {
          version: 1,
          source: 'music-widget',
          customData: { mgdMusic: musicJson },
          editToken: session.editToken,
          clientDate: new Date().toISOString(),
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      status.textContent = '¡Gracias! Tu pedido musical fue registrado ✨';
      status.className = 'mgd-v2-status success';
    } catch (error) {
      console.error('Mi Gran Día Música:', error);
      if (error?.code === 'permission-denied') {
        status.textContent = 'La canción quedó guardada en este celular, pero falta publicar las reglas de Firebase para guardarla en la boda.';
      } else {
        status.textContent = 'No se pudo guardar en la nube. Tu canción sigue guardada en este celular.';
      }
      status.className = 'mgd-v2-status error';
    } finally {
      button.disabled = false;
      button.textContent = 'Guardar música';
    }
  });
}

async function install(host) {
  if (!host || installed.has(host)) return;
  const token = clean(host.dataset.mgdRsvpToken || host.dataset.mgdMusicToken || host.dataset.mgdToken, 180);
  if (!token) return;
  installed.add(host);
  host.classList.add('mgd-native-widget-v2');
  try {
    if (host.dataset.mgdMusicToken) await installMusic(host, token);
    else await installRsvp(host, token);
  } catch (error) {
    console.error('Mi Gran Día widget:', error);
    host.innerHTML = `<div class="mgd-v2-status error">${esc(error?.message || 'No se pudo cargar este formulario.')}</div>`;
  }
}

function scan() {
  ensureCss();
  document.querySelectorAll('[data-mgd-rsvp-token],[data-mgd-music-token],[data-mgd-token]').forEach((host) => install(host));
}

new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
scan();

export { VERSION };
