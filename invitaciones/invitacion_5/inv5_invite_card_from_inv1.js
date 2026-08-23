(() => {
  function ensureFonts(doc){
    if(doc.getElementById('inv5-inv1-card-fonts')) return;
    const link=doc.createElement('link');
    link.id='inv5-inv1-card-fonts';
    link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:wght@300;400;500;600&display=swap';
    doc.head.appendChild(link);
  }

  function apply(doc){
    if(!doc) return;

    const section=doc.querySelector('.paper-section');
    const wrap=section?.querySelector('.countdown-image-wrap');
    const image=wrap?.querySelector('.countdown-image');
    if(!section||!wrap||!image) return;

    ensureFonts(doc);

    // Mantiene la imagen propia de Invitación 5 y elimina solo el contenido HTML anterior.
    section.querySelectorAll('#countdownOverlay,.countdown-overlay').forEach(el=>el.remove());
    wrap.querySelectorAll('.invite-html-text').forEach(el=>el.remove());

    wrap.classList.add('invite-image-wrap','invite-text-layer');
    image.classList.add('invite-base-image');
    image.alt='Base de invitación de boda Antonio y Lucero';

    const lineTop=doc.createElement('div');
    lineTop.className='invite-html-text invite-line-top';
    lineTop.innerHTML='TENEMOS EL HONOR<br>DE INVITARTE A';

    const title=doc.createElement('div');
    title.className='invite-html-text invite-main-title';
    title.innerHTML='<span>Nuestra</span><span>Boda</span>';

    const month=doc.createElement('div');
    month.className='invite-html-text invite-month-text';
    month.textContent='ENERO';

    const dateRow=doc.createElement('div');
    dateRow.className='invite-html-text invite-date-row';
    dateRow.innerHTML='<span>Viernes</span><i></i><strong>16</strong><i></i><span>2027</span>';

    const ornament=doc.createElement('div');
    ornament.className='invite-html-text invite-ornament';
    ornament.textContent='✦';

    wrap.append(lineTop,title,month,dateRow,ornament);

    doc.getElementById('inv5-inv1-card-style')?.remove();
    const style=doc.createElement('style');
    style.id='inv5-inv1-card-style';
    style.textContent=`
      .paper-section .invite-image-wrap{
        width:100% !important;
        margin:0 auto !important;
        position:relative !important;
      }
      .paper-section .invite-base-image{
        width:100% !important;
        height:auto !important;
        display:block !important;
        user-select:none !important;
        -webkit-user-drag:none !important;
      }
      .paper-section .invite-html-text{
        position:absolute !important;
        left:50% !important;
        transform:translateX(-50%) !important;
        z-index:3 !important;
        text-align:center !important;
        width:76% !important;
        color:#4b5137 !important;
        pointer-events:none !important;
        box-sizing:border-box !important;
      }
      .paper-section .invite-line-top{
        top:44.5% !important;
        font-family:'Cormorant Garamond',serif !important;
        font-size:clamp(13px,3.4vw,23px) !important;
        line-height:1.35 !important;
        letter-spacing:.16em !important;
        font-weight:600 !important;
        text-transform:uppercase !important;
      }
      .paper-section .invite-main-title{
        top:52.0% !important;
        font-family:'Great Vibes',cursive !important;
        font-weight:400 !important;
        line-height:.78 !important;
        color:#465034 !important;
        text-shadow:0 1px 0 rgba(255,255,255,.32) !important;
      }
      .paper-section .invite-main-title span{
        display:block !important;
        font-size:clamp(56px,16.2vw,112px) !important;
      }
      .paper-section .invite-month-text{
        top:69.4% !important;
        font-family:'Cormorant Garamond',serif !important;
        font-size:clamp(15px,4vw,27px) !important;
        letter-spacing:.22em !important;
        font-weight:600 !important;
        color:#4b5137 !important;
      }
      .paper-section .invite-month-text::after{
        content:'' !important;
        display:block !important;
        width:46% !important;
        height:1px !important;
        margin:9px auto 0 !important;
        background:linear-gradient(90deg,transparent,rgba(173,136,73,.78),transparent) !important;
      }
      .paper-section .invite-date-row{
        top:75.1% !important;
        display:grid !important;
        grid-template-columns:1fr 1px auto 1px 1fr !important;
        align-items:center !important;
        gap:16px !important;
        width:60% !important;
        font-family:'Cormorant Garamond',serif !important;
        color:#4b5137 !important;
      }
      .paper-section .invite-date-row span{
        font-size:clamp(15px,4.3vw,29px) !important;
        font-weight:500 !important;
      }
      .paper-section .invite-date-row strong{
        font-size:clamp(48px,13vw,88px) !important;
        line-height:1 !important;
        font-weight:300 !important;
        color:#a88743 !important;
      }
      .paper-section .invite-date-row i{
        display:block !important;
        width:1px !important;
        height:58px !important;
        background:rgba(168,135,67,.66) !important;
      }
      .paper-section .invite-ornament{
        top:83.5% !important;
        font-family:'Cormorant Garamond',serif !important;
        font-size:clamp(20px,5vw,32px) !important;
        color:#a88743 !important;
        opacity:.82 !important;
      }
      @media(max-width:520px){
        .paper-section .invite-line-top{
          top:44.3% !important;
          font-size:clamp(12px,3.5vw,16px) !important;
        }
        .paper-section .invite-main-title{top:52.3% !important;}
        .paper-section .invite-main-title span{
          font-size:clamp(54px,16vw,74px) !important;
        }
        .paper-section .invite-month-text{
          top:69.6% !important;
          font-size:clamp(14px,3.8vw,18px) !important;
        }
        .paper-section .invite-date-row{
          top:75.3% !important;
          width:66% !important;
          gap:12px !important;
        }
        .paper-section .invite-date-row span{
          font-size:clamp(14px,4vw,18px) !important;
        }
        .paper-section .invite-date-row strong{
          font-size:clamp(44px,12.5vw,58px) !important;
        }
        .paper-section .invite-date-row i{height:46px !important;}
      }
    `;
    doc.head.appendChild(style);
  }

  window.inv5ApplyInviteCardFromInv1=apply;
})();
