import { db, getWeddingContext } from '../../services/firebase.js?v=20260814-1136-collab1';
import {
  doc as fsDoc,
  getDoc,
  serverTimestamp,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION = '20260816-1617-rsvp-music-builder2';
const PUBLIC_RSVP_BASE = 'https://avaldiviezoch.github.io/Wedding/rsvp.html';
const done = new WeakSet();

const DEFAULTS = {
  enabled: true,
  title: 'La música también la eligen ustedes',
  intro: 'Ayúdanos a preparar la fiesta. Déjanos las canciones que te gustaría escuchar para tenerlas en cuenta con el DJ o grupo y que ese día solo tengas que disfrutar.',
  maxSongs: 5,
  askArtist: true,
  askMessage: true,
  messageLabel: 'Mensaje o dedicatoria (opcional)'
};

function clean(value, max) { return String(value ?? '').trim().slice(0, max); }
function config(value = {}) {
  return {
    enabled: value.enabled !== false,
    title: clean(value.title || DEFAULTS.title, 110) || DEFAULTS.title,
    intro: clean(value.intro || DEFAULTS.intro, 500) || DEFAULTS.intro,
    maxSongs: Math.max(1, Math.min(10, Math.floor(Number(value.maxSongs) || 5))),
    askArtist: value.askArtist !== false,
    askMessage: value.askMessage !== false,
    messageLabel: clean(value.messageLabel || DEFAULTS.messageLabel, 90) || DEFAULTS.messageLabel
  };
}
function esc(value='') { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function musicUrl(token) { return token ? `${PUBLIC_RSVP_BASE}?token=${encodeURIComponent(token)}&view=music` : ''; }
function embed(token) { const url=musicUrl(token); return url ? `<iframe\n  src="${url}"\n  title="Encuesta de música para la boda"\n  style="width:100%;min-height:620px;border:0;border-radius:24px;overflow:hidden;"\n  loading="lazy"\n  referrerpolicy="strict-origin-when-cross-origin"\n></iframe>` : ''; }

function readUi(doc) {
  return config({
    enabled: !!doc.getElementById('mgdMusicEnabled')?.checked,
    title: doc.getElementById('mgdMusicTitle')?.value,
    intro: doc.getElementById('mgdMusicIntro')?.value,
    maxSongs: doc.getElementById('mgdMusicMaxSongs')?.value,
    askArtist: !!doc.getElementById('mgdMusicAskArtist')?.checked,
    askMessage: !!doc.getElementById('mgdMusicAskMessage')?.checked,
    messageLabel: doc.getElementById('mgdMusicMessageLabel')?.value
  });
}
function preview(doc, c = readUi(doc)) {
  const host=doc.getElementById('mgdMusicPreview'); if(!host)return;
  host.innerHTML=`<small>Vista previa</small><strong>${esc(c.title)}</strong><p>${esc(c.intro)}</p><div class="mgd-music-preview-fields"><div class="mgd-music-preview-field">Canción</div>${c.askArtist?'<div class="mgd-music-preview-field">Artista</div>':''}${c.askMessage?`<div class="mgd-music-preview-field wide">${esc(c.messageLabel)}</div>`:''}</div>`;
}
function fill(doc, c) {
  const set=(id,v)=>{const el=doc.getElementById(id);if(el)el.value=String(v??'');};
  set('mgdMusicTitle',c.title);set('mgdMusicIntro',c.intro);set('mgdMusicMaxSongs',c.maxSongs);set('mgdMusicMessageLabel',c.messageLabel);
  const enabled=doc.getElementById('mgdMusicEnabled');if(enabled)enabled.checked=c.enabled;
  const artist=doc.getElementById('mgdMusicAskArtist');if(artist)artist.checked=c.askArtist;
  const message=doc.getElementById('mgdMusicAskMessage');if(message)message.checked=c.askMessage;
  preview(doc,c);
}
function integration(doc, token) {
  const u=doc.getElementById('mgdMusicPublicUrl');if(u)u.value=musicUrl(token);
  const e=doc.getElementById('mgdMusicEmbedCode');if(e)e.value=embed(token);
  ['mgdCopyMusicUrl','mgdOpenMusicUrl','mgdCopyMusicEmbed'].forEach(id=>{const b=doc.getElementById(id);if(b)b.disabled=!token;});
}
async function load(doc) {
  const ctx=getWeddingContext();if(!ctx?.id||ctx.legacyMode)return;
  const snap=await getDoc(fsDoc(db,'weddings',ctx.id,'rsvpConfig','main'));
  const data=snap.exists()?(snap.data()||{}):{};
  fill(doc,config(data.musicConfig||{}));integration(doc,String(data.token||''));
}
async function save(doc) {
  const ctx=getWeddingContext();if(!ctx?.id||ctx.legacyMode)throw new Error('No hay una boda activa.');
  const ref=fsDoc(db,'weddings',ctx.id,'rsvpConfig','main');const snap=await getDoc(ref);const token=String(snap.data()?.token||'').trim();const c=readUi(doc);
  const batch=writeBatch(db);batch.set(ref,{musicConfig:c,updatedAt:serverTimestamp()},{merge:true});if(token)batch.set(fsDoc(db,'publicRsvp',token),{musicConfig:c,updatedAt:serverTimestamp()},{merge:true});await batch.commit();fill(doc,c);integration(doc,token);
}
async function copy(value,button){if(!value)return;await navigator.clipboard.writeText(value);const before=button.textContent;button.textContent='Copiado ✓';setTimeout(()=>button.textContent=before,1000);}

function install(doc) {
  const card=doc.getElementById('mgdMusicBuilderCard'); if(!card||done.has(doc))return false;done.add(doc);
  ['mgdMusicTitle','mgdMusicIntro','mgdMusicMaxSongs','mgdMusicMessageLabel','mgdMusicEnabled','mgdMusicAskArtist','mgdMusicAskMessage'].forEach(id=>doc.getElementById(id)?.addEventListener('input',()=>preview(doc)));
  const old=doc.getElementById('mgdSaveMusicConfig');if(old){const button=old.cloneNode(true);old.replaceWith(button);button.addEventListener('click',async()=>{const status=doc.getElementById('mgdMusicBuilderState');button.disabled=true;button.textContent='Guardando…';try{await save(doc);if(status){status.textContent='Encuesta publicada ✓';status.className='rsvp-sync-state is-success';}}catch(error){console.error(error);if(status){status.textContent=error?.message||'No se pudo guardar';status.className='rsvp-sync-state is-error';}}finally{button.disabled=false;button.textContent='Guardar encuesta de música';}});}
  const copyUrl=doc.getElementById('mgdCopyMusicUrl');if(copyUrl){const b=copyUrl.cloneNode(true);copyUrl.replaceWith(b);b.addEventListener('click',()=>copy(doc.getElementById('mgdMusicPublicUrl')?.value,b));}
  const copyEmbed=doc.getElementById('mgdCopyMusicEmbed');if(copyEmbed){const b=copyEmbed.cloneNode(true);copyEmbed.replaceWith(b);b.addEventListener('click',()=>copy(doc.getElementById('mgdMusicEmbedCode')?.value,b));}
  const open=doc.getElementById('mgdOpenMusicUrl');if(open){const b=open.cloneNode(true);open.replaceWith(b);b.addEventListener('click',()=>{const url=doc.getElementById('mgdMusicPublicUrl')?.value;if(url)window.open(url,'_blank','noopener');});}
  load(doc).catch(console.error);return true;
}
function scan(){const docs=[document];document.querySelectorAll('iframe').forEach(frame=>{try{if(frame.contentDocument)docs.push(frame.contentDocument);}catch(_){}});docs.forEach(install);}new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('load',scan);scan();
