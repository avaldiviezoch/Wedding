(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;
  const ROOT_ID='sat-inv6-gift-paper-wrap';
  const VERSION='txt-placement-v2';

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

  function build(d){
    const root=d.createElement('div');
    root.id=ROOT_ID;
    root.dataset.giftMountVersion=VERSION;

    const stage=d.createElement('div');
    stage.className='sat-inv6-gift-paper-stage';

    const paper=d.createElement('img');
    paper.id='sat-inv6-gift-paper-bottom';
    paper.src='./assets/papel_roto_6_5.png';
    paper.alt='';

    const text=d.createElement('div');
    text.className='sat-inv6-gift-paper-text';
    text.innerHTML=`
      <div class="sat-inv6-gift-paper-kicker">NUESTRO MEJOR</div>
      <div class="sat-inv6-gift-paper-script">regalo</div>
      <p class="sat-inv6-gift-paper-copy">Tu presencia es nuestro mayor regalo, pero si deseas tener un detalle con nosotros, una contribución para nuestro futuro significará muchísimo para nosotros.</p>
      <div class="sat-inv6-gift-toggle-wrap">
        <button type="button" class="sat-inv6-gift-toggle" aria-expanded="false">TIPOS DE REGALO <span class="sat-inv6-gift-toggle-arrow">⌄</span></button>
      </div>`;

    stage.appendChild(paper);
    stage.appendChild(text);

    const details=d.createElement('div');
    details.className='sat-inv6-gift-details';
    details.innerHTML=`
      <p class="sat-inv6-gift-details-intro">Elige la opción que prefieras ♡</p>
      <div class="sat-inv6-gift-method">
        <div class="sat-inv6-gift-method-title">BCP</div>
        <div class="sat-inv6-gift-data-row">
          <div class="sat-inv6-gift-data-text"><span class="sat-inv6-gift-data-label">Cuenta</span><strong class="sat-inv6-gift-data-value">19335282760050</strong></div>
          <button type="button" class="sat-inv6-copy-btn" data-copy="19335282760050">COPIAR</button>
        </div>
        <div class="sat-inv6-gift-data-row">
          <div class="sat-inv6-gift-data-text"><span class="sat-inv6-gift-data-label">CCI</span><strong class="sat-inv6-gift-data-value">00219313528276005017</strong></div>
          <button type="button" class="sat-inv6-copy-btn" data-copy="00219313528276005017">COPIAR</button>
        </div>
      </div>
      <div class="sat-inv6-gift-method">
        <div class="sat-inv6-gift-method-title">Yape</div>
        <img class="sat-inv6-gift-qr" src="./assets/qr_yape.jpg" alt="QR de Yape">
      </div>
      <div class="sat-inv6-gift-method">
        <div class="sat-inv6-gift-method-title">Regalo físico</div>
        <div class="sat-inv6-gift-data-row">
          <div class="sat-inv6-gift-data-text"><span class="sat-inv6-gift-data-label">Dirección</span><strong class="sat-inv6-gift-data-value sat-inv6-gift-address">Urb. Alameda de la Rivera Mz. G Lt. 45, Ate</strong></div>
          <button type="button" class="sat-inv6-copy-btn" data-copy="Urb. Alameda de la Rivera Mz. G Lt. 45, Ate">COPIAR</button>
        </div>
      </div>`;

    root.appendChild(stage);
    root.appendChild(details);

    const toggle=text.querySelector('.sat-inv6-gift-toggle');
    toggle?.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      const open=!details.classList.contains('is-open');
      details.classList.toggle('is-open',open);
      toggle.classList.toggle('is-open',open);
      toggle.setAttribute('aria-expanded',String(open));
    });

    root.querySelectorAll('[data-copy]').forEach(button=>{
      button.addEventListener('click',async e=>{
        e.preventDefault();
        e.stopPropagation();
        const value=button.getAttribute('data-copy')||'';
        try{
          await navigator.clipboard.writeText(value);
          const old=button.textContent;
          button.textContent='COPIADO';
          setTimeout(()=>button.textContent=old,1000);
        }catch(err){}
      });
    });

    return root;
  }

  function mount(){
    const d=deepestDoc();
    if(!d)return false;

    const giftHost=d.getElementById('inv5GiftInRsvp');
    if(!giftHost?.parentNode)return false;

    const current=d.getElementById(ROOT_ID);
    if(current?.dataset.giftMountVersion===VERSION && current.previousElementSibling===giftHost){
      return true;
    }

    current?.remove();
    const root=build(d);
    giftHost.insertAdjacentElement('afterend',root);
    return true;
  }

  function schedule(){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(mount()||tries>=120)clearInterval(timer);
    },100);
  }

  outer.addEventListener('load',schedule);
  schedule();
})();