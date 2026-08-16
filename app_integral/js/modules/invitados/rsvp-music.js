import { getApp, getApps } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  doc,
  getFirestore,
  serverTimestamp,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION = '20260816-1555-rsvp-music1';
const params = new URLSearchParams(location.search);
const token = String(params.get('token') || '').trim();
const MAX_SONGS = 5;

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

function clean(value, max = 140) {
  return String(value || '').trim().slice(0, max);
}

function readLocalMusic(sessionId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(localKey(sessionId)) || 'null');
    if (!parsed || !Array.isArray(parsed.songs)) return { songs: [] };
    return {
      version: 1,
      songs: parsed.songs
        .map((item) => ({ title: clean(item?.title), artist: clean(item?.artist) }))
        .filter((item) => item.title || item.artist)
        .slice(0, MAX_SONGS),
      updatedAtClient: clean(parsed.updatedAtClient, 60)
    };
  } catch (_) {
    return { songs: [] };
  }
}

function writeLocalMusic(sessionId, value) {
  localStorage.setItem(localKey(sessionId), JSON.stringify(value));
}

function serializeMusic(value) {
  return JSON.stringify({
    version: 1,
    songs: (value?.songs || []).slice(0, MAX_SONGS),
    updatedAtClient: value?.updatedAtClient || new Date().toISOString()
  });
}

function parseMusic(value) {
  if (!value) return { songs: [] };
  if (typeof value === 'object' && Array.isArray(value.songs)) return value;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && Array.isArray(parsed.songs) ? parsed : { songs: [] };
  } catch (_) {
    return { songs: [] };
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

function songRow(item = {}, index = 0) {
  return `
    <div class="rsvp-music-row" data-music-row>
      <label class="rsvp-field">
        <span>Canción</span>
        <input class="rsvp-input" data-music-title maxlength="140" placeholder="Ej. Yellow" value="${escapeHtml(item.title || '')}">
      </label>
      <label class="rsvp-field">
        <span>Artista</span>
        <input class="rsvp-input" data-music-artist maxlength="140" placeholder="Ej. Coldplay" value="${escapeHtml(item.artist || '')}">
      </label>
      <button class="rsvp-music-remove" type="button" data-remove-music-row aria-label="Quitar canción ${index + 1}" title="Quitar canción">×</button>
    </div>`;
}

function collectMusic(section) {
  const songs = [...section.querySelectorAll('[data-music-row]')]
    .map((row) => ({
      title: clean(row.querySelector('[data-music-title]')?.value),
      artist: clean(row.querySelector('[data-music-artist]')?.value)
    }))
    .filter((item) => item.title || item.artist)
    .slice(0, MAX_SONGS);
  return {
    version: 1,
    songs,
    updatedAtClient: new Date().toISOString()
  };
}

function setStatus(section, text, type = '') {
  const node = section.querySelector('#rsvpMusicStatus');
  if (!node) return;
  node.textContent = text;
  node.className = `rsvp-music-status${type ? ` ${type}` : ''}`;
}

function syncHiddenField(section, value) {
  const form = section.closest('form');
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
  host.innerHTML = songs.slice(0, MAX_SONGS).map(songRow).join('');
  const add = section.querySelector('#rsvpAddMusicRow');
  if (add) add.disabled = host.querySelectorAll('[data-music-row]').length >= MAX_SONGS;
}

async function saveMusic(section) {
  const session = getRsvpSession();
  if (!session) {
    setStatus(section, 'No pudimos identificar esta respuesta. Recarga el formulario.', 'error');
    return;
  }

  const music = collectMusic(section);
  writeLocalMusic(session.id, music);
  syncHiddenField(section, music);

  const button = section.querySelector('#rsvpSaveMusic');
  if (button) {
    button.disabled = true;
    button.textContent = 'Guardando…';
  }

  if (!music.songs.length) {
    setStatus(section, 'No agregaste canciones. Tu confirmación no será modificada.');
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
    await updateDoc(doc(db, 'publicRsvp', token, 'responses', session.id), {
      'customData.mgdMusic': serializeMusic(music),
      updatedAt: serverTimestamp()
    });
    setStatus(section, 'Música guardada ✓', 'success');
  } catch (error) {
    const code = String(error?.code || error?.message || '');
    if (code.includes('not-found') || code.includes('firebase-not-ready')) {
      setStatus(section, 'Tus canciones están listas y se guardarán junto con tu confirmación.', 'pending');
    } else if (code.includes('permission-denied')) {
      setStatus(section, 'Guarda primero tu confirmación. Tus canciones quedaron preparadas.', 'pending');
    } else {
      console.error('RSVP music save error:', error);
      setStatus(section, 'No pudimos guardar la música ahora. Tus canciones siguen guardadas en este dispositivo.', 'error');
    }
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Guardar música';
    }
  }
}

function installMusicSection(form) {
  if (!form || form.dataset.mgdMusicInstalled === VERSION) return;
  form.dataset.mgdMusicInstalled = VERSION;
  const session = getRsvpSession();
  if (!session) return;

  const submit = form.querySelector('#rsvpSubmitButton');
  if (!submit) return;

  const section = document.createElement('section');
  section.className = 'rsvp-section rsvp-music-section';
  section.id = 'rsvpMusicSection';
  section.innerHTML = `
    <div class="rsvp-music-heading">
      <span class="rsvp-music-kicker">Para la fiesta</span>
      <h2 class="rsvp-section-title">La música también la eligen ustedes</h2>
      <p>Ayúdanos a preparar la fiesta. Déjanos las canciones que te gustaría escuchar para tenerlas en cuenta con el DJ o grupo y que ese día solo tengas que disfrutar.</p>
    </div>
    <div class="rsvp-music-rows" id="rsvpMusicRows"></div>
    <div class="rsvp-music-actions">
      <button class="rsvp-music-add" id="rsvpAddMusicRow" type="button">+ Agregar otra canción</button>
      <button class="rsvp-music-save" id="rsvpSaveMusic" type="button">Guardar música</button>
    </div>
    <div class="rsvp-music-status" id="rsvpMusicStatus" role="status" aria-live="polite"></div>`;

  submit.before(section);

  let stored = readLocalMusic(session.id);
  const previousHidden = form.querySelector('[data-custom-key="mgdMusic"]')?.value;
  if (previousHidden && !stored.songs.length) stored = parseMusic(previousHidden);
  renderRows(section, stored);
  syncHiddenField(section, stored);

  section.addEventListener('input', () => {
    const value = collectMusic(section);
    writeLocalMusic(session.id, value);
    syncHiddenField(section, value);
    setStatus(section, value.songs.length ? 'Cambios pendientes de guardar.' : '');
  });

  section.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-remove-music-row]');
    if (remove) {
      const rows = section.querySelectorAll('[data-music-row]');
      if (rows.length === 1) {
        rows[0].querySelector('[data-music-title]').value = '';
        rows[0].querySelector('[data-music-artist]').value = '';
      } else {
        remove.closest('[data-music-row]')?.remove();
      }
      const value = collectMusic(section);
      writeLocalMusic(session.id, value);
      syncHiddenField(section, value);
      renderRows(section, value);
      return;
    }

    if (event.target.closest('#rsvpAddMusicRow')) {
      const host = section.querySelector('#rsvpMusicRows');
      const count = host.querySelectorAll('[data-music-row]').length;
      if (count >= MAX_SONGS) return;
      host.insertAdjacentHTML('beforeend', songRow({}, count));
      section.querySelector('#rsvpAddMusicRow').disabled = count + 1 >= MAX_SONGS;
      return;
    }

    if (event.target.closest('#rsvpSaveMusic')) saveMusic(section);
  });

  form.addEventListener('submit', () => {
    const value = collectMusic(section);
    writeLocalMusic(session.id, value);
    syncHiddenField(section, value);
  }, true);

  requestAnimationFrame(() => window.parent?.postMessage({
    type: 'MIGRANDIA_RSVP_HEIGHT',
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
  }, '*'));
}

function scan() {
  const form = document.getElementById('rsvpPublicForm');
  if (form) installMusicSection(form);
}

const observer = new MutationObserver(scan);
observer.observe(document.documentElement, { childList: true, subtree: true });
scan();
