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
        font-size:calc(clamp(16px,3.9vw,24px) - 1px)!important;
        font-style:italic!important;
      }
      @media(max-width:540px){
        .sat-inv6-faq-note{
          font-size:calc(clamp(13px,3.8vw,18px) - 1px)!important;
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

    return true;
  }

  function run(){
    [0,120,300,650,1100,1800,3000,5000,8000].forEach(ms=>setTimeout(apply,ms));
  }

  outer.addEventListener('load',run);
  run();
})();
