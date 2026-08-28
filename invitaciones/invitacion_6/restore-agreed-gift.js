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

  // Salvaguarda corta: el dueño real del montaje es invitacion_5.html.
  // Aquí solo verificamos que el montaje nativo haya terminado correctamente.
  function verifyNativeMount(){
    const doc=deepestDoc();
    if(!doc)return false;

    const giftExperience=doc.getElementById('giftExperience');
    const host=doc.getElementById('inv5GiftInRsvp');
    const rsvpCard=doc.querySelector('#rsvpSection .final-card');
    if(!giftExperience||!host||!rsvpCard)return false;

    const mounted=giftExperience.parentNode===host&&host.parentNode===rsvpCard;
    if(!mounted)return false;

    doc.getElementById('inv6-gift-rebuild')?.remove();
    doc.getElementById('sat-inv6-gift-paper-wrap')?.remove();
    doc.getElementById('inv6-gift-rebuild-style')?.remove();
    doc.getElementById('inv6-hide-legacy-gift-style')?.remove();
    return true;
  }

  function run(){
    [0,150,400,900,1600,2800].forEach(ms=>setTimeout(verifyNativeMount,ms));
  }

  outer.addEventListener('load',run);
  run();
})();
