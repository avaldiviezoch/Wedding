(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;
  const ROOT_ID='sat-inv6-gift-paper-wrap';
  const STYLE_ID='inv6-gift-clean-style';

  function doc(){
    try{
      const d1=outer.contentDocument||outer.contentWindow.document;
      const f1=d1.getElementById('inviteFrame');
      if(!f1)return null;
      const d2=f1.contentDocument||f1.contentWindow.document;
      const f2=d2.getElementById('inv5');
      return f2?(f2.contentDocument||f2.contentWindow.document):null;
    }catch(e){return null;}
  }

  function installStyle(d){
    let s=d.getElementById(STYLE_ID);
    if(!s){s=d.createElement('style');s.id=STYLE_ID;d.head.appendChild(s);}
    s.textContent=`
      @font-face{font-family:'Inv6GiftSeasons';src:url('./assets/The%20Seasons%20Regular.ttf') format('truetype');font-weight:400;font-style:normal;font-display:swap}
      @font-face{font-family:'Inv6GiftEyesome';src:url('./assets/Eyesome-Script.otf') format('opentype');font-weight:400;font-style:normal;font-display:swap}
      #${ROOT_ID}{position:relative!important;display:block!important;width:100%!important;max-width:680px!important;margin:0 auto!important;padding:0!important;overflow:visible!important;z-index:5!important}
      #${ROOT_ID} .inv6-gift-stage{position:relative!important;display:block!important;width:100%!important;margin:0!important;padding:0!important;overflow:visible!important}
      #${ROOT_ID} .inv6-gift-paper{position:relative!important;display:block!important;width:100%!important;max-width:680px!important;height:auto!important;margin:0 auto!important;padding:0!important;transform:translateY(-15%)!important;object-fit:contain!important;border:0!important;background:transparent!important;box-shadow:none!important}
      #${ROOT_ID} .inv6-gift-copy{position:absolute!important;left:50%!important;top:25%!important;transform:translate(-50%,-50%)!important;width:90%!important;margin:0!important;padding:0!important;text-align:center!important;z-index:10!important;color:#fff!important}
      #${ROOT_ID} .inv6-gift-kicker{display:block!important;margin:0!important;font-family:'Inv6GiftSeasons',Georgia,serif!important;font-size:clamp(38px,8vw,62px)!important;line-height:.9!important;font-weight:400!important;letter-spacing:.01em!important;text-transform:uppercase!important;color:#fff!important}
      #${ROOT_ID} .inv6-gift-script{display:block!important;margin:3px 0 0!important;font-family:'Inv6GiftEyesome',cursive!important;font-size:clamp(42px,9vw,70px)!important;line-height:.85!important;font-weight:400!important;color:#fff!important}
      #${ROOT_ID} .inv6-gift-text{display:block!important;width:82%!important;max-width:420px!important;margin:14px auto 0!important;font-family:Georgia,'Times New Roman',serif!important;font-size:13px!important;line-height:1.32!important;font-weight:400!important;text-align:center!important;color:#fff!important}
      #${ROOT_ID} .inv6-gift-toggle-wrap{display:block!important;width:82%!important;max-width:420px!important;margin:16px auto 0!important;text-align:center!important}
      #${ROOT_ID} .inv6-gift-toggle{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;margin:0 auto!important;padding:12px 23px!important;border:1px solid rgba(109,117,89,.35)!important;border-radius:999px!important;background:#F1E5DA!important;color:#5D644F!important;font-family:Georgia,'Times New Roman',serif!important;font-size:10px!important;line-height:1!important;font-weight:700!important;letter-spacing:1.25px!important;text-transform:uppercase!important;box-shadow:none!important}
      #${ROOT_ID} .inv6-gift-arrow{display:inline-block!important;font-size:15px!important;line-height:1!important;transition:transform .2s ease!important}
      #${ROOT_ID} .inv6-gift-toggle[aria-expanded='true'] .inv6-gift-arrow{transform:rotate(180deg)!important}
      #${ROOT_ID} .inv6-gift-details{display:none!important;position:relative!important;width:84%!important;max-width:350px!important;margin:-82px auto 22px!important;padding:10px!important;box-sizing:border-box!important;background:#F1E5DA!important;color:#5D644F!important;border:1px solid rgba(109,117,89,.16)!important;border-radius:16px!important;box-shadow:0 8px 18px rgba(63,72,46,.07)!important;z-index:12!important}
      #${ROOT_ID} .inv6-gift-details.is-open{display:block!important}
      #${ROOT_ID} .inv6-gift-intro{margin:0 0 6px!important;padding:0!important;font-family:Georgia,'Times New Roman',serif!important;font-size:9px!important;line-height:1.3!important;font-style:italic!important;text-align:center!important;color:#687052!important}
      #${ROOT_ID} .inv6-gift-method{margin:0!important;padding:8px 0!important;border-top:1px solid rgba(109,117,89,.14)!important}
      #${ROOT_ID} .inv6-gift-method:first-of-type{border-top:0!important;padding-top:3px!important}
      #${ROOT_ID} .inv6-gift-method-title{margin:0 0 5px!important;font-family:'Inv6GiftSeasons',Georgia,serif!important;font-size:16px!important;line-height:1!important;font-weight:500!important;text-align:center!important;color:#5D644F!important}
      #${ROOT_ID} .inv6-gift-row{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:7px!important;width:100%!important;margin:5px 0 0!important;padding:7px 8px!important;box-sizing:border-box!important;background:rgba(255,255,255,.30)!important;border:1px solid rgba(109,117,89,.12)!important;border-radius:11px!important;text-align:left!important}
      #${ROOT_ID} .inv6-gift-data{flex:1!important;min-width:0!important}
      #${ROOT_ID} .inv6-gift-label{display:block!important;margin:0 0 2px!important;font-family:Georgia,'Times New Roman',serif!important;font-size:7.5px!important;line-height:1.1!important;font-weight:700!important;letter-spacing:.65px!important;text-transform:uppercase!important;color:#7A806A!important}
      #${ROOT_ID} .inv6-gift-value{display:block!important;margin:0!important;font-family:Georgia,'Times New Roman',serif!important;font-size:10px!important;line-height:1.22!important;font-weight:600!important;color:#525A46!important;overflow-wrap:anywhere!important}
      #${ROOT_ID} .inv6-gift-copy-btn{flex:0 0 auto!important;min-width:52px!important;margin:0!important;padding:6px 7px!important;border:1px solid rgba(109,117,89,.25)!important;border-radius:999px!important;background:#FBF8EF!important;color:#5D644F!important;font-family:Georgia,'Times New Roman',serif!important;font-size:7.5px!important;line-height:1!important;font-weight:700!important;letter-spacing:.55px!important;box-shadow:none!important}
      #${ROOT_ID} .inv6-gift-qr{display:block!important;width:98px!important;max-width:38%!important;height:auto!important;margin:4px auto 0!important;padding:4px!important;box-sizing:border-box!important;object-fit:contain!important;background:#fff!important;border:1px solid rgba(109,117,89,.12)!important;border-radius:10px!important;box-shadow:none!important}
      #${ROOT_ID} .inv6-gift-address{font-size:9px!important;line-height:1.25!important}
      @media(max-width:390px){
        #${ROOT_ID} .inv6-gift-details{width:86%!important;max-width:320px!important;margin-top:-72px!important;padding:9px!important}
        #${ROOT_ID} .inv6-gift-method-title{font-size:15px!important}
        #${ROOT_ID} .inv6-gift-qr{width:92px!important}
      }
    `;
  }

  function markup(d){
    const root=d.createElement('section');
    root.id=ROOT_ID;
    root.dataset.cleanGift='1';
    root.innerHTML=`
      <div class="inv6-gift-stage">
        <img class="inv6-gift-paper" src="./assets/papel_roto_6_5.png" alt="">
        <div class="inv6-gift-copy">
          <div class="inv6-gift-kicker">NUESTRO MEJOR</div>
          <div class="inv6-gift-script">regalo</div>
          <p class="inv6-gift-text">Tu presencia es nuestro mayor regalo, pero si deseas tener un detalle con nosotros, una contribución para nuestro futuro significará muchísimo para nosotros.</p>
          <div class="inv6-gift-toggle-wrap"><button type="button" class="inv6-gift-toggle" aria-expanded="false">TIPOS DE REGALO <span class="inv6-gift-arrow">⌄</span></button></div>
        </div>
      </div>
      <div class="inv6-gift-details">
        <p class="inv6-gift-intro">Elige la opción que prefieras ♡</p>
        <div class="inv6-gift-method">
          <div class="inv6-gift-method-title">BCP</div>
          <div class="inv6-gift-row"><div class="inv6-gift-data"><span class="inv6-gift-label">Cuenta</span><strong class="inv6-gift-value">19335282760050</strong></div><button type="button" class="inv6-gift-copy-btn" data-copy="19335282760050">COPIAR</button></div>
          <div class="inv6-gift-row"><div class="inv6-gift-data"><span class="inv6-gift-label">CCI</span><strong class="inv6-gift-value">00219313528276005017</strong></div><button type="button" class="inv6-gift-copy-btn" data-copy="00219313528276005017">COPIAR</button></div>
        </div>
        <div class="inv6-gift-method"><div class="inv6-gift-method-title">Yape</div><img class="inv6-gift-qr" src="./assets/qr_yape.jpg" alt="QR de Yape"></div>
        <div class="inv6-gift-method"><div class="inv6-gift-method-title">Regalo físico</div><div class="inv6-gift-row"><div class="inv6-gift-data"><span class="inv6-gift-label">Dirección</span><strong class="inv6-gift-value inv6-gift-address">Urb. Alameda de la Rivera Mz. G Lt. 45, Ate</strong></div><button type="button" class="inv6-gift-copy-btn" data-copy="Urb. Alameda de la Rivera Mz. G Lt. 45, Ate">COPIAR</button></div></div>
      </div>`;
    const toggle=root.querySelector('.inv6-gift-toggle');
    const details=root.querySelector('.inv6-gift-details');
    toggle.addEventListener('click',()=>{const open=!details.classList.contains('is-open');details.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));});
    root.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',async()=>{const value=btn.dataset.copy||'';try{await navigator.clipboard.writeText(value);const old=btn.textContent;btn.textContent='COPIADO';setTimeout(()=>btn.textContent=old,1000);}catch(e){}}));
    return root;
  }

  function replace(){
    const d=doc();if(!d?.head)return false;
    installStyle(d);
    const current=d.getElementById(ROOT_ID);
    if(current?.dataset.cleanGift==='1')return true;
    if(!current?.parentNode)return false;
    current.parentNode.replaceChild(markup(d),current);
    return true;
  }

  function schedule(){[0,120,300,700,1400,2600,4500,7000,10000].forEach(ms=>setTimeout(replace,ms));}
  outer.addEventListener('load',schedule);
  schedule();
})();