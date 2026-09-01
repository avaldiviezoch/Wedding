(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;

  const STYLE_ID='inv7-faq-final-tune-style';

  function syncVisibleViewport(){
    const viewport=window.visualViewport;
    const height=Math.ceil(viewport?.height||window.innerHeight||document.documentElement.clientHeight||0);
    if(!height)return;
    outer.style.setProperty('height',height+'px','important');
    outer.style.setProperty('bottom','auto','important');
  }

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
        font-size:clamp(14px,3.2vw,18px)!important;
        font-style:italic!important;
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

    return true;
  }

  function run(){
    syncVisibleViewport();
    [0,120,300,650,1100,1800,3000,5000,8000].forEach(ms=>setTimeout(apply,ms));
  }

  window.visualViewport?.addEventListener('resize',syncVisibleViewport,{passive:true});
  window.addEventListener('resize',syncVisibleViewport,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(syncVisibleViewport,80),{passive:true});
  outer.addEventListener('load',run);
  run();
})();
