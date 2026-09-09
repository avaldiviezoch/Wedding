(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;
  const STYLE_ID='inv7-visible-refresh-20260831';

  function syncTypography(doc){
    const reference=doc.querySelector('#inv6TornPaperMessage .inv6-torn-paper-text');
    if(!reference)return false;
    const cs=doc.defaultView?.getComputedStyle(reference);
    if(!cs)return false;

    const normalTargets=[
      ...doc.querySelectorAll('.sat-inv6-crew-copy'),
      ...doc.querySelectorAll('.paper-section .inv6-between-lead')
    ];
    normalTargets.forEach(el=>{
      el.style.setProperty('font-family',cs.fontFamily,'important');
      el.style.setProperty('font-style',cs.fontStyle,'important');
      el.style.setProperty('font-weight',cs.fontWeight,'important');
      el.style.setProperty('font-stretch',cs.fontStretch,'important');
      if(cs.fontVariationSettings)el.style.setProperty('font-variation-settings',cs.fontVariationSettings,'important');
    });

    doc.querySelectorAll('.sat-inv6-crew-title').forEach(el=>{
      el.style.setProperty('font-family',cs.fontFamily,'important');
      el.style.setProperty('font-style',cs.fontStyle,'important');
      el.style.setProperty('font-weight','700','important');
      el.style.setProperty('font-stretch',cs.fontStretch,'important');
      if(cs.fontVariationSettings)el.style.setProperty('font-variation-settings',cs.fontVariationSettings,'important');
    });
    return true;
  }

  function apply(){
    try{
      const d1=outer.contentDocument||outer.contentWindow.document;
      const f1=d1?.getElementById('inviteFrame');
      const d2=f1?(f1.contentDocument||f1.contentWindow.document):null;
      const f2=d2?.getElementById('inv5');
      const doc=f2?(f2.contentDocument||f2.contentWindow.document):null;
      if(!doc?.head)return false;

      /* Eliminar la fuente que se inyectó por error: el texto de referencia debe usar exactamente su render original. */
      doc.getElementById('inv7-cormorant-italic-real')?.remove();

      let style=doc.getElementById(STYLE_ID);
      if(!style){
        style=doc.createElement('style');
        style.id=STYLE_ID;
        doc.head.appendChild(style);
      }

      style.textContent=`
        html body #sat-inv6-photo-collage .photo-1{left:0!important}
        html body #sat-inv6-photo-collage .photo-2{right:0!important}

        /* La referencia “Nada nos hará más felices…” NO se modifica. */
        html body .sat-inv6-crew-copy,
        html body .paper-section .inv6-between-lead{font-weight:400!important}
        html body .sat-inv6-crew-title{top:16.2%!important;font-weight:700!important}

        html body #sat-inv6-paper-bottom-section{
          position:relative!important;
          z-index:2!important;
          margin-bottom:-90px!important;
          background:transparent!important;
        }
        html body #sat-inv6-paper-bottom-section .sat-inv6-paper-bg{
          -webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 72%,rgba(0,0,0,.96) 78%,rgba(0,0,0,.72) 86%,rgba(0,0,0,.28) 94%,transparent 100%)!important;
          mask-image:linear-gradient(to bottom,#000 0%,#000 72%,rgba(0,0,0,.96) 78%,rgba(0,0,0,.72) 86%,rgba(0,0,0,.28) 94%,transparent 100%)!important;
        }
        html body #sat-inv6-program-timeline-section{
          position:relative!important;
          z-index:1!important;
          padding-top:112px!important;
          background-image:url('./assets/IMG_1047.jpeg')!important;
          background-size:100% 100%!important;
          background-position:center top!important;
          background-repeat:no-repeat!important;
        }
        html body #sat-inv6-rsvp-heading-section::before{
          content:''!important;
          position:absolute!important;
          left:0!important;
          right:0!important;
          top:-90px!important;
          height:90px!important;
          background-image:url('./assets/IMG_1047.jpeg')!important;
          background-size:100% auto!important;
          background-position:center bottom!important;
          background-repeat:no-repeat!important;
          pointer-events:none!important;
          z-index:0!important;
        }
        html body #sat-inv6-rsvp-heading-section{padding-top:78px!important}
        html body #sat-inv6-rsvp-heading-section .sat-inv6-gaviota-regalo{top:-18px!important}
        html body #sat-inv6-rsvp-heading-section>*{position:relative!important;z-index:1!important}
      `;

      const programHeaderBg=doc.querySelector('#sat-inv6-paper-bottom-section .sat-inv6-paper-bg');
      if(programHeaderBg)programHeaderBg.src='./assets/fondo_verde_de_programacion.png';

      const dressSubtitle=doc.querySelector('.inv5-dress-subtitle');
      const dressWhite=doc.querySelector('.inv5-dress-white');
      if(dressSubtitle) dressSubtitle.innerHTML='Queremos que cada uno de ustedes<br>se sienta especial y luzca espectacular en<br>nuestro día. ¡Aquí todos brillamos!';
      if(dressWhite) dressWhite.innerHTML='<span style="white-space:nowrap">Amaremos que vistan en colores de</span><br><span style="white-space:nowrap">nuestra paleta de boda, es decir tropicales y</span><br><span style="white-space:nowrap">pasteles acorde a la estación ☀️🌴 Recuerda</span><br><span style="white-space:nowrap">que tu mejor accesorio es tu actitud y una</span><br><span style="white-space:nowrap">gran sonrisa.</span>';

      const fiesta=doc.querySelector('.sat-inv6-program-fiesta-gif');
      const comida=doc.querySelector('.sat-inv6-program-comida-gif');
      const brindis=doc.querySelector('.sat-inv6-program-brindis-gif');
      const ceremonia=doc.querySelector('.sat-inv6-program-ceremonia-gif');
      const fin=doc.querySelector('.sat-inv6-program-fin-gif');
      if(fiesta)fiesta.src='./assets/fiesta_6.png';
      if(comida)comida.src='./assets/comida_6.png';
      if(brindis)brindis.src='./assets/brindis_6.png';
      if(ceremonia)ceremonia.src='./assets/itinerario_entrada_6_3.png';
      if(fin)fin.src='./assets/itinerario_despedida_6_3.png';

      syncTypography(doc);
      requestAnimationFrame(()=>syncTypography(doc));
      return true;
    }catch(e){return false;}
  }

  function run(){
    [0,120,300,650,1100,1800,3000,5000,8000,12000].forEach(ms=>setTimeout(apply,ms));
  }

  outer.addEventListener('load',run);
  run();
})();
