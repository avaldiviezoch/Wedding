(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;

  const STYLE_ID='inv6-timeline-type-fidelity-style';

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

  function apply(){
    const doc=deepestDoc();
    if(!doc)return false;

    doc.getElementById(STYLE_ID)?.remove();
    const style=doc.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      /* Cabecera PROGRAMA — solo tipografía y tamaño, según TXT maduro */
      #sat-inv6-paper-bottom-section .sat-inv6-program-title{
        font-family:'Inv6SeasonsReal',Georgia,'Times New Roman',serif!important;
        font-size:clamp(34px,8.5vw,62px)!important;
        font-style:normal!important;
        font-weight:500!important;
      }
      #sat-inv6-paper-bottom-section .sat-inv6-program-script{
        font-family:'Inv6EyesomeReal','Great Vibes',cursive!important;
        font-size:clamp(42px,10.5vw,78px)!important;
        font-style:normal!important;
        font-weight:400!important;
      }

      /* Timeline — horas y etiquetas, según TXT maduro */
      #sat-inv6-program-timeline-section .sat-inv6-program-time{
        font-family:'Inv6SeasonsReal',Georgia,'Times New Roman',serif!important;
        font-size:clamp(34px,6vw,52px)!important;
        font-style:normal!important;
        font-weight:400!important;
      }
      #sat-inv6-program-timeline-section .sat-inv6-program-label{
        font-family:'Open Sans',Arial,sans-serif!important;
        font-size:clamp(14px,2.55vw,19px)!important;
        font-style:normal!important;
        font-weight:400!important;
      }

      @media(max-width:540px){
        #sat-inv6-paper-bottom-section .sat-inv6-program-title{
          font-size:clamp(32px,8.5vw,46px)!important;
        }
        #sat-inv6-paper-bottom-section .sat-inv6-program-script{
          font-size:clamp(40px,10.5vw,58px)!important;
        }
        #sat-inv6-program-timeline-section .sat-inv6-program-time{
          font-size:clamp(28px,7vw,38px)!important;
        }
        #sat-inv6-program-timeline-section .sat-inv6-program-label{
          font-size:clamp(12px,3.2vw,15px)!important;
        }
      }

      @media(max-width:390px){
        #sat-inv6-paper-bottom-section .sat-inv6-program-title{
          font-size:31px!important;
        }
        #sat-inv6-paper-bottom-section .sat-inv6-program-script{
          font-size:40px!important;
        }
        #sat-inv6-program-timeline-section .sat-inv6-program-time{
          font-size:29px!important;
        }
        #sat-inv6-program-timeline-section .sat-inv6-program-label{
          font-size:12px!important;
        }
      }
    `;
    doc.head.appendChild(style);
    return true;
  }

  [0,250,700,1400,2500,4000,6000].forEach(ms=>setTimeout(apply,ms));
  outer.addEventListener('load',()=>{
    [0,250,700,1400,2500,4000,6000].forEach(ms=>setTimeout(apply,ms));
  });
})();
