(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;

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

  function mount(){
    const d=deepestDoc();
    if(!d)return false;
    const root=d.getElementById('sat-inv6-gift-paper-wrap');
    if(!root)return false;
    if(root.dataset.giftMounted==='1' && root.querySelector('.sat-inv6-gift-paper-text'))return true;

    root.innerHTML=`
      <div class="sat-inv6-gift-paper-stage">
        <img id="sat-inv6-gift-paper-bottom" src="./assets/papel_roto_6_5.png" alt="">
        <div class="sat-inv6-gift-paper-text">
          <div class="sat-inv6-gift-paper-kicker">NUESTRO MEJOR</div>
          <div class="sat-inv6-gift-paper-script">regalo</div>
          <p class="sat-inv6-gift-paper-copy">Tu presencia es nuestro mayor regalo, pero si deseas tener un detalle con nosotros, una contribución para nuestro futuro significará muchísimo para nosotros.</p>
          <div class="sat-inv6-gift-toggle-wrap">
            <button type="button" class="sat-inv6-gift-toggle" aria-expanded="false">TIPOS DE REGALO <span class="sat-inv6-gift-toggle-arrow">⌄</span></button>
          </div>
        </div>
      </div>
      <div class="sat-inv6-gift-details">
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
        </div>
      </div>`;

    root.dataset.giftMounted='1';
    const toggle=root.querySelector('.sat-inv6-gift-toggle');
    const details=root.querySelector('.sat-inv6-gift-details');
    toggle?.addEventListener('click',()=>{
      const open=!details.classList.contains('is-open');
      details.classList.toggle('is-open',open);
      toggle.classList.toggle('is-open',open);
      toggle.setAttribute('aria-expanded',String(open));
    });
    root.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',async()=>{
      const value=btn.dataset.copy||'';
      try{
        await navigator.clipboard.writeText(value);
        const old=btn.textContent;
        btn.textContent='COPIADO';
        setTimeout(()=>btn.textContent=old,1000);
      }catch(e){}
    }));
    return true;
  }

  function schedule(){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(mount()||tries>=80)clearInterval(timer);
    },100);
  }

  outer.addEventListener('load',schedule);
  schedule();
})();