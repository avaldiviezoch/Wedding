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
       * Dress Code: subir el bloque aproximadamente un 10% del alto visible,
       * con límites para mantener aire respecto del GIF de Programación.
       */
      #dressCodeSection,
      .inv5-dress-section{
        margin-top:clamp(-84px,-10vh,-68px) !important;
      }

      @media(max-width:360px){
        #dressCodeSection,
        .inv5-dress-section{
          margin-top:clamp(-72px,-9vh,-60px) !important;
        }
      }

      /*
       * Dress Code: solo redistribución interna. El fondo no se modifica.
       * La paleta pasa a 5 + 4 elementos y los textos respiran más entre sí.
       */
      #dressCodeSection .inv5-dress-palette{
        width:258px !important;
        max-width:258px !important;
        justify-content:center !important;
        align-content:center !important;
        row-gap:12px !important;
        column-gap:12px !important;
        margin-bottom:30px !important;
      }
      #dressCodeSection .inv5-dress-subtitle{
        margin-bottom:22px !important;
      }
      #dressCodeSection .inv5-dress-white{
        margin-bottom:30px !important;
      }
      #dressCodeSection .inv5-dress-lower-1{
        margin-bottom:30px !important;
      }
      #dressCodeSection .inv5-dress-last{
        margin-top:0 !important;
      }

      @media(max-width:540px){
        #dressCodeSection .inv5-dress-palette{
          width:220px !important;
          max-width:220px !important;
          row-gap:10px !important;
          column-gap:10px !important;
          margin-bottom:28px !important;
        }
        #dressCodeSection .inv5-dress-subtitle{
          margin-bottom:20px !important;
        }
        #dressCodeSection .inv5-dress-white{
          margin-bottom:28px !important;
        }
        #dressCodeSection .inv5-dress-lower-1{
          margin-bottom:28px !important;
        }
      }

      /* Te esperamos: dar más aire respecto del texto superior y de Brook. */
      #esperamosSection .final-title{
        margin-top:18px !important;
        margin-bottom:18px !important;
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

      /*
       * Confirmación / Regalo / Música toman exactamente la tipografía
       * de la nota del DJ. La nota del DJ no se modifica.
       */
      .inv5-action-note-unified{
        font-style:italic !important;
        text-align:center !important;
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

  function findActionNote(doc,kind){
    const tests={
      confirmation:text=>text.includes('toca a nuestro mensajero')&&text.includes('confirmar tu asistencia'),
      gift:text=>text.includes('toca el regalo')&&text.includes('descubrirlo'),
      music:text=>text.includes('toca la imagen')&&text.includes('dejar tu canci')
    };
    const test=tests[kind];
    if(!test) return null;

    const matches=[...doc.querySelectorAll('p,span,small,div,strong,em')]
      .filter(el=>{
        const text=norm(el.textContent);
        return text.length>0&&text.length<180&&test(text);
      })
      .sort((a,b)=>norm(a.textContent).length-norm(b.textContent).length);

    return matches[0]||null;
  }

  function findDjReferenceNote(doc){
    const matches=[...doc.querySelectorAll('p,span,small,div,strong,em')]
      .filter(el=>{
        const text=norm(el.textContent);
        return text.length>0&&text.length<220&&
          text.includes('el dj no aceptar')&&
          text.includes('pedidos musicales')&&
          text.includes('compartirnos tu canci');
      })
      .sort((a,b)=>norm(a.textContent).length-norm(b.textContent).length);

    return matches[0]||null;
  }

  function copyNoteTypography(source,target){
    if(!source||!target) return;
    const cs=source.ownerDocument.defaultView.getComputedStyle(source);
    [
      'fontFamily','fontSize','fontWeight','fontStyle','lineHeight',
      'letterSpacing','textTransform','color'
    ].forEach(prop=>{
      const value=cs[prop];
      if(value) target.style.setProperty(prop.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),value,'important');
    });
    target.classList.add('inv5-action-note-unified');
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

    if(stage.nextElementSibling!==subtitle){
      stage.insertAdjacentElement('afterend',subtitle);
    }

    if(title && title.nextElementSibling!==stage){
      experience.insertBefore(title,stage);
    }
  }

  function unifyActionNotes(doc){
    const model=findDjReferenceNote(doc);
    if(!model) return;

    const confirmation=findActionNote(doc,'confirmation');
    const gift=findActionNote(doc,'gift')||doc.querySelector('#inv5GiftInRsvp .gift-stage-subtitle');
    const music=findActionNote(doc,'music');

    [confirmation,gift,music].forEach(note=>copyNoteTypography(model,note));
  }

  function apply(){
    const doc=findBaseDocument();
    if(!doc) return false;
    installLayoutStyle(doc);
    removeMusicKicker(doc);
    arrangeGiftInstruction(doc);
    unifyActionNotes(doc);
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
