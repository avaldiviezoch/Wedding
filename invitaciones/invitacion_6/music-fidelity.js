(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;
  const STYLE_ID='inv6-txt-music-fidelity-style';

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

  function applyMusicFidelity(){
    const doc=deepestDoc();
    if(!doc)return false;
    const host=doc.querySelector('.sat-inv6-music-free-host');
    if(!host)return false;

    let style=doc.getElementById(STYLE_ID);
    if(!style){
      style=doc.createElement('style');
      style.id=STYLE_ID;
      doc.head.appendChild(style);
    }

    style.textContent=`
      /* FIDELIDAD TXT — SOLO PEDIDOS MUSICALES */
      body .sat-inv6-music-free-host{
        width:100%!important;
        max-width:680px!important;
        margin:0 auto!important;
        padding:28px 16px 0!important;
        box-sizing:border-box!important;
        background:transparent!important;
        overflow:visible!important;
      }
      body .sat-inv6-music-free-card,
      body .sat-inv6-music-free-host .music-request-card,
      body .sat-inv6-music-free-host .final-card{
        background:transparent!important;
        border:0!important;
        box-shadow:none!important;
        padding:0!important;
        overflow:visible!important;
      }
      body .sat-inv6-music-free-title-wrap{
        width:100%!important;
        margin:0 auto 14px!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        text-align:center!important;
        overflow:visible!important;
      }
      body .sat-inv6-music-free-host .sat-inv6-music-free-title-main{
        display:block!important;
        width:auto!important;
        margin:0 auto!important;
        font-family:'Inv6 The Seasons','The Seasons Regular',Georgia,serif!important;
        font-size:clamp(48px,10vw,82px)!important;
        line-height:.92!important;
        font-weight:400!important;
        letter-spacing:.01em!important;
        text-transform:uppercase!important;
        color:#5D644F!important;
        white-space:nowrap!important;
        transform:none!important;
      }
      body .sat-inv6-music-free-host .sat-inv6-music-free-title-script{
        display:block!important;
        width:auto!important;
        max-width:none!important;
        margin:-6px auto 0!important;
        transform:translateX(22%)!important;
        font-family:'Inv6 Eyesome','Eyesome Script',cursive!important;
        font-size:clamp(34px,7vw,58px)!important;
        line-height:.92!important;
        font-weight:400!important;
        color:#6D7559!important;
        white-space:nowrap!important;
        text-align:center!important;
      }
      body .sat-inv6-music-free-diagonal{
        width:100%!important;
        max-width:640px!important;
        margin:0 auto!important;
        position:relative!important;
        overflow:visible!important;
      }
      body .sat-inv6-music-free-copy{
        width:min(50%,240px)!important;
        margin:0 0 -8px 8px!important;
        text-align:center!important;
        color:#5B4830!important;
        position:relative!important;
        z-index:2!important;
      }
      body .sat-inv6-music-free-copy p{
        margin:0!important;
        font-family:Georgia,'Times New Roman',serif!important;
        font-size:18px!important;
        line-height:1.24!important;
        font-weight:400!important;
        color:#5B4830!important;
      }
      body .sat-inv6-music-free-copy p + p{margin-top:24px!important;}
      body .sat-inv6-music-stage-holder{
        width:min(84%,390px)!important;
        margin:6px 0 0 auto!important;
        position:relative!important;
        z-index:1!important;
        background:transparent!important;
      }
      body .sat-inv6-music-stage-holder .music-image-stage{
        width:100%!important;
        max-width:none!important;
        margin:0!important;
        background:transparent!important;
        border:0!important;
        box-shadow:none!important;
      }
      body .sat-inv6-music-stage-holder .music-main-image,
      body .sat-inv6-music-stage-holder img{
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
      body .sat-inv6-music-hint-holder{
        width:min(84%,390px)!important;
        margin:0 0 0 auto!important;
        text-align:center!important;
      }
      body .sat-inv6-music-hint-holder .music-tap-hint{
        margin:0 0 4px!important;
        text-align:center!important;
        font-family:Georgia,'Times New Roman',serif!important;
        font-size:9px!important;
        line-height:1.35!important;
        letter-spacing:.12em!important;
        text-transform:uppercase!important;
        color:#7C816E!important;
      }
      body .sat-inv6-music-free-host .music-request-panel{
        width:min(94%,500px)!important;
        margin:10px auto 0!important;
        transform:none!important;
      }
      body .sat-inv6-music-free-host .music-form-paper{
        background:rgba(255,255,255,.10)!important;
        border:1px solid rgba(109,117,89,.16)!important;
        box-shadow:0 10px 24px rgba(83,78,61,.05)!important;
      }
      body .sat-inv6-music-free-host .music-success-msg,
      body .sat-inv6-music-free-host .music-warning{
        width:min(92%,500px)!important;
        margin:12px auto 0!important;
        text-align:center!important;
      }
      body .sat-inv6-music-free-band{display:none!important;}

      @media(max-width:540px){
        body .sat-inv6-music-free-host{padding:24px 12px 0!important;}
        body .sat-inv6-music-free-host .sat-inv6-music-free-title-main{font-size:clamp(50px,14.2vw,78px)!important;}
        body .sat-inv6-music-free-host .sat-inv6-music-free-title-script{
          margin:-4px auto 0!important;
          transform:translateX(18%)!important;
          font-size:clamp(30px,9.2vw,48px)!important;
        }
        body .sat-inv6-music-free-copy{width:min(54%,170px)!important;margin:0 0 -6px 2px!important;}
        body .sat-inv6-music-free-copy p{font-size:13px!important;line-height:1.28!important;}
        body .sat-inv6-music-free-copy p + p{margin-top:18px!important;}
        body .sat-inv6-music-stage-holder,
        body .sat-inv6-music-hint-holder{width:min(86%,270px)!important;}
      }
      @media(max-width:390px){
        body .sat-inv6-music-free-host .sat-inv6-music-free-title-main{font-size:46px!important;}
        body .sat-inv6-music-free-host .sat-inv6-music-free-title-script{
          font-size:28px!important;
          margin-top:-2px!important;
          transform:translateX(16%)!important;
        }
        body .sat-inv6-music-free-copy{width:min(56%,150px)!important;}
        body .sat-inv6-music-free-copy p{font-size:12px!important;}
        body .sat-inv6-music-stage-holder,
        body .sat-inv6-music-hint-holder{width:min(88%,245px)!important;}
      }
    `;

    const main=host.querySelector('.sat-inv6-music-free-title-main');
    const script=host.querySelector('.sat-inv6-music-free-title-script');
    if(main) main.removeAttribute('style');
    if(script) script.removeAttribute('style');
    return true;
  }

  function start(){
    [0,250,700,1400,2500,4000,6000].forEach(ms=>setTimeout(applyMusicFidelity,ms));
  }
  outer.addEventListener('load',start);
  start();
})();
