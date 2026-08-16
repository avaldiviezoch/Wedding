const VERSION='20260816-1900-native-help1';
const WIDGET='https://avaldiviezoch.github.io/Wedding/app_integral/js/modules/invitados/rsvp-native-widget.js?v=20260816-1845-native1';
const done=new WeakMap();
function tokenFrom(doc){const value=String(doc.getElementById('rsvpPublicUrl')?.value||'');try{return new URL(value).searchParams.get('token')||'';}catch(_){return '';}}
function code(token){return token?`<div\n  data-mgd-rsvp-token="${token}"\n  style="--mgd-accent:#6d7559;--mgd-surface:rgba(255,255,255,.12);--mgd-border:rgba(109,117,89,.24);"\n></div>\n<script type="module" src="${WIDGET}"></script>`:'';}
function instructionsMarkup(){return `
  <div class="mgd-native-help" data-mgd-native-help="rsvp">
    <strong>Cómo agregarlo a tu invitación</strong>
    <ol>
      <li>Copia el bloque de <b>Código nativo Mi Gran Día</b>.</li>
      <li>Pégalo exactamente en la parte del HTML donde quieras que aparezca el formulario de confirmación.</li>
      <li>No cambies <code>data-mgd-rsvp-token</code> ni la URL del <code>&lt;script&gt;</code>; esos datos conectan la invitación con Mi Gran Día.</li>
      <li>Puedes cambiar colores desde <code>--mgd-accent</code>, <code>--mgd-surface</code> y <code>--mgd-border</code>, o estilizar el contenedor desde el CSS de tu invitación.</li>
    </ol>
    <p><b>Para abrirlo al tocar una imagen o GIF:</b> coloca el bloque dentro de un contenedor oculto y muestra/oculta ese contenedor con el clic de tu imagen. El formulario seguirá siendo HTML nativo de la invitación; no es un iframe.</p>
    <pre>&lt;img src="tu-gif.gif" onclick="document.getElementById('miRsvp').hidden=false"&gt;\n&lt;div id="miRsvp" hidden&gt;\n  [PEGA AQUÍ EL CÓDIGO NATIVO]\n&lt;/div&gt;</pre>
    <p class="mgd-native-help-note">El mensaje de confirmación aparece en el mismo lugar del formulario y las respuestas se guardan en Mi Gran Día/Firebase.</p>
  </div>`;}
function ensureHelpStyles(doc){if(doc.getElementById('mgdNativeHelpStyles'))return;const st=doc.createElement('style');st.id='mgdNativeHelpStyles';st.textContent=`.mgd-native-help{margin-top:12px;padding:14px 15px;border:1px solid #e1dfd7;border-radius:14px;background:#faf9f6;color:#62695d;font-size:11px;line-height:1.55}.mgd-native-help strong{display:block;margin-bottom:7px;color:#343b31;font-size:12px}.mgd-native-help ol{margin:0 0 10px 18px;padding:0}.mgd-native-help li{margin:3px 0}.mgd-native-help p{margin:8px 0 0}.mgd-native-help code{padding:1px 4px;border-radius:5px;background:#eef0e6;color:#59634f}.mgd-native-help pre{margin:9px 0 0;padding:10px;overflow:auto;border-radius:10px;background:#282c27;color:#f7f5ee;font-size:10px;line-height:1.45;white-space:pre-wrap}.mgd-native-help-note{color:#777e73}`;doc.head.appendChild(st);}
function ensureHelp(doc,area){const box=area.closest('.rsvp-code-box');if(!box)return;ensureHelpStyles(doc);let help=box.querySelector('[data-mgd-native-help="rsvp"]');if(!help)box.insertAdjacentHTML('beforeend',instructionsMarkup());}
function apply(doc){const area=doc.getElementById('rsvpEmbedCode');if(!area)return false;const token=tokenFrom(doc);if(token)area.value=code(token);area.placeholder='Aquí aparecerá el código nativo para integrar';const box=area.closest('.rsvp-code-box');const label=box?.querySelector('label');if(label)label.textContent='Código nativo Mi Gran Día </>';ensureHelp(doc,area);const note=box?.parentElement?.parentElement?.querySelector('.rsvp-note');if(note)note.textContent='Este código agrega el formulario directamente dentro de tu invitación, sin iframe. Puedes cambiar colores y tipografía sin afectar el guardado en Mi Gran Día.';return true;}
function install(doc){if(!apply(doc))return;const url=doc.getElementById('rsvpPublicUrl');if(url&&!done.has(doc)){const observer=new MutationObserver(()=>apply(doc));observer.observe(doc.documentElement,{childList:true,subtree:true,attributes:true});['input','change'].forEach(type=>url.addEventListener(type,()=>setTimeout(()=>apply(doc),0)));done.set(doc,observer);}setTimeout(()=>apply(doc),250);setTimeout(()=>apply(doc),900);}
function scan(){const docs=[document];document.querySelectorAll('iframe').forEach(frame=>{try{if(frame.contentDocument)docs.push(frame.contentDocument);}catch(_){}});docs.forEach(install);}new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('load',scan);scan();
