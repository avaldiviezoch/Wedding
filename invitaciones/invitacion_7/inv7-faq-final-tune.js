(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;

  const STYLE_ID='inv7-faq-final-tune-style';

  function getDoc(){
    try{
      const d1=outer.contentDocument||outer.contentWindow.document;
      const f1=d1?.getElementById('inviteFrame');
      const d2=f1?(f1.contentDocument||f1.contentWindow.document):null;
      const f2=d2?.getElementById('inv5');
      return f2?(f2.contentDocument||f2.contentWindow.document):null;
    }catch(e){return null;}
  }

  function applyFaqImages(doc,list){
    const sources={
      estacionamiento:'https://raw.githubusercontent.com/avaldiviezoch/Wedding/main/invitaciones/invitacion_5/pic_preguntas_5_1.png',
      alergia:'https://raw.githubusercontent.com/avaldiviezoch/Wedding/main/invitaciones/invitacion_5/pic_preguntas_5_2.png',
      confirmar:'https://raw.githubusercontent.com/avaldiviezoch/Wedding/main/invitaciones/invitacion_5/pic_preguntas_5_3.png',
      lugar:'https://raw.githubusercontent.com/avaldiviezoch/Wedding/main/invitaciones/invitacion_5/pic_preguntas_5_4.png'
    };

    list.querySelectorAll('.sat-inv6-faq-item').forEach(item=>{
      const button=item.querySelector('.sat-inv6-faq-q');
      if(!button)return;

      const text=(button.textContent||'').toLowerCase();
      let src='';
      let alt='';

      if(text.includes('estacionamiento')){
        src=sources.estacionamiento;
        alt='Ilustración de estacionamiento';
      }else if(text.includes('alergia')||text.includes('restricción')||text.includes('restriccion')){
        src=sources.alergia;
        alt='Ilustración de alergias o restricciones alimentarias';
      }else if(text.includes('confirmar')||text.includes('asistencia')){
        src=sources.confirmar;
        alt='Ilustración de fecha de confirmación';
      }else if((text.includes('ceremonia')&&text.includes('recepción'))||(text.includes('ceremonia')&&text.includes('recepcion'))||text.includes('mismo lugar')){
        src=sources.lugar;
        alt='Ilustración de ceremonia y recepción en el mismo lugar';
      }

      if(!src)return;

      let illustration=item.querySelector('.inv7-faq-illustration');
      if(!illustration){
        illustration=doc.createElement('div');
        illustration.className='inv7-faq-illustration';
        const img=doc.createElement('img');
        img.loading='lazy';
        img.decoding='async';
        illustration.appendChild(img);
        item.appendChild(illustration);
      }

      const img=illustration.querySelector('img');
      if(img){
        if(img.src!==src)img.src=src;
        img.alt=alt;
      }
    });
  }

  function apply(){
    const doc=getDoc();
    if(!doc?.head||!doc?.body)return false;

    let style=doc.getElementById(STYLE_ID);
    if(!style){
      style=doc.createElement('style');
      style.id=STYLE_ID;
      doc.head.appendChild(style);
    }

    style.textContent=`
      .sat-inv6-faq-note{
        font-size:clamp(14px,3.2vw,18px)!important;
        font-style:italic!important;
      }
      .inv7-faq-illustration{
        display:none;
        width:100%;
        margin:0 auto 16px;
        text-align:center;
        opacity:0;
        transform:translateY(14px) scale(.97);
      }
      .inv7-faq-illustration img{
        display:block;
        width:min(100%,250px);
        max-width:250px;
        height:auto;
        margin:0 auto;
        border:0;
        background:transparent;
        box-shadow:none;
        transform-origin:50% 80%;
        will-change:transform;
      }
      .sat-inv6-faq-item.is-open .inv7-faq-illustration{
        display:block;
        animation:inv7FaqPicIn .68s cubic-bezier(.22,.86,.28,1.12) both;
      }
      .sat-inv6-faq-item.is-open .inv7-faq-illustration img{
        animation:inv7FaqPicIdle 4.4s ease-in-out .72s infinite;
      }
      @keyframes inv7FaqPicIn{
        0%{opacity:0;transform:translateY(17px) scale(.97) rotate(1.8deg)}
        70%{opacity:1;transform:translateY(-2px) scale(1.01) rotate(-.7deg)}
        100%{opacity:1;transform:translateY(0) scale(1) rotate(0)}
      }
      @keyframes inv7FaqPicIdle{
        0%,100%{transform:translateY(0) rotate(-1deg)}
        50%{transform:translateY(-4px) rotate(1deg)}
      }
      @media(max-width:540px){
        .sat-inv6-faq-note{
          font-size:13px!important;
        }
      }
    `;

    const list=doc.querySelector('.sat-inv6-faq-list');
    if(!list)return false;

    const exists=[...list.querySelectorAll('.sat-inv6-faq-q')].some(btn=>(btn.textContent||'').toLowerCase().includes('estacionamiento'));

    if(!exists){
      const item=doc.createElement('div');
      item.className='sat-inv6-faq-item';
      item.innerHTML=`
        <button type="button" class="sat-inv6-faq-q">¿Hay estacionamiento?</button>
        <div class="sat-inv6-faq-a">Cerca de la zona hay algunos estacionamientos. Como tendremos bebidas durante la celebración, recomendamos llegar en taxi o aplicativo.</div>
      `;
      const btn=item.querySelector('.sat-inv6-faq-q');
      btn?.addEventListener('click',()=>item.classList.toggle('is-open'));
      list.insertBefore(item,list.firstChild);
    }

    applyFaqImages(doc,list);
    return true;
  }

  function run(){
    [0,120,300,650,1100,1800,3000,5000,8000].forEach(ms=>setTimeout(apply,ms));
  }

  outer.addEventListener('load',run);
  run();
})();
