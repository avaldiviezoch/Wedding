(()=>{
  'use strict';
  const ROOT='/Wedding/invitaciones/invitacion_6_fiel_txt/';

  async function text(name){
    const response=await fetch(ROOT+name+'?v=20260826-fiel1',{cache:'no-store'});
    if(!response.ok)throw new Error('No se pudo cargar '+name);
    return response.text();
  }

  function run(source,label){
    const tagged=source+'\n//# sourceURL='+ROOT+label;
    (0,eval)(tagged);
  }

  function inlineScripts(html){
    const scripts=[];
    const re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while((match=re.exec(html)))scripts.push(match[1]);
    return scripts.join('\n');
  }

  function directWrapper(source){
    const needle="const frame=document.getElementById('inv5');";
    if(!source.includes(needle))throw new Error('Wrapper snapshot incompatible');
    return source.replace(needle,`const frame={
      contentDocument:document,
      contentWindow:{document},
      classList:{add(){},remove(){}},
      addEventListener(type,fn){if(type==='load')queueMicrotask(fn);}
    };`);
  }

  function directMature(source){
    const outerNeedle="const outer=document.getElementById('inviteFrame');";
    if(!source.includes(outerNeedle))throw new Error('Mature snapshot incompatible');
    source=source.replace(outerNeedle,`const outer={
      contentDocument:document,
      contentWindow:{document},
      addEventListener(type,fn){if(type==='load')queueMicrotask(fn);}
    };`);

    const deepest=/  function deepestDoc\(\)\{[\s\S]*?\n  \}\n\nfunction ensureStyle\(doc\)\{/;
    if(!deepest.test(source))throw new Error('No se pudo adaptar deepestDoc');
    source=source.replace(deepest,"  function deepestDoc(){ return document; }\n\nfunction ensureStyle(doc){");
    return source;
  }

  async function start(){
    try{
      const wrapperHtml=await text('wrapper_snapshot.html');
      const wrapperCode=directWrapper(inlineScripts(wrapperHtml));
      run(wrapperCode,'wrapper-direct.js');

      // El wrapper original programa sus cambios al evento load. Esperamos un ciclo
      // para conservar exactamente ese orden antes de aplicar el parche maduro.
      await new Promise(resolve=>setTimeout(resolve,0));

      const mature=directMature(await text('mature_patch_snapshot.js'));
      run(mature,'mature-direct.js');
      window.dispatchEvent(new Event('inv6-local-ready'));
    }catch(error){
      console.error('[Invitación 6 fiel]',error);
      document.documentElement.dataset.inv6DirectError='1';
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
// Fiel al código maduro: este runtime solo aplana documentos, no redefine diseño ni contenido.
