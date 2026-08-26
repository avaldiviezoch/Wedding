(() => {
  const outer=document.getElementById('inviteFrame');
  const BLOCK_ID='sat-inv6-green-location-exact';
  const PHOTO_ID='sat-inv6-photo-collage';
  const STYLE_ID='sat-inv6-green-location-exact-style';
  const DUPLICATE_ID='inv6-green-location-from-inv1';
  const PAUSE_MUSIC=false;

function pauseInvitationMusic(){
  if(!PAUSE_MUSIC)return;

  const docs=[];

  try{
    const d1=outer?.contentDocument||outer?.contentWindow?.document;
    if(d1)docs.push(d1);

    const f2=d1?.getElementById('inv5');
    const d3=f2?(f2.contentDocument||f2.contentWindow.document):null;
    if(d3)docs.push(d3);
  }catch(e){}

  docs.forEach(doc=>{
    doc.querySelectorAll('audio,video').forEach(media=>{
      if(media.tagName==='VIDEO')return;

      try{
        media.pause();
        media.muted=true;
        media.volume=0;
        media.currentTime=0;
        media.autoplay=false;
        media.removeAttribute('autoplay');
      }catch(e){}
    });

    if(!doc.__satMusicPauseInstalled){
      doc.__satMusicPauseInstalled=true;

      doc.addEventListener('play',e=>{
        const media=e.target;

        if(
          PAUSE_MUSIC &&
          media &&
          media.tagName==='AUDIO'
        ){
          try{
            media.pause();
            media.muted=true;
            media.volume=0;
            media.currentTime=0;
            media.autoplay=false;
          }catch(err){}
        }
      },true);
    }
  });
}

  function deepestDoc(){
    try{
      const d1=outer?.contentDocument||outer?.contentWindow?.document;
      const f2=d1?.getElementById('inv5');
      return f2?(f2.contentDocument||f2.contentWindow.document):null;
    }catch(e){return null}
  }

function ensureStyle(doc){
  let s=doc.getElementById(STYLE_ID);

  if(!s){
    s=doc.createElement('style');
    s.id=STYLE_ID;
    doc.head.appendChild(s);
  }

  s.textContent=`
    @font-face{
      font-family:'The Seasons Regular';
      src:url('./Amsterdam%20Four_ttf%20400.ttf') format('truetype');
      font-style:normal;
      font-weight:400;
      font-display:swap;
    }

    @font-face{
      font-family:'Eyesome Script';
      src:url('./Amsterdam%20Four_ttf%20400.ttf') format('opentype');
      font-style:normal;
      font-weight:400;
      font-display:swap;
    }

    #${DUPLICATE_ID}{display:none!important}

    img.church-green-img:not(#${BLOCK_ID} img),
    img.inv6-green-location-img:not(#${BLOCK_ID} img){
      display:none!important
    }

    #${BLOCK_ID}{
      width:100%!important;
      margin:0!important;
      padding:0!important;
      background:transparent!important;
      position:relative!important;
      overflow:hidden!important
    }

    #${BLOCK_ID} .church-green-wrap{
      width:100%!important;
      max-width:680px!important;
      margin:0 auto!important;
      padding:0!important;
      position:relative!important;
      overflow:hidden!important
    }

    #${BLOCK_ID} .green-img{
      display:block!important;
      width:100%!important;
      height:auto!important;
      border:0!important
    }

    #${BLOCK_ID} .church-overlay-content{
      position:absolute!important;
      inset:0!important;
      z-index:2!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      text-align:center!important;
      padding:105px 32px 120px!important;
      box-sizing:border-box!important;
      color:#FBF8EF!important;
      transform:translateY(20px)!important
    }

    #${BLOCK_ID} .church-kicker{
      margin:0 0 16px!important;
      font-family:'Cormorant Garamond',serif!important;
      font-size:13px!important;
      letter-spacing:5px!important;
      color:#D9D6B9!important
    }

    #${BLOCK_ID} .church-title{
      margin:0 0 24px!important;
      font-family:'Great Vibes',cursive!important;
      font-size:clamp(52px,11vw,72px)!important;
      line-height:.90!important;
      font-weight:400!important;
      color:#FBF8EF!important
    }

    #${BLOCK_ID} .church-title span{
      display:block!important;
      white-space:nowrap!important
    }

    #${BLOCK_ID} .church-main-copy{
      margin:0 0 34px!important;
      font-family:'Cormorant Garamond',serif!important;
      font-size:clamp(18px,4.5vw,25px)!important;
      line-height:1.35!important;
      max-width:320px!important
    }

    #${BLOCK_ID} .church-place-name{
      margin:0 0 14px!important;
      font-family:'Great Vibes',cursive!important;
      font-size:clamp(46px,10vw,64px)!important;
      color:#F2E4AB!important;
      white-space:nowrap!important
    }

    #${BLOCK_ID} .church-address{
      margin:0 0 34px!important;
      font-family:'Cormorant Garamond',serif!important;
      font-size:clamp(18px,4.6vw,24px)!important;
      border-bottom:1px solid rgba(217,214,185,.45)!important;
      padding:0 4px 6px!important;
      white-space:nowrap!important
    }

    #${BLOCK_ID} .church-note{
      margin:0 0 28px!important;
      font-family:'Cormorant Garamond',serif!important;
      font-size:clamp(17px,4.2vw,22px)!important;
      line-height:1.45!important;
      max-width:330px!important
    }

    #${PHOTO_ID}{
      position:relative!important;
      width:100%!important;
      max-width:680px!important;
      height:clamp(500px,104vw,710px)!important;
      margin:0 auto!important;
      background:#eee5d1!important;
      overflow:hidden!important
    }

    #${PHOTO_ID} img{
      position:absolute!important;
      display:block!important;
      height:auto!important;
      object-fit:contain!important
    }

    #${PHOTO_ID} .photo-1{
      width:46%!important;
      left:5%!important;
      top:5%!important;
      z-index:1!important
    }

    #${PHOTO_ID} .photo-2{
      width:46%!important;
      right:4%!important;
      top:16%!important;
      z-index:2!important
    }

    .sat-inv6-next-section{
      margin-top:-58px!important;
      position:relative!important;
      z-index:3!important
    }

    .sat-inv6-crew-title{
      position:absolute!important;
      left:50%!important;
      top:20.2%!important;
      transform:translateX(-50%)!important;
      width:56%!important;
      max-width:360px!important;
      margin:0!important;
      z-index:7!important;
      text-align:center!important;
      font-family:'Cormorant Garamond',serif!important;
      font-size:clamp(17px,2.9vw,24px)!important;
      line-height:1.3!important;
      font-style:italic!important;
      font-weight:700!important;
      color:#5D644F!important
    }

    .sat-inv6-crew-copy{
      position:absolute!important;
      left:50%!important;
      top:33.6%!important;
      transform:translateX(-50%)!important;
      width:56%!important;
      max-width:360px!important;
      margin:0!important;
      z-index:7!important;
      text-align:center!important;
      font-family:Georgia,'Times New Roman',serif!important;
      font-size:clamp(14px,2.5vw,19px)!important;
      line-height:1.45!important;
      font-style:italic!important;
      font-weight:400!important;
      color:#5D644F!important
    }

    .sat-inv6-crew-copy p{
      margin:0 0 12px!important
    }

    #sat-inv6-crew-bottom-photo-section{
      position:relative!important;
      width:100%!important;
      max-width:680px!important;
      margin:-70px auto 0!important;
      padding:0!important;
      overflow:hidden!important;
      background:#eee5d1!important
    }

    #sat-inv6-crew-bottom-photo-section img{
      display:block!important;
      width:100%!important;
      height:auto!important;
      margin:0!important;
      padding:0!important;
      border:0!important
    }

    #sat-inv6-dress-bottom-photo-section{
      position:relative!important;
      width:100%!important;
      max-width:680px!important;
      margin:0 auto!important;
      padding:0!important;
      overflow:hidden!important;
      background:#eee5d1!important
    }

    #sat-inv6-dress-bottom-photo-section img{
      display:block!important;
      width:100%!important;
      height:auto!important;
      margin:0!important;
      padding:0!important;
      border:0!important
    }

    /* =====================================================
       PAPEL ROTO - CABECERA DEL PROGRAMA
       ===================================================== */

    #sat-inv6-paper-bottom-section{
      position:relative!important;
      width:100%!important;
      max-width:680px!important;
      margin:0 auto!important;
      padding:0!important;
      overflow:hidden!important;
      background:transparent!important
    }

    #sat-inv6-paper-bottom-section .sat-inv6-paper-bg{
      display:block!important;
      width:100%!important;
      height:auto!important;
      margin:0!important;
      padding:0!important;
      border:0!important
    }

    #sat-inv6-paper-bottom-section .sat-inv6-paper-program{
      position:absolute!important;
      left:3.5%!important;
      right:4%!important;
      top:50%!important;
      transform:translateY(-50%)!important;
      display:flex!important;
      align-items:center!important;
      justify-content:flex-start!important;
      z-index:4!important
    }

    #sat-inv6-paper-bottom-section .sat-inv6-paper-logo{
      position:relative!important;
      left:auto!important;
      top:auto!important;
      transform:none!important;
      width:30%!important;
      height:auto!important;
      flex:0 0 auto!important;
      margin:0 9% 0 0!important;
      padding:0!important;
      border:0!important
    }

#sat-inv6-paper-bottom-section .sat-inv6-program-text{
  position:relative!important;
  flex:1!important;
  text-align:left!important;
  color:#FFFFFF!important;
  transform:translateY(0)!important
}

#sat-inv6-paper-bottom-section .sat-inv6-program-title{
  font-family:'The Seasons Regular',serif!important;
  font-size:clamp(34px,8.5vw,62px)!important;
  line-height:.9!important;
  font-weight:500!important;
  letter-spacing:.01em!important;
  white-space:nowrap!important;
  color:#FFFFFF!important
}

#sat-inv6-paper-bottom-section .sat-inv6-program-script{
  font-family:'Eyesome Script',cursive!important;
  font-size:clamp(42px,10.5vw,78px)!important;
  line-height:.82!important;
  font-weight:400!important;
  color:#FFFFFF!important;
  margin-top:3px!important;
  margin-left:14%!important;
  white-space:nowrap!important
}

    /* =====================================================
       PROGRAMA / TIMELINE
       SIN SEGUNDO FONDO
       ===================================================== */

    #sat-inv6-program-timeline-section{
      position:relative!important;
      width:100%!important;
      max-width:680px!important;
      margin:0 auto!important;
      padding:22px 24px 54px!important;
      box-sizing:border-box!important;
      background:transparent!important;
      overflow:hidden!important
    }

    #sat-inv6-program-timeline-section .sat-inv6-program-inner{
      position:relative!important;
      width:100%!important;
      margin:0!important;
      padding:0!important
    }

    #sat-inv6-program-timeline-section .sat-inv6-program-line-wrap{
      position:absolute!important;
      left:50%!important;
      top:44px!important;
      bottom:44px!important;
      width:20px!important;
      transform:translateX(-50%)!important;
      z-index:1!important;
      pointer-events:none!important
    }

    #sat-inv6-program-timeline-section .sat-inv6-program-line{
      position:absolute!important;
      left:50%!important;
      top:0!important;
      width:2px!important;
      height:0;
      transform:translateX(-50%)!important;
      transform-origin:top center!important;
      background:#6D7559!important;
      border-radius:999px!important;
      animation:satInv6ProgramLineGrow 3.6s cubic-bezier(.2,.7,.2,1) forwards!important
    }

    #sat-inv6-program-timeline-section .sat-inv6-program-line-start,
    #sat-inv6-program-timeline-section .sat-inv6-program-line-end{
      position:absolute!important;
      left:50%!important;
      width:11px!important;
      height:11px!important;
      border-radius:50%!important;
      background:#6D7559!important;
      transform:translateX(-50%)!important;
      z-index:3!important
    }

    #sat-inv6-program-timeline-section .sat-inv6-program-line-start{
      top:-5px!important
    }

    #sat-inv6-program-timeline-section .sat-inv6-program-line-end{
      bottom:-5px!important
    }

    #sat-inv6-program-timeline-section .sat-inv6-program-item{
      position:relative!important;
      z-index:2!important;
      display:grid!important;
      grid-template-columns:minmax(0,1fr) 32px minmax(0,1fr)!important;
      align-items:center!important;
      column-gap:12px!important;
      width:100%!important;
      min-height:132px!important;
      margin:0!important;
      padding:0!important;
      box-sizing:border-box!important
    }

    #sat-inv6-program-timeline-section .sat-inv6-program-node{
      grid-column:2!important;
      grid-row:1!important;
      justify-self:center!important;
      align-self:center!important;
      width:10px!important;
      height:10px!important;
      border-radius:50%!important;
      background:#6D7559!important;
      box-shadow:0 0 0 4px rgba(241,229,218,.96)!important;
      z-index:5!important
    }

    #sat-inv6-program-timeline-section .sat-inv6-program-side{
      width:100%!important;
      box-sizing:border-box!important
    }

    #sat-inv6-program-timeline-section .sat-inv6-program-side.left{
      grid-column:1!important;
      grid-row:1!important;
      text-align:right!important;
      padding-right:8px!important
    }

    #sat-inv6-program-timeline-section .sat-inv6-program-side.right{
      grid-column:3!important;
      grid-row:1!important;
      text-align:left!important;
      padding-left:8px!important
    }

    #sat-inv6-program-timeline-section .sat-inv6-program-time{
      display:block!important;
      margin:0 0 5px!important;
      padding:0!important;
      font-family:'The Seasons Regular',serif!important;
      font-size:clamp(34px,6vw,52px)!important;
      line-height:.9!important;
      font-style:normal!important;
      font-weight:400!important;
      letter-spacing:0!important;
      color:#5D644F!important
    }

    #sat-inv6-program-timeline-section .sat-inv6-program-label{
      display:block!important;
      margin:0!important;
      padding:0!important;
      font-family:'Open Sans',Arial,sans-serif!important;
      font-size:clamp(14px,2.55vw,19px)!important;
      line-height:1.15!important;
      font-style:normal!important;
      font-weight:400!important;
      color:#6D7559!important
    }

    #sat-inv6-program-timeline-section .sat-inv6-program-photo-slot{
      display:block!important;
      width:100%!important;
      min-height:105px!important;
      background:transparent!important
    }

    @keyframes satInv6ProgramLineGrow{
      0%{height:0}
      100%{height:100%}
    }

    /* =====================================================
       CABECERA RSVP
       ===================================================== */

    #sat-inv6-rsvp-heading-section{
      position:relative!important;
      width:100%!important;
      max-width:680px!important;
      margin:0 auto!important;
      padding:26px 24px 18px!important;
      box-sizing:border-box!important;
      text-align:center!important;
      background:transparent!important
    }

#sat-inv6-rsvp-heading-section .sat-inv6-gaviota-regalo{
  position:absolute!important;
  width:105px!important;
  height:auto!important;

  top:-70px!important;
  left:calc(50% + 74px)!important;

  z-index:6!important;
  pointer-events:none!important;
}

    #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-kicker{
      margin:0 0 2px!important;
      font-family:'The Seasons Regular',serif!important;
      font-size:clamp(48px,10vw,82px)!important;
      line-height:.9!important;
      font-weight:400!important;
      letter-spacing:.01em!important;
      color:#5D644F!important;
      text-transform:uppercase!important
    }

    #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-title{
      margin:0!important;
      font-family:'Eyesome Script',cursive!important;
      font-size:clamp(34px,7vw,58px)!important;
      line-height:.9!important;
      font-weight:400!important;
      letter-spacing:0!important;
      color:#6D7559!important
    }

    /* =====================================================
   BOTÓN VERDE RSVP - REEMPLAZA AL GIF ORIGINAL
   ===================================================== */

/* RSVP NUEVO: ocultar definitivamente la imagen/ave antigua */
#rsvpSection .rsvp-main-image{
  display:none!important;
  visibility:hidden!important;
  opacity:0!important;
  width:0!important;
  height:0!important;
  min-width:0!important;
  min-height:0!important;
  margin:0!important;
  padding:0!important;
  pointer-events:none!important;
}

#rsvpSection .rsvp-image-stage{
  width:auto!important;
  max-width:none!important;
  margin:24px auto 0!important;
  display:flex!important;
  justify-content:center!important;
  align-items:center!important;
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
}

#rsvpSection .sat-inv6-rsvp-button{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:8px!important;

  margin:0 auto!important;
  padding:15px 28px!important;

  border-radius:999px!important;
  border:1px solid #66703F!important;

  background:#66703F!important;
  color:#FBF8EF!important;

  font-family:Georgia,'Times New Roman',serif!important;
  font-size:11px!important;
  line-height:1!important;
  font-weight:500!important;
  letter-spacing:1.4px!important;

  text-transform:uppercase!important;
  white-space:nowrap!important;

  cursor:pointer!important;

  box-shadow:none!important;
  transition:.3s ease!important;
}

#rsvpSection .sat-inv6-rsvp-button:hover{
  transform:translateY(-2px)!important;
  box-shadow:0 12px 24px rgba(102,112,63,.18)!important;
}

#rsvpSection .sat-inv6-rsvp-button-arrow{
  font-size:16px!important;
  line-height:1!important;
  transform:translateY(-1px)!important;
}

#rsvpSection .sat-inv6-rsvp-button-arrow{
  font-size:16px!important;
  line-height:1!important;
  transform:translateY(-1px)!important;
}

#rsvpSection .rsvp-tap-hint{
  display:block!important;

  margin:0 auto 14px!important;
  padding:0 24px!important;

  max-width:420px!important;

  font-family:Georgia,'Times New Roman',serif!important;
  font-size:14px!important;
  line-height:1.45!important;
  font-weight:400!important;
  font-style:italic!important;

  text-align:center!important;
  color:#6D7559!important;

  letter-spacing:0!important;
  text-transform:none!important;
}

/* =====================================================
   FONDO VERDE FINAL DEL REGALO
   ===================================================== */

#sat-inv6-gift-paper-wrap{
  position:relative!important;
  display:block!important;
  width:100%!important;
  max-width:680px!important;
  margin:0 auto!important;
  padding:0!important;
  overflow:visible!important;
  z-index:5!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-stage{
  position:relative!important;
  display:block!important;
  width:100%!important;
  margin:0!important;
  padding:0!important;
  overflow:visible!important;
}

#sat-inv6-gift-paper-bottom{
  position:relative!important;
  display:block!important;
  width:100%!important;
  max-width:680px!important;
  height:auto!important;
  margin:0 auto!important;
  padding:0!important;
  transform:translateY(-15%)!important;
  object-fit:contain!important;
  opacity:1!important;
  visibility:visible!important;
  border:0!important;
  background:transparent!important;
  box-shadow:none!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-text{
  position:absolute!important;
  left:50%!important;
  top:25%!important;
  transform:translate(-50%,-50%)!important;
  width:90%!important;
  margin:0!important;
  padding:0!important;
  text-align:center!important;
  z-index:10!important;
  opacity:1!important;
  visibility:visible!important;
  pointer-events:auto!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-kicker{
  display:block!important;
  margin:0!important;
  font-family:'The Seasons Regular',serif!important;
  font-size:clamp(38px,8vw,62px)!important;
  line-height:.9!important;
  font-weight:400!important;
  letter-spacing:.01em!important;
  text-transform:uppercase!important;
  color:#FFFFFF!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-script{
  display:block!important;
  margin:3px 0 0!important;
  font-family:'Eyesome Script',cursive!important;
  font-size:clamp(42px,9vw,70px)!important;
  line-height:.85!important;
  font-weight:400!important;
  color:#FFFFFF!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-copy{
  display:block!important;
  width:82%!important;
  max-width:420px!important;
  margin:14px auto 0!important;
  font-family:Georgia,'Times New Roman',serif!important;
  font-size:13px!important;
  line-height:1.32!important;
  font-weight:400!important;
  text-align:center!important;
  color:#FFFFFF!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-toggle-wrap{
  display:block!important;
  width:82%!important;
  max-width:420px!important;
  margin:16px auto 0!important;
  text-align:center!important;
  pointer-events:auto!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-toggle{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:8px!important;
  margin:0 auto!important;
  padding:12px 23px!important;
  border:1px solid rgba(109,117,89,.35)!important;
  border-radius:999px!important;
  background:#F1E5DA!important;
  color:#5D644F!important;
  font-family:Georgia,'Times New Roman',serif!important;
  font-size:10px!important;
  line-height:1!important;
  font-weight:700!important;
  letter-spacing:1.25px!important;
  text-transform:uppercase!important;
  cursor:pointer!important;
  box-shadow:none!important;
  pointer-events:auto!important;
  -webkit-tap-highlight-color:transparent!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-toggle-arrow{
  display:inline-block!important;
  font-size:15px!important;
  line-height:1!important;
  transition:transform .2s ease!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-toggle.is-open .sat-inv6-gift-toggle-arrow{
  transform:rotate(180deg)!important;
}

/* PANEL AUTÓNOMO EN FLUJO NORMAL: nunca tapa la sección siguiente */
#sat-inv6-gift-paper-wrap .sat-inv6-gift-details{
  display:none!important;
  position:relative!important;
  width:84%!important;
  max-width:350px!important;
  margin:-82px auto 22px!important;
  padding:10px!important;
  box-sizing:border-box!important;
  background:#F1E5DA!important;
  color:#5D644F!important;
  border:1px solid rgba(109,117,89,.16)!important;
  border-radius:16px!important;
  box-shadow:0 8px 18px rgba(63,72,46,.07)!important;
  z-index:12!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-details.is-open{
  display:block!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-details-intro{
  margin:0 0 6px!important;
  padding:0!important;
  font-family:Georgia,'Times New Roman',serif!important;
  font-size:9px!important;
  line-height:1.3!important;
  font-style:italic!important;
  text-align:center!important;
  color:#687052!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-method{
  margin:0!important;
  padding:8px 0!important;
  border-top:1px solid rgba(109,117,89,.14)!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-method:first-of-type{
  border-top:0!important;
  padding-top:3px!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-method-title{
  margin:0 0 5px!important;
  font-family:'The Seasons Regular',Georgia,serif!important;
  font-size:16px!important;
  line-height:1!important;
  font-weight:500!important;
  text-align:center!important;
  color:#5D644F!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-data-row{
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:7px!important;
  width:100%!important;
  margin:5px 0 0!important;
  padding:7px 8px!important;
  box-sizing:border-box!important;
  background:rgba(255,255,255,.30)!important;
  border:1px solid rgba(109,117,89,.12)!important;
  border-radius:11px!important;
  text-align:left!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-data-text{
  flex:1!important;
  min-width:0!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-data-label{
  display:block!important;
  margin:0 0 2px!important;
  font-family:Georgia,'Times New Roman',serif!important;
  font-size:7.5px!important;
  line-height:1.1!important;
  font-weight:700!important;
  letter-spacing:.65px!important;
  text-transform:uppercase!important;
  color:#7A806A!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-data-value{
  display:block!important;
  margin:0!important;
  font-family:Georgia,'Times New Roman',serif!important;
  font-size:10px!important;
  line-height:1.22!important;
  font-weight:600!important;
  color:#525A46!important;
  overflow-wrap:anywhere!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-copy-btn{
  flex:0 0 auto!important;
  min-width:52px!important;
  margin:0!important;
  padding:6px 7px!important;
  border:1px solid rgba(109,117,89,.25)!important;
  border-radius:999px!important;
  background:#FBF8EF!important;
  color:#5D644F!important;
  font-family:Georgia,'Times New Roman',serif!important;
  font-size:7.5px!important;
  line-height:1!important;
  font-weight:700!important;
  letter-spacing:.55px!important;
  cursor:pointer!important;
  box-shadow:none!important;
  -webkit-tap-highlight-color:transparent!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-qr{
  display:block!important;
  width:98px!important;
  max-width:38%!important;
  height:auto!important;
  margin:4px auto 0!important;
  padding:4px!important;
  box-sizing:border-box!important;
  object-fit:contain!important;
  background:#FFFFFF!important;
  border:1px solid rgba(109,117,89,.12)!important;
  border-radius:10px!important;
  box-shadow:none!important;
}

#sat-inv6-gift-paper-wrap .sat-inv6-gift-address{
  font-size:9px!important;
  line-height:1.25!important;
}

@media(max-width:390px){
  #sat-inv6-gift-paper-wrap .sat-inv6-gift-details{
    width:86%!important;
    max-width:320px!important;
    margin-top:-72px!important;
    padding:9px!important;
  }
  #sat-inv6-gift-paper-wrap .sat-inv6-gift-method-title{font-size:15px!important;}
  #sat-inv6-gift-paper-wrap .sat-inv6-gift-qr{width:92px!important;}
}

#inv5GiftInRsvp{
  overflow:visible!important;
}

#inv5GiftInRsvp .gift-experience{
  width:100%!important;
  max-width:none!important;
  overflow:visible!important;
}

/* OCULTAR "TOCA EL REGALO PARA DESCUBRIRLO" */
#inv5GiftInRsvp .gift-play-hint{
  display:none!important;
}

    @media(max-width:540px){
      #sat-inv6-rsvp-heading-section{
        padding:20px 18px 14px!important
      }

      #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-kicker{
        font-family:'The Seasons Regular',serif!important;
        font-size:46px!important;
        line-height:.9!important;
        font-weight:400!important;
        letter-spacing:.01em!important;
        text-transform:uppercase!important
      }

      #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-title{
        font-family:'Eyesome Script',cursive!important;
        font-size:36px!important;
        line-height:.9!important;
        font-weight:400!important
      }
    }

    @media(max-width:390px){
      #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-kicker{
        font-size:43px!important
      }

      #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-title{
        font-size:34px!important
      }
    }

    /* =====================================================
       TRIPULACIÓN
       ===================================================== */

    .crew-section.is-visible .crew-gif{
      animation:satCrewGifUp 1.15s cubic-bezier(.20,.82,.28,1) forwards!important
    }

    @keyframes satCrewGifUp{
      0%{
        opacity:0;
        transform:translateY(-36px) scale(.96)
      }
      72%{
        opacity:1;
        transform:translateY(-74px) scale(1.006)
      }
      100%{
        opacity:1;
        transform:translateY(-70px) scale(1)
      }
    }

    .crew-section{
      overflow:visible!important
    }

    .crew-stage{
      overflow:visible!important
    }

    /* =====================================================
       DRESS CODE
       ===================================================== */

    #dressCodeSection .inv5-dress-code{
      font-family:'The Seasons Regular',serif!important;
      color:#5D644F!important;
      font-size:clamp(48px,10vw,82px)!important;
      line-height:1!important;
      font-weight:500!important
    }

    #dressCodeSection .inv5-dress-formal{
      font-family:'Eyesome Script',cursive!important;
      font-size:clamp(34px,7vw,58px)!important;
      color:#6D7559!important
    }

    #dressCodeSection .inv5-dress-content{
      transform:translateY(-1%)!important
    }

    #dressCodeSection .inv5-dress-code + *{
      font-size:clamp(34px,7vw,58px)!important;
      line-height:1!important;
      font-weight:600!important
    }

    #dressCodeSection .inv5-dress-subtitle{
      font-weight:400!important;
      font-size:13px!important;
      line-height:1.32!important
    }

    #dressCodeSection .inv5-dress-white{
      font-weight:400!important;
      font-size:13px!important;
      line-height:1.38!important
    }

    /* =====================================================
       MÓVIL
       ===================================================== */

    @media(max-width:540px){

      #${PHOTO_ID}{
        height:106vw!important
      }

      #${PHOTO_ID} .photo-1{
        width:48%!important;
        left:5%!important;
        top:4%!important
      }

      #${PHOTO_ID} .photo-2{
        width:48%!important;
        right:4%!important;
        top:16.5%!important
      }

      .sat-inv6-next-section{
        margin-top:-42px!important
      }

      .sat-inv6-crew-title{
        top:17.8%!important;
        width:58%!important;
        max-width:230px!important;
        font-size:clamp(15px,4.6vw,19px)!important;
        line-height:1.3!important
      }

      .sat-inv6-crew-copy{
        top:26.4%!important;
        width:58%!important;
        max-width:255px!important;
        font-size:clamp(12px,3.4vw,15px)!important;
        line-height:1.4!important
      }

      #sat-inv6-paper-bottom-section .sat-inv6-paper-program{
        left:2.5%!important;
        right:3%!important
      }

      #sat-inv6-paper-bottom-section .sat-inv6-paper-logo{
        width:31%!important;
        margin-right:9%!important
      }

      #sat-inv6-paper-bottom-section .sat-inv6-program-title{
        font-size:clamp(32px,8.2vw,46px)!important
      }

      #sat-inv6-paper-bottom-section .sat-inv6-program-script{
        font-size:clamp(40px,10.2vw,58px)!important;
        margin-left:14%!important
      }

      #sat-inv6-program-timeline-section{
        padding:18px 18px 42px!important;
        background:transparent!important
      }

      #sat-inv6-program-timeline-section .sat-inv6-program-line-wrap{
        top:37px!important;
        bottom:37px!important;
        width:16px!important
      }

      #sat-inv6-program-timeline-section .sat-inv6-program-line{
        width:2px!important
      }

      #sat-inv6-program-timeline-section .sat-inv6-program-line-start,
      #sat-inv6-program-timeline-section .sat-inv6-program-line-end{
        width:9px!important;
        height:9px!important
      }

      #sat-inv6-program-timeline-section .sat-inv6-program-item{
        grid-template-columns:minmax(0,1fr) 24px minmax(0,1fr)!important;
        column-gap:9px!important;
        min-height:126px!important
      }

      #sat-inv6-program-timeline-section .sat-inv6-program-node{
        width:8px!important;
        height:8px!important;
        box-shadow:0 0 0 3px rgba(241,229,218,.96)!important
      }

      #sat-inv6-program-timeline-section .sat-inv6-program-side.left{
        padding-right:8px!important
      }

      #sat-inv6-program-timeline-section .sat-inv6-program-side.right{
        padding-left:8px!important
      }

      #sat-inv6-program-timeline-section .sat-inv6-program-time{
        font-size:clamp(28px,7.7vw,38px)!important;
        line-height:.9!important;
        margin-bottom:5px!important
      }

      #sat-inv6-program-timeline-section .sat-inv6-program-label{
        font-size:clamp(12px,3.35vw,15px)!important;
        line-height:1.14!important
      }

      #sat-inv6-program-timeline-section .sat-inv6-program-photo-slot{
        min-height:92px!important
      }
    }

    @media(max-width:390px){

      .sat-inv6-next-section{
        margin-top:-36px!important
      }

      .sat-inv6-crew-title{
        top:17.2%!important;
        width:60%!important;
        max-width:220px!important;
        font-size:16px!important;
        line-height:1.3!important
      }

      .sat-inv6-crew-copy{
        top:26.1%!important;
        width:62%!important;
        max-width:240px!important;
        font-size:12px!important;
        line-height:1.4!important
      }

      #sat-inv6-paper-bottom-section .sat-inv6-paper-logo{
        width:32%!important
      }

      #sat-inv6-paper-bottom-section .sat-inv6-program-title{
        font-size:31px!important
      }

      #sat-inv6-paper-bottom-section .sat-inv6-program-script{
        font-size:40px!important
      }

      #sat-inv6-program-timeline-section .sat-inv6-program-item{
        min-height:122px!important
      }

      #sat-inv6-program-timeline-section .sat-inv6-program-time{
        font-size:29px!important
      }

      #sat-inv6-program-timeline-section .sat-inv6-program-label{
        font-size:12px!important
      }


    /* =====================================================
       PEDIDOS MUSICALES — SIN FONDO BEIGE
       TEXTO ARRIBA + IMAGEN MÁS GRANDE ABAJO EN DIAGONAL
       ===================================================== */
    .sat-inv6-music-free-host{
      width:100%!important;
      max-width:680px!important;
      margin:0 auto!important;
      padding:28px 16px 0!important;
      box-sizing:border-box!important;
      background:transparent!important;
      overflow:visible!important;
    }

    .sat-inv6-music-free-card,
    .sat-inv6-music-free-host .music-request-card,
    .sat-inv6-music-free-host .final-card{
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
      padding:0!important;
      overflow:visible!important;
    }

    .sat-inv6-music-free-title-wrap{
      width:100%!important;
      margin:0 auto 14px!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      text-align:center!important;
      overflow:visible!important;
    }

    .sat-inv6-music-free-host .sat-inv6-music-free-title-main{
      display:block!important;
      width:auto!important;
      margin:0 auto!important;
      font-family:'The Seasons Regular',serif!important;
      font-size:clamp(48px,10vw,82px)!important;
      line-height:.92!important;
      font-weight:400!important;
      letter-spacing:.01em!important;
      text-transform:uppercase!important;
      color:#5D644F!important;
      white-space:nowrap!important;
    }

    .sat-inv6-music-free-host .sat-inv6-music-free-title-script{
      display:block!important;
      width:auto!important;
      max-width:none!important;
      margin:-6px auto 0!important;
      transform:translateX(22%)!important;
      font-family:'Eyesome Script',cursive!important;
      font-size:clamp(34px,7vw,58px)!important;
      line-height:.92!important;
      font-weight:400!important;
      color:#6D7559!important;
      white-space:nowrap!important;
      text-align:center!important;
    }

    .sat-inv6-music-free-diagonal{
      width:100%!important;
      max-width:640px!important;
      margin:0 auto!important;
      position:relative!important;
      overflow:visible!important;
    }

    .sat-inv6-music-free-copy{
      width:min(50%,240px)!important;
      margin:0 0 -8px 8px!important;
      text-align:center!important;
      color:#5B4830!important;
      position:relative!important;
      z-index:2!important;
    }

    .sat-inv6-music-free-copy p{
      margin:0!important;
      font-family:Georgia,'Times New Roman',serif!important;
      font-size:18px!important;
      line-height:1.24!important;
      font-weight:400!important;
      color:#5B4830!important;
    }

    .sat-inv6-music-free-copy p + p{
      margin-top:24px!important;
    }

    .sat-inv6-music-stage-holder{
      width:min(84%,390px)!important;
      margin:6px 0 0 auto!important;
      position:relative!important;
      z-index:1!important;
      background:transparent!important;
    }

    .sat-inv6-music-stage-holder .music-image-stage{
      width:100%!important;
      max-width:none!important;
      margin:0!important;
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
    }

    .sat-inv6-music-stage-holder .music-main-image,
    .sat-inv6-music-stage-holder img{
      display:block!important;
      width:100%!important;
      max-width:none!important;
      height:auto!important;
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
      object-fit:contain!important;
      filter:drop-shadow(0 12px 18px rgba(68,70,51,.07))!important;
    }

    .sat-inv6-music-hint-holder{
      width:min(84%,390px)!important;
      margin:0 0 0 auto!important;
      text-align:center!important;
    }

    .sat-inv6-music-hint-holder .music-tap-hint{
      margin:0 0 4px!important;
      text-align:center!important;
      font-family:Georgia,'Times New Roman',serif!important;
      font-size:9px!important;
      line-height:1.35!important;
      letter-spacing:.12em!important;
      text-transform:uppercase!important;
      color:#7C816E!important;
    }

    .sat-inv6-music-free-host .music-request-panel{
      width:min(94%,500px)!important;
      margin:10px auto 0!important;
      transform:none!important;
    }

    .sat-inv6-music-free-host .music-form-paper{
      background:rgba(255,255,255,.10)!important;
      border:1px solid rgba(109,117,89,.16)!important;
      box-shadow:0 10px 24px rgba(83,78,61,.05)!important;
    }

    .sat-inv6-music-free-host .music-success-msg,
    .sat-inv6-music-free-host .music-warning{
      width:min(92%,500px)!important;
      margin:12px auto 0!important;
      text-align:center!important;
    }

    .sat-inv6-music-free-band{
      display:none!important;
    }

    @media(max-width:540px){
      .sat-inv6-music-free-host{
        padding:24px 12px 0!important;
      }

      .sat-inv6-music-free-title-main{
        font-size:clamp(50px,14.2vw,78px)!important;
      }

      .sat-inv6-music-free-title-script{
        margin:-4px auto 0!important;
        transform:translateX(18%)!important;
        font-size:clamp(30px,9.2vw,48px)!important;
      }

      .sat-inv6-music-free-copy{
        width:min(54%,170px)!important;
        margin:0 0 -6px 2px!important;
      }

      .sat-inv6-music-free-copy p{
        font-size:13px!important;
        line-height:1.28!important;
      }

      .sat-inv6-music-free-copy p + p{
        margin-top:18px!important;
      }

      .sat-inv6-music-stage-holder,
      .sat-inv6-music-hint-holder{
        width:min(86%,270px)!important;
      }

      .sat-inv6-music-free-band{
        display:none!important;
      }
    }

    @media(max-width:390px){
      .sat-inv6-music-free-title-main{
        font-size:46px!important;
      }

      .sat-inv6-music-free-title-script{
        font-size:28px!important;
        margin-top:-2px!important;
        transform:translateX(16%)!important;
      }

      .sat-inv6-music-free-copy{
        width:min(56%,150px)!important;
      }

      .sat-inv6-music-free-copy p{
        font-size:12px!important;
      }

      .sat-inv6-music-stage-holder,
      .sat-inv6-music-hint-holder{
        width:min(88%,245px)!important;
      }
    }



    /* =====================================================
       AVISO DE MÚSICA + PREGUNTAS FRECUENTES
       ===================================================== */
    .sat-inv6-faq-host{
      width:100%!important;
      max-width:680px!important;
      margin:0 auto!important;
      padding:0 16px 0!important;
      box-sizing:border-box!important;
      background:transparent!important;
    }

    .sat-inv6-music-warning-ripped{
      position:relative!important;
      width:calc(100% + 32px)!important;
      margin:0 -16px 28px!important;
      padding:0!important;
      box-sizing:border-box!important;
      background:transparent!important;
      overflow:visible!important;
    }

    .sat-inv6-music-warning-paper{
      display:block!important;
      width:100%!important;
      height:auto!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
      user-select:none!important;
      -webkit-user-drag:none!important;
    }

    .sat-inv6-music-warning-ripped-text{
      position:absolute!important;
      z-index:3!important;
      left:50%!important;
      top:47%!important;
      width:84%!important;
      transform:translate(-50%,-50%)!important;
      margin:0!important;
      padding:0!important;
      text-align:center!important;
      font-family:Georgia,'Times New Roman',serif!important;
      font-size:clamp(18px,4.3vw,26px)!important;
      line-height:1.34!important;
      color:#FBF8EF!important;
      pointer-events:none!important;
    }

    .sat-inv6-faq-title-wrap{
      width:100%!important;
      margin:0 auto 22px!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      text-align:center!important;
    }

    .sat-inv6-faq-title-main{
      display:block!important;
      width:auto!important;
      max-width:100%!important;
      margin:0 auto!important;
      padding:0!important;
      font-family:'The Seasons Regular',Georgia,serif!important;
      font-size:clamp(48px,10vw,82px)!important;
      line-height:.90!important;
      font-weight:400!important;
      font-style:normal!important;
      letter-spacing:.01em!important;
      text-transform:uppercase!important;
      color:#5D644F!important;
      white-space:nowrap!important;
      transform:none!important;
    }

    .sat-inv6-faq-title-script{
      display:block!important;
      width:auto!important;
      max-width:100%!important;
      margin:-5px auto 0!important;
      padding:0!important;
      transform:translateX(8%)!important;
      font-family:'Eyesome Script',cursive!important;
      font-size:clamp(34px,7vw,58px)!important;
      line-height:.95!important;
      font-weight:400!important;
      font-style:normal!important;
      color:#6D7559!important;
      white-space:nowrap!important;
      text-align:center!important;
    }

    .sat-inv6-faq-list{
      width:min(100%,560px)!important;
      margin:0 auto 24px!important;
      border-top:1px solid rgba(138,129,109,.55)!important;
    }

    .sat-inv6-faq-item{
      border-bottom:1px solid rgba(138,129,109,.55)!important;
    }

    .sat-inv6-faq-q,
    .sat-inv6-faq-note{
      display:block!important;
      width:100%!important;
      margin:0!important;
      padding:18px 6px 18px!important;
      box-sizing:border-box!important;
      font-family:Georgia,'Times New Roman',serif!important;
      font-size:clamp(16px,3.9vw,24px)!important;
      line-height:1.22!important;
      color:#5B4830!important;
      text-align:left!important;
      background:transparent!important;
      border:0!important;
      cursor:pointer!important;
    }

    .sat-inv6-faq-q{
      position:relative!important;
      padding-right:28px!important;
    }

    .sat-inv6-faq-q::after{
      content:'+'!important;
      position:absolute!important;
      right:4px!important;
      top:50%!important;
      transform:translateY(-50%)!important;
      font-size:20px!important;
      line-height:1!important;
      color:#7A806A!important;
    }

    .sat-inv6-faq-item.is-open .sat-inv6-faq-q::after{
      content:'–'!important;
    }

    .sat-inv6-faq-a{
      display:none!important;
      padding:0 6px 18px!important;
      font-family:Georgia,'Times New Roman',serif!important;
      font-size:clamp(14px,3.2vw,18px)!important;
      line-height:1.55!important;
      color:#6B6E5D!important;
      text-align:left!important;
    }

    .sat-inv6-faq-item.is-open .sat-inv6-faq-a{
      display:block!important;
    }

    .sat-inv6-faq-note{
      cursor:default!important;
    }

    @media(max-width:540px){
      .sat-inv6-faq-host{
        padding:0 12px 0!important;
      }

      .sat-inv6-music-warning-ripped{
        width:calc(100% + 24px)!important;
        margin:0 -12px 24px!important;
        padding:0!important;
      }

      .sat-inv6-music-warning-ripped-text{
        top:46.5%!important;
        width:88%!important;
        font-size:clamp(14px,4vw,20px)!important;
        line-height:1.36!important;
      }

      .sat-inv6-faq-title-main{
        font-size:clamp(44px,13vw,62px)!important;
      }

      .sat-inv6-faq-title-script{
        margin-top:-5px!important;
        font-size:clamp(27px,8.5vw,40px)!important;
        transform:translateX(8%)!important;
      }

      .sat-inv6-faq-q,
      .sat-inv6-faq-note{
        font-size:clamp(13px,3.8vw,18px)!important;
        padding:16px 4px 16px!important;
        padding-right:24px!important;
      }

      .sat-inv6-faq-a{
        font-size:13px!important;
        padding:0 4px 16px!important;
      }
    }



    /* =====================================================
       CIERRE FINAL / GRACIAS
       ===================================================== */
    #sat-inv6-final-thanks-section{
      position:relative!important;
      width:100%!important;
      max-width:680px!important;
      margin:0 auto!important;
      padding:0 16px 26px!important;
      box-sizing:border-box!important;
      background:transparent!important;
      overflow:hidden!important;
    }

    #sat-inv6-final-thanks-section .sat-inv6-final-fullbleed{
      display:block!important;
      width:calc(100% + 32px)!important;
      max-width:none!important;
      height:auto!important;
      margin:0 -16px!important;
      padding:0!important;
      border:0!important;
      object-fit:cover!important;
    }

    #sat-inv6-final-thanks-section .sat-inv6-final-center{
      width:100%!important;
      margin:0 auto!important;
      padding:20px 12px 20px!important;
      box-sizing:border-box!important;
      text-align:center!important;
      background:transparent!important;
    }

    #sat-inv6-final-thanks-section .sat-inv6-final-brook{
      display:block!important;
      width:86px!important;
      max-width:28%!important;
      height:auto!important;
      margin:0 auto 10px!important;
      padding:0!important;
      object-fit:contain!important;
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
    }

    #sat-inv6-final-thanks-section .sat-inv6-final-title{
      margin:0!important;
      font-family:'The Seasons Regular',Georgia,serif!important;
      font-size:clamp(48px,10vw,82px)!important;
      line-height:1!important;
      font-weight:400!important;
      color:#5D644F!important;
      text-transform:uppercase!important;
      letter-spacing:.01em!important;
    }

    #sat-inv6-final-thanks-section .sat-inv6-final-script{
      margin:2px auto 16px!important;
      font-family:'Eyesome Script',cursive!important;
      font-size:clamp(34px,7vw,58px)!important;
      line-height:1!important;
      font-weight:400!important;
      color:#6D7559!important;
    }

    #sat-inv6-final-thanks-section .sat-inv6-final-logo{
      display:block!important;
      width:78px!important;
      max-width:28%!important;
      height:auto!important;
      margin:0 auto 14px!important;
      object-fit:contain!important;
      opacity:1!important;
      background:transparent!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
      filter:drop-shadow(0 0 3px rgba(91,72,48,.32)) drop-shadow(0 0 8px rgba(255,253,248,.72))!important;
    }

    #sat-inv6-final-thanks-section .sat-inv6-final-names{
      margin:0 auto 18px!important;
      font-family:'Eyesome Script',cursive!important;
      font-size:clamp(34px,10vw,62px)!important;
      line-height:1!important;
      font-weight:400!important;
      color:#6D7559!important;
      white-space:nowrap!important;
    }

    #sat-inv6-final-thanks-section .sat-inv6-final-credits{
      width:min(100%,260px)!important;
      margin:0 auto 0!important;
      padding:10px 12px!important;
      box-sizing:border-box!important;
      background:transparent!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
      text-align:center!important;
    }

    #sat-inv6-final-thanks-section .sat-inv6-final-credits-kicker{
      margin:0 0 6px!important;
      font-family:Georgia,'Times New Roman',serif!important;
      font-size:9px!important;
      line-height:1.2!important;
      font-weight:700!important;
      letter-spacing:.18em!important;
      text-transform:uppercase!important;
      color:#A08F7E!important;
    }

    #sat-inv6-final-thanks-section .sat-inv6-final-credits-line{
      margin:0!important;
      font-family:Georgia,'Times New Roman',serif!important;
      font-size:10px!important;
      line-height:1.5!important;
      color:#6B6A63!important;
    }

    @media(max-width:540px){
      #sat-inv6-final-thanks-section{
        padding:0 12px 22px!important;
      }

      #sat-inv6-final-thanks-section .sat-inv6-final-fullbleed{
        width:calc(100% + 24px)!important;
        margin:0 -12px!important;
      }

      #sat-inv6-final-thanks-section .sat-inv6-final-center{
        padding:18px 8px 18px!important;
      }

      #sat-inv6-final-thanks-section .sat-inv6-final-brook{
        width:76px!important;
        margin-bottom:8px!important;
      }

      #sat-inv6-final-thanks-section .sat-inv6-final-title{
        font-size:clamp(28px,8.8vw,42px)!important;
      }

      #sat-inv6-final-thanks-section .sat-inv6-final-script{
        margin-bottom:14px!important;
        font-size:clamp(19px,6.2vw,30px)!important;
      }

      #sat-inv6-final-thanks-section .sat-inv6-final-logo{
        width:68px!important;
        margin-bottom:12px!important;
      }

      #sat-inv6-final-thanks-section .sat-inv6-final-names{
        font-size:clamp(30px,9.2vw,48px)!important;
        margin-bottom:16px!important;
      }

      #sat-inv6-final-thanks-section .sat-inv6-final-credits{
        width:min(100%,240px)!important;
        padding:9px 10px!important;
        background:transparent!important;
        border:0!important;
        border-radius:0!important;
        box-shadow:none!important;
      }

      #sat-inv6-final-thanks-section .sat-inv6-final-credits-line{
        font-size:9px!important;
      }
    }



    /* HOMOGENEIZACIÓN DE TÍTULOS — SOLO COLOR Y TAMAÑO */
    #dressCodeSection .inv5-dress-code,
    #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-kicker,
    .sat-inv6-music-free-host .sat-inv6-music-free-title-main,
    .sat-inv6-faq-title-main,
    #sat-inv6-final-thanks-section .sat-inv6-final-title{
      color:#5D644F!important;
      font-size:clamp(48px,10vw,82px)!important;
    }

    #dressCodeSection .inv5-dress-formal,
    #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-title,
    .sat-inv6-music-free-host .sat-inv6-music-free-title-script,
    .sat-inv6-faq-title-script,
    #sat-inv6-final-thanks-section .sat-inv6-final-script{
      color:#6D7559!important;
      font-size:clamp(34px,7vw,58px)!important;
    }



    /* SOLO el texto:
       "Nada nos hará más felices que celebrar nuestro amor..."
       Misma tipografía que "Y nos encantaría que formaras parte de la nuestra."
       NO afecta Nos casamos, contador ni ningún otro texto. */
    #inv6TornPaperMessage .inv6-torn-paper-text{
      font-family:Georgia,'Times New Roman',serif!important;
      font-style:italic!important;
      font-weight:400!important;
    }



    /* Sombrero animado debajo de la cuenta regresiva */
    #sat-inv6-countdown-hat{
      display:flex!important;
      width:100%!important;
      justify-content:center!important;
      align-items:center!important;
      margin:4px auto 10px!important;
      padding:0!important;
      background:transparent!important;
      pointer-events:none!important;
      position:relative!important;
      z-index:5!important;
    }

    #sat-inv6-countdown-hat img{
      display:block!important;
      width:clamp(92px,22vw,138px)!important;
      max-width:138px!important;
      height:auto!important;
      margin:0 auto!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
      object-fit:contain!important;
    }

    @media(max-width:540px){
      #sat-inv6-countdown-hat img{
        width:clamp(84px,24vw,118px)!important;
        max-width:118px!important;
      }
    }



    /* GIF Dress Code debajo de "Reservamos el color blanco para los novios" */
    #sat-inv6-dress-gif{
      display:flex!important;
      width:100%!important;
      justify-content:center!important;
      align-items:center!important;
      margin:2px auto 6px!important;
      padding:0!important;
      background:transparent!important;
      pointer-events:none!important;
    }

    #sat-inv6-dress-gif img{
      display:block!important;
      width:clamp(150px,42vw,240px)!important;
      max-width:240px!important;
      height:auto!important;
      margin:0 auto!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
      object-fit:contain!important;
    }

    @media(max-width:540px){
      #sat-inv6-dress-gif img{
        width:clamp(140px,46vw,210px)!important;
        max-width:210px!important;
      }
    }



    /* GIF de Fiesta en el cronograma */
    #sat-inv6-program-timeline-section .sat-inv6-program-fiesta-gif,
    #sat-inv6-program-timeline-section .sat-inv6-program-brindis-gif,
    #sat-inv6-program-timeline-section .sat-inv6-program-comida-gif,
    #sat-inv6-program-timeline-section .sat-inv6-program-ceremonia-gif,
    #sat-inv6-program-timeline-section .sat-inv6-program-fin-gif{
      display:block!important;
      width:clamp(92px,24vw,150px)!important;
      max-width:150px!important;
      height:auto!important;
      margin:0 auto!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
      object-fit:contain!important;
      pointer-events:none!important;
    }

    @media(max-width:540px){
      #sat-inv6-program-timeline-section .sat-inv6-program-fiesta-gif,
      #sat-inv6-program-timeline-section .sat-inv6-program-brindis-gif,
      #sat-inv6-program-timeline-section .sat-inv6-program-comida-gif,
      #sat-inv6-program-timeline-section .sat-inv6-program-ceremonia-gif,
      #sat-inv6-program-timeline-section .sat-inv6-program-fin-gif{
        width:clamp(82px,26vw,125px)!important;
        max-width:125px!important;
      }
    }

  `;
}

  function removeDuplicate(doc){
    const keep=doc.getElementById(BLOCK_ID);
    doc.getElementById(DUPLICATE_ID)?.remove();
    doc.querySelectorAll('img.church-green-img,img.inv6-green-location-img').forEach(img=>{
      if(keep&&keep.contains(img))return;
      const host=img.closest('section')||img.parentElement;
      if(host&&host!==keep)host.remove();
    });
  }

  async function greenSrc(){
    return './assets/church_green_6.webp';
  }

  function following(photos){
    const next=photos?.nextElementSibling;
    if(!next)return;

    next.classList.add('sat-inv6-next-section');

    const w=next.ownerDocument.createTreeWalker(
      next,
      NodeFilter.SHOW_TEXT
    );

    const nodes=[];

    while(w.nextNode()){
      nodes.push(w.currentNode);
    }

    nodes.forEach(n=>n.nodeValue='');

    next.querySelector('.sat-inv6-crew-title')?.remove();
    next.querySelector('.sat-inv6-crew-copy')?.remove();

    const t=next.ownerDocument.createElement('h2');
    t.className='sat-inv6-crew-title';
    t.textContent='Toda gran aventura necesita una buena tripulación';

    t.style.setProperty(
      'font-family',
      "Georgia, 'Times New Roman', serif",
      'important'
    );

    t.style.setProperty(
      'font-weight',
      '800',
      'important'
    );

    t.style.setProperty(
      'font-style',
      'italic',
      'important'
    );

    next.appendChild(t);

    const copy=next.ownerDocument.createElement('div');

    copy.className='sat-inv6-crew-copy';

    copy.innerHTML=`
      <p>
        Y nos encantaría que formaras<br>
        parte de la nuestra.
      </p>

      <p>
        Ahora que ya conoces el rumbo,<br>
        queremos contarte algunos<br>
        detalles para que<br>
        disfrutes este día tan especial<br>
        junto a nosotros.
      </p>
    `;

    next.appendChild(copy);

    next.ownerDocument
      .getElementById('sat-inv6-crew-bottom-photo-section')
      ?.remove();

    const bottomPhotoSection=
      next.ownerDocument.createElement('section');

    bottomPhotoSection.id=
      'sat-inv6-crew-bottom-photo-section';

    bottomPhotoSection.innerHTML=`
      <img
        src="./assets/foto_cortada_superior_6_1.png"
        alt=""
      >
    `;

    next.insertAdjacentElement(
      'afterend',
      bottomPhotoSection
    );

    const doc=next.ownerDocument;

/* =====================================================
   ELIMINAR DEFINITIVAMENTE
   "TOCA EL REGALO PARA DESCUBRIRLO"
   ===================================================== */

const removeGiftHint=()=>{

  doc.querySelectorAll('.gift-play-hint').forEach(el=>{
    el.remove();
  });

  doc.querySelectorAll('p,span,div,small').forEach(el=>{

    const texto=(el.textContent||'')
      .replace(/\s+/g,' ')
      .trim()
      .toUpperCase();

    if(
      texto==='TOCA EL REGALO PARA DESCUBRIRLO' ||
      texto==='TOCA EL REGALO PARA DESCUBRIRLO.'
    ){
      el.remove();
    }

  });
};

removeGiftHint();

if(!doc.__satGiftHintObserver){

  doc.__satGiftHintObserver=new MutationObserver(()=>{
    removeGiftHint();
  });

  doc.__satGiftHintObserver.observe(
    doc.body,
    {
      childList:true,
      subtree:true
    }
  );
}

    /* ELIMINAR SOLO EL TÍTULO "QUIERO DEJARLES UN DETALLE" */
doc.querySelectorAll('h1,h2,h3,h4,h5,h6,div,p,span').forEach(el=>{

  const texto=(el.textContent||'')
    .replace(/\s+/g,' ')
    .trim()
    .toUpperCase();

  if(texto==='QUIERO DEJARLES UN DETALLE'){
    el.remove();
  }

});

/* =====================================================
   RSVP DEFINITIVO
   - TÍTULO NUEVO + AVE LATERAL
   - BOTÓN VERDE
   - IMAGEN/AVE ANTIGUA OCULTA PARA SIEMPRE
   - CONSERVA EL CLICK ORIGINAL
   ===================================================== */

const enforceInv6Rsvp=()=>{
  const rsvpSection=doc.querySelector('#rsvpSection');
  if(!rsvpSection)return;

  /* 1. Eliminar únicamente el título antiguo */
  rsvpSection.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span').forEach(el=>{
    if(el.closest('#sat-inv6-rsvp-heading-section'))return;
    if(el.closest('.sat-inv6-rsvp-button'))return;

    const texto=(el.textContent||'')
      .replace(/\s+/g,' ')
      .trim()
      .toUpperCase();

    if(
      texto==='CONFIRMAR TU ASISTENCIA' ||
      texto==='CONFIRMA TU ASISTENCIA'
    ){
      el.remove();
    }
  });

  const stage=rsvpSection.querySelector('.rsvp-image-stage');
  if(!stage)return;

  /* 2. Mantener la imagen original SOLO como disparador oculto */
  const original=stage.querySelector('.rsvp-main-image');
  if(original){
    original.style.setProperty('display','none','important');
    original.style.setProperty('visibility','hidden','important');
    original.style.setProperty('opacity','0','important');
    original.style.setProperty('width','0','important');
    original.style.setProperty('height','0','important');
    original.style.setProperty('margin','0','important');
    original.style.setProperty('padding','0','important');
    original.setAttribute('aria-hidden','true');
  }

  /* 3. Mensaje corto encima del botón */
  const hint=rsvpSection.querySelector('.rsvp-tap-hint');
  if(hint){
    hint.textContent='Agradecemos confirmar su asistencia antes del 15 de Octubre';
    if(hint.nextElementSibling!==stage){
      stage.insertAdjacentElement('beforebegin',hint);
    }
  }

  /* 4. Un solo botón nuevo */
  stage.querySelectorAll('.sat-inv6-rsvp-button').forEach((btn,i)=>{
    if(i>0)btn.remove();
  });

  let button=stage.querySelector('.sat-inv6-rsvp-button');

  if(!button){
    button=doc.createElement('button');
    button.type='button';
    button.className='sat-inv6-rsvp-button';
    button.innerHTML=`
      CONFIRMA TU ASISTENCIA
      <span class="sat-inv6-rsvp-button-arrow">⌄</span>
    `;
    stage.appendChild(button);
  }

  if(button.getAttribute('data-sat-rsvp-bound')!=='1'){
    button.setAttribute('data-sat-rsvp-bound','1');

    button.addEventListener('click',e=>{
      const legacy=stage.querySelector('.rsvp-main-image');

      if(legacy){
        e.preventDefault();
        e.stopPropagation();
        legacy.click();
        return;
      }

      /* Si el formulario escucha el click del contenedor, dejamos que lo reciba */
      const MouseEventCtor=doc.defaultView?.MouseEvent;
      if(!MouseEventCtor)return;
      const ev=new MouseEventCtor('click',{bubbles:true,cancelable:true,view:doc.defaultView});
      stage.dispatchEvent(ev);
    });
  }
};

enforceInv6Rsvp();

/*
   IMPORTANTE:
   No usamos MutationObserver aquí.
   El observer anterior entraba en un bucle porque enforceInv6Rsvp()
   vuelve a escribir el texto del hint y eso genera otra mutación.
   El CSS ya oculta permanentemente la imagen antigua y apply()
   vuelve a ejecutar enforceInv6Rsvp() en los reintentos normales.
*/

/* =====================================================
   FONDO VERDE FINAL DEL REGALO
   ===================================================== */

const giftHost=
  doc.getElementById('inv5GiftInRsvp');

if(giftHost){

  /* eliminar únicamente nuestra versión anterior */
  doc.getElementById('sat-inv6-gift-paper-wrap')?.remove();

  const giftPaperWrap=doc.createElement('div');
  giftPaperWrap.id='sat-inv6-gift-paper-wrap';

  const giftStage=doc.createElement('div');
  giftStage.className='sat-inv6-gift-paper-stage';

  const giftPaper=doc.createElement('img');
  giftPaper.id='sat-inv6-gift-paper-bottom';
  giftPaper.src='./assets/papel_roto_6_5.png';
  giftPaper.alt='';

  const giftPaperText=doc.createElement('div');
  giftPaperText.className='sat-inv6-gift-paper-text';
  giftPaperText.innerHTML=`
    <div class="sat-inv6-gift-paper-kicker">NUESTRO MEJOR</div>
    <div class="sat-inv6-gift-paper-script">regalo</div>
    <p class="sat-inv6-gift-paper-copy">
      Tu presencia es nuestro mayor regalo, pero si deseas tener un detalle con nosotros, una contribución para nuestro futuro significará muchísimo para nosotros.
    </p>
    <div class="sat-inv6-gift-toggle-wrap">
      <button type="button" class="sat-inv6-gift-toggle" aria-expanded="false">
        TIPOS DE REGALO
        <span class="sat-inv6-gift-toggle-arrow">⌄</span>
      </button>
    </div>
  `;

  giftStage.appendChild(giftPaper);
  giftStage.appendChild(giftPaperText);

  const giftDetails=doc.createElement('div');
  giftDetails.className='sat-inv6-gift-details';
  giftDetails.innerHTML=`
    <p class="sat-inv6-gift-details-intro">Elige la opción que prefieras ♡</p>

    <div class="sat-inv6-gift-method">
      <div class="sat-inv6-gift-method-title">BCP</div>

      <div class="sat-inv6-gift-data-row">
        <div class="sat-inv6-gift-data-text">
          <span class="sat-inv6-gift-data-label">Cuenta</span>
          <strong class="sat-inv6-gift-data-value">19335282760050</strong>
        </div>
        <button type="button" class="sat-inv6-copy-btn" data-copy="19335282760050">COPIAR</button>
      </div>

      <div class="sat-inv6-gift-data-row">
        <div class="sat-inv6-gift-data-text">
          <span class="sat-inv6-gift-data-label">CCI</span>
          <strong class="sat-inv6-gift-data-value">00219313528276005017</strong>
        </div>
        <button type="button" class="sat-inv6-copy-btn" data-copy="00219313528276005017">COPIAR</button>
      </div>
    </div>

    <div class="sat-inv6-gift-method">
      <div class="sat-inv6-gift-method-title">Yape</div>
      <img
        class="sat-inv6-gift-qr"
        src="./assets/qr_yape.jpg"
        alt="QR de Yape"
      >
    </div>

    <div class="sat-inv6-gift-method">
      <div class="sat-inv6-gift-method-title">Regalo físico</div>
      <div class="sat-inv6-gift-data-row">
        <div class="sat-inv6-gift-data-text">
          <span class="sat-inv6-gift-data-label">Dirección</span>
          <strong class="sat-inv6-gift-data-value sat-inv6-gift-address">Urb. Alameda de la Rivera Mz. G Lt. 45, Ate</strong>
        </div>
        <button type="button" class="sat-inv6-copy-btn" data-copy="Urb. Alameda de la Rivera Mz. G Lt. 45, Ate">COPIAR</button>
      </div>
    </div>
  `;

  giftPaperWrap.appendChild(giftStage);
  giftPaperWrap.appendChild(giftDetails);

  const giftToggle=giftPaperText.querySelector('.sat-inv6-gift-toggle');

  giftToggle?.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();

    const opening=!giftDetails.classList.contains('is-open');
    giftDetails.classList.toggle('is-open',opening);
    giftToggle.classList.toggle('is-open',opening);
    giftToggle.setAttribute('aria-expanded',opening ? 'true' : 'false');
  });

  const copyValue=async(value,button)=>{
    let copied=false;
    const win=doc.defaultView;

    try{
      if(win?.navigator?.clipboard && win.isSecureContext){
        await win.navigator.clipboard.writeText(value);
        copied=true;
      }
    }catch(e){}

    if(!copied){
      const area=doc.createElement('textarea');
      area.value=value;
      area.setAttribute('readonly','');
      area.style.position='fixed';
      area.style.left='-9999px';
      area.style.top='-9999px';
      doc.body.appendChild(area);
      area.select();
      try{ copied=doc.execCommand('copy'); }catch(e){}
      area.remove();
    }

    if(button){
      const old=button.textContent;
      button.textContent=copied ? 'COPIADO ✓' : 'COPIAR';
      setTimeout(()=>{
        if(button.isConnected)button.textContent=old;
      },1200);
    }
  };

  giftDetails.querySelectorAll('.sat-inv6-copy-btn').forEach(button=>{
    button.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      copyValue(button.getAttribute('data-copy')||'',button);
    });
  });

  giftHost.insertAdjacentElement('afterend',giftPaperWrap);
}

    const dressCodeSection=
      doc.getElementById('dressCodeSection');

    const itinerarySection=
      doc.getElementById('itinerarySection');

    if(dressCodeSection&&itinerarySection){
      itinerarySection.insertAdjacentElement(
        'beforebegin',
        dressCodeSection
      );
    }

    if(dressCodeSection){
      bottomPhotoSection.insertAdjacentElement(
        'afterend',
        dressCodeSection
      );
    }

    /* ELIMINAR SOLO EL CRONOGRAMA ORIGINAL */

    if(itinerarySection){
      itinerarySection.remove();
    }

    next.ownerDocument
      .getElementById('sat-inv6-dress-bottom-photo-section')
      ?.remove();

    if(dressCodeSection){

      const dressBottomPhoto=
        next.ownerDocument.createElement('section');

      dressBottomPhoto.id=
        'sat-inv6-dress-bottom-photo-section';

      dressBottomPhoto.innerHTML=`
        <img
          src="./assets/foto_cortada_superior_6_2.png"
          alt=""
        >
      `;

      dressCodeSection.insertAdjacentElement(
        'afterend',
        dressBottomPhoto
      );

      next.ownerDocument
        .getElementById('sat-inv6-green-phrase-copy')
        ?.remove();

      next.ownerDocument
        .getElementById('sat-inv6-paper-bottom-section')
        ?.remove();

      const paperBottomSection=
        next.ownerDocument.createElement('section');

      paperBottomSection.id=
        'sat-inv6-paper-bottom-section';

      paperBottomSection.innerHTML=`
        <img
          class="sat-inv6-paper-bg"
          src="./assets/papel_roto_6_3.png"
          alt=""
        >

        <div class="sat-inv6-paper-program">

          <img
            class="sat-inv6-paper-logo"
            src="./assets/logo_6_3.png"
            alt="A y L"
          >

          <div class="sat-inv6-program-text">
            <div class="sat-inv6-program-title">
              PROGRAMA
            </div>

            <div class="sat-inv6-program-script">
              del día
            </div>
          </div>

        </div>
      `;

      dressBottomPhoto.insertAdjacentElement(
        'afterend',
        paperBottomSection
      );

      next.ownerDocument
        .getElementById('sat-inv6-program-timeline-section')
        ?.remove();

      const programTimelineSection=
        next.ownerDocument.createElement('section');

      programTimelineSection.id=
        'sat-inv6-program-timeline-section';

      programTimelineSection.innerHTML=`
        <div class="sat-inv6-program-inner">

          <div class="sat-inv6-program-line-wrap">
            <div class="sat-inv6-program-line-start"></div>
            <div class="sat-inv6-program-line"></div>
            <div class="sat-inv6-program-line-end"></div>
          </div>

          <div class="sat-inv6-program-item">

            <div class="sat-inv6-program-side left">
              <h3 class="sat-inv6-program-time">
                02:00
              </h3>

              <div class="sat-inv6-program-label">
                Recepción
              </div>
            </div>

            <div class="sat-inv6-program-node"></div>

            <div class="sat-inv6-program-side right">
              <div class="sat-inv6-program-photo-slot"></div>
            </div>

          </div>

          <div class="sat-inv6-program-item">

            <div class="sat-inv6-program-side left">

              <h3 class="sat-inv6-program-time">
                03:00
              </h3>

              <div class="sat-inv6-program-label">
                Ceremonia<br>
                de Boda
              </div>

            </div>

            <div class="sat-inv6-program-node"></div>

            <div class="sat-inv6-program-side right">
              <div class="sat-inv6-program-photo-slot">
                <img
                  class="sat-inv6-program-ceremonia-gif"
                  src="./assets/inicio_de_boda_6_3.gif"
                  alt=""
                >
              </div>
            </div>

          </div>

          <div class="sat-inv6-program-item">

            <div class="sat-inv6-program-side left">
              <div class="sat-inv6-program-photo-slot">
                <img
                  class="sat-inv6-program-brindis-gif"
                  src="./assets/brindis_6_3.gif"
                  alt=""
                >
              </div>
            </div>

            <div class="sat-inv6-program-node"></div>

            <div class="sat-inv6-program-side right">

              <h3 class="sat-inv6-program-time">
                04:00
              </h3>

              <div class="sat-inv6-program-label">
                Brindis
              </div>

            </div>

          </div>

          <div class="sat-inv6-program-item">

            <div class="sat-inv6-program-side left">

              <h3 class="sat-inv6-program-time">
                05:00
              </h3>

              <div class="sat-inv6-program-label">
                Inicio del<br>
                Banquete
              </div>

            </div>

            <div class="sat-inv6-program-node"></div>

            <div class="sat-inv6-program-side right">
              <div class="sat-inv6-program-photo-slot">
                <img
                  class="sat-inv6-program-comida-gif"
                  src="./assets/comida_6_2.gif"
                  alt=""
                >
              </div>
            </div>

          </div>

          <div class="sat-inv6-program-item">

            <div class="sat-inv6-program-side left">
              <div class="sat-inv6-program-photo-slot">
                <img
                  class="sat-inv6-program-fiesta-gif"
                  src="./assets/fiesta_6_2.gif"
                  alt=""
                >
              </div>
            </div>

            <div class="sat-inv6-program-node"></div>

            <div class="sat-inv6-program-side right">

              <h3 class="sat-inv6-program-time">
                06:00
              </h3>

              <div class="sat-inv6-program-label">
                Fiesta!!
              </div>

            </div>

          </div>

          <div class="sat-inv6-program-item">

            <div class="sat-inv6-program-side left">

              <h3 class="sat-inv6-program-time">
                00:00
              </h3>

              <div class="sat-inv6-program-label">
                Fin de la<br>
                Celebración!
              </div>

            </div>

            <div class="sat-inv6-program-node"></div>

            <div class="sat-inv6-program-side right">
              <div class="sat-inv6-program-photo-slot">
                <img
                  class="sat-inv6-program-fin-gif"
                  src="./assets/fin_boda_6_2.gif"
                  alt=""
                >
              </div>
            </div>

          </div>

        </div>
      `;

      paperBottomSection.insertAdjacentElement(
        'afterend',
        programTimelineSection
      );

      next.ownerDocument
        .getElementById('sat-inv6-rsvp-heading-section')
        ?.remove();

      const rsvpHeadingSection=
        next.ownerDocument.createElement('section');

      rsvpHeadingSection.id=
        'sat-inv6-rsvp-heading-section';

rsvpHeadingSection.innerHTML=`

  <img
    class="sat-inv6-gaviota-regalo"
    src="./confirmar%20invitacion_2.gif"
    alt=""
  >

  <div class="sat-inv6-rsvp-kicker">
    CONFIRMA
  </div>

  <div class="sat-inv6-rsvp-title">
    tu asistencia
  </div>
`;

      programTimelineSection.insertAdjacentElement(
        'afterend',
        rsvpHeadingSection
      );


      /* El RSVP visible debe ser SIEMPRE el nuevo */
      enforceInv6Rsvp();
    }

    if(dressCodeSection){

      const subtitle=
        dressCodeSection.querySelector(
          '.inv5-dress-subtitle'
        );

      const whiteText=
        dressCodeSection.querySelector(
          '.inv5-dress-white'
        );

      const palette=
        dressCodeSection.querySelector(
          '.inv5-dress-palette'
        );

      const lowerText=
        dressCodeSection.querySelector(
          '.inv5-dress-lower-1'
        );

      const lastText=
        dressCodeSection.querySelector(
          '.inv5-dress-last'
        );

      const formalText=
        dressCodeSection.querySelector(
          '.inv5-dress-formal'
        );

      if(subtitle){
        subtitle.textContent=
          'Queremos que cada uno de ustedes se sienta especial y luzca espectacular en nuestro día. ¡Aquí todos brillamos!';
      }

      if(whiteText){
        whiteText.textContent=
          'Amaremos que vistan en colores de nuestra paleta de boda, es decir tropicales y pasteles acorde a la estación ☀️🌴 Recuerda que tu mejor accesorio es tu actitud y una gran sonrisa.';
      }

      if(whiteText&&palette){
        whiteText.insertAdjacentElement(
          'afterend',
          palette
        );
      }

      if(lowerText){
        lowerText.textContent=
          'Reservamos el color blanco para los novios ♡';
      }

      if(lastText){
        lastText.remove();
      }

      if(formalText){

        formalText.style.setProperty(
          'font-family',
          "'Eyesome Script', cursive",
          'important'
        );

        formalText.style.setProperty(
          'font-size',
          '34px',
          'important'
        );

        formalText.style.setProperty(
          'line-height',
          '1',
          'important'
        );
      }
    }
  }



  function restyleMusicSection(doc){
    const stage=doc.querySelector('.music-image-stage');
    if(!stage)return;

    const host=
      stage.closest('section')||
      stage.closest('.final-section')||
      stage.parentElement;

    if(!host)return;

    const panel=
      host.querySelector('.music-request-panel')||
      doc.querySelector('.music-request-panel');

    const success=
      host.querySelector('.music-success-msg')||
      doc.querySelector('.music-success-msg');

    const hint=
      host.querySelector('.music-tap-hint')||
      doc.querySelector('.music-tap-hint');

    const warning=
      host.querySelector('.music-warning')||
      doc.querySelector('.music-warning');

    const card=
      host.querySelector('.music-request-card')||
      stage.closest('.music-request-card')||
      host;

    if(host.getAttribute('data-sat-music-rebuilt')==='1')return;

    const stageNode=stage;
    const hintNode=hint;
    const panelNode=panel;
    const successNode=success;
    const warningNode=warning;

    host.setAttribute('data-sat-music-rebuilt','1');
    host.classList.add('sat-inv6-music-free-host');

    host.innerHTML='';

    const shell=doc.createElement('div');
    shell.className='music-request-card sat-inv6-music-free-card';

    shell.innerHTML=`
      <div class="sat-inv6-music-free-title-wrap">
        <div
          class="sat-inv6-music-free-title-main"
          style="font-family:'The Seasons Regular',serif!important;font-size:clamp(50px,14vw,78px)!important;line-height:.9!important;font-weight:400!important;letter-spacing:.01em!important;text-transform:uppercase!important;color:#5D644F!important;white-space:nowrap!important;"
        >PEDIDOS</div>

        <div
          class="sat-inv6-music-free-title-script"
          style="font-family:'Eyesome Script',cursive!important;font-size:clamp(30px,9vw,48px)!important;line-height:.9!important;font-weight:400!important;color:#6D7559!important;white-space:nowrap!important;margin-top:-4px!important;transform:translateX(18%)!important;"
        >Musicales</div>
      </div>

      <div class="sat-inv6-music-free-diagonal">
        <div class="sat-inv6-music-free-copy">
          <p>
            ¿Hay una canción que<br>
            te gustaría escuchar<br>
            durante la recepción o<br>
            la fiesta?
          </p>

          <p>
            Déjanos tu pedido<br>
            aquí para considerarlo!
          </p>
        </div>

        <div class="sat-inv6-music-stage-holder"></div>
        <div class="sat-inv6-music-hint-holder"></div>
      </div>
    `;

    shell.querySelector('.sat-inv6-music-stage-holder')
      ?.appendChild(stageNode);

    if(hintNode){
      shell.querySelector('.sat-inv6-music-hint-holder')
        ?.appendChild(hintNode);
    }

    host.appendChild(shell);

    if(panelNode)host.appendChild(panelNode);
    if(successNode)host.appendChild(successNode);

    if(warningNode){
      doc.__satInv6MusicWarningText=(warningNode.textContent||'').trim();
      warningNode.remove();
    }

    const band=doc.createElement('div');
    band.className='sat-inv6-music-free-band';
    host.appendChild(band);
  }




  function restyleFaqSection(doc){
    let host=
      doc.querySelector('#faqSection')||
      doc.querySelector('.faq-section')||
      null;

    if(!host){
      const firstMatch=[...doc.querySelectorAll('section,div')].find(el=>{
        const t=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
        return t.includes('¿la ceremonia de boda y la recepción serán en el mismo lugar') ||
               t.includes('hasta qué fecha puedo confirmar mi asistencia') ||
               t.includes('puedo informar de alguna alergia');
      });
      host=firstMatch;
    }

    if(!host)return;
    if(host.getAttribute('data-sat-faq-rebuilt')==='1')return;

    host.setAttribute('data-sat-faq-rebuilt','1');
    host.classList.add('sat-inv6-faq-host');

    const warningText=
      doc.__satInv6MusicWarningText||
      'El DJ no aceptará pedidos musicales durante la celebración, así que este es tu momento para compartirnos tu canción.';

    host.innerHTML=`
      <div class="sat-inv6-music-warning-ripped">
        <img
          class="sat-inv6-music-warning-paper"
          src="./assets/papel_roto_6_1.png"
          alt=""
        >
        <div class="sat-inv6-music-warning-ripped-text">
          ${warningText}
        </div>
      </div>

      <div
        class="sat-inv6-faq-title-wrap"
        style="width:100%!important;margin:0 auto 22px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important;overflow:visible!important;"
      >
        <div
          class="sat-inv6-faq-title-main"
          style="display:block!important;width:auto!important;max-width:100%!important;margin:0 auto!important;padding:0!important;font-family:'The Seasons Regular',Georgia,serif!important;font-size:clamp(44px,13vw,72px)!important;line-height:.90!important;font-weight:400!important;font-style:normal!important;letter-spacing:.01em!important;text-transform:uppercase!important;color:#5B4830!important;white-space:nowrap!important;transform:none!important;"
        >PREGUNTAS</div>

        <div
          class="sat-inv6-faq-title-script"
          style="display:block!important;width:auto!important;max-width:100%!important;margin:-5px auto 0!important;padding:0!important;font-family:'Eyesome Script',cursive!important;font-size:clamp(28px,8.7vw,46px)!important;line-height:.95!important;font-weight:400!important;font-style:normal!important;color:#6D7559!important;white-space:nowrap!important;text-align:center!important;transform:translateX(8%)!important;"
        >Frecuentes</div>
      </div>

      <div class="sat-inv6-faq-list">
        <div class="sat-inv6-faq-item">
          <button type="button" class="sat-inv6-faq-q">¿La ceremonia de Boda y la Recepción serán en el mismo lugar?</button>
          <div class="sat-inv6-faq-a">Sí, la ceremonia y la recepción se realizarán en el mismo lugar: Residencia Privada, Calle Acapulco 480, La Molina.</div>
        </div>

        <div class="sat-inv6-faq-item">
          <button type="button" class="sat-inv6-faq-q">¿Hasta qué fecha puedo confirmar mi asistencia?</button>
          <div class="sat-inv6-faq-a">Agradecemos confirmar tu asistencia antes del 15 de Octubre.</div>
        </div>

        <div class="sat-inv6-faq-item">
          <button type="button" class="sat-inv6-faq-q">¿Puedo informar de alguna alergia y/o restricción alimentaria?</button>
          <div class="sat-inv6-faq-a">Sí, por favor indícalo al momento de confirmar tu asistencia para tenerlo en cuenta.</div>
        </div>

        <div class="sat-inv6-faq-item">
          <div class="sat-inv6-faq-note">Tip: Usa calzado cómodo, el césped será parte de la celebración</div>
        </div>
      </div>
    `;

    host.querySelectorAll('.sat-inv6-faq-q').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const item=btn.closest('.sat-inv6-faq-item');
        if(!item)return;
        item.classList.toggle('is-open');
      });
    });
  }






  function insertFinalThanksSection(doc){
    const faqHost=
      doc.querySelector('.sat-inv6-faq-host')||
      doc.querySelector('#faqSection')||
      null;

    if(!faqHost)return;

    doc.getElementById('sat-inv6-final-thanks-section')?.remove();

    const section=doc.createElement('section');
    section.id='sat-inv6-final-thanks-section';

    section.innerHTML=`
      <img
        class="sat-inv6-final-fullbleed sat-inv6-final-fullbleed-top"
        src="./assets/foto_pareja_final_6_1.png"
        alt="Antonio y Lucero en la playa"
      >

      <div class="sat-inv6-final-center">
        <img
          class="sat-inv6-final-brook"
          src="./brook.gif"
          alt="Brook"
          loading="eager"
          decoding="async"
        >

        <h2 class="sat-inv6-final-title">¡GRACIAS!</h2>

        <div class="sat-inv6-final-script">
          Por ser parte de nuestro comienzo
        </div>

        <img
          class="sat-inv6-final-logo"
          src="./assets/logo_6_2.png"
          alt="Logo Antonio y Lucero"
        >

        <div class="sat-inv6-final-names">
          Lucero y Antonio
        </div>

        <div class="sat-inv6-final-credits">
          <div class="sat-inv6-final-credits-kicker">
            Créditos
          </div>

          <p class="sat-inv6-final-credits-line">
            Antonio Valdiviezo ©
          </p>

          <p class="sat-inv6-final-credits-line">
            Music — Sake de Binks (One Piece – Oda)
          </p>
        </div>
      </div>

      <img
        class="sat-inv6-final-fullbleed sat-inv6-final-fullbleed-bottom"
        src="./assets/foto_pareja_final_6_2.png"
        alt="Antonio y Lucero en la playa"
      >
    `;

    faqHost.insertAdjacentElement('afterend',section);

    /* CIERRE DEFINITIVO:
       la foto_pareja_final_6_2 es el último elemento de la invitación.
       Eliminamos cualquier bloque antiguo que quedara después (incluido Brook viejo). */
    let legacyAfterFinal=section.nextElementSibling;
    while(legacyAfterFinal){
      const nextLegacy=legacyAfterFinal.nextElementSibling;
      legacyAfterFinal.remove();
      legacyAfterFinal=nextLegacy;
    }
  }


  function hardenFaqTitle(doc){
    const main=doc.querySelector('.sat-inv6-faq-title-main');
    const script=doc.querySelector('.sat-inv6-faq-title-script');

    if(main){
      main.style.setProperty('font-family',"'The Seasons Regular', Georgia, serif",'important');
      main.style.setProperty('font-size','clamp(48px,10vw,82px)','important');
      main.style.setProperty('line-height','.90','important');
      main.style.setProperty('font-weight','400','important');
      main.style.setProperty('font-style','normal','important');
      main.style.setProperty('letter-spacing','.01em','important');
      main.style.setProperty('text-transform','uppercase','important');
      main.style.setProperty('white-space','nowrap','important');
      main.style.setProperty('transform','none','important');
      main.style.setProperty('color','#5D644F','important');
    }

    if(script){
      script.style.setProperty('font-family',"'Eyesome Script', cursive",'important');
      script.style.setProperty('font-size','clamp(34px,7vw,58px)','important');
      script.style.setProperty('line-height','.95','important');
      script.style.setProperty('font-weight','400','important');
      script.style.setProperty('font-style','normal','important');
      script.style.setProperty('white-space','nowrap','important');
      script.style.setProperty('transform','translateX(8%)','important');
      script.style.setProperty('color','#6D7559','important');
      script.style.setProperty('text-align','center','important');
    }
  }




  function insertCountdownHat(doc){
    let holder=doc.getElementById('sat-inv6-countdown-hat');

    if(!holder){
      holder=doc.createElement('div');
      holder.id='sat-inv6-countdown-hat';
      holder.setAttribute('aria-hidden','true');
      holder.innerHTML=`
        <img
          src="./assets/entrada_sombrero_6_2.gif"
          alt=""
        >
      `;
    }

    /* Debe ir ENTRE la cuenta regresiva y la frase
       "Nos encantaría que seas parte de este momento tan especial para nosotros!" */
    const phraseSection=doc.querySelector('.phrase-section');

    if(phraseSection){
      if(phraseSection.previousElementSibling!==holder){
        phraseSection.insertAdjacentElement('beforebegin',holder);
      }
      return;
    }

    /* Respaldo: si aún no existe la sección de la frase,
       lo colocamos justo después del bloque del contador. */
    const paperSection=doc.querySelector('.paper-section');
    if(paperSection){
      if(paperSection.nextElementSibling!==holder){
        paperSection.insertAdjacentElement('afterend',holder);
      }
    }
  }



  function insertDressCodeGif(doc){
    let holder=doc.getElementById('sat-inv6-dress-gif');

    if(!holder){
      holder=doc.createElement('div');
      holder.id='sat-inv6-dress-gif';
      holder.setAttribute('aria-hidden','true');
      holder.innerHTML=`
        <img
          src="./assets/dress_code_6_2.gif"
          alt=""
        >
      `;
    }

    const normalize=s=>
      (s||'')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g,'')
        .replace(/\s+/g,' ')
        .trim()
        .toLowerCase();

    const phrase='reservamos el color blanco para los novios';

    /* Buscar el elemento MÁS PEQUEÑO que contiene exactamente la frase */
    const target=[...doc.querySelectorAll('p,div,span,strong')]
      .filter(el=>normalize(el.textContent).includes(phrase))
      .sort((a,b)=>normalize(a.textContent).length-normalize(b.textContent).length)[0];

    if(!target){
      holder.remove();
      return;
    }

    /* Insertarlo justo debajo de ese bloque textual */
    const block = target.closest('p,div') || target;

    if(block.nextElementSibling!==holder){
      block.insertAdjacentElement('afterend',holder);
    }
  }

  async function apply(){

    const doc=deepestDoc();

    if(!doc)return false;

    pauseInvitationMusic();

    const location=
      doc.querySelector(
        'section.location-section'
      );

    if(!location)return false;

    ensureStyle(doc);
    insertCountdownHat(doc);
    insertDressCodeGif(doc);
    removeDuplicate(doc);

    doc.getElementById(BLOCK_ID)?.remove();

    const block=
      doc.createElement('section');

    block.id=BLOCK_ID;

    block.innerHTML=`
      <div class="church-green-wrap">

        <img
          class="green-img"
          alt=""
        >

        <div class="church-overlay-content">

          <div class="church-kicker">
            UBICACIÓN
          </div>

          <div class="church-title">
            <span>Ceremonia</span>
            <span>&amp; Recepción</span>
          </div>

          <p class="church-main-copy">
            La boda y la recepción se realizarán en el mismo lugar.
          </p>

          <div class="church-place-name">
            Residencia Privada
          </div>

          <div class="church-address">
            Calle Acapulco 480, La Molina
          </div>

          <p class="church-note">
            Te esperamos para compartir juntos cada momento de este día tan especial.
          </p>

        </div>

      </div>
    `;

    location.insertAdjacentElement(
      'afterend',
      block
    );

    try{
      block.querySelector(
        '.green-img'
      ).src=await greenSrc();
    }catch(e){
      console.warn(e);
    }

    doc.getElementById(
      PHOTO_ID
    )?.remove();

    const photos=
      doc.createElement('section');

    photos.id=PHOTO_ID;

    photos.innerHTML=`
      <img
        class="photo-1"
        src="./assets/foto_pareja_6_1.png"
        alt=""
      >

      <img
        class="photo-2"
        src="./assets/foto_pareja_6_2png.png"
        alt=""
      >
    `;

    block.insertAdjacentElement(
      'afterend',
      photos
    );

    following(photos);
    restyleMusicSection(doc);
    restyleFaqSection(doc);
    hardenFaqTitle(doc);
    insertFinalThanksSection(doc);

    removeDuplicate(doc);
    optimizeInvitationMedia(doc);

    return true;
  }

  function start(){

    [
      0,
      250,
      700,
      1400,
      2500,
      4000
    ].forEach(
      ms=>setTimeout(
        apply,
        ms
      )
    );
  }

  function optimizeInvitationMedia(doc){
    doc.querySelectorAll('img').forEach(img=>{
      if(!img.hasAttribute('loading'))img.loading='lazy';
      img.decoding='async';
      if(!img.hasAttribute('width')&&!img.style.aspectRatio){
        img.style.setProperty('height','auto');
      }
    });
    doc.querySelectorAll('video,audio').forEach(media=>{
      if(!media.hasAttribute('preload'))media.preload='metadata';
    });
  }

  window.addEventListener(
    'inv6-local-ready',
    start
  );

  outer.addEventListener(
    'load',
    ()=>{

      setTimeout(
        pauseInvitationMusic,
        50
      );

      setTimeout(
        pauseInvitationMusic,
        250
      );

      setTimeout(
        pauseInvitationMusic,
        700
      );

      setTimeout(
        pauseInvitationMusic,
        1500
      );

      setTimeout(
        start,
        300
      );
    }
  );
})();
