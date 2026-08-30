(() => {
  function apply(doc){
    if(!doc) return;
    const section=doc.getElementById('inv6PrimeraEntrada');
    const copy=section?.querySelector('.inv6-first-copy');
    if(!section||!copy) return;

    document.documentElement.style.setProperty('background','#fffdf8','important');
    document.body?.style.setProperty('background','#fffdf8','important');
    const outerFrame=document.getElementById('inviteFrame');
    outerFrame?.style.setProperty('background','#e9e1cc','important');

    let note=section.querySelector('.inv6-top-note');
    if(!note){
      note=doc.createElement('div');
      note.className='inv6-top-note';
      note.setAttribute('aria-label','mi presente y todo mi futuro, contigo hasta el Laugh Tale');
      note.innerHTML=`
        <span class="inv6-top-note-line inv6-top-note-line-1">mi presente y todo mi futuro, contigo</span>
        <span class="inv6-top-note-line inv6-top-note-line-2">hasta el Laugh Tale</span>`;
      section.appendChild(note);
    }

    doc.getElementById('inv6-layout-fix-style')?.remove();
    const style=doc.createElement('style');
    style.id='inv6-layout-fix-style';
    style.textContent=`
      html,
      body,
      #mainInvitation,
      .invitation-shell{
        background:#e9e1cc !important;
        background-image:none !important;
      }
      .paper-section{
        background:#e9e1cc !important;
      }
      #inv6PrimeraEntrada{
        position:relative !important;
        width:100% !important;
        margin:0 !important;
        padding:0 !important;
        background:#e9e1cc !important;
        overflow:visible !important;
      }
      #inv6PrimeraEntrada .inv6-first-image{
        position:relative !important;
        z-index:2 !important;
        display:block !important;
        width:100% !important;
        height:auto !important;
        margin:0 !important;
        padding:0 !important;
        border:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }
      #inv6PrimeraEntrada .inv6-top-note{
        position:absolute !important;
        z-index:5 !important;
        top:2.2% !important;
        right:4.8% !important;
        width:69% !important;
        color:#4a433d !important;
        text-align:right !important;
        font-family:'Amsterdam Four','Great Vibes',cursive !important;
        font-size:clamp(15px,3.15vw,24px) !important;
        line-height:1.03 !important;
        font-weight:400 !important;
        pointer-events:none !important;
        transform:rotate(4deg) !important;
        transform-origin:center center !important;
        text-shadow:0 0 .5px rgba(255,255,255,.95),0 0 1px rgba(255,255,255,.55) !important;
        filter:drop-shadow(0 1px 0 rgba(255,255,255,.15));
      }
      #inv6PrimeraEntrada .inv6-top-note-line{
        display:block !important;
        width:max-content !important;
        max-width:100% !important;
        margin-left:auto !important;
        overflow:hidden !important;
        white-space:nowrap !important;
        clip-path:inset(0 100% 0 0);
        will-change:clip-path;
      }
      #inv6PrimeraEntrada .inv6-top-note-line-1{
        animation:inv6InvisibleWriting 2.65s cubic-bezier(.22,.61,.36,1) .45s forwards;
      }
      #inv6PrimeraEntrada .inv6-top-note-line-2{
        margin-top:1px !important;
        animation:inv6InvisibleWriting 1.75s cubic-bezier(.22,.61,.36,1) 2.85s forwards;
      }
      @keyframes inv6InvisibleWriting{
        from{clip-path:inset(0 100% 0 0);opacity:.72;}
        to{clip-path:inset(0 0 0 0);opacity:1;}
      }
      #inv6PrimeraEntrada .inv6-first-copy{
        position:relative !important;
        left:auto !important;
        top:auto !important;
        width:100% !important;
        transform:none !important;
        z-index:1 !important;
        margin:-2px 0 0 !important;
        padding:30px 5.5% 84px !important;
        text-align:center !important;
        color:#303542 !important;
        background:#e9e1cc !important;
        pointer-events:none !important;
      }
      #inv6PrimeraEntrada .inv6-we-marry{
        margin:0 !important;
        font-family:Georgia,'Times New Roman',serif !important;
        font-size:clamp(26px,5.7vw,44px) !important;
        line-height:1.05 !important;
        letter-spacing:.01em !important;
        font-weight:400 !important;
        color:#303542 !important;
      }
      #inv6PrimeraEntrada .inv6-couple{
        margin:12px auto 0 !important;
        font-family:'Amsterdam Four','Great Vibes',cursive !important;
        font-size:clamp(45px,10.8vw,80px) !important;
        line-height:.92 !important;
        font-weight:400 !important;
        color:#777a50 !important;
        white-space:nowrap !important;
      }
      #inv6PrimeraEntrada .inv6-date{
        margin:20px 0 0 !important;
        transform:translateY(10px) !important;
        font-family:Georgia,'Times New Roman',serif !important;
        font-size:clamp(27px,5.9vw,45px) !important;
        line-height:1 !important;
        letter-spacing:.02em !important;
        color:#303542 !important;
      }
      #inv6PrimeraEntrada .inv6-countdown{
        width:min(94%,560px) !important;
        margin:76px auto 0 !important;
        display:grid !important;
        grid-template-columns:repeat(4,minmax(0,1fr)) !important;
        color:#67704b !important;
      }
      #inv6PrimeraEntrada .inv6-time{
        position:relative !important;
        min-width:0 !important;
        padding:0 6px !important;
      }
      #inv6PrimeraEntrada .inv6-time + .inv6-time::before{
        content:'' !important;
        position:absolute !important;
        left:0 !important;
        top:2% !important;
        width:1px !important;
        height:72% !important;
        background:rgba(103,112,75,.7) !important;
      }
      #inv6PrimeraEntrada .inv6-time strong{
        display:block !important;
        font-family:Georgia,'Times New Roman',serif !important;
        font-size:clamp(36px,8.8vw,66px) !important;
        line-height:.92 !important;
        font-weight:400 !important;
        letter-spacing:-.025em !important;
      }
      #inv6PrimeraEntrada .inv6-time span{
        display:block !important;
        margin-top:10px !important;
        font-family:Georgia,'Times New Roman',serif !important;
        font-size:clamp(13px,2.9vw,21px) !important;
        line-height:1 !important;
        font-weight:400 !important;
      }
      .paper-section{
        margin-top:28px !important;
      }
      @media(max-width:540px){
        #inv6PrimeraEntrada .inv6-top-note{
          top:2% !important;
          right:4.4% !important;
          width:71% !important;
          font-size:clamp(14px,4.15vw,18px) !important;
        }
        #inv6PrimeraEntrada .inv6-first-copy{
          margin:-2px 0 0 !important;
          padding:26px 4.5% 78px !important;
        }
        #inv6PrimeraEntrada .inv6-we-marry{font-size:clamp(24px,6.9vw,34px) !important;}
        #inv6PrimeraEntrada .inv6-couple{margin-top:9px !important;font-size:clamp(40px,12.2vw,58px) !important;}
        #inv6PrimeraEntrada .inv6-date{margin-top:16px !important;font-size:clamp(24px,6.9vw,33px) !important;}
        #inv6PrimeraEntrada .inv6-countdown{margin-top:64px !important;width:96% !important;}
        #inv6PrimeraEntrada .inv6-time{padding:0 4px !important;}
        #inv6PrimeraEntrada .inv6-time strong{font-size:clamp(31px,10.2vw,46px) !important;}
        #inv6PrimeraEntrada .inv6-time span{font-size:clamp(12px,3.6vw,16px) !important;margin-top:8px !important;}
        .paper-section{margin-top:20px !important;}
      }
      @media(prefers-reduced-motion:reduce){
        #inv6PrimeraEntrada .inv6-top-note-line{animation:none !important;clip-path:none !important;}
      }
    `;
    doc.head.appendChild(style);
  }

  window.inv6ApplyLayoutFix=apply;
})();
