(()=>{
  const MARKER='inv6-green-copy';
  let sourcePromise=null;

  function getExactGreenSrc(){
    if(sourcePromise) return sourcePromise;
    const url=new URL('../invitacion_1/invitacion_1.html',window.location.href);
    sourcePromise=fetch(url,{cache:'force-cache'})
      .then(r=>{
        if(!r.ok) throw new Error(`Invitation 1 fetch failed: ${r.status}`);
        return r.text();
      })
      .then(html=>{
        const parsed=new DOMParser().parseFromString(html,'text/html');
        const source=parsed.querySelector('.church-green-img');
        const src=source?.getAttribute('src')||'';
        if(!src.startsWith('data:image/webp;base64,')){
          throw new Error('Invitation 1 church-green-img embedded source not found');
        }
        return src;
      });
    return sourcePromise;
  }

  async function apply(doc){
    if(!doc||doc.getElementById(MARKER)) return;
    const location=doc.querySelector('.location-section');
    if(!location) return;

    try{
      const src=await getExactGreenSrc();
      if(doc.getElementById(MARKER)) return;

      const section=doc.createElement('section');
      section.id=MARKER;
      section.className='church-green-section';
      section.setAttribute('aria-hidden','true');
      section.style.cssText='min-height:0;margin:0;padding:0;display:block;background:transparent;text-align:center;';

      const img=doc.createElement('img');
      img.className='church-green-img';
      img.alt='';
      img.src=src;
      img.style.cssText='display:block;width:100%;max-width:100%;height:auto;margin:0 auto;';

      section.appendChild(img);
      location.insertAdjacentElement('afterend',section);
    }catch(err){
      console.error('[Invitación 6] No se pudo cargar church-green-img de Invitación 1.',err);
    }
  }

  window.inv6ApplyGreenSection=apply;
})();
