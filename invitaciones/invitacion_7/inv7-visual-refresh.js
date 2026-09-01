(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;
  const STYLE_ID='inv7-visible-refresh-20260831';

  function apply(){
    try{
      const d1=outer.contentDocument||outer.contentWindow.document;
      const f1=d1?.getElementById('inviteFrame');
      const d2=f1?(f1.contentDocument||f1.contentWindow.document):null;
      const f2=d2?.getElementById('inv5');
      const doc=f2?(f2.contentDocument||f2.contentWindow.document):null;
      if(!doc?.head)return false;

      let style=doc.getElementById(STYLE_ID);
      if(!style){
        style=doc.createElement('style');
        style.id=STYLE_ID;
        doc.head.appendChild(style);
      }

      style.textContent=`
        html body #sat-inv6-photo-collage .photo-1{
          left:0!important;
        }
        html body #sat-inv6-photo-collage .photo-2{
          right:0!important;
        }
        html body .sat-inv6-crew-title{
          top:16.2%!important;
        }
        html body #sat-inv6-program-timeline-section{
          background-image:url('./assets/IMG_1047.jpeg')!important;
          background-size:100% 100%!important;
          background-position:center top!important;
          background-repeat:no-repeat!important;
          padding-bottom:110px!important;
        }
        html body #sat-inv6-program-timeline-section .sat-inv6-program-line-wrap{
          bottom:100px!important;
        }
      `;

      const dressSubtitle=doc.querySelector('.inv5-dress-subtitle');
      const dressWhite=doc.querySelector('.inv5-dress-white');

      if(dressSubtitle){
        dressSubtitle.innerHTML='Queremos que cada uno de ustedes<br>se sienta especial y luzca espectacular en<br>nuestro día. ¡Aquí todos brillamos!';
      }

      if(dressWhite){
        dressWhite.innerHTML='<span style="white-space:nowrap">Amaremos que vistan en colores de</span><br><span style="white-space:nowrap">nuestra paleta de boda, es decir tropicales y</span><br><span style="white-space:nowrap">pasteles acorde a la estación ☀️🌴 Recuerda</span><br><span style="white-space:nowrap">que tu mejor accesorio es tu actitud y una</span><br><span style="white-space:nowrap">gran sonrisa.</span>';
      }

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

      return true;
    }catch(e){return false;}
  }

  function run(){
    [0,120,300,650,1100,1800,3000,5000,8000].forEach(ms=>setTimeout(apply,ms));
  }

  outer.addEventListener('load',run);
  run();
})();
