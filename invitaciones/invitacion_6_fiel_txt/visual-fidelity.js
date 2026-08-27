(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;
  const STYLE_ID='inv6-txt-audit-fidelity-style';

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

  function ensureStyle(doc){
    let style=doc.getElementById(STYLE_ID);
    if(!style){
      style=doc.createElement('style');
      style.id=STYLE_ID;
      doc.head.appendChild(style);
    }
    style.textContent=`
      @font-face{font-family:'Inv6 The Seasons';src:url('https://raw.githubusercontent.com/avaldiviezoch/Wedding/6b6fa65d2a36d583f3fa20889edf1ca2a5d137ca/invitaciones/invitacion_6/assets/The%20Seasons%20Regular.ttf') format('truetype');font-style:normal;font-weight:400;font-display:swap}
      @font-face{font-family:'Inv6 Eyesome';src:url('https://raw.githubusercontent.com/avaldiviezoch/Wedding/2a5c34fdb595a7900aa9272c10d227e703f9132b/invitaciones/invitacion_6/assets/Eyesome-Script.otf') format('opentype');font-style:normal;font-weight:400;font-display:swap}

      #sat-inv6-green-location-exact{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;overflow:hidden!important}
      #sat-inv6-green-location-exact .church-green-wrap{width:100%!important;max-width:680px!important;margin:0 auto!important;position:relative!important;overflow:hidden!important}
      #sat-inv6-green-location-exact .green-img{display:block!important;width:100%!important;height:auto!important;object-fit:contain!important}
      #sat-inv6-green-location-exact .church-overlay-content{padding:105px 32px 120px!important;transform:translateY(20px)!important}
      #sat-inv6-green-location-exact .church-kicker{font-family:'Cormorant Garamond',serif!important;font-size:13px!important;letter-spacing:5px!important;margin:0 0 16px!important}
      #sat-inv6-green-location-exact .church-title{font-family:'Great Vibes',cursive!important;font-size:clamp(52px,11vw,72px)!important;line-height:.9!important;margin:0 0 24px!important}
      #sat-inv6-green-location-exact .church-main-copy{font-family:'Cormorant Garamond',serif!important;font-size:clamp(18px,4.5vw,25px)!important;line-height:1.35!important;max-width:320px!important;margin:0 0 34px!important}
      #sat-inv6-green-location-exact .church-place-name{font-family:'Great Vibes',cursive!important;font-size:clamp(46px,10vw,64px)!important;margin:0 0 14px!important}
      #sat-inv6-green-location-exact .church-address{font-family:'Cormorant Garamond',serif!important;font-size:clamp(18px,4.6vw,24px)!important;margin:0 0 34px!important}
      #sat-inv6-green-location-exact .church-note{font-family:'Cormorant Garamond',serif!important;font-size:clamp(17px,4.2vw,22px)!important;line-height:1.45!important;max-width:330px!important;margin:0 0 28px!important}

      #sat-inv6-photo-collage{width:100%!important;max-width:680px!important;height:clamp(500px,104vw,710px)!important;margin:0 auto!important;overflow:hidden!important}
      #sat-inv6-photo-collage img{position:absolute!important;height:auto!important;object-fit:contain!important}
      #sat-inv6-photo-collage .photo-1{width:46%!important;left:5%!important;top:5%!important}
      #sat-inv6-photo-collage .photo-2{width:46%!important;right:4%!important;top:16%!important}

      .sat-inv6-next-section{margin-top:-58px!important}
      .sat-inv6-crew-title{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(17px,2.9vw,24px)!important;line-height:1.3!important;font-style:italic!important;font-weight:800!important;width:56%!important;max-width:360px!important;top:20.2%!important}
      .sat-inv6-crew-copy{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(14px,2.5vw,19px)!important;line-height:1.45!important;font-style:italic!important;font-weight:400!important;width:56%!important;max-width:360px!important;top:33.6%!important}
      #sat-inv6-crew-bottom-photo-section,#sat-inv6-dress-bottom-photo-section{width:100%!important;max-width:680px!important;margin-left:auto!important;margin-right:auto!important}
      #sat-inv6-crew-bottom-photo-section{margin-top:-70px!important}
      #sat-inv6-crew-bottom-photo-section img,#sat-inv6-dress-bottom-photo-section img{display:block!important;width:100%!important;height:auto!important;object-fit:contain!important}

      #dressCodeSection .inv5-dress-code{font-family:'Inv6 The Seasons',Georgia,serif!important;font-size:clamp(48px,10vw,82px)!important;line-height:1!important;font-weight:500!important}
      #dressCodeSection .inv5-dress-formal{font-family:'Inv6 Eyesome',cursive!important;font-size:34px!important;line-height:1!important;font-weight:400!important}
      #dressCodeSection .inv5-dress-subtitle{font-family:Georgia,'Times New Roman',serif!important;font-size:13px!important;line-height:1.32!important;font-weight:400!important}
      #dressCodeSection .inv5-dress-white{font-family:Georgia,'Times New Roman',serif!important;font-size:13px!important;line-height:1.38!important;font-weight:400!important}
      #sat-inv6-dress-gif img{width:clamp(150px,42vw,240px)!important;max-width:240px!important;height:auto!important;object-fit:contain!important}

      /* PROGRAMA: definición única y completa según el TXT */
      #sat-inv6-paper-bottom-section{width:100%!important;max-width:680px!important;margin:0 auto!important}
      #sat-inv6-paper-bottom-section .sat-inv6-paper-logo{width:30%!important;margin-right:9%!important;height:auto!important;object-fit:contain!important}
      #sat-inv6-paper-bottom-section .sat-inv6-program-text{position:relative!important;flex:1!important;text-align:left!important;color:#fff!important;transform:translateY(0)!important}
      #sat-inv6-paper-bottom-section .sat-inv6-program-title{margin:0!important;font-family:'Inv6 The Seasons',Georgia,serif!important;font-size:clamp(34px,8.5vw,62px)!important;line-height:.9!important;font-weight:500!important;letter-spacing:.01em!important;white-space:nowrap!important;color:#fff!important}
      #sat-inv6-paper-bottom-section .sat-inv6-program-script{margin:3px 0 0 14%!important;font-family:'Inv6 Eyesome',cursive!important;font-size:clamp(42px,10.5vw,78px)!important;line-height:.82!important;font-weight:400!important;letter-spacing:0!important;white-space:nowrap!important;color:#fff!important}

      #sat-inv6-program-timeline-section{width:100%!important;max-width:680px!important;padding:22px 24px 54px!important;margin:0 auto!important}
      #sat-inv6-program-timeline-section .sat-inv6-program-item{grid-template-columns:minmax(0,1fr) 32px minmax(0,1fr)!important;column-gap:12px!important;min-height:132px!important}
      #sat-inv6-program-timeline-section .sat-inv6-program-time{font-family:'Inv6 The Seasons',Georgia,serif!important;font-size:clamp(34px,6vw,52px)!important;line-height:.9!important;font-weight:400!important}
      #sat-inv6-program-timeline-section .sat-inv6-program-label{font-family:'Open Sans',Arial,sans-serif!important;font-size:clamp(14px,2.55vw,19px)!important;line-height:1.15!important;font-weight:400!important}
      #sat-inv6-program-timeline-section .sat-inv6-program-fiesta-gif,#sat-inv6-program-timeline-section .sat-inv6-program-brindis-gif,#sat-inv6-program-timeline-section .sat-inv6-program-comida-gif,#sat-inv6-program-timeline-section .sat-inv6-program-ceremonia-gif,#sat-inv6-program-timeline-section .sat-inv6-program-fin-gif{width:clamp(92px,24vw,150px)!important;max-width:150px!important;height:auto!important;object-fit:contain!important}

      /* RSVP: definición única y completa según el TXT */
      #sat-inv6-rsvp-heading-section{position:relative!important;width:100%!important;max-width:680px!important;margin:0 auto!important;padding:26px 24px 18px!important;box-sizing:border-box!important;text-align:center!important;background:transparent!important}
      #sat-inv6-rsvp-heading-section .sat-inv6-gaviota-regalo{width:105px!important;top:-70px!important;left:calc(50% + 74px)!important;height:auto!important}
      #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-kicker{margin:0 0 2px!important;font-family:'Inv6 The Seasons',Georgia,serif!important;font-size:clamp(48px,10vw,82px)!important;line-height:.9!important;font-weight:400!important;letter-spacing:.01em!important;color:#5D644F!important;text-transform:uppercase!important}
      #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-title{margin:0!important;font-family:'Inv6 Eyesome',cursive!important;font-size:clamp(34px,7vw,58px)!important;line-height:.9!important;font-weight:400!important;letter-spacing:0!important;color:#6D7559!important}
      #rsvpSection .rsvp-tap-hint{font-family:Georgia,'Times New Roman',serif!important;font-size:14px!important;line-height:1.45!important;font-style:italic!important}
      #rsvpSection .sat-inv6-rsvp-button{font-family:Georgia,'Times New Roman',serif!important;font-size:11px!important;padding:15px 28px!important}

      /* REGALO: una sola definición, sin dependencia de la fuente defectuosa del código antiguo */
      #sat-inv6-gift-paper-wrap{position:relative!important;width:100%!important;max-width:680px!important;margin:0 auto!important;padding:0!important;overflow:visible!important}
      #sat-inv6-gift-paper-bottom{display:block!important;width:100%!important;max-width:680px!important;height:auto!important;margin:0 auto!important;transform:translateY(-15%)!important;object-fit:contain!important}
      #sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-text{position:absolute!important;left:50%!important;top:24%!important;transform:translate(-50%,-50%)!important;width:88%!important;margin:0!important;padding:0!important;text-align:center!important;z-index:10!important}
      #sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-kicker{display:block!important;margin:0!important;font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(30px,6vw,44px)!important;line-height:1!important;font-weight:600!important;letter-spacing:.055em!important;text-transform:uppercase!important;color:#fff!important}
      #sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-script{display:block!important;margin:5px 0 0!important;font-family:'Inv6 Eyesome','Great Vibes',cursive!important;font-size:clamp(34px,7vw,52px)!important;line-height:.9!important;font-weight:400!important;color:#fff!important}
      #sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-copy{display:block!important;width:78%!important;max-width:390px!important;margin:15px auto 0!important;font-family:Georgia,'Times New Roman',serif!important;font-size:13px!important;line-height:1.36!important;font-weight:400!important;text-align:center!important;color:#fff!important}
      #sat-inv6-gift-paper-wrap .sat-inv6-gift-toggle-wrap{display:block!important;width:82%!important;max-width:420px!important;margin:18px auto 0!important;text-align:center!important}
      #sat-inv6-gift-paper-wrap .sat-inv6-gift-toggle{font-family:Georgia,'Times New Roman',serif!important;font-size:10px!important;padding:12px 23px!important;letter-spacing:1.25px!important}
      #sat-inv6-gift-paper-wrap .sat-inv6-gift-details{width:84%!important;max-width:350px!important}
      #sat-inv6-gift-paper-wrap .sat-inv6-gift-method-title{font-family:Georgia,'Times New Roman',serif!important;font-size:16px!important;font-weight:600!important}
      #sat-inv6-gift-paper-wrap .sat-inv6-gift-qr{width:98px!important;max-width:38%!important;height:auto!important;object-fit:contain!important}

      .sat-inv6-music-free-host{max-width:680px!important;padding:28px 16px 0!important;margin:0 auto!important}
      .sat-inv6-music-free-host .sat-inv6-music-free-title-main{font-family:'Inv6 The Seasons',Georgia,serif!important;font-size:clamp(50px,14vw,78px)!important;line-height:.9!important;font-weight:400!important}
      .sat-inv6-music-free-host .sat-inv6-music-free-title-script{font-family:'Inv6 Eyesome',cursive!important;font-size:clamp(30px,9vw,48px)!important;line-height:.9!important;font-weight:400!important}
      .sat-inv6-music-free-copy p{font-family:Georgia,'Times New Roman',serif!important;font-size:18px!important;line-height:1.24!important}
      .sat-inv6-music-stage-holder,.sat-inv6-music-hint-holder{width:min(84%,390px)!important}
      .sat-inv6-music-stage-holder img{width:100%!important;height:auto!important;object-fit:contain!important}
      .sat-inv6-music-free-host .music-request-panel{width:min(94%,500px)!important}

      .sat-inv6-faq-host{max-width:680px!important;margin:0 auto!important;padding:0 16px!important}
      .sat-inv6-faq-title-main{font-family:'Inv6 The Seasons',Georgia,serif!important;font-size:clamp(48px,10vw,82px)!important;line-height:.9!important;font-weight:400!important}
      .sat-inv6-faq-title-script{font-family:'Inv6 Eyesome',cursive!important;font-size:clamp(34px,7vw,58px)!important;line-height:.95!important;font-weight:400!important}
      .sat-inv6-faq-q,.sat-inv6-faq-note{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(16px,3.9vw,24px)!important;line-height:1.22!important}
      .sat-inv6-faq-a{font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(14px,3.2vw,18px)!important;line-height:1.55!important}

      #sat-inv6-final-thanks-section{max-width:680px!important;margin:0 auto!important;padding:0 16px 26px!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-fullbleed{width:calc(100% + 32px)!important;max-width:none!important;height:auto!important;margin:0 -16px!important;object-fit:cover!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-brook{width:86px!important;max-width:28%!important;height:auto!important;object-fit:contain!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-title{font-family:'Inv6 The Seasons',Georgia,serif!important;font-size:clamp(48px,10vw,82px)!important;line-height:1!important;font-weight:400!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-script{font-family:'Inv6 Eyesome',cursive!important;font-size:clamp(34px,7vw,58px)!important;line-height:1!important;font-weight:400!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-logo{width:78px!important;max-width:28%!important;height:auto!important;object-fit:contain!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-names{font-family:'Inv6 Eyesome',cursive!important;font-size:clamp(34px,10vw,62px)!important;line-height:1!important;font-weight:400!important}
      #sat-inv6-countdown-hat img{width:clamp(92px,22vw,138px)!important;max-width:138px!important;height:auto!important;object-fit:contain!important}

      @media(max-width:540px){
        #sat-inv6-photo-collage{height:106vw!important}
        #sat-inv6-photo-collage .photo-1{width:48%!important;left:5%!important;top:4%!important}
        #sat-inv6-photo-collage .photo-2{width:48%!important;right:4%!important;top:16.5%!important}
        .sat-inv6-next-section{margin-top:-42px!important}
        .sat-inv6-crew-title{top:17.8%!important;width:58%!important;max-width:230px!important;font-size:clamp(15px,4.6vw,19px)!important}
        .sat-inv6-crew-copy{top:26.4%!important;width:58%!important;max-width:255px!important;font-size:clamp(12px,3.4vw,15px)!important;line-height:1.4!important}
        #sat-inv6-dress-gif img{width:clamp(140px,46vw,210px)!important;max-width:210px!important}
        #sat-inv6-paper-bottom-section .sat-inv6-paper-logo{width:31%!important}
        #sat-inv6-paper-bottom-section .sat-inv6-program-title{font-size:clamp(32px,8.2vw,46px)!important}
        #sat-inv6-paper-bottom-section .sat-inv6-program-script{font-size:clamp(40px,10.2vw,58px)!important;margin-left:14%!important}
        #sat-inv6-program-timeline-section{padding:18px 18px 42px!important}
        #sat-inv6-program-timeline-section .sat-inv6-program-item{grid-template-columns:minmax(0,1fr) 24px minmax(0,1fr)!important;column-gap:9px!important;min-height:126px!important}
        #sat-inv6-program-timeline-section .sat-inv6-program-time{font-size:clamp(28px,7.7vw,38px)!important}
        #sat-inv6-program-timeline-section .sat-inv6-program-label{font-size:clamp(12px,3.35vw,15px)!important}
        #sat-inv6-program-timeline-section .sat-inv6-program-fiesta-gif,#sat-inv6-program-timeline-section .sat-inv6-program-brindis-gif,#sat-inv6-program-timeline-section .sat-inv6-program-comida-gif,#sat-inv6-program-timeline-section .sat-inv6-program-ceremonia-gif,#sat-inv6-program-timeline-section .sat-inv6-program-fin-gif{width:clamp(82px,26vw,125px)!important;max-width:125px!important}
        #sat-inv6-rsvp-heading-section{padding:20px 18px 14px!important}
        #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-kicker{font-size:46px!important}
        #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-title{font-size:36px!important}
        #sat-inv6-countdown-hat img{width:clamp(84px,24vw,118px)!important;max-width:118px!important}

        #sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-text{top:23.5%!important;width:88%!important}
        #sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-kicker{font-size:clamp(26px,7.4vw,34px)!important;letter-spacing:.05em!important}
        #sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-script{font-size:clamp(30px,8.6vw,40px)!important;margin-top:4px!important}
        #sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-copy{width:76%!important;max-width:320px!important;margin-top:13px!important;font-size:12px!important;line-height:1.34!important}
        #sat-inv6-gift-paper-wrap .sat-inv6-gift-toggle-wrap{margin-top:15px!important}

        .sat-inv6-music-free-host{padding:24px 12px 0!important}
        .sat-inv6-music-free-host .sat-inv6-music-free-title-main{font-size:clamp(50px,14.2vw,78px)!important}
        .sat-inv6-music-free-host .sat-inv6-music-free-title-script{font-size:clamp(30px,9.2vw,48px)!important}
        .sat-inv6-music-free-copy p{font-size:13px!important;line-height:1.28!important}
        .sat-inv6-music-stage-holder,.sat-inv6-music-hint-holder{width:min(86%,270px)!important}
        .sat-inv6-faq-host{padding:0 12px!important}
        .sat-inv6-faq-title-main{font-size:clamp(44px,13vw,62px)!important}
        .sat-inv6-faq-title-script{font-size:clamp(27px,8.5vw,40px)!important}
        .sat-inv6-faq-q,.sat-inv6-faq-note{font-size:clamp(13px,3.8vw,18px)!important}
        .sat-inv6-faq-a{font-size:13px!important}
        #sat-inv6-final-thanks-section{padding:0 12px 22px!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-fullbleed{width:calc(100% + 24px)!important;margin:0 -12px!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-brook{width:76px!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-title{font-size:clamp(28px,8.8vw,42px)!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-script{font-size:clamp(19px,6.2vw,30px)!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-logo{width:68px!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-names{font-size:clamp(30px,9.2vw,48px)!important}
      }

      @media(max-width:390px){
        .sat-inv6-next-section{margin-top:-36px!important}
        .sat-inv6-crew-title{top:17.2%!important;width:60%!important;max-width:220px!important;font-size:16px!important}
        .sat-inv6-crew-copy{top:26.1%!important;width:62%!important;max-width:240px!important;font-size:12px!important}
        #sat-inv6-paper-bottom-section .sat-inv6-paper-logo{width:32%!important}
        #sat-inv6-paper-bottom-section .sat-inv6-program-title{font-size:31px!important}
        #sat-inv6-paper-bottom-section .sat-inv6-program-script{font-size:40px!important}
        #sat-inv6-program-timeline-section .sat-inv6-program-item{min-height:122px!important}
        #sat-inv6-program-timeline-section .sat-inv6-program-time{font-size:29px!important}
        #sat-inv6-program-timeline-section .sat-inv6-program-label{font-size:12px!important}
        #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-kicker{font-size:43px!important}
        #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-title{font-size:34px!important}
        #sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-text{top:23%!important;width:90%!important}
        #sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-kicker{font-size:25px!important;letter-spacing:.045em!important}
        #sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-script{font-size:31px!important}
        #sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-copy{width:78%!important;font-size:11.5px!important;line-height:1.32!important;margin-top:12px!important}
        #sat-inv6-gift-paper-wrap .sat-inv6-gift-toggle-wrap{margin-top:14px!important}
        #sat-inv6-gift-paper-wrap .sat-inv6-gift-details{width:86%!important;max-width:320px!important}
        #sat-inv6-gift-paper-wrap .sat-inv6-gift-qr{width:92px!important}
        .sat-inv6-music-free-host .sat-inv6-music-free-title-main{font-size:46px!important}
        .sat-inv6-music-free-host .sat-inv6-music-free-title-script{font-size:28px!important}
        .sat-inv6-music-free-copy p{font-size:12px!important}
        .sat-inv6-music-stage-holder,.sat-inv6-music-hint-holder{width:min(88%,245px)!important}
      }
    `;
  }

  function fixInlineOverrides(doc){
    const w=doc.defaultView?.innerWidth||window.innerWidth||390;
    const set=(sel,prop,val)=>doc.querySelectorAll(sel).forEach(el=>el.style.setProperty(prop,val,'important'));

    set('#dressCodeSection .inv5-dress-code','font-family',"'Inv6 The Seasons', Georgia, serif");
    set('#dressCodeSection .inv5-dress-code','font-size','clamp(48px,10vw,82px)');
    set('#dressCodeSection .inv5-dress-formal','font-family',"'Inv6 Eyesome', cursive");
    set('#dressCodeSection .inv5-dress-formal','font-size','34px');

    /* Regalo: impedir que estilos inline/antiguos vuelvan a convertir el kicker en caligrafía */
    set('#sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-kicker','font-family',"Georgia, 'Times New Roman', serif");
    set('#sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-kicker','font-weight','600');
    set('#sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-script','font-family',"'Inv6 Eyesome', 'Great Vibes', cursive");
    if(w<=390){
      set('#sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-kicker','font-size','25px');
      set('#sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-script','font-size','31px');
    }else if(w<=540){
      set('#sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-kicker','font-size','clamp(26px,7.4vw,34px)');
      set('#sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-script','font-size','clamp(30px,8.6vw,40px)');
    }else{
      set('#sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-kicker','font-size','clamp(30px,6vw,44px)');
      set('#sat-inv6-gift-paper-wrap .sat-inv6-gift-paper-script','font-size','clamp(34px,7vw,52px)');
    }

    set('.sat-inv6-music-free-title-main','font-family',"'Inv6 The Seasons', Georgia, serif");
    set('.sat-inv6-music-free-title-script','font-family',"'Inv6 Eyesome', cursive");
    if(w<=390){
      set('.sat-inv6-music-free-title-main','font-size','46px');
      set('.sat-inv6-music-free-title-script','font-size','28px');
    }else if(w<=540){
      set('.sat-inv6-music-free-title-main','font-size','clamp(50px,14.2vw,78px)');
      set('.sat-inv6-music-free-title-script','font-size','clamp(30px,9.2vw,48px)');
    }else{
      set('.sat-inv6-music-free-title-main','font-size','clamp(50px,14vw,78px)');
      set('.sat-inv6-music-free-title-script','font-size','clamp(30px,9vw,48px)');
    }

    set('.sat-inv6-faq-title-main','font-family',"'Inv6 The Seasons', Georgia, serif");
    set('.sat-inv6-faq-title-script','font-family',"'Inv6 Eyesome', cursive");
    if(w<=540){
      set('.sat-inv6-faq-title-main','font-size','clamp(44px,13vw,62px)');
      set('.sat-inv6-faq-title-script','font-size','clamp(27px,8.5vw,40px)');
    }else{
      set('.sat-inv6-faq-title-main','font-size','clamp(48px,10vw,82px)');
      set('.sat-inv6-faq-title-script','font-size','clamp(34px,7vw,58px)');
    }

    set('.sat-inv6-crew-title','font-family',"Georgia, 'Times New Roman', serif");
    set('.sat-inv6-crew-title','font-weight','800');
    set('.sat-inv6-crew-title','font-style','italic');
    if(w<=390)set('.sat-inv6-crew-title','font-size','16px');
    else if(w<=540)set('.sat-inv6-crew-title','font-size','clamp(15px,4.6vw,19px)');
    else set('.sat-inv6-crew-title','font-size','clamp(17px,2.9vw,24px)');

    set('#sat-inv6-final-thanks-section .sat-inv6-final-title','font-family',"'Inv6 The Seasons', Georgia, serif");
    set('#sat-inv6-final-thanks-section .sat-inv6-final-title','font-size',w<=540?'clamp(28px,8.8vw,42px)':'clamp(48px,10vw,82px)');
  }

  function apply(){
    const doc=deepestDoc();
    if(!doc?.head)return false;
    ensureStyle(doc);
    fixInlineOverrides(doc);
    return true;
  }

  function schedule(){
    [0,120,300,700,1500,2800,4300,6000,8500].forEach(ms=>setTimeout(apply,ms));
  }

  outer.addEventListener('load',schedule);
  window.addEventListener('resize',()=>setTimeout(apply,50));
  schedule();
})();