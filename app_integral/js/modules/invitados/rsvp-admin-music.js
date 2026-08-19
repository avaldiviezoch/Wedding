import { db, getWeddingContext } from '../../services/firebase.js?v=20260814-1136-collab1';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION = '20260819-2300-rsvp-live-preview1';
const installedDocs = new WeakMap();
const PUBLIC_RSVP_BASE = 'https://avaldiviezoch.github.io/Wedding/rsvp.html';
const NATIVE_WIDGET_URL = 'https://avaldiviezoch.github.io/Wedding/app_integral/js/modules/invitados/rsvp-native-widget.js?v=20260819-2330-music-gate1';

const DEFAULT_MUSIC_CONFIG = Object.freeze({
  enabled: true,
  title: 'La música también la eligen ustedes',
  intro: 'Ayúdanos a preparar la fiesta. Déjanos las canciones que te gustaría escuchar para tenerlas en cuenta con el DJ o grupo y que ese día solo tengas que disfrutar.',
  maxSongs: 5,
  askArtist: true,
  askMessage: true,
  messageLabel: 'Mensaje o dedicatoria (opcional)'
});

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalize(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function cleanText(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

function normalizeMusicConfig(value = {}) {
  return {
    enabled: value.enabled !== false,
    title: cleanText(value.title || DEFAULT_MUSIC_CONFIG.title, 110) || DEFAULT_MUSIC_CONFIG.title,
    intro: cleanText(value.intro || DEFAULT_MUSIC_CONFIG.intro, 500) || DEFAULT_MUSIC_CONFIG.intro,
    maxSongs: Math.max(1, Math.min(10, Math.floor(Number(value.maxSongs) || DEFAULT_MUSIC_CONFIG.maxSongs))),
    askArtist: value.askArtist !== false,
    askMessage: value.askMessage !== false,
    messageLabel: cleanText(value.messageLabel || DEFAULT_MUSIC_CONFIG.messageLabel, 90) || DEFAULT_MUSIC_CONFIG.messageLabel
  };
}

function parseMusic(value) {
  if (!value) return { songs: [], message: '', guestName: '' };
  let parsed = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch (_) { return { songs: [], message: '', guestName: '' }; }
  }
  const songs = Array.isArray(parsed?.songs) ? parsed.songs : [];
  return {
    songs: songs
      .map((item) => ({
        title: cleanText(item?.title, 140),
        artist: cleanText(item?.artist, 140)
      }))
      .filter((item) => item.title || item.artist)
      .slice(0, 10),
    message: cleanText(parsed?.message, 500),
    guestName: cleanText(parsed?.guestName, 120)
  };
}

function responseMusic(item) {
  if (item?.attendance !== 'confirmed') return { songs: [], message: '', guestName: '' };
  return parseMusic(item?.customData?.mgdMusic);
}

function musicOnlyUrl(token) {
  const cleanToken = cleanText(token, 180);
  return cleanToken ? `${PUBLIC_RSVP_BASE}?token=${encodeURIComponent(cleanToken)}&view=music` : '';
}

function musicEmbedCode(token) {
  const cleanToken = cleanText(token, 180);
  if (!cleanToken) return '';
  return `<div\n  data-mgd-music-token="${cleanToken}"\n  style="--mgd-accent:#6d7559;--mgd-surface:rgba(255,255,255,.12);--mgd-border:rgba(109,117,89,.24);"\n></div>\n<script type="module" src="${NATIVE_WIDGET_URL}"></script>`;
}

function injectStyles(doc) {
  if (doc.getElementById('mgdRsvpAdminMusicStyles')) return;
  const style = doc.createElement('style');
  style.id = 'mgdRsvpAdminMusicStyles';
  style.textContent = `
    .rsvp-music-admin-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:14px}
    .rsvp-music-admin-kpi{padding:14px;border:1px solid #e5e2d9;border-radius:15px;background:#faf9f5}
    .rsvp-music-admin-kpi span{display:block;color:#888e83;font-size:10px;font-weight:750;text-transform:uppercase;letter-spacing:.06em}.rsvp-music-admin-kpi strong{display:block;margin-top:5px;color:#343b31;font-size:23px;line-height:1}
    .rsvp-music-admin-list{display:grid;gap:9px}.rsvp-music-admin-row{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.9fr) auto;gap:12px;align-items:center;padding:13px 14px;border:1px solid #e5e2d9;border-radius:15px;background:#fff}
    .rsvp-music-admin-song strong,.rsvp-music-admin-person strong{display:block;color:#343b31;font-size:12px}.rsvp-music-admin-song span,.rsvp-music-admin-person span{display:block;margin-top:3px;color:#858b81;font-size:10px}.rsvp-music-admin-count{display:grid;place-items:center;min-width:34px;height:28px;padding:0 9px;border-radius:999px;background:#eef0e6;color:#6f7856;font-size:10px;font-weight:850}
    .rsvp-music-admin-empty{padding:28px;border:1px dashed #dad8cf;border-radius:16px;text-align:center;color:#858b81;font-size:11px;line-height:1.55}.rsvp-music-response-box{margin-top:8px;padding:9px 10px;border-radius:12px;background:#f3f5ed;color:#626b58;font-size:10px;line-height:1.5}.rsvp-music-response-box strong{color:#566149}.rsvp-music-response-list{margin:6px 0 0;padding-left:20px;display:grid;gap:4px}.rsvp-music-response-list li{padding-left:2px}.rsvp-music-response-separator{height:1px;margin:9px 0;background:#dfe3d4}.rsvp-chip.is-music{background:#eef0e6;color:#63704e;border-color:#dce1d0}
    .mgd-music-builder{border:1px solid #dfe3d4;background:linear-gradient(145deg,#fbfcf8,#f3f5ed)}.mgd-music-builder-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.mgd-music-builder-grid .wide{grid-column:1/-1}.mgd-music-builder .rsvp-field input,.mgd-music-builder .rsvp-field textarea,.mgd-music-builder .rsvp-field select{width:100%;min-height:44px;border:1px solid #ddd9cf;border-radius:12px;padding:10px 12px;background:#fff;color:#343b31}.mgd-music-builder .rsvp-field textarea{min-height:92px;resize:vertical}.mgd-music-builder-switches{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.mgd-music-builder-switch{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid #e1dfd7;border-radius:12px;background:#fff;color:#62695d;font-size:11px}.mgd-music-preview{margin-top:14px;padding:15px;border:1px dashed #d9ddcf;border-radius:15px;background:#fff}.mgd-music-preview small{display:block;color:#899267;font-size:9px;font-weight:850;letter-spacing:.12em;text-transform:uppercase}.mgd-music-preview strong{display:block;margin-top:5px;color:#343b31;font-size:15px}.mgd-music-preview p{margin:6px 0 0;color:#747b70;font-size:11px;line-height:1.55}.mgd-music-preview-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.mgd-music-preview-field{height:40px;border:1px solid #e2dfd7;border-radius:11px;background:#faf9f6;padding:11px;color:#999;font-size:10px}.mgd-music-preview-field.wide{grid-column:1/-1}
    .mgd-music-integrate{margin-top:14px}.mgd-music-integrate-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.mgd-music-integrate-box{padding:14px;border:1px solid #e2dfd7;border-radius:15px;background:#faf9f6}.mgd-music-integrate-box label{display:block;margin-bottom:7px;color:#6b7265;font-size:10px;font-weight:800}.mgd-music-integrate-box input,.mgd-music-integrate-box textarea{width:100%;border:1px solid #ddd9cf;border-radius:11px;background:#fff;padding:10px;color:#495045;font-size:10px}.mgd-music-integrate-box textarea{min-height:112px;resize:vertical}.mgd-music-integrate-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
    .mgd-music-preview{padding:0;overflow:hidden;border-style:solid;border-radius:20px;box-shadow:0 14px 36px rgba(61,70,54,.08)}.mgd-music-preview-head{display:flex;align-items:center;justify-content:space-between;padding:12px 15px;border-bottom:1px solid #eceee7;background:#fafbf7}.mgd-music-preview-head span{padding:4px 8px;border-radius:999px;background:#eef2e6;color:#697451;font-size:8px;font-weight:800}.mgd-music-preview-layout{display:grid;grid-template-columns:minmax(150px,.72fr) minmax(240px,1.28fr)}.mgd-music-preview-media{min-height:285px;display:grid;place-content:center;text-align:center;padding:24px;background:linear-gradient(145deg,#dfe5d2,#9eaa88);color:#fff}.mgd-music-preview-media b{font-size:28px}.mgd-music-preview-media strong{margin-top:9px;color:#fff;font-size:13px}.mgd-music-preview-media small{margin-top:4px;color:rgba(255,255,255,.82);font-size:9px;letter-spacing:0;text-transform:none}.mgd-music-preview-body{padding:22px}.mgd-music-preview-body>strong{font:700 18px/1.2 Georgia,serif}.mgd-music-preview-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;grid-column:1/-1;padding:9px;border:1px solid #e6e4dc;border-radius:12px;background:#faf9f6}.mgd-music-preview-submit{grid-column:1/-1;border:0;border-radius:10px;padding:11px;background:#6d7559;color:#fff;font-size:10px;font-weight:800}
    @media(max-width:700px){.rsvp-music-admin-summary,.mgd-music-builder-grid,.mgd-music-integrate-grid,.mgd-music-preview-layout{grid-template-columns:1fr}.mgd-music-preview-media{min-height:150px}.mgd-music-admin-row{grid-template-columns:1fr auto}.rsvp-music-admin-person{grid-column:1}.rsvp-music-admin-count{grid-column:2;grid-row:1 / span 2}.mgd-music-preview-fields{grid-template-columns:1fr}.mgd-music-preview-field.wide{grid-column:auto}.mgd-music-preview-row{grid-template-columns:1fr}}
  `;
  doc.head.appendChild(style);
}

function builderMarkup() {
  return `
    <div class="rsvp-card mgd-music-builder" id="mgdMusicBuilderCard">
      <div class="rsvp-card-head"><div><h3>Encuesta de música para DJ</h3><p>Configura el bloque que tus invitados podrán completar dentro del RSVP o como formulario “Solo Música” integrado en tu invitación digital.</p></div><span class="rsvp-sync-state" id="mgdMusicBuilderState">Listo para configurar</span></div>
      <div class="mgd-music-builder-grid">
        <label class="rsvp-field wide"><span>Título del bloque</span><input id="mgdMusicTitle" maxlength="110"></label>
        <label class="rsvp-field wide"><span>Texto para tus invitados</span><textarea id="mgdMusicIntro" maxlength="500"></textarea></label>
        <label class="rsvp-field"><span>Máximo de canciones por invitado</span><select id="mgdMusicMaxSongs">${Array.from({length:10},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></label>
        <label class="rsvp-field"><span>Etiqueta del mensaje</span><input id="mgdMusicMessageLabel" maxlength="90"></label>
      </div>
      <div class="mgd-music-builder-switches">
        <label class="mgd-music-builder-switch"><input id="mgdMusicEnabled" type="checkbox"> Activar encuesta de música</label>
        <label class="mgd-music-builder-switch"><input id="mgdMusicAskArtist" type="checkbox"> Preguntar artista</label>
        <label class="mgd-music-builder-switch"><input id="mgdMusicAskMessage" type="checkbox"> Permitir mensaje / dedicatoria</label>
      </div>
      <div class="rsvp-note"><strong>Acceso protegido automáticamente:</strong> la encuesta solo se habilita después de que la persona confirme “Sí, asistiré”. Si aún no respondió, verá un botón para ir a Confirmación; si respondió “No” o “Por confirmar”, no podrá guardar canciones.</div>
      <div class="mgd-music-preview" id="mgdMusicPreview"></div>
      <div class="rsvp-config-footer"><button class="rsvp-btn primary" id="mgdSaveMusicConfig" type="button">Guardar encuesta de música</button></div>
    </div>`;
}

function integrationMarkup() {
  return `
    <div class="rsvp-card mgd-music-integrate" id="mgdMusicIntegrateCard">
      <div class="rsvp-card-head"><div><h3>Integrar “Solo Música” en tu invitación</h3><p>Este bloque muestra únicamente la encuesta musical. Puedes ponerlo donde quieras en la invitación, sin duplicar toda la confirmación RSVP.</p></div></div>
      <div class="mgd-music-integrate-grid">
        <div class="mgd-music-integrate-box"><label>Enlace público · Solo Música</label><input id="mgdMusicPublicUrl" readonly placeholder="Publica primero el RSVP"><div class="mgd-music-integrate-actions"><button class="rsvp-btn" id="mgdCopyMusicUrl" type="button">Copiar enlace</button><button class="rsvp-btn dark" id="mgdOpenMusicUrl" type="button">Abrir vista</button></div></div>
        <div class="mgd-music-integrate-box"><label>Código HTML &lt;/&gt;</label><textarea id="mgdMusicEmbedCode" readonly placeholder="Aquí aparecerá el iframe de música"></textarea><div class="mgd-music-integrate-actions"><button class="rsvp-btn" id="mgdCopyMusicEmbed" type="button">Copiar HTML</button></div></div>
      </div>
      <div class="rsvp-note">La vista “Solo Música” usa el mismo token de la boda y la misma sesión del invitado. Si esa persona también completa el RSVP, ambos datos quedan asociados sin que una parte borre la otra.</div>
    </div>`;
}

function ensureUi(doc) {
  const shell = doc.querySelector('.rsvp-admin-shell');
  const tabs = shell?.querySelector('.rsvp-admin-tabs');
  if (!shell || !tabs) return null;

  let tab = tabs.querySelector('[data-rsvp-pane-tab="music"]');
  if (!tab) {
    tab = doc.createElement('button');
    tab.className = 'rsvp-admin-tab';
    tab.type = 'button';
    tab.dataset.rsvpPaneTab = 'music';
    tab.textContent = '♫ Música';
    tabs.appendChild(tab);
    tab.addEventListener('click', () => {
      doc.querySelectorAll('[data-rsvp-pane-tab]').forEach((item) => item.classList.toggle('is-active', item === tab));
      doc.querySelectorAll('[data-rsvp-pane]').forEach((pane) => pane.classList.toggle('is-active', pane.dataset.rsvpPane === 'music'));
    });
  }

  let pane = shell.querySelector('[data-rsvp-pane="music"]');
  if (!pane) {
    pane = doc.createElement('section');
    pane.className = 'rsvp-pane';
    pane.dataset.rsvpPane = 'music';
    pane.innerHTML = `<div class="rsvp-card"><div class="rsvp-card-head"><div><h3>Música solicitada por tus invitados</h3><p>Aquí se consolidan los pedidos musicales vinculados a las respuestas RSVP.</p></div><span class="rsvp-sync-state" id="rsvpMusicSyncState">Cargando música…</span></div><div class="rsvp-music-admin-summary"><article class="rsvp-music-admin-kpi"><span>Invitados con música</span><strong id="rsvpMusicGuests">0</strong></article><article class="rsvp-music-admin-kpi"><span>Pedidos musicales</span><strong id="rsvpMusicRequests">0</strong></article><article class="rsvp-music-admin-kpi"><span>Canciones únicas</span><strong id="rsvpMusicUnique">0</strong></article></div><div class="rsvp-music-admin-list" id="rsvpMusicAdminList"></div></div>`;
    shell.appendChild(pane);
  }

  const formPane = shell.querySelector('[data-rsvp-pane="form"]');
  if (formPane && !formPane.querySelector('#mgdMusicBuilderCard')) formPane.insertAdjacentHTML('beforeend', builderMarkup());
  const integratePane = shell.querySelector('[data-rsvp-pane="integrate"]');
  if (integratePane && !integratePane.querySelector('#mgdMusicPublicUrl') && !integratePane.querySelector('#mgdMusicIntegrateCard')) integratePane.insertAdjacentHTML('beforeend', integrationMarkup());
  return { tab, pane };
}

function readBuilder(doc) {
  return normalizeMusicConfig({
    enabled: Boolean(doc.getElementById('mgdMusicEnabled')?.checked),
    title: doc.getElementById('mgdMusicTitle')?.value,
    intro: doc.getElementById('mgdMusicIntro')?.value,
    maxSongs: Number(doc.getElementById('mgdMusicMaxSongs')?.value || 5),
    askArtist: Boolean(doc.getElementById('mgdMusicAskArtist')?.checked),
    askMessage: Boolean(doc.getElementById('mgdMusicAskMessage')?.checked),
    messageLabel: doc.getElementById('mgdMusicMessageLabel')?.value
  });
}

function renderBuilder(doc, config) {
  const c = normalizeMusicConfig(config);
  const setValue = (id, value) => { const el = doc.getElementById(id); if (el) el.value = String(value ?? ''); };
  setValue('mgdMusicTitle', c.title); setValue('mgdMusicIntro', c.intro); setValue('mgdMusicMaxSongs', c.maxSongs); setValue('mgdMusicMessageLabel', c.messageLabel);
  const enabled = doc.getElementById('mgdMusicEnabled'); if (enabled) enabled.checked = c.enabled;
  const artist = doc.getElementById('mgdMusicAskArtist'); if (artist) artist.checked = c.askArtist;
  const message = doc.getElementById('mgdMusicAskMessage'); if (message) message.checked = c.askMessage;
  renderPreview(doc, c);
}

function renderPreview(doc, config = readBuilder(doc)) {
  const host = doc.getElementById('mgdMusicPreview'); if (!host) return;
  const c = normalizeMusicConfig(config);
  const rows = Array.from({ length: Math.min(3, c.maxSongs) }, (_, index) => `<div class="mgd-music-preview-row"><div class="mgd-music-preview-field">Canción ${index + 1}</div>${c.askArtist ? '<div class="mgd-music-preview-field">Artista</div>' : ''}</div>`).join('');
  host.innerHTML = `<div class="mgd-music-preview-head"><small>Vista previa en vivo</small><span>No modifica el token</span></div><div class="mgd-music-preview-layout"><div class="mgd-music-preview-media"><b>♫</b><strong>Tu foto, imagen o GIF</strong><small>Aquí irá el elemento que abre Música</small></div><div class="mgd-music-preview-body"><small>ENCUESTA MUSICAL</small><strong>${escapeHtml(c.title)}</strong><p>${escapeHtml(c.intro)}</p><div class="mgd-music-preview-fields">${rows}${c.maxSongs > 3 ? `<div class="mgd-music-preview-field wide">+ ${c.maxSongs - 3} canciones disponibles</div>` : ''}${c.askMessage ? `<div class="mgd-music-preview-field wide">${escapeHtml(c.messageLabel)}</div>` : ''}<button class="mgd-music-preview-submit" type="button">Guardar música</button></div></div></div>`;
}

function renderIntegration(doc, token) {
  const url = musicOnlyUrl(token); const code = musicEmbedCode(token);
  const u = doc.getElementById('mgdMusicPublicUrl'); if (u) u.value = url;
  const e = doc.getElementById('mgdMusicEmbedCode'); if (e) e.value = code;
  ['mgdCopyMusicUrl','mgdOpenMusicUrl','mgdCopyMusicEmbed'].forEach((id)=>{ const b=doc.getElementById(id); if(b) b.disabled=!url; });
}

async function copyText(value, button) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
  const before = button.textContent; button.textContent = 'Copiado ✓'; setTimeout(()=>button.textContent=before,1200);
}

async function loadMusicConfig(doc) {
  const context = getWeddingContext();
  if (!context?.id || context.legacyMode) return { config: normalizeMusicConfig(), token: '' };
  const snap = await getDoc(doc(db, 'weddings', context.id, 'rsvpConfig', 'main'));
  const data = snap.exists() ? (snap.data() || {}) : {};
  const config = normalizeMusicConfig(data.musicConfig || {});
  renderBuilder(doc, config);
  renderIntegration(doc, data.token || '');
  return { config, token: String(data.token || '') };
}

async function saveMusicConfig(doc) {
  const context = getWeddingContext();
  if (!context?.id || context.legacyMode) throw new Error('No hay una boda activa.');
  const privateRef = doc(db, 'weddings', context.id, 'rsvpConfig', 'main');
  const current = await getDoc(privateRef);
  const token = String(current.data()?.token || '').trim();
  const config = readBuilder(doc);
  const batch = writeBatch(db);
  batch.set(privateRef, { musicConfig: config, updatedAt: serverTimestamp() }, { merge: true });
  if (token) batch.set(doc(db, 'publicRsvp', token), { musicConfig: config, updatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();
  renderBuilder(doc, config); renderIntegration(doc, token);
  return { config, token };
}

function annotateResponseCards(doc, items) {
  const byId = new Map(items.map((item) => [String(item.id), item]));
  doc.querySelectorAll('[data-rsvp-response-id]').forEach((card) => {
    const item = byId.get(String(card.dataset.rsvpResponseId));
    const music = responseMusic(item); const songs = music.songs;
    card.querySelectorAll('[data-mgd-music-chip],[data-mgd-music-box]').forEach((node) => node.remove());
    if (!songs.length && !music.message) return;
    const tags = card.querySelector('.rsvp-admin-tags');
    if (tags && songs.length) { const chip=doc.createElement('span'); chip.className='rsvp-chip rsvp-admin-tag is-music'; chip.dataset.mgdMusicChip='true'; chip.textContent=`♫ ${songs.length} canción${songs.length===1?'':'es'}`; tags.appendChild(chip); }
    const main = card.querySelector('.rsvp-response-main');
    if (main) { const box=doc.createElement('div'); box.className='rsvp-music-response-box'; box.dataset.mgdMusicBox='true'; const lines=[]; if(songs.length) lines.push(`<strong>Música:</strong><ol class="rsvp-music-response-list">${songs.map((song)=>`<li>${escapeHtml([song.title,song.artist].filter(Boolean).join(' — '))}</li>`).join('')}</ol>`); if(music.message) lines.push(`<strong>Mensaje:</strong> ${escapeHtml(music.message)}`); box.innerHTML=lines.join('<div class="rsvp-music-response-separator"></div>'); main.appendChild(box); }
  });
}

function render(doc, items) {
  const entries = [];
  items.forEach((item) => responseMusic(item).songs.forEach((song) => entries.push({ responseId:item.id, name:item.name||'Sin nombre', ...song })));
  const unique = new Map();
  entries.forEach((entry) => { const key=`${normalize(entry.title)}|${normalize(entry.artist)}`; if(!unique.has(key)) unique.set(key,{...entry,people:[]}); const target=unique.get(key); if(!target.people.includes(entry.name)) target.people.push(entry.name); });
  const setText=(id,value)=>{const el=doc.getElementById(id);if(el)el.textContent=String(value)};
  setText('rsvpMusicGuests',new Set(entries.map((e)=>String(e.responseId))).size); setText('rsvpMusicRequests',entries.length); setText('rsvpMusicUnique',unique.size);
  const state=doc.getElementById('rsvpMusicSyncState'); if(state){state.textContent=entries.length?'Música sincronizada con RSVP':'Sin pedidos musicales';state.className=`rsvp-sync-state${entries.length?' is-success':''}`;}
  const host=doc.getElementById('rsvpMusicAdminList'); if(host){host.innerHTML=!entries.length?'<div class="rsvp-music-admin-empty">Todavía ningún invitado ha guardado música. Cuando lo haga, aparecerá aquí automáticamente.</div>':[...unique.values()].sort((a,b)=>b.people.length-a.people.length||a.title.localeCompare(b.title,'es')).map((item)=>`<article class="rsvp-music-admin-row"><div class="rsvp-music-admin-song"><strong>${escapeHtml(item.title||'Canción sin título')}</strong><span>${escapeHtml(item.artist||'Artista no indicado')}</span></div><div class="rsvp-music-admin-person"><strong>${escapeHtml(item.people.join(', '))}</strong><span>${item.people.length===1?'Pedido por este invitado':'Coincidencia entre varios invitados'}</span></div><span class="rsvp-music-admin-count">${item.people.length}×</span></article>`).join('');}
  annotateResponseCards(doc, items);
}

async function resolveToken() {
  const context=getWeddingContext(); if(!context?.id||context.legacyMode)return''; const snap=await getDoc(doc(db,'weddings',context.id,'rsvpConfig','main')); return snap.exists()?String(snap.data()?.token||'').trim():'';
}

async function startSubscription(doc, state) {
  state.unsubscribe?.(); state.unsubscribe=null; const token=await resolveToken().catch(()=> '');
  if(!token){render(doc,[]);const node=doc.getElementById('rsvpMusicSyncState');if(node)node.textContent='Publica primero el RSVP';return;}
  const ref=collection(db,'publicRsvp',token,'responses'); const apply=(snap)=>render(doc,snap.docs.map((entry)=>({id:entry.id,...(entry.data()||{})})));
  state.unsubscribe=onSnapshot(query(ref,orderBy('submittedAt','desc')),apply,()=>{state.unsubscribe?.();state.unsubscribe=onSnapshot(ref,apply,(error)=>{console.error('RSVP admin music snapshot error:',error);const node=doc.getElementById('rsvpMusicSyncState');if(node){node.textContent='No se pudo leer la música';node.className='rsvp-sync-state is-error';}});});
}

function bindBuilder(doc, state) {
  ['mgdMusicTitle','mgdMusicIntro','mgdMusicMaxSongs','mgdMusicMessageLabel','mgdMusicEnabled','mgdMusicAskArtist','mgdMusicAskMessage'].forEach((id)=>doc.getElementById(id)?.addEventListener('input',()=>renderPreview(doc)));
  doc.getElementById('mgdSaveMusicConfig')?.addEventListener('click',async(event)=>{const button=event.currentTarget;const status=doc.getElementById('mgdMusicBuilderState');button.disabled=true;button.textContent='Guardando…';if(status)status.textContent='Guardando…';try{await saveMusicConfig(doc);if(status){status.textContent='Encuesta publicada ✓';status.className='rsvp-sync-state is-success';}setTimeout(()=>startSubscription(doc,state),400);}catch(error){console.error(error);if(status){status.textContent=error?.message||'No se pudo guardar';status.className='rsvp-sync-state is-error';}}finally{button.disabled=false;button.textContent='Guardar encuesta de música';}});
  doc.getElementById('mgdCopyMusicUrl')?.addEventListener('click',(event)=>copyText(doc.getElementById('mgdMusicPublicUrl')?.value,event.currentTarget));
  doc.getElementById('mgdCopyMusicEmbed')?.addEventListener('click',(event)=>copyText(doc.getElementById('mgdMusicEmbedCode')?.value,event.currentTarget));
  doc.getElementById('mgdOpenMusicUrl')?.addEventListener('click',()=>{const url=doc.getElementById('mgdMusicPublicUrl')?.value;if(url)window.open(url,'_blank','noopener');});
}

function install(doc) {
  if(!doc?.body||!doc.querySelector('.rsvp-admin-shell'))return false; if(installedDocs.has(doc))return true; injectStyles(doc); ensureUi(doc);
  const state={unsubscribe:null,observer:null}; installedDocs.set(doc,state); bindBuilder(doc,state); loadMusicConfig(doc).catch(console.error);
  state.observer=new MutationObserver(()=>{if(!doc.querySelector('[data-rsvp-pane-tab="music"]')||!doc.getElementById('mgdMusicBuilderCard')){ensureUi(doc);bindBuilder(doc,state);loadMusicConfig(doc).catch(()=>{});}}); state.observer.observe(doc.querySelector('.rsvp-admin-shell'),{childList:true,subtree:true});
  ['rsvpRefreshButton','rsvpSaveConfig','rsvpRegenerateLink'].forEach((id)=>doc.getElementById(id)?.addEventListener('click',()=>setTimeout(()=>{startSubscription(doc,state);loadMusicConfig(doc).catch(()=>{});},700)));
  startSubscription(doc,state); return true;
}

function scan(){const docs=[document];document.querySelectorAll('iframe').forEach((frame)=>{try{if(frame.contentDocument)docs.push(frame.contentDocument);}catch(_){}});docs.forEach(install);} const observer=new MutationObserver(scan);observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('load',scan);scan();
