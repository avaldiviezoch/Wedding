const VERSION='20260816-1918-native-fast1';
const WIDGET='https://avaldiviezoch.github.io/Wedding/app_integral/js/modules/invitados/rsvp-native-widget.js?v=20260819-2330-music-gate1';
const done=new WeakSet();

function tokenFrom(doc){
  const value=String(doc.getElementById('rsvpPublicUrl')?.value||'');
  try{return new URL(value).searchParams.get('token')||'';}catch(_){return '';}
}
function code(token){
  return token?`<div\n  data-mgd-rsvp-token="${token}"\n  style="--mgd-accent:#6d7559;--mgd-surface:rgba(255,255,255,.12);--mgd-border:rgba(109,117,89,.24);"\n></div>\n<script type="module" src="${WIDGET}"></script>`:'';
}
function instructionsMarkup(){return `
  <div class="mgd-native-help" data-mgd-native-help="rsvp">
    <strong>Cómo agregarlo a tu invitación</strong>
    <ol>
      <li>Copia el bloque de <b>Código nativo Mi Gran Día</b>.</li>
      <li>Pégalo exactamente en la parte del HTML donde quieras que aparezca el formulario de confirmación.</li>
      <li>No cambies <code>data-mgd-rsvp-token</code> ni la URL del <code>&lt;script&gt;</code>.</li>
      <li>Puedes cambiar colores y tipografía sin afectar el guardado.</li>
    </ol>
    <p class="mgd-native-help-note">Las respuestas se guardan directamente en Mi Gran Día/Firebase.</p>
  </div>`;}
function ensureHelpStyles(doc){
  if(doc.getElementById('mgdNativeHelpStyles'))return;
  const st=doc.createElement('style');st.id='mgdNativeHelpStyles';
  st.textContent='.mgd-native-help{margin-top:12px;padding:14px 15px;border:1px solid #e1dfd7;border-radius:14px;background:#faf9f6;color:#62695d;font-size:11px;line-height:1.55}.mgd-native-help strong{display:block;margin-bottom:7px;color:#343b31;font-size:12px}.mgd-native-help ol{margin:0 0 10px 18px;padding:0}.mgd-native-help li{margin:3px 0}.mgd-native-help code{padding:1px 4px;border-radius:5px;background:#eef0e6;color:#59634f}.mgd-native-help-note{color:#777e73}';
  doc.head.appendChild(st);
}
function apply(doc){
  const area=doc.getElementById('rsvpEmbedCode');if(!area)return false;
  const token=tokenFrom(doc);if(token)area.value=code(token);
  area.placeholder='Aquí aparecerá el código nativo para integrar';
  const box=area.closest('.rsvp-code-box');const label=box?.querySelector('label');if(label)label.textContent='Código nativo Mi Gran Día </>';
  ensureHelpStyles(doc);
  if(box&&!box.querySelector('[data-mgd-native-help="rsvp"]'))box.insertAdjacentHTML('beforeend',instructionsMarkup());
  const note=box?.parentElement?.parentElement?.querySelector('.rsvp-note');
  if(note)note.textContent='Este código agrega el formulario directamente dentro de tu invitación, sin iframe.';
  return true;
}
function install(doc){
  if(!doc?.body||done.has(doc)||!apply(doc))return false;
  done.add(doc);
  const url=doc.getElementById('rsvpPublicUrl');
  ['input','change'].forEach(type=>url?.addEventListener(type,()=>apply(doc)));
  doc.addEventListener('click',(event)=>{
    if(event.target?.closest?.('#rsvpRegenerateLink,#rsvpSaveConfig,#rsvpCopyPublicUrl'))setTimeout(()=>apply(doc),80);
  });
  return true;
}
function scan(){
  const workspace=document.getElementById('unifiedWorkspace');
  const docs=[document];
  workspace?.querySelectorAll('iframe').forEach(frame=>{try{if(frame.contentDocument)docs.push(frame.contentDocument);}catch(_){}});
  docs.forEach(install);
}
function bind(){
  const workspace=document.getElementById('unifiedWorkspace');
  if(workspace&&workspace.dataset.mgdRsvpNativeObserver!==VERSION){
    workspace.dataset.mgdRsvpNativeObserver=VERSION;
    new MutationObserver(scan).observe(workspace,{childList:true});
    workspace.querySelectorAll('iframe').forEach(frame=>frame.addEventListener('load',scan));
  }
  scan();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();