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

  function restore(){
    const doc=deepestDoc();
    if(!doc)return false;

    // Elimina únicamente reconstrucciones de Invitación 6 que no corresponden.
    doc.getElementById('inv6-gift-rebuild')?.remove();
    doc.getElementById('sat-inv6-gift-paper-wrap')?.remove();

    const giftExperience=doc.getElementById('giftExperience');
    const rsvpCard=doc.querySelector('#rsvpSection .final-card');
    if(!giftExperience||!rsvpCard)return false;

    let host=doc.getElementById('inv5GiftInRsvp');
    if(!host){
      host=doc.createElement('div');
      host.id='inv5GiftInRsvp';
      host.className='inv5-gift-in-rsvp';
      host.setAttribute('aria-label','Regalo');
      rsvpCard.appendChild(host);
    }

    if(giftExperience.parentNode!==host)host.appendChild(giftExperience);

    // Asegura que el regalo superior original permanezca visible.
    host.style.setProperty('display','block','important');
    host.style.setProperty('visibility','visible','important');
    host.style.setProperty('opacity','1','important');
    giftExperience.style.setProperty('display','flex','important');
    giftExperience.style.setProperty('visibility','visible','important');
    giftExperience.style.setProperty('opacity','1','important');

    // Solo después de rescatar el regalo correcto se elimina el contenedor legacy inferior.
    const legacySection=doc.getElementById('giftSection');
    if(legacySection&&legacySection!==host&&!legacySection.contains(host))legacySection.remove();

    return true;
  }

  function schedule(){
    [0,150,350,700,1200,2000,3500,5500,8000].forEach(ms=>setTimeout(restore,ms));
  }

  outer.addEventListener('load',schedule);
  schedule();
})();
