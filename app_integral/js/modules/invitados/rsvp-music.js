import { getApp, getApps } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION = '20260817-2215-rsvp-music-linked2';
const params = new URLSearchParams(location.search);
const token = String(params.get('token') || '').trim();
const MUSIC_ONLY = params.get('view') === 'music';
const DEFAULT_CONFIG = {
  enabled: true,
  title: 'La música también la eligen ustedes',
  intro: 'Ayúdanos a preparar la fiesta. Déjanos las canciones que te gustaría escuchar para tenerlas en cuenta con el DJ o grupo y que ese día solo tengas que disfrutar.',
  maxSongs: 5,
  askArtist: true,
  askMessage: true,
  messageLabel: 'Mensaje o dedicatoria (opcional)'
};
let musicConfig = { ...DEFAULT_CONFIG };
let configPromise = null;

function clean(value, max = 140) {
  return String(value || '').trim().slice(0, max);
}

function emptyMusic() {
  return { version: 1, songs: [], message: '', updatedAtClient: '' };
}

function normalizeConfig(value = {}) {
  return {
    enabled: value.enabled !== false,
    title: clean(value.title || DEFAULT_CONFIG.title, 110) || DEFAULT_CONFIG.title,
    intro: clean(value.intro || DEFAULT_CONFIG.intro, 500) || DEFAULT_CONFIG.intro,
    maxSongs: Math.max(1, Math.min(10, Math.floor(Number(value.maxSongs) || 5))),
    askArtist: value.askArtist !== false,
    askMessage: value.askMessage !== false,
    messageLabel: clean(value.messageLabel || DEFAULT_CONFIG.messageLabel, 90) || DEFAULT_CONFIG.messageLabel
  };
}

async function loadMusicConfig() {
  if (configPromise) return configPromise;
  configPromise = (async () => {
    if (!token || !getApps().length) return musicConfig;
    try {
      const db = getFirestore(getApp());
      const snap = await getDoc(doc(db, 'publicRsvp', token));
      if (snap.exists()) musicConfig = normalizeConfig(snap.data()?.musicConfig || {});
    } catch (error) {
      console.warn('No se pudo leer configuración de música:', error);
    }
    return musicConfig;
  })();
  return configPromise;
}

function getRsvpSession() {
  if (!token) return null;
  try {
    const value = JSON.parse(localStorage.getItem(`migrandia_rsvp_session_${token}`) || 'null');
    return value?.id && value?.editToken ? value : null;
  } catch (_) {
    return null;
  }
}

function localKey(sessionId) {
  return `migrandia_rsvp_music_${token}_${sessionId || 'pending'}`;
}

function normalizeMusic(value) {
  const parsed = value && typeof value === 'object' ? value : {};
  return {
    version: 1,
    songs: Array.isArray(parsed.songs)
      ? parsed.songs
          .map((item) => ({
            title: clean(item?.title),
            artist: clean(item?.artist)
          }))
          .filter((item) => item.title || item.artist)
          .slice(0, musicConfig.maxSongs)
      : [],
    message: clean(parsed.message, 500),
    updatedAtClient: clean(parsed.updatedAtClient, 60)
  };
}

function readLocalMusic(sessionId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(localKey(sessionId)) || 'null');
    return normalizeMusic(parsed);
  } catch (_) {
    return emptyMusic();
  }
}

function writeLocalMusic(sessionId, value) {
  localStorage.setItem(localKey(sessionId), JSON.stringify(normalizeMusic(value)));
}

function serializeMusic(value) {
  const normalized = normalizeMusic({
    ...value,
    updatedAtClient: value?.updatedAtClient || new Date().toISOString()
  });
  return JSON.stringify(normalized);
}

function parseMusic(value) {
  if (!value) return emptyMusic();
  if (typeof value === 'object') return normalizeMusic(value);
  try {
    return normalizeMusic(JSON.parse(String(value)));
  } catch (_) {
    return emptyMusic();
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

function rsvpUrl() {
  const url = new URL(location.href);
  url.searchParams.delete('view');
  return url.href;
}

async function hasLinkedResponse(session) {
  if (!session || !token || !getApps().length) return false;
  try {
    const db = getFirestore(getApp());
    await updateDoc(
      doc(db, 'publicRsvp', token, 'responses', session.id),
      { updatedAt: serverTimestamp() }
    );
    return true;
  } catch (error) {
    const code = String(error?.code || error?.message || '');
    if (!code.includes('not-found') && !code.includes('permission-denied')) {
      console.warn('No se pudo comprobar la respuesta RSVP asociada:', error);
    }
    return false;
  }
}

function songRow(item = {}, index = 0) {
  return `<div class="rsvp-music-row" data-music-row>
    <label class="rsvp-field"><span>Canción</span><input class="rsvp-input" data-music-title maxlength="140" placeholder="Ej. Yellow" value="${escapeHtml(item.title || '')}"></label>
    ${musicConfig.askArtist ? `<label class="rsvp-field"><span>Artista</span><input class="rsvp-input" data-music-artist maxlength="140" placeholder="Ej. Coldplay" value="${escapeHtml(item.artist || '')}"></label>` : ''}
    <button class="rsvp-music-remove" type="button" data-remove-music-row aria-label="Quitar canción ${index + 1}" title="Quitar canción">×</button>
  </div>`;
}

function collectMusic(section) {
  const songs = [...section.querySelectorAll('[data-music-row]')]
    .map((row) => ({
      title: clean(row.querySelector('[data-music-title]')?.value),
      artist: musicConfig.askArtist ? clean(row.querySelector('[data-music-artist]')?.value) : ''
    }))
    .filter((item) => item.title || item.artist)
    .slice(0, musicConfig.maxSongs);

  return {
    version: 1,
    songs,
    message: musicConfig.askMessage ? clean(section.querySelector('#rsvpMusicMessage')?.value, 500) : '',
    updatedAtClient: new Date().toISOString()
  };
}

function setStatus(section, text, type = '') {
  const node = section.querySelector('#rsvpMusicStatus');
  if (!node) return;
  node.textContent = text;
  node.className = `rsvp-music-status${type ? ` ${type}` : ''}`;
}

function syncHiddenField(form, value) {
  if (!form) return;
  let hidden = form.querySelector('[data-custom-key="mgdMusic"]');
  if (!hidden) {
    hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.dataset.customKey = 'mgdMusic';
    form.appendChild(hidden);
  }
  hidden.value = serializeMusic(value);
}

function renderRows(section, value) {
  const host = section.querySelector('#rsvpMusicRows');
  if (!host) return;
  const songs = Array.isArray(value?.songs) && value.songs.length ? value.songs : [{}];
  host.innerHTML = songs.slice(0, musicConfig.maxSongs).map(songRow).join('');
  const add = section.querySelector('#rsvpAddMusicRow');
  if (add) add.disabled = host.querySelectorAll('[data-music-row]').length >= musicConfig.maxSongs;
}

function renderMusicOnlyGate(form, section) {
  document.body.classList.add('rsvp-music-only');
  form.querySelectorAll(':scope > *').forEach((node) => {
    if (node !== section) node.classList.add('hidden');
  });
  section.classList.remove('hidden');
  section.innerHTML = `
    <div class="rsvp-music-heading">
      <span class="rsvp-music-kicker">Antes de elegir la música</span>
      <h2 class="rsvp-section-title">Primero confirma tu asistencia</h2>
      <p>Así podremos asociar tu canción a tu confirmación sin pedirte el nombre otra vez.</p>
    </div>
    <div class="rsvp-music-status pending">Tu pedido musical quedará identificado automáticamente con tu RSVP.</div>
    <div class="rsvp-music-actions">
      <button class="rsvp-music-save" id="rsvpGoToConfirmation" type="button">Confirmar asistencia →</button>
    </div>`;
  section.querySelector('#rsvpGoToConfirmation')?.addEventListener('click', () => {
    location.href = rsvpUrl();
  });
  const head = document.querySelector('.rsvp-public-head');
  if (head) {
    const brand = head.querySelector('.rsvp-brand');
    if (brand) brand.textContent = 'Mi Gran Día · Música';
    const title = head.querySelector('h1');
    if (title) title.textContent = 'Tu canción para la boda';
    const welcome = head.querySelector('.rsvp-welcome');
    if (welcome) welcome.textContent = 'Primero necesitamos vincular este pedido con tu confirmación.';
  }
  const footer = document.querySelector('.rsvp-footer');
  if (footer) footer.textContent = 'Encuesta musical protegida por Mi Gran Día';
}

function applyMusicOnlyLayout(form, section) {
  document.body.classList.add('rsvp-music-only');
  form.querySelectorAll(':scope > *').forEach((node) => {
    if (node !== section) node.classList.add('hidden');
  });
  section.classList.remove('hidden');

  const head = document.querySelector('.rsvp-public-head');
  if (head) {
    const brand = head.querySelector('.rsvp-brand');
    if (brand) brand.textContent = 'Mi Gran Día · Música';
    const title = head.querySelector('h1');
    if (title) title.textContent = musicConfig.title;
    const welcome = head.querySelector('.rsvp-welcome');
    if (welcome) welcome.textContent = musicConfig.intro;
  }

  const identity = section.querySelector('#rsvpMusicIdentity');
  if (identity) {
    identity.textContent = 'Pedido vinculado a tu confirmación RSVP. No necesitas escribir tu nombre otra vez.';
  }

  const footer = document.querySelector('.rsvp-footer');
  if (footer) footer.textContent = 'Encuesta musical protegida por Mi Gran Día';
}

async function saveMusic(section) {
  const session = getRsvpSession();
  if (!session) {
    setStatus(section, 'No pudimos identificar esta respuesta. Vuelve a tu confirmación.', 'error');
    return;
  }

  const linked = await hasLinkedResponse(session);
  if (!linked) {
    const form = section.closest('form');
    if (form) renderMusicOnlyGate(form, section);
    return;
  }

  const music = collectMusic(section);
  writeLocalMusic(session.id, music);
  const button = section.querySelector('#rsvpSaveMusic');
  if (button) {
    button.disabled = true;
    button.textContent = 'Guardando…';
  }

  if (!music.songs.length) {
    setStatus(section, 'Agrega al menos una canción para guardar.', 'pending');
    if (button) {
      button.disabled = false;
      button.textContent = 'Guardar música';
    }
    return;
  }

  try {
    const app = getApps().length ? getApp() : null;
    if (!app) throw new Error('firebase-not-ready');
    const db = getFirestore(app);
    await updateDoc(
      doc(db, 'publicRsvp', token, 'responses', session.id),
      {
        'customData.mgdMusic': serializeMusic(music),
        updatedAt: serverTimestamp()
      }
    );
    setStatus(section, 'Música guardada y vinculada a tu confirmación ✓', 'success');
  } catch (error) {
    console.error('RSVP music save error:', error);
    setStatus(section, 'No pudimos guardar la música ahora. Intenta nuevamente.', 'error');
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Guardar música';
    }
  }
}

async function installMusicPreserver(form) {
  if (!form || form.dataset.mgdMusicPreserver === VERSION) return;
  const session = getRsvpSession();
  if (!session) return;
  form.dataset.mgdMusicPreserver = VERSION;

  const music = readLocalMusic(session.id);
  if (music.songs.length || music.message) syncHiddenField(form, music);
}

async function installMusicOnlySection(form) {
  if (!form || form.dataset.mgdMusicInstalled === VERSION) return;
  const session = getRsvpSession();
  if (!session) return;
  const submit = form.querySelector('#rsvpSubmitButton');
  if (!submit) return;

  form.dataset.mgdMusicInstalled = VERSION;
  if (!musicConfig.enabled) return;

  const section = document.createElement('section');
  section.className = 'rsvp-section rsvp-music-section';
  section.id = 'rsvpMusicSection';
  section.innerHTML = `
    <div class="rsvp-music-heading">
      <span class="rsvp-music-kicker">Para la fiesta</span>
      <h2 class="rsvp-section-title">${escapeHtml(musicConfig.title)}</h2>
      <p>${escapeHtml(musicConfig.intro)}</p>
    </div>
    <div class="rsvp-music-status success" id="rsvpMusicIdentity"></div>
    <div class="rsvp-music-rows" id="rsvpMusicRows"></div>
    ${musicConfig.askMessage ? `<label class="rsvp-field rsvp-music-message"><span>${escapeHtml(musicConfig.messageLabel)}</span><textarea class="rsvp-textarea" id="rsvpMusicMessage" maxlength="500" placeholder="Escribe aquí si quieres dejar una dedicatoria o indicación para los novios"></textarea></label>` : ''}
    <div class="rsvp-music-actions">
      <button class="rsvp-music-add" id="rsvpAddMusicRow" type="button">+ Agregar otra canción</button>
      <button class="rsvp-music-save" id="rsvpSaveMusic" type="button">Guardar música</button>
    </div>
    <div class="rsvp-music-status" id="rsvpMusicStatus" role="status" aria-live="polite"></div>
    <div class="rsvp-music-actions">
      <button class="rsvp-music-add" id="rsvpBackToConfirmation" type="button">← Volver a mi confirmación</button>
    </div>`;
  submit.before(section);

  const linked = await hasLinkedResponse(session);
  if (!linked) {
    renderMusicOnlyGate(form, section);
    requestAnimationFrame(() => window.parent?.postMessage({
      type: 'MIGRANDIA_RSVP_HEIGHT',
      height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
    }, '*'));
    return;
  }

  const stored = readLocalMusic(session.id);
  renderRows(section, stored);
  if (musicConfig.askMessage) {
    const msg = section.querySelector('#rsvpMusicMessage');
    if (msg) msg.value = stored.message || '';
  }
  applyMusicOnlyLayout(form, section);

  section.addEventListener('input', () => {
    const value = collectMusic(section);
    writeLocalMusic(session.id, value);
    setStatus(section, value.songs.length ? 'Cambios pendientes de guardar.' : '');
  });

  section.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-remove-music-row]');
    if (remove) {
      const rows = section.querySelectorAll('[data-music-row]');
      if (rows.length === 1) {
        rows[0].querySelector('[data-music-title]').value = '';
        const artist = rows[0].querySelector('[data-music-artist]');
        if (artist) artist.value = '';
      } else {
        remove.closest('[data-music-row]')?.remove();
      }
      const value = collectMusic(section);
      writeLocalMusic(session.id, value);
      renderRows(section, value);
      return;
    }

    if (event.target.closest('#rsvpAddMusicRow')) {
      const host = section.querySelector('#rsvpMusicRows');
      const count = host.querySelectorAll('[data-music-row]').length;
      if (count >= musicConfig.maxSongs) return;
      host.insertAdjacentHTML('beforeend', songRow({}, count));
      section.querySelector('#rsvpAddMusicRow').disabled = count + 1 >= musicConfig.maxSongs;
      return;
    }

    if (event.target.closest('#rsvpSaveMusic')) {
      saveMusic(section);
      return;
    }

    if (event.target.closest('#rsvpBackToConfirmation')) {
      location.href = rsvpUrl();
    }
  });

  requestAnimationFrame(() => window.parent?.postMessage({
    type: 'MIGRANDIA_RSVP_HEIGHT',
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
  }, '*'));
}

function ensureSuccessMusicCta() {
  if (MUSIC_ONLY || !musicConfig.enabled) return;
  const success = document.getElementById('rsvpSuccess');
  const editButton = document.getElementById('rsvpEditResponse');
  if (!success || !editButton || success.querySelector('#rsvpChooseMusic')) return;

  const button = document.createElement('button');
  button.className = 'rsvp-edit-button';
  button.id = 'rsvpChooseMusic';
  button.type = 'button';
  button.textContent = 'Elegir mi canción →';
  button.addEventListener('click', () => {
    const url = new URL(location.href);
    url.searchParams.set('view', 'music');
    location.href = url.href;
  });
  editButton.before(button);
}

async function scan() {
  const form = document.getElementById('rsvpPublicForm');
  if (!form) return;
  await loadMusicConfig();
  if (MUSIC_ONLY) await installMusicOnlySection(form);
  else {
    await installMusicPreserver(form);
    ensureSuccessMusicCta();
  }
}

const observer = new MutationObserver(scan);
observer.observe(document.documentElement, { childList: true, subtree: true });
scan();
