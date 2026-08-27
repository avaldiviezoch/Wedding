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
    const doc=deepestDoc();
    if(!doc)return false;

    const giftHost=doc.getElementById('inv5GiftInRsvp');
    if(!giftHost?.parentNode)return false;

    // Eliminar únicamente las dos variantes visuales generadas por Invitación 6.
    // El host funcional original se conserva como ancla y no se modifica.
    doc.getElementById('inv6-gift-rebuild')?.remove();
    doc.getElementById('sat-inv6-gift-paper-wrap')?.remove();

    const giftPaperWrap=doc.createElement('div');
    giftPaperWrap.id='sat-inv6-gift-paper-wrap';

    const giftStage=doc.createElement('div');
    giftStage.className='sat-inv6-gift-paper-stage';

    const giftPaper=doc.createElement('img');
    giftPaper.id='sat-inv6-gift-paper-bottom';
    giftPaper.src='./assets/papel_roto_6_5.png';
    giftPaper.alt='';

    const giftPaperText=doc.createElement('div');
    giftPaperText.className='sat-inv6-gift-paper-text';
    giftPaperText.innerHTML=`
      <div class="sat-inv6-gift-paper-kicker">NUESTRO MEJOR</div>
      <div class="sat-inv6-gift-paper-script">regalo</div>
      <p class="sat-inv6-gift-paper-copy">Tu presencia es nuestro mayor regalo, pero si deseas tener un detalle con nosotros, una contribución para nuestro futuro significará muchísimo para nosotros.</p>
      <div class="sat-inv6-gift-toggle-wrap">
        <button type="button" class="sat-inv6-gift-toggle" aria-expanded="false">TIPOS DE REGALO <span class="sat-inv6-gift-toggle-arrow">⌄</span></button>
      </div>`;

    giftStage.appendChild(giftPaper);
    giftStage.appendChild(giftPaperText);

    const giftDetails=doc.createElement('div');
    giftDetails.className='sat-inv6-gift-details';
    giftDetails.innerHTML=`
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

    giftPaperWrap.appendChild(giftStage);
    giftPaperWrap.appendChild(giftDetails);

    const giftToggle=giftPaperText.querySelector('.sat-inv6-gift-toggle');
    giftToggle?.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      const opening=!giftDetails.classList.contains('is-open');
      giftDetails.classList.toggle('is-open',opening);
      giftToggle.classList.toggle('is-open',opening);
      giftToggle.setAttribute('aria-expanded',opening?'true':'false');
    });

    const copyValue=async(value,button)=>{
      let copied=false;
      const win=doc.defaultView;
      try{
        if(win?.navigator?.clipboard&&win.isSecureContext){
          await win.navigator.clipboard.writeText(value);
          copied=true;
        }
      }catch(e){}
      if(!copied){
        const area=doc.createElement('textarea');
        area.value=value;
        area.setAttribute('readonly','');
        area.style.position='fixed';
        area.style.left='-9999px';
        area.style.top='-9999px';
        doc.body.appendChild(area);
        area.select();
        try{copied=doc.execCommand('copy');}catch(e){}
        area.remove();
      }
      if(button){
        const old=button.textContent;
        button.textContent=copied?'COPIADO ✓':'COPIAR';
        setTimeout(()=>{if(button.isConnected)button.textContent=old;},1200);
      }
    };

    giftDetails.querySelectorAll('.sat-inv6-copy-btn').forEach(button=>{
      button.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        copyValue(button.getAttribute('data-copy')||'',button);
      });
    });

    giftHost.insertAdjacentElement('afterend',giftPaperWrap);
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
