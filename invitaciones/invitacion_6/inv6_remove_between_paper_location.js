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

      /* Ajuste exclusivo de la tarjeta de UBICACIÓN. */
      .location-section .church-overlay-content{
        padding-top:128px !important;
        padding-bottom:78px !important;
      }

      .location-section .church-kicker{
        margin-top:10px !important;
        margin-bottom:20px !important;
        position:relative !important;
        z-index:3 !important;
      }

      .location-section .church-note{
        margin-bottom:0 !important;
      }

      @media(max-width:540px){
        #inv6TornPaperMessage + .location-section{
          margin-top:24px !important;
        }
        .location-section .church-overlay-content{
          padding-top:104px !important;
          padding-bottom:68px !important;
        }
        .location-section .church-kicker{
          margin-top:12px !important;
          margin-bottom:18px !important;
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

    // Mantiene eliminada únicamente la segunda tarjeta verde duplicada.
    doc.getElementById(GREEN_BLOCK_ID)?.remove();

    // El botón original que está ARRIBA del fondo verde se conserva intacto.
    ensureSpacing(doc);
  }

  window.inv6RemoveBetweenPaperAndLocation=apply;
})();
