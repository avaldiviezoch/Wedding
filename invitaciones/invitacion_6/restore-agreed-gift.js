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

  function forceVisible(el,display){
    if(!el)return;
    el.classList.remove('hidden');
    el.removeAttribute('hidden');
    el.style.setProperty('display',display||'block','important');
    el.style.setProperty('visibility','visible','important');
    el.style.setProperty('opacity','1','important');
  }

  function restore(){
    const doc=deepestDoc();
    if(!doc)return false;

    doc.getElementById('inv6-gift-rebuild')?.remove();
    doc.getElementById('sat-inv6-gift-paper-wrap')?.remove();
    doc.getElementById('inv6-gift-rebuild-style')?.remove();

    // No ocultar el origen antes de rescatar el regalo original.
    doc.getElementById('inv6-hide-legacy-gift-style')?.remove();

    const giftExperience=doc.getElementById('giftExperience');
    const rsvpSection=doc.getElementById('rsvpSection');
    const rsvpCard=rsvpSection?.querySelector('.final-card');
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

    forceVisible(rsvpSection,'block');
    forceVisible(rsvpCard,'block');
    rsvpCard.style.setProperty('overflow','visible','important');
    rsvpCard.style.setProperty('height','auto','important');
    rsvpCard.style.setProperty('max-height','none','important');

    forceVisible(host,'block');
    host.style.setProperty('position','relative','important');
    host.style.setProperty('width','100%','important');
    host.style.setProperty('height','auto','important');
    host.style.setProperty('min-height','1px','important');
    host.style.setProperty('overflow','visible','important');
    host.style.setProperty('z-index','20','important');

    forceVisible(giftExperience,'flex');
    giftExperience.style.setProperty('position','relative','important');
    giftExperience.style.setProperty('width','100%','important');
    giftExperience.style.setProperty('height','auto','important');
    giftExperience.style.setProperty('min-height','1px','important');
    giftExperience.style.setProperty('overflow','visible','important');

    const heading=giftExperience.querySelector('.gift-stage-heading');
    const stage=giftExperience.querySelector('.gift-animation-stage');
    const media=giftExperience.querySelector('#giftMainMedia,.gift-main-media');
    if(heading&&stage&&heading.nextElementSibling!==stage){
      giftExperience.insertBefore(heading,stage);
    }
    forceVisible(heading,'block');
    forceVisible(stage,'block');
    forceVisible(media,'block');
    if(media){
      media.style.setProperty('height','auto','important');
      media.style.setProperty('max-height','none','important');
    }

    // El contenedor legacy ya no se necesita después de rescatar su contenido original.
    const legacySection=doc.getElementById('giftSection');
    if(legacySection&&!legacySection.contains(giftExperience))legacySection.remove();

    return true;
  }

  let observer=null;
  function watch(){
    const doc=deepestDoc();
    if(!doc?.body||observer)return;
    observer=new MutationObserver(()=>{
      const host=doc.getElementById('inv5GiftInRsvp');
      const gift=doc.getElementById('giftExperience');
      if(!host||!gift||gift.parentNode!==host)restore();
    });
    observer.observe(doc.body,{childList:true,subtree:true});
  }

  function schedule(){
    [0,100,250,500,900,1400,2200,3500,5500,8000,12000].forEach(ms=>setTimeout(()=>{restore();watch();},ms));
  }

  outer.addEventListener('load',schedule);
  schedule();
})();
