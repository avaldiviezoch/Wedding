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

  function mountOriginalGift(){
    const doc=deepestDoc();
    if(!doc)return false;

    const giftExperience=doc.getElementById('giftExperience');
    const rsvpCard=doc.querySelector('#rsvpSection .final-card');
    if(!giftExperience||!rsvpCard)return false;

    let host=doc.getElementById('inv5GiftInRsvp');
    if(!host){
      host=doc.createElement('div');
      host.id='inv5GiftInRsvp';
      host.className='inv5-gift-in-rsvp';
      host.setAttribute('aria-label','Regalo');
    }

    if(host.parentNode!==rsvpCard)rsvpCard.appendChild(host);
    if(giftExperience.parentNode!==host)host.appendChild(giftExperience);

    const heading=giftExperience.querySelector('.gift-stage-heading');
    const stage=giftExperience.querySelector('.gift-animation-stage');
    if(heading&&stage&&heading.nextElementSibling!==stage){
      giftExperience.insertBefore(heading,stage);
    }

    // Solo después de confirmar que el regalo original quedó montado arriba,
    // se retira el contenedor legacy que quedó vacío.
    if(giftExperience.parentNode===host&&host.parentNode===rsvpCard){
      const legacySection=doc.getElementById('giftSection');
      if(legacySection&&!legacySection.contains(giftExperience))legacySection.remove();
      doc.getElementById('inv6-gift-rebuild')?.remove();
      doc.getElementById('sat-inv6-gift-paper-wrap')?.remove();
      doc.getElementById('inv6-gift-rebuild-style')?.remove();
      doc.getElementById('inv6-hide-legacy-gift-style')?.remove();
      return true;
    }

    return false;
  }

  function run(){
    const delays=[0,120,300,700,1500,3000,5000];
    let done=false;
    delays.forEach(ms=>setTimeout(()=>{
      if(done)return;
      done=mountOriginalGift();
    },ms));
  }

  outer.addEventListener('load',run);
  run();
})();
