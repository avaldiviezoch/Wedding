(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;

  function deepestDoc(){
    try{
      const d1=outer.contentDocument||outer.contentWindow.document;
      const f1=d1.getElementById('inviteFrame');
      if(!f1)return null;
      const d2=f1.contentDocument||f1.contentWindow.document;
      const f2=d2.getElementById('inv5');
      return f2?(f2.contentDocument||f2.contentWindow.document):null;
    }catch(e){return null;}
  }

  function clean(doc){
    if(!doc)return false;

    // El regalo original de invitacion_5 fue movido dentro de este contenedor.
    // Se oculta completo para que solo exista el componente reconstruido.
    const original=doc.getElementById('inv5GiftInRsvp');
    if(original){
      original.style.setProperty('display','none','important');
      original.style.setProperty('height','0','important');
      original.style.setProperty('min-height','0','important');
      original.style.setProperty('margin','0','important');
      original.style.setProperty('padding','0','important');
      original.style.setProperty('overflow','hidden','important');
      original.setAttribute('aria-hidden','true');
    }

    // Elimina cualquier hoja/regalo legacy que visual-fidelity u otra capa vuelva a crear.
    doc.querySelectorAll('#sat-inv6-gift-paper-wrap').forEach(el=>el.remove());

    // Solo debe existir una reconstruccion.
    const rebuilt=[...doc.querySelectorAll('#inv6-gift-rebuild')];
    rebuilt.slice(1).forEach(el=>el.remove());

    return true;
  }

  function install(){
    const doc=deepestDoc();
    if(!doc)return false;
    clean(doc);
    if(!doc.documentElement.dataset.inv6GiftCleanupObserved){
      doc.documentElement.dataset.inv6GiftCleanupObserved='1';
      const observer=new MutationObserver(()=>clean(doc));
      observer.observe(doc.body||doc.documentElement,{childList:true,subtree:true});
    }
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(install()||tries>=160)clearInterval(timer);
  },100);

  outer.addEventListener('load',()=>{
    let innerTries=0;
    const t=setInterval(()=>{
      innerTries++;
      if(install()||innerTries>=160)clearInterval(t);
    },100);
  });
})();
