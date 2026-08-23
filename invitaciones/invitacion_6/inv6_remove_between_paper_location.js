(() => {
  const STYLE_ID='inv6-paper-to-location-style';
  const GREEN_BLOCK_ID='inv6-green-location-from-inv1';

  function ensureSpacing(doc){
    let style=doc.getElementById(STYLE_ID);
    if(!style){
      style=doc.createElement('style');
      style.id=STYLE_ID;
      doc.head.appendChild(style);
    }
    style.textContent=`
      #inv6TornPaperMessage + .location-section{
        margin-top:clamp(22px,4.5vw,36px) !important;
      }
      @media(max-width:540px){
        #inv6TornPaperMessage + .location-section{
          margin-top:24px !important;
        }
      }
    `;
  }

  function apply(doc){
    if(!doc) return;

    const hands=doc.getElementById('handsSection') || doc.querySelector('section.hands-section');
    const story=doc.getElementById('photoStorySection') || doc.querySelector('section.photo-story-section');
    hands?.remove();
    story?.remove();

    const torn=doc.getElementById('inv6TornPaperMessage');
    const location=doc.querySelector('section.location-section');

    if(torn && location && torn.nextElementSibling !== location){
      let node=torn.nextElementSibling;
      while(node && node !== location){
        const next=node.nextElementSibling;
        node.remove();
        node=next;
      }
    }

    // Elimina la segunda tarjeta verde duplicada agregada previamente.
    doc.getElementById(GREEN_BLOCK_ID)?.remove();

    // Elimina únicamente el botón VER UBICACIÓN de la tarjeta principal.
    if(location){
      const button=location.querySelector('a.map-button,a[href*="maps"],a[href*="google.com/maps"]');
      button?.remove();
    }

    ensureSpacing(doc);
  }

  window.inv6RemoveBetweenPaperAndLocation=apply;
})();
