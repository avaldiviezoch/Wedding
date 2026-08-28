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
    if(!style){style=doc.createElement('style');style.id=STYLE_ID;doc.head.appendChild(style);}
    style.textContent=`
      @font-face{font-family:'Inv6SeasonsReal';src:url('https://raw.githubusercontent.com/avaldiviezoch/Wedding/6b6fa65d2a36d583f3fa20889edf1ca2a5d137ca/invitaciones/invitacion_6/assets/The%20Seasons%20Regular.ttf') format('truetype');font-style:normal;font-weight:400;font-display:swap}
      @font-face{font-family:'Inv6EyesomeReal';src:url('https://raw.githubusercontent.com/avaldiviezoch/Wedding/2a5c34fdb595a7900aa9272c10d227e703f9132b/invitaciones/invitacion_6/assets/Eyesome-Script.otf') format('opentype');font-style:normal;font-weight:400;font-display:swap}

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

      #dressCodeSection .inv5-dress-code{font-family:'Inv6SeasonsReal',Georgia,serif!important;font-size:clamp(48px,10vw,82px)!important;line-height:1!important;font-weight:500!important}
      #dressCodeSection .inv5-dress-formal{font-family:'Inv6EyesomeReal',cursive!important;font-size:34px!important;line-height:1!important;font-weight:400!important}
      #dressCodeSection .inv5-dress-subtitle,#dressCodeSection .inv5-dress-white{font-family:Georgia,'Times New Roman',serif!important;font-size:13px!important;line-height:1.35!important;font-weight:400!important}
      #sat-inv6-dress-gif img{width:clamp(150px,42vw,240px)!important;max-width:240px!important;height:auto!important;object-fit:contain!important}

      #sat-inv6-paper-bottom-section{width:100%!important;max-width:680px!important;margin:0 auto!important}
      #sat-inv6-paper-bottom-section .sat-inv6-paper-logo{width:30%!important;margin-right:9%!important;height:auto!important;object-fit:contain!important}
      #sat-inv6-paper-bottom-section .sat-inv6-program-text{position:relative!important;flex:1!important;text-align:left!important;color:#fff!important;transform:translateY(0)!important}
      #sat-inv6-paper-bottom-section .sat-inv6-program-title{margin:0!important;font-family:'Inv6SeasonsReal',Georgia,serif!important;font-size:clamp(34px,8.5vw,62px)!important;line-height:.9!important;font-weight:500!important;letter-spacing:.01em!important;white-space:nowrap!important;color:#fff!important}
      #sat-inv6-paper-bottom-section .sat-inv6-program-script{margin:3px 0 0 14%!important;font-family:'Inv6EyesomeReal',cursive!important;font-size:clamp(42px,10.5vw,78px)!important;line-height:.82!important;font-weight:400!important;letter-spacing:0!important;white-space:nowrap!important;color:#fff!important}
      #sat-inv6-program-timeline-section{width:100%!important;max-width:680px!important;padding:22px 24px 54px!important;margin:0 auto!important}
      #sat-inv6-program-timeline-section .sat-inv6-program-item{grid-template-columns:minmax(0,1fr) 32px minmax(0,1fr)!important;column-gap:12px!important;min-height:132px!important}
      #sat-inv6-program-timeline-section .sat-inv6-program-time{font-family:'Inv6SeasonsReal',Georgia,serif!important;font-size:clamp(34px,6vw,52px)!important;line-height:.9!important;font-weight:400!important}
      #sat-inv6-program-timeline-section .sat-inv6-program-label{font-family:'Open Sans',Arial,sans-serif!important;font-size:clamp(14px,2.55vw,19px)!important;line-height:1.15!important;font-weight:400!important}
      #sat-inv6-program-timeline-section .sat-inv6-program-fiesta-gif,#sat-inv6-program-timeline-section .sat-inv6-program-brindis-gif,#sat-inv6-program-timeline-section .sat-inv6-program-comida-gif,#sat-inv6-program-timeline-section .sat-inv6-program-ceremonia-gif,#sat-inv6-program-timeline-section .sat-inv6-program-fin-gif{width:clamp(92px,24vw,150px)!important;max-width:150px!important;height:auto!important;object-fit:contain!important}

      #sat-inv6-rsvp-heading-section{position:relative!important;width:100%!important;max-width:680px!important;margin:0 auto!important;padding:26px 24px 18px!important;box-sizing:border-box!important;text-align:center!important;background:transparent!important}
      #sat-inv6-rsvp-heading-section .sat-inv6-gaviota-regalo{width:105px!important;top:-70px!important;left:calc(50% + 74px)!important;height:auto!important}
      #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-kicker{margin:0 0 2px!important;font-family:'Inv6SeasonsReal',Georgia,serif!important;font-size:clamp(48px,10vw,82px)!important;line-height:.9!important;font-weight:400!important;letter-spacing:.01em!important;color:#5D644F!important;text-transform:uppercase!important}
      #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-title{margin:0!important;font-family:'Inv6EyesomeReal',cursive!important;font-size:clamp(34px,7vw,58px)!important;line-height:.9!important;font-weight:400!important;letter-spacing:0!important;color:#6D7559!important}
      #rsvpSection .rsvp-tap-hint{font-family:Georgia,'Times New Roman',serif!important;font-size:14px!important;line-height:1.45!important;font-style:italic!important}
      #rsvpSection .sat-inv6-rsvp-button{font-family:Georgia,'Times New Roman',serif!important;font-size:11px!important;padding:15px 28px!important}

      /* REGALO — métricas completas del TXT */

      .sat-inv6-music-free-host{max-width:680px!important;padding:28px 16px 0!important;margin:0 auto!important}
      .sat-inv6-music-free-host .sat-inv6-music-free-title-main{font-family:'Inv6SeasonsReal',Georgia,serif!important;font-size:clamp(50px,14vw,78px)!important;line-height:.9!important;font-weight:400!important}
      .sat-inv6-music-free-host .sat-inv6-music-free-title-script{font-family:'Inv6EyesomeReal',cursive!important;font-size:clamp(30px,9vw,48px)!important;line-height:.9!important;font-weight:400!important}
      .sat-inv6-music-free-copy p{font-family:Georgia,'Times New Roman',serif!important;font-size:18px!important;line-height:1.24!important}
      .sat-inv6-music-stage-holder,.sat-inv6-music-hint-holder{width:min(84%,390px)!important}
      .sat-inv6-music-stage-holder img{width:100%!important;height:auto!important;object-fit:contain!important}
      .sat-inv6-music-free-host .music-request-panel{width:min(94%,500px)!important}

      .sat-inv6-faq-host{width:100%!important;max-width:680px!important;margin:0 auto!important;padding:0 16px!important;box-sizing:border-box!important;background:transparent!important}
      .sat-inv6-faq-title-wrap{width:100%!important;margin:0 auto 22px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important}
      .sat-inv6-faq-title-main{display:block!important;width:auto!important;max-width:100%!important;margin:0 auto!important;padding:0!important;font-family:'Inv6SeasonsReal',Georgia,serif!important;font-size:clamp(48px,10vw,82px)!important;line-height:.9!important;font-weight:400!important;font-style:normal!important;letter-spacing:.01em!important;text-transform:uppercase!important;color:#5D644F!important;white-space:nowrap!important;transform:none!important}
      .sat-inv6-faq-title-script{display:block!important;width:auto!important;max-width:100%!important;margin:-5px auto 0!important;padding:0!important;transform:translateX(8%)!important;font-family:'Inv6EyesomeReal',cursive!important;font-size:clamp(34px,7vw,58px)!important;line-height:.95!important;font-weight:400!important;font-style:normal!important;color:#6D7559!important;white-space:nowrap!important;text-align:center!important}
      .sat-inv6-faq-list{width:min(100%,560px)!important;margin:0 auto 24px!important;border-top:1px solid rgba(138,129,109,.55)!important}
      .sat-inv6-faq-item{border-bottom:1px solid rgba(138,129,109,.55)!important}
      .sat-inv6-faq-q,.sat-inv6-faq-note{display:block!important;width:100%!important;margin:0!important;padding:18px 6px!important;box-sizing:border-box!important;font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(16px,3.9vw,24px)!important;line-height:1.22!important;color:#5B4830!important;text-align:left!important;background:transparent!important;border:0!important}
      .sat-inv6-faq-q{position:relative!important;padding-right:28px!important;cursor:pointer!important}
      .sat-inv6-faq-q::after{content:'+'!important;position:absolute!important;right:4px!important;top:50%!important;transform:translateY(-50%)!important;font-size:20px!important;line-height:1!important;color:#7A806A!important}
      .sat-inv6-faq-item.is-open .sat-inv6-faq-q::after{content:'–'!important}
      .sat-inv6-faq-a{display:none!important;padding:0 6px 18px!important;font-family:Georgia,'Times New Roman',serif!important;font-size:clamp(14px,3.2vw,18px)!important;line-height:1.55!important;color:#6B6E5D!important;text-align:left!important}
      .sat-inv6-faq-item.is-open .sat-inv6-faq-a{display:block!important}
      .sat-inv6-faq-note{cursor:default!important}

      /* CIERRE FINAL / GRACIAS — métricas completas del TXT */
      #sat-inv6-final-thanks-section{position:relative!important;width:100%!important;max-width:680px!important;margin:0 auto!important;padding:0 16px 26px!important;box-sizing:border-box!important;background:transparent!important;overflow:hidden!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-fullbleed{display:block!important;width:calc(100% + 32px)!important;max-width:none!important;height:auto!important;margin:0 -16px!important;padding:0!important;border:0!important;object-fit:cover!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-center{display:block!important;width:100%!important;margin:0 auto!important;padding:20px 12px 20px!important;box-sizing:border-box!important;text-align:center!important;background:transparent!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-brook{display:block!important;width:86px!important;max-width:28%!important;height:auto!important;margin:0 auto 10px!important;padding:0!important;object-fit:contain!important;background:transparent!important;border:0!important;box-shadow:none!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-title{display:block!important;width:100%!important;margin:0 auto!important;font-family:'Inv6SeasonsReal',Georgia,serif!important;font-size:clamp(48px,10vw,82px)!important;line-height:1!important;font-weight:400!important;color:#5D644F!important;text-transform:uppercase!important;letter-spacing:.01em!important;text-align:center!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-script{display:block!important;width:100%!important;margin:2px auto 16px!important;font-family:'Inv6EyesomeReal',cursive!important;font-size:clamp(34px,7vw,58px)!important;line-height:1!important;font-weight:400!important;color:#6D7559!important;text-align:center!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-logo{display:block!important;width:78px!important;max-width:28%!important;height:auto!important;margin:0 auto 14px!important;object-fit:contain!important;opacity:1!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;filter:drop-shadow(0 0 3px rgba(91,72,48,.32)) drop-shadow(0 0 8px rgba(255,253,248,.72))!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-names{display:block!important;width:100%!important;margin:0 auto 18px!important;font-family:'Inv6EyesomeReal',cursive!important;font-size:clamp(34px,10vw,62px)!important;line-height:1!important;font-weight:400!important;color:#6D7559!important;white-space:nowrap!important;text-align:center!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-credits{display:block!important;width:min(100%,260px)!important;margin:0 auto!important;padding:10px 12px!important;box-sizing:border-box!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;text-align:center!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-credits-kicker{display:block!important;width:100%!important;margin:0 0 6px!important;font-family:Georgia,'Times New Roman',serif!important;font-size:9px!important;line-height:1.2!important;font-weight:700!important;letter-spacing:.18em!important;text-transform:uppercase!important;color:#A08F7E!important;text-align:center!important}
      #sat-inv6-final-thanks-section .sat-inv6-final-credits-line{display:block!important;width:100%!important;margin:0!important;font-family:Georgia,'Times New Roman',serif!important;font-size:10px!important;line-height:1.5!important;color:#6B6A63!important;text-align:center!important}

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
        #sat-inv6-rsvp-heading-section{padding:20px 18px 14px!important}
        #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-kicker{font-size:46px!important}
        #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-title{font-size:36px!important}
        .sat-inv6-music-free-host{padding:24px 12px 0!important}
        .sat-inv6-music-free-host .sat-inv6-music-free-title-main{font-size:clamp(50px,14.2vw,78px)!important}
        .sat-inv6-music-free-host .sat-inv6-music-free-title-script{font-size:clamp(30px,9.2vw,48px)!important}
        .sat-inv6-music-free-copy p{font-size:13px!important;line-height:1.28!important}
        .sat-inv6-music-stage-holder,.sat-inv6-music-hint-holder{width:min(86%,270px)!important}
        .sat-inv6-faq-host{padding:0 12px!important}
        .sat-inv6-faq-title-main{font-size:clamp(44px,13vw,62px)!important}
        .sat-inv6-faq-title-script{margin-top:-5px!important;font-size:clamp(27px,8.5vw,40px)!important;transform:translateX(8%)!important}
        .sat-inv6-faq-q,.sat-inv6-faq-note{font-size:clamp(13px,3.8vw,18px)!important;padding:16px 4px!important;padding-right:24px!important}
        .sat-inv6-faq-a{font-size:13px!important;padding:0 4px 16px!important}

        #sat-inv6-final-thanks-section{padding:0 12px 22px!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-fullbleed{width:calc(100% + 24px)!important;margin:0 -12px!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-center{padding:18px 8px 18px!important;text-align:center!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-brook{width:76px!important;margin:0 auto 8px!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-title{font-size:clamp(28px,8.8vw,42px)!important;margin:0 auto!important;text-align:center!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-script{margin:2px auto 14px!important;font-size:clamp(19px,6.2vw,30px)!important;text-align:center!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-logo{width:68px!important;margin:0 auto 12px!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-names{font-size:clamp(30px,9.2vw,48px)!important;margin:0 auto 16px!important;text-align:center!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-credits{width:min(100%,240px)!important;margin:0 auto!important;padding:9px 10px!important;text-align:center!important}
        #sat-inv6-final-thanks-section .sat-inv6-final-credits-line{font-size:9px!important;text-align:center!important}
      }

      @media(max-width:390px){
        #sat-inv6-paper-bottom-section .sat-inv6-program-title{font-size:31px!important}
        #sat-inv6-paper-bottom-section .sat-inv6-program-script{font-size:40px!important}
        #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-kicker{font-size:43px!important}
        #sat-inv6-rsvp-heading-section .sat-inv6-rsvp-title{font-size:34px!important}
        .sat-inv6-music-free-host .sat-inv6-music-free-title-main{font-size:46px!important}
        .sat-inv6-music-free-host .sat-inv6-music-free-title-script{font-size:28px!important}
      }
    `;
  }

  function fixInlineOverrides(doc){
    const w=doc.defaultView?.innerWidth||window.innerWidth||390;
    const set=(sel,prop,val)=>doc.querySelectorAll(sel).forEach(el=>el.style.setProperty(prop,val,'important'));
    const seasons="'Inv6SeasonsReal', Georgia, serif";
    const eyesome="'Inv6EyesomeReal', cursive";

    set('#dressCodeSection .inv5-dress-code','font-family',seasons);
    set('#dressCodeSection .inv5-dress-formal','font-family',eyesome);
    set('#sat-inv6-paper-bottom-section .sat-inv6-program-title','font-family',seasons);
    set('#sat-inv6-paper-bottom-section .sat-inv6-program-script','font-family',eyesome);
    set('#sat-inv6-paper-bottom-section .sat-inv6-program-script','margin-left','14%');
    set('#sat-inv6-rsvp-heading-section .sat-inv6-rsvp-kicker','font-family',seasons);
    set('#sat-inv6-rsvp-heading-section .sat-inv6-rsvp-title','font-family',eyesome);
    set('.sat-inv6-faq-title-main','font-family',seasons);
    set('.sat-inv6-faq-title-script','font-family',eyesome);
    set('.sat-inv6-faq-title-script','transform','translateX(8%)');
    set('.sat-inv6-faq-title-script','margin-top','-5px');

    if(w<=390){
      set('#sat-inv6-paper-bottom-section .sat-inv6-program-title','font-size','31px');
      set('#sat-inv6-paper-bottom-section .sat-inv6-program-script','font-size','40px');
      set('#sat-inv6-rsvp-heading-section .sat-inv6-rsvp-kicker','font-size','43px');
      set('#sat-inv6-rsvp-heading-section .sat-inv6-rsvp-title','font-size','34px');
      set('.sat-inv6-faq-title-main','font-size','clamp(44px,13vw,62px)');
      set('.sat-inv6-faq-title-script','font-size','clamp(27px,8.5vw,40px)');
    }else if(w<=540){
      set('#sat-inv6-paper-bottom-section .sat-inv6-program-title','font-size','clamp(32px,8.2vw,46px)');
      set('#sat-inv6-paper-bottom-section .sat-inv6-program-script','font-size','clamp(40px,10.2vw,58px)');
      set('#sat-inv6-rsvp-heading-section .sat-inv6-rsvp-kicker','font-size','46px');
      set('#sat-inv6-rsvp-heading-section .sat-inv6-rsvp-title','font-size','36px');
      set('.sat-inv6-faq-title-main','font-size','clamp(44px,13vw,62px)');
      set('.sat-inv6-faq-title-script','font-size','clamp(27px,8.5vw,40px)');
    }else{
      set('#sat-inv6-paper-bottom-section .sat-inv6-program-title','font-size','clamp(34px,8.5vw,62px)');
      set('#sat-inv6-paper-bottom-section .sat-inv6-program-script','font-size','clamp(42px,10.5vw,78px)');
      set('#sat-inv6-rsvp-heading-section .sat-inv6-rsvp-kicker','font-size','clamp(48px,10vw,82px)');
      set('#sat-inv6-rsvp-heading-section .sat-inv6-rsvp-title','font-size','clamp(34px,7vw,58px)');
      set('.sat-inv6-faq-title-main','font-size','clamp(48px,10vw,82px)');
      set('.sat-inv6-faq-title-script','font-size','clamp(34px,7vw,58px)');
    }

    set('.sat-inv6-music-free-title-main','font-family',seasons);
    set('.sat-inv6-music-free-title-script','font-family',eyesome);

    set('#sat-inv6-final-thanks-section .sat-inv6-final-center','width','100%');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-center','margin','0 auto');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-center','text-align','center');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-brook','display','block');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-brook','margin',w<=540?'0 auto 8px':'0 auto 10px');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-title','font-family',seasons);
    set('#sat-inv6-final-thanks-section .sat-inv6-final-title','width','100%');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-title','margin','0 auto');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-title','text-align','center');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-title','font-size',w<=540?'clamp(28px,8.8vw,42px)':'clamp(48px,10vw,82px)');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-script','font-family',eyesome);
    set('#sat-inv6-final-thanks-section .sat-inv6-final-script','width','100%');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-script','margin',w<=540?'2px auto 14px':'2px auto 16px');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-script','text-align','center');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-script','font-size',w<=540?'clamp(19px,6.2vw,30px)':'clamp(34px,7vw,58px)');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-logo','display','block');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-logo','margin',w<=540?'0 auto 12px':'0 auto 14px');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-names','font-family',eyesome);
    set('#sat-inv6-final-thanks-section .sat-inv6-final-names','width','100%');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-names','margin',w<=540?'0 auto 16px':'0 auto 18px');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-names','text-align','center');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-names','font-size',w<=540?'clamp(30px,9.2vw,48px)':'clamp(34px,10vw,62px)');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-credits','width',w<=540?'min(100%,240px)':'min(100%,260px)');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-credits','margin','0 auto');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-credits','text-align','center');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-credits-kicker','text-align','center');
    set('#sat-inv6-final-thanks-section .sat-inv6-final-credits-line','text-align','center');
    if(w<=540)set('#sat-inv6-final-thanks-section .sat-inv6-final-credits-line','font-size','9px');
  }

  function apply(){const doc=deepestDoc();if(!doc?.head)return false;ensureStyle(doc);fixInlineOverrides(doc);return true;}
  function schedule(){[0,120,300,700,1500,2800,4300,6000,8500,11000].forEach(ms=>setTimeout(apply,ms));}
  outer.addEventListener('load',schedule);
  window.addEventListener('resize',()=>setTimeout(apply,50));
  schedule();
})();

// Corrige el día de la semana mostrado en la tarjeta de fecha.
(() => {
  const patchWeddingDay = () => {
    const firstDoc = document.querySelector('#invite')?.contentDocument;
    const secondDoc = firstDoc?.querySelector('#inviteFrame')?.contentDocument;
    const invitationDoc = secondDoc?.querySelector('#inv5')?.contentDocument;
    if (!invitationDoc?.body) return false;

    const walker = invitationDoc.createTreeWalker(invitationDoc.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue?.trim() === 'Viernes') {
        node.nodeValue = node.nodeValue.replace('Viernes', 'Sábado');
      }
    }
    return true;
  };

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (patchWeddingDay() || attempts >= 100) clearInterval(timer);
  }, 250);
  window.addEventListener('load', patchWeddingDay, { once: true });
})();


// Mantiene la corrección activa hasta que el contenido de la fecha esté renderizado.
(() => {
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    let changed = false;
    try {
      const firstDoc = document.querySelector('#invite')?.contentDocument;
      const secondDoc = firstDoc?.querySelector('#inviteFrame')?.contentDocument;
      const invitationDoc = secondDoc?.querySelector('#inv5')?.contentDocument;
      const walker = invitationDoc?.body
        ? invitationDoc.createTreeWalker(invitationDoc.body, NodeFilter.SHOW_TEXT)
        : null;
      let node;
      while (walker && (node = walker.nextNode())) {
        if (node.nodeValue?.trim() === 'Viernes') {
          node.nodeValue = node.nodeValue.replace('Viernes', 'Sábado');
          changed = true;
        }
      }
    } catch (_) {}
    if (changed || attempts >= 160) clearInterval(timer);
  }, 250);
})();
