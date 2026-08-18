(() => {
  /*
   * INVITACIÓN 5 — AJUSTES DE LAYOUT
   * ---------------------------------
   * Este archivo contiene únicamente ajustes estructurales/locales de secciones.
   * No modifica tamaños ni posiciones de los títulos principales.
   */

  function findBaseDocument(){
    try{
      const outerFrame=document.getElementById('inviteFrame');
      if(!outerFrame) return null;
      const wrapperDoc=outerFrame.contentDocument||outerFrame.contentWindow?.document;
      const inner=wrapperDoc?.getElementById('inv5');
      if(!inner) return null;
      return inner.contentDocument||inner.contentWindow?.document||null;
    }catch(e){
      return null;
    }
  }

  function norm(value){
    return (value||'').replace(/\s+/g,' ').trim().toLowerCase();
  }

  function installLayoutStyle(doc){
    if(doc.getElementById('inv5-layout-polish-style')) return;
    const style=doc.createElement('style');
    style.id='inv5-layout-polish-style';
    style.textContent=`
      /*
       * Dress Code: acercar el bloque completo al cronograma.
       * Se mueve la sección como unidad, sin tocar título, ilustración ni contenido interno.
       */
      #dressCodeSection,
      .inv5-dress-section{
        margin-top:-56px !important;
      }

      /* En pantallas muy estrechas reducimos un poco el solape visual. */
      @media(max-width:360px){
        #dressCodeSection,
        .inv5-dress-section{
          margin-top:-44px !important;
        }
      }

      /* Música: separar el texto introductorio del título sin tocar el título. */
      #musicSection .music-copy .final-text.inv5-music-copy-spaced{
        margin-top:22px !important;
      }

      /* Regalo: título -> GIF -> indicación, siguiendo la jerarquía de Confirmación. */
      #inv5GiftInRsvp .gift-stage-heading{
        display:contents !important;
      }
      #inv5GiftInRsvp .gift-stage-title{
        order:1 !important;
      }
      #inv5GiftInRsvp .gift-animation-stage{
        order:2 !important;
      }
      #inv5GiftInRsvp .gift-stage-subtitle.inv5-gift-instruction{
        order:3 !important;
        display:block !important;
        width:100% !important;
        max-width:520px !important;
        margin:16px auto 0 !important;
        padding:0 18px !important;
        text-align:center !important;
        position:relative !important;
        inset:auto !important;
        transform:none !important;
        background:transparent !important;
        border:0 !important;
        box-shadow:none !important;
      }
    `;
    doc.head.appendChild(style);
  }

  function removeMusicKicker(doc){
    const music=doc.getElementById('musicSection');
    if(!music) return;

    [...music.querySelectorAll('*')].forEach(el=>{
      const text=norm(el.textContent);
      if(text==='nuestra banda sonora') el.remove();
    });

    const copy=music.querySelector('.music-copy .final-text');
    if(copy) copy.classList.add('inv5-music-copy-spaced');
  }

  function findConfirmationInstruction(doc){
    return [...doc.querySelectorAll('#rsvpSection *')].find(el=>{
      const text=norm(el.textContent);
      return text.includes('toca a nuestro mensajero') && text.includes('confirmar tu asistencia');
    })||null;
  }

  function copyTypography(source,target){
    if(!source||!target) return;
    const cs=source.ownerDocument.defaultView.getComputedStyle(source);
    [
      'fontFamily','fontSize','fontWeight','fontStyle','lineHeight',
      'letterSpacing','textTransform','color'
    ].forEach(prop=>{
      const value=cs[prop];
      if(value) target.style.setProperty(prop.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),value,'important');
    });
  }

  function arrangeGiftInstruction(doc){
    const gift=doc.getElementById('inv5GiftInRsvp');
    if(!gift) return;

    const experience=gift.querySelector('.gift-experience')||gift;
    const title=gift.querySelector('.gift-stage-title');
    const stage=gift.querySelector('.gift-animation-stage');
    const subtitle=gift.querySelector('.gift-stage-subtitle');
    if(!stage||!subtitle) return;

    subtitle.classList.add('inv5-gift-instruction');

    /* Mover físicamente la indicación después del GIF para evitar solapamientos. */
    if(stage.nextElementSibling!==subtitle){
      stage.insertAdjacentElement('afterend',subtitle);
    }

    /* Mantener el título antes del GIF. */
    if(title && title.nextElementSibling!==stage){
      experience.insertBefore(title,stage);
    }

    copyTypography(findConfirmationInstruction(doc),subtitle);
  }

  function apply(){
    const doc=findBaseDocument();
    if(!doc) return false;
    installLayoutStyle(doc);
    removeMusicKicker(doc);
    arrangeGiftInstruction(doc);
    return true;
  }

  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(apply()||attempts>60) clearInterval(timer);
  },120);

  setTimeout(apply,600);
  setTimeout(apply,1400);
})();
