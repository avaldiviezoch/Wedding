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
      /* Cuenta regresiva: la imagen conserva solo el contenido editorial de Invitación 1. */
      .countdown-image-wrap{
        position:relative !important;
        overflow:visible !important;
        margin-bottom:0 !important;
      }
      .inv5-countdown-image-copy{
        position:absolute !important;
        left:50% !important;
        top:55% !important;
        transform:translate(-50%,-50%) !important;
        width:min(72%,420px) !important;
        text-align:center !important;
        z-index:3 !important;
        color:#5f6652 !important;
        pointer-events:none !important;
      }
      .inv5-countdown-kicker{
        font-family:Georgia,'Times New Roman',serif !important;
        font-size:clamp(10px,2.5vw,14px) !important;
        letter-spacing:.28em !important;
        text-transform:uppercase !important;
        margin:0 0 8px !important;
        color:#747a63 !important;
      }
      .inv5-countdown-title{
        font-family:'Amsterdam Four',cursive !important;
        font-size:clamp(30px,7.4vw,50px) !important;
        line-height:1.08 !important;
        font-weight:400 !important;
        margin:0 auto 8px !important;
        color:#5d6854 !important;
      }
      .inv5-countdown-date{
        font-family:Georgia,'Times New Roman',serif !important;
        font-size:clamp(19px,4vw,28px) !important;
        font-style:italic !important;
        line-height:1.15 !important;
        margin:0 0 10px !important;
        color:#66705b !important;
      }
      .inv5-countdown-copy{
        max-width:320px !important;
        margin:0 auto !important;
        font-family:Georgia,'Times New Roman',serif !important;
        font-size:clamp(12px,2.8vw,16px) !important;
        line-height:1.5 !important;
        color:#646957 !important;
      }
      .countdown-overlay.inv5-countdown-below{
        position:relative !important;
        left:auto !important;
        right:auto !important;
        top:auto !important;
        bottom:auto !important;
        transform:none !important;
        width:min(92%,560px) !important;
        margin:10px auto 42px !important;
        padding:0 10px !important;
        text-align:center !important;
      }
      .countdown-overlay.inv5-countdown-below .faltan{
        margin-top:0 !important;
        margin-bottom:16px !important;
      }

      @media(max-width:420px){
        .inv5-countdown-image-copy{
          top:54% !important;
          width:70% !important;
        }
        .inv5-countdown-title{
          font-size:clamp(27px,7.2vw,38px) !important;
        }
        .inv5-countdown-copy{
          font-size:clamp(11px,2.7vw,14px) !important;
          line-height:1.42 !important;
        }
        .countdown-overlay.inv5-countdown-below{
          width:94% !important;
          margin-top:4px !important;
          margin-bottom:36px !important;
          padding:0 6px !important;
        }
      }

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

      #esperamosSection .final-title{
        margin-top:18px !important;
        margin-bottom:18px !important;
      }

      #musicSection .music-copy .final-text.inv5-music-copy-spaced{
        margin-top:22px !important;
      }

      #inv5GiftInRsvp .gift-stage-heading{
        display:block !important;
        width:calc(100vw - 24px) !important;
        max-width:520px !important;
        margin-left:auto !important;
        margin-right:auto !important;
        padding-left:0 !important;
        padding-right:0 !important;
      }
      #inv5GiftInRsvp .gift-stage-title{
        order:1 !important;
        width:100% !important;
        max-width:none !important;
        white-space:nowrap !important;
        text-align:center !important;
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

      #inv5GiftInRsvp .gift-experience.is-revealed .gift-stage-heading,
      #inv5GiftInRsvp .gift-experience.is-revealed .gift-stage-subtitle{
        display:none !important;
      }

      @media(max-width:350px){
        #inv5GiftInRsvp .gift-stage-heading{
          width:calc(100vw - 20px) !important;
        }
        #inv5GiftInRsvp .gift-stage-title{
          white-space:normal !important;
        }
      }

      .inv5-action-note-unified{
        font-style:italic !important;
        text-align:center !important;
      }
    `;
    doc.head.appendChild(style);
  }

  function arrangeCountdown(doc){
    const imageWrap=doc.querySelector('.countdown-image-wrap');
    const overlay=doc.querySelector('.countdown-overlay');
    if(!imageWrap||!overlay) return;

    let copy=imageWrap.querySelector('.inv5-countdown-image-copy');
    if(!copy){
      copy=doc.createElement('div');
      copy.className='inv5-countdown-image-copy';
      copy.innerHTML=`
        <div class="inv5-countdown-kicker">CUENTA REGRESIVA</div>
        <div class="inv5-countdown-title">Cada día falta menos</div>
        <div class="inv5-countdown-date">16 de enero</div>
        <p class="inv5-countdown-copy">Estamos contando los días para compartir este momento tan especial contigo.</p>
      `;
      imageWrap.appendChild(copy);
    }

    overlay.classList.add('inv5-countdown-below');
    if(imageWrap.nextElementSibling!==overlay){
      imageWrap.insertAdjacentElement('afterend',overlay);
    }
  }

  function updateGiftPhysicalNote(doc){
    const note=doc.querySelector('.gift-physical-note');
    if(!note) return;
    note.textContent='Si prefieres entregarnos un regalo físico, estaremos gustosos de recepcionarlo en la siguiente dirección: Urb. Alameda de la Rivera, Mz. G, Lt. 45, Ate.';
  }

  function updateGiftRevealText(doc){
    const note=doc.querySelector('#gift-panel .gift-reveal-text');
    if(!note) return;
    note.textContent='Si prefieres un detalle no físico puedes optar por estas opciones.';
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
    arrangeCountdown(doc);
    updateGiftPhysicalNote(doc);
    updateGiftRevealText(doc);
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
