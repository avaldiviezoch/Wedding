import { getApp, getApps } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION = '20260817-2112-rsvp-music2';
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

function clean(value, max = 140) { return String(value || '').trim().slice(0, max); }
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
    } catch (error) { console.warn('No se pudo leer configuración de música:', error); }
    return musicConfig;
  })();
  return configPromise;
}

function getRsvpSession() {
  if (!token) return null;
  try {
    const value = JSON.parse(localStorage.getItem(`migrandia_rsvp_session_${token}`) || 'null');
    return value?.id && value?.editToken ? value : null;
  } catch (_) { return null; }
}

function localKey(sessionId) { return `migrandia_rsvp_music_${token}_${sessionId || 'pending'}`; }
function readLocalMusic(sessionId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(localKey(sessionId)) || 'null');
    if (!parsed || !Array.isArray(parsed.songs)) return { songs: [], message: '', guestName: '' };
    return {
      version: 1,
      songs: parsed.songs.map((item) => ({ title: clean(item?.title), artist: clean(item?.artist) })).filter((item) => item.title || item.artist).slice(0, musicConfig.maxSongs),
      message: clean(parsed.message, 500),
      guestName: clean(parsed.guestName, 120),
      updatedAtClient: clean(parsed.updatedAtClient, 60)
    };
  } catch (_) { return { songs: [], message: '', guestName: '' }; }
}
function writeLocalMusic(sessionId, value) { localStorage.setItem(localKey(sessionId), JSON.stringify(value)); }
function serializeMusic(value) {
  return JSON.stringify({ version: 1, songs: (value?.songs || []).slice(0, musicConfig.maxSongs), message: clean(value?.message, 500), guestName: clean(value?.guestName, 120), updatedAtClient: value?.updatedAtClient || new Date().toISOString() });
}
function parseMusic(value) {
  if (!value) return { songs: [], message: '', guestName: '' };
  if (typeof value === 'object' && Array.isArray(value.songs)) return value;
  try { const parsed = JSON.parse(String(value)); return parsed && Array.isArray(parsed.songs) ? parsed : { songs: [], message: '', guestName: '' }; } catch (_) { return { songs: [], message: '', guestName: '' }; }
}
function escapeHtml(value = '') { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }

function songRow(item = {}, index = 0) {
  return `<div class="rsvp-music-row" data-music-row>
    <label class="rsvp-field"><span>Canción</span><input class="rsvp-input" data-music-title maxlength="140" placeholder="Ej. Yellow" value="${escapeHtml(item.title || '')}"></label>
    ${musicConfig.askArtist ? `<label class="rsvp-field"><span>Artista</span><input class="rsvp-input" data-music-artist maxlength="140" placeholder="Ej. Coldplay" value="${escapeHtml(item.artist || '')}"></label>` : ''}
    <button class="rsvp-music-remove" type="button" data-remove-music-row aria-label="Quitar canción ${index + 1}" title="Quitar canción">×</button>
  </div>`;
}

function collectMusic(section) {
  const songs = [...section.querySelectorAll('[data-music-row]')].map((row) => ({ title: clean(row.querySelector('[data-music-title]')?.value), artist: musicConfig.askArtist ? clean(row.querySelector('[data-music-artist]')?.value) : '' })).filter((item) => item.title || item.artist).slice(0, musicConfig.maxSongs);
  return { version: 1, songs, message: musicConfig.askMessage ? clean(section.querySelector('#rsvpMusicMessage')?.value, 500) : '', guestName: MUSIC_ONLY ? clean(section.querySelector('#rsvpMusicGuestName')?.value, 120) : '', updatedAtClient: new Date().toISOString() };
}
function setStatus(section, text, type = '') { const node=section.querySelector('#rsvpMusicStatus'); if(node){node.textContent=text;node.className=`rsvp-music-status${type?` ${type}`:''}`;} }
function syncHiddenField(section, value) { const form=section.closest('form'); if(!form)return; let hidden=form.querySelector('[data-custom-key="mgdMusic"]'); if(!hidden){hidden=document.createElement('input');hidden.type='hidden';hidden.dataset.customKey='mgdMusic';form.appendChild(hidden);} hidden.value=serializeMusic(value); }
function renderRows(section, value) { const host=section.querySelector('#rsvpMusicRows'); if(!host)return; const songs=Array.isArray(value?.songs)&&value.songs.length?value.songs:[{}]; host.innerHTML=songs.slice(0,musicConfig.maxSongs).map(songRow).join(''); const add=section.querySelector('#rsvpAddMusicRow'); if(add)add.disabled=host.querySelectorAll('[data-music-row]').length>=musicConfig.maxSongs; }

async function saveMusic(section) {
  const session=getRsvpSession(); if(!session){setStatus(section,'No pudimos identificar esta respuesta. Recarga el formulario.','error');return;}
  const music=collectMusic(section); writeLocalMusic(session.id,music); syncHiddenField(section,music);
  const button=section.querySelector('#rsvpSaveMusic'); if(button){button.disabled=true;button.textContent='Guardando…';}
  if(!music.songs.length){setStatus(section,'Agrega al menos una canción para guardar.','pending');if(button){button.disabled=false;button.textContent='Guardar música';}return;}
  try {
    const app=getApps().length?getApp():null; if(!app)throw new Error('firebase-not-ready'); const db=getFirestore(app);
    const ref=doc(db,'publicRsvp',token,'responses',session.id);
    try {
      await updateDoc(ref,{'customData.mgdMusic':serializeMusic(music),updatedAt:serverTimestamp()});
    } catch (error) {
      const code=String(error?.code||error?.message||'');
      if(!code.includes('not-found')&&!code.includes('permission-denied')) throw error;
      await setDoc(ref,{
        version:1,
        source:'music-widget',
        customData:{mgdMusic:serializeMusic(music)},
        editToken:session.editToken,
        clientDate:new Date().toISOString(),
        submittedAt:serverTimestamp(),
        updatedAt:serverTimestamp()
      },{merge:true});
    }
    setStatus(section,'Música guardada ✓','success');
  } catch(error) {
    const code=String(error?.code||error?.message||'');
    if(code.includes('firebase-not-ready')||code.includes('permission-denied')) setStatus(section,'Tus canciones quedaron guardadas en este dispositivo. Intenta nuevamente cuando tengas conexión.','pending');
    else { console.error('RSVP music save error:',error); setStatus(section,'No pudimos guardar la música ahora. Tus canciones siguen guardadas en este dispositivo.','error'); }
  } finally { if(button){button.disabled=false;button.textContent='Guardar música';} }
}

function applyMusicOnlyLayout(form, section, stored) {
  document.body.classList.add('rsvp-music-only');
  form.querySelectorAll(':scope > *').forEach((node)=>{ if(node!==section) node.classList.add('hidden'); });
  section.classList.remove('hidden');
  const head=document.querySelector('.rsvp-public-head');
  if(head){const brand=head.querySelector('.rsvp-brand');if(brand)brand.textContent='Mi Gran Día · Música';const title=head.querySelector('h1');if(title)title.textContent=musicConfig.title;const welcome=head.querySelector('.rsvp-welcome');if(welcome)welcome.textContent=musicConfig.intro;}
  const footer=document.querySelector('.rsvp-footer');if(footer)footer.textContent='Encuesta musical protegida por Mi Gran Día';
  const name=section.querySelector('#rsvpMusicGuestName');if(name)name.value=stored.guestName||'';
}

function installMusicSection(form) {
  if(!form||form.dataset.mgdMusicInstalled===VERSION)return; const session=getRsvpSession(); if(!session)return;
  const submit=form.querySelector('#rsvpSubmitButton'); if(!submit)return;
  form.dataset.mgdMusicInstalled=VERSION;
  if(!musicConfig.enabled && !MUSIC_ONLY)return;
  const section=document.createElement('section'); section.className='rsvp-section rsvp-music-section';section.id='rsvpMusicSection';
  section.innerHTML=`<div class="rsvp-music-heading"><span class="rsvp-music-kicker">Para la fiesta</span><h2 class="rsvp-section-title">${escapeHtml(musicConfig.title)}</h2><p>${escapeHtml(musicConfig.intro)}</p></div>
    ${MUSIC_ONLY?'<label class="rsvp-field"><span>Tu nombre</span><input class="rsvp-input" id="rsvpMusicGuestName" maxlength="120" autocomplete="name" placeholder="Nombre completo"></label>':''}
    <div class="rsvp-music-rows" id="rsvpMusicRows"></div>
    ${musicConfig.askMessage?`<label class="rsvp-field rsvp-music-message"><span>${escapeHtml(musicConfig.messageLabel)}</span><textarea class="rsvp-textarea" id="rsvpMusicMessage" maxlength="500" placeholder="Escribe aquí si quieres dejar una dedicatoria o indicación para los novios"></textarea></label>`:''}
    <div class="rsvp-music-actions"><button class="rsvp-music-add" id="rsvpAddMusicRow" type="button">+ Agregar otra canción</button><button class="rsvp-music-save" id="rsvpSaveMusic" type="button">Guardar música</button></div><div class="rsvp-music-status" id="rsvpMusicStatus" role="status" aria-live="polite"></div>`;
  submit.before(section);
  let stored=readLocalMusic(session.id);const previousHidden=form.querySelector('[data-custom-key="mgdMusic"]')?.value;if(previousHidden&&!stored.songs.length)stored=parseMusic(previousHidden);
  renderRows(section,stored);if(musicConfig.askMessage){const msg=section.querySelector('#rsvpMusicMessage');if(msg)msg.value=stored.message||'';}syncHiddenField(section,stored);
  if(MUSIC_ONLY)applyMusicOnlyLayout(form,section,stored);
  section.addEventListener('input',()=>{const value=collectMusic(section);writeLocalMusic(session.id,value);syncHiddenField(section,value);setStatus(section,value.songs.length?'Cambios pendientes de guardar.':'');});
  section.addEventListener('click',(event)=>{const remove=event.target.closest('[data-remove-music-row]');if(remove){const rows=section.querySelectorAll('[data-music-row]');if(rows.length===1){rows[0].querySelector('[data-music-title]').value='';const artist=rows[0].querySelector('[data-music-artist]');if(artist)artist.value='';}else remove.closest('[data-music-row]')?.remove();const value=collectMusic(section);writeLocalMusic(session.id,value);syncHiddenField(section,value);renderRows(section,value);return;}if(event.target.closest('#rsvpAddMusicRow')){const host=section.querySelector('#rsvpMusicRows');const count=host.querySelectorAll('[data-music-row]').length;if(count>=musicConfig.maxSongs)return;host.insertAdjacentHTML('beforeend',songRow({},count));section.querySelector('#rsvpAddMusicRow').disabled=count+1>=musicConfig.maxSongs;return;}if(event.target.closest('#rsvpSaveMusic'))saveMusic(section);});
  form.addEventListener('submit',()=>{const value=collectMusic(section);writeLocalMusic(session.id,value);syncHiddenField(section,value);},true);
  requestAnimationFrame(()=>window.parent?.postMessage({type:'MIGRANDIA_RSVP_HEIGHT',height:Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)},'*'));
}

async function scan() { const form=document.getElementById('rsvpPublicForm'); if(!form)return; await loadMusicConfig(); installMusicSection(form); }
const observer=new MutationObserver(scan);observer.observe(document.documentElement,{childList:true,subtree:true});scan();