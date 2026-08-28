(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;

  const STYLE_ID='inv6-gift-green-underlay-style';
  const BLOCK_ID='inv6GiftGreenUnderlay';

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

  function ensureStyle(doc){
    let style=doc.getElementById(STYLE_ID);
    if(!style){
      style=doc.createElement('style');
      style.id=STYLE_ID;
      doc.head.appendChild(style);
    }

    style.textContent=`
      #inv5GiftInRsvp{overflow:visible!important}
      #${BLOCK_ID}{
        position:relative!important;
        display:block!important;
        width:100%!important;
        max-width:680px!important;
        margin:-1px auto 0!important;
        padding:0!important;
        box-sizing:border-box!important;
        z-index:8!important;
        background:transparent!important;
        overflow:visible!important;
      }
      #${BLOCK_ID} *{box-sizing:border-box!important}
      #${BLOCK_ID} .inv6-gift-sheet{
        position:relative!important;
        width:100%!important;
        margin:0!important;
        padding:66px 34px 70px!important;
        background:#66715A!important;
        color:#fff!important;
        text-align:center!important;
        overflow:hidden!important;
        clip-path:polygon(0 3.2%,4% 1.4%,9% 2.6%,14% .9%,20% 2.2%,27% .8%,34% 2.5%,42% .7%,49% 2.1%,57% .9%,64% 2.6%,72% 1%,80% 2.3%,88% .8%,94% 2.2%,100% 1.2%,100% 97.3%,95% 98.7%,90% 97.4%,84% 99%,77% 97.6%,69% 99.2%,61% 97.5%,54% 99.1%,47% 97.7%,39% 99.2%,31% 97.6%,23% 99%,16% 97.5%,9% 98.8%,4% 97.4%,0 98.8%)!important;
      }
      #${BLOCK_ID} .inv6-gift-sheet::before{
        content:""!important;
        position:absolute!important;
        inset:0!important;
        pointer-events:none!important;
        background:
          radial-gradient(circle at 18% 20%,rgba(255,255,255,.045),transparent 30%),
          radial-gradient(circle at 78% 72%,rgba(0,0,0,.045),transparent 34%),
          linear-gradient(180deg,rgba(255,255,255,.018),rgba(0,0,0,.025))!important;
      }
      #${BLOCK_ID} .inv6-gift-content{position:relative!important;z-index:2!important;max-width:470px!important;margin:0 auto!important}
      #${BLOCK_ID} .inv6-gift-kicker{
        margin:0!important;
        font-family:'Inv6SeasonsReal','The Seasons Regular',Georgia,'Times New Roman',serif!important;
        font-size:clamp(39px,8.7vw,62px)!important;
        line-height:.92!important;
        font-weight:400!important;
        letter-spacing:.015em!important;
        text-transform:uppercase!important;
        color:#fff!important;
      }
      #${BLOCK_ID} .inv6-gift-script{
        margin:2px 0 0!important;
        font-family:'Inv6EyesomeReal','Eyesome Script','Great Vibes',cursive!important;
        font-size:clamp(46px,10vw,72px)!important;
        line-height:.88!important;
        font-weight:400!important;
        color:#fff!important;
      }
      #${BLOCK_ID} .inv6-gift-copy{
        width:min(100%,410px)!important;
        margin:20px auto 0!important;
        font-family:Georgia,'Times New Roman',serif!important;
        font-size:clamp(13px,3.15vw,16px)!important;
        line-height:1.48!important;
        font-weight:400!important;
        color:#fff!important;
      }
      #${BLOCK_ID} .inv6-gift-toggle{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:9px!important;
        margin:24px auto 0!important;
        padding:13px 24px!important;
        border:1px solid rgba(255,255,255,.38)!important;
        border-radius:999px!important;
        background:#F1E5DA!important;
        color:#5D644F!important;
        font-family:Georgia,'Times New Roman',serif!important;
        font-size:10px!important;
        line-height:1!important;
        font-weight:700!important;
        letter-spacing:1.2px!important;
        text-transform:uppercase!important;
        cursor:pointer!important;
        box-shadow:0 6px 16px rgba(0,0,0,.08)!important;
        -webkit-tap-highlight-color:transparent!important;
      }
      #${BLOCK_ID} .inv6-gift-toggle-icon{font-size:15px!important;line-height:1!important;transition:transform .22s ease!important}
      #${BLOCK_ID}.is-open .inv6-gift-toggle-icon{transform:rotate(180deg)!important}
      #${BLOCK_ID} .inv6-gift-details{
        display:none!important;
        width:min(88%,390px)!important;
        margin:-24px auto 24px!important;
        padding:38px 16px 16px!important;
        position:relative!important;
        z-index:4!important;
        background:#F1E5DA!important;
        color:#5D644F!important;
        border:1px solid rgba(109,117,89,.16)!important;
        border-radius:18px!important;
        box-shadow:0 10px 24px rgba(63,72,46,.10)!important;
      }
      #${BLOCK_ID}.is-open .inv6-gift-details{display:block!important}
      #${BLOCK_ID} .inv6-gift-details-intro{margin:0 0 10px!important;font:italic 12px/1.4 Georgia,'Times New Roman',serif!important;color:#687052!important;text-align:center!important}
      #${BLOCK_ID} .inv6-gift-method{padding:13px 0!important;border-top:1px solid rgba(109,117,89,.14)!important}
      #${BLOCK_ID} .inv6-gift-method:first-of-type{border-top:0!important}
      #${BLOCK_ID} .inv6-gift-method-title{margin:0 0 8px!important;font-family:'Inv6SeasonsReal',Georgia,serif!important;font-size:20px!important;line-height:1!important;font-weight:500!important;color:#5D644F!important;text-align:center!important}
      #${BLOCK_ID} .inv6-gift-row{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;margin-top:7px!important;padding:9px 10px!important;background:rgba(255,255,255,.38)!important;border:1px solid rgba(109,117,89,.12)!important;border-radius:12px!important;text-align:left!important}
      #${BLOCK_ID} .inv6-gift-row-text{min-width:0!important;flex:1!important}
      #${BLOCK_ID} .inv6-gift-label{display:block!important;margin:0 0 2px!important;font:700 8px/1.1 Georgia,'Times New Roman',serif!important;letter-spacing:.7px!important;text-transform:uppercase!important;color:#7A806A!important}
      #${BLOCK_ID} .inv6-gift-value{display:block!important;margin:0!important;font:600 11px/1.3 Georgia,'Times New Roman',serif!important;color:#525A46!important;overflow-wrap:anywhere!important}
      #${BLOCK_ID} .inv6-gift-copy-btn{flex:0 0 auto!important;margin:0!important;padding:7px 9px!important;border:1px solid rgba(109,117,89,.25)!important;border-radius:999px!important;background:#FBF8EF!important;color:#5D644F!important;font:700 8px/1 Georgia,'Times New Roman',serif!important;letter-spacing:.55px!important;cursor:pointer!important}
      #${BLOCK_ID} .inv6-gift-qr{display:block!important;width:108px!important;max-width:42%!important;height:auto!important;margin:6px auto 0!important;padding:5px!important;background:#fff!important;border:1px solid rgba(109,117,89,.12)!important;border-radius:12px!important}
      @media(max-width:390px){
        #${BLOCK_ID} .inv6-gift-sheet{padding:58px 24px 60px!important}
        #${BLOCK_ID} .inv6-gift-copy{font-size:13px!important;line-height:1.44!important}
        #${BLOCK_ID} .inv6-gift-details{width:90%!important;padding-left:12px!important;padding-right:12px!important}
      }
    `;
  }

  function build(doc){
    const root=doc.createElement('section');
    root.id=BLOCK_ID;
    root.setAttribute('aria-label','Regalos');
    root.innerHTML=`
      <div class="inv6-gift-sheet">
        <div class="inv6-gift-content">
          <h2 class="inv6-gift-kicker">NUESTRO MEJOR</h2>
          <div class="inv6-gift-script">regalo</div>
          <p class="inv6-gift-copy">Tu presencia es nuestro mayor regalo, pero si deseas tener un detalle con nosotros, una contribución para nuestro futuro significará muchísimo para nosotros.</p>
          <button type="button" class="inv6-gift-toggle" aria-expanded="false">TIPOS DE REGALO <span class="inv6-gift-toggle-icon">⌄</span></button>
        </div>
      </div>
      <div class="inv6-gift-details" aria-hidden="true">
        <p class="inv6-gift-details-intro">Elige la opción que prefieras ♡</p>
        <div class="inv6-gift-method">
          <div class="inv6-gift-method-title">BCP</div>
          <div class="inv6-gift-row">
            <div class="inv6-gift-row-text"><span class="inv6-gift-label">Cuenta</span><strong class="inv6-gift-value">19335282760050</strong></div>
            <button type="button" class="inv6-gift-copy-btn" data-copy="19335282760050">COPIAR</button>
          </div>
          <div class="inv6-gift-row">
            <div class="inv6-gift-row-text"><span class="inv6-gift-label">CCI</span><strong class="inv6-gift-value">00219313528276005017</strong></div>
            <button type="button" class="inv6-gift-copy-btn" data-copy="00219313528276005017">COPIAR</button>
          </div>
        </div>
        <div class="inv6-gift-method">
          <div class="inv6-gift-method-title">Yape</div>
          <img class="inv6-gift-qr" src="./assets/qr_yape.jpg" alt="QR de Yape">
        </div>
        <div class="inv6-gift-method">
          <div class="inv6-gift-method-title">Regalo físico</div>
          <div class="inv6-gift-row">
            <div class="inv6-gift-row-text"><span class="inv6-gift-label">Dirección</span><strong class="inv6-gift-value">Urb. Alameda de la Rivera Mz. G Lt. 45, Ate</strong></div>
            <button type="button" class="inv6-gift-copy-btn" data-copy="Urb. Alameda de la Rivera Mz. G Lt. 45, Ate">COPIAR</button>
          </div>
        </div>
      </div>`;

    const toggle=root.querySelector('.inv6-gift-toggle');
    const details=root.querySelector('.inv6-gift-details');
    toggle.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      const open=!root.classList.contains('is-open');
      root.classList.toggle('is-open',open);
      toggle.setAttribute('aria-expanded',String(open));
      details.setAttribute('aria-hidden',String(!open));
    });

    root.querySelectorAll('[data-copy]').forEach(btn=>{
      btn.addEventListener('click',async e=>{
        e.preventDefault();
        e.stopPropagation();
        const value=btn.getAttribute('data-copy')||'';
        try{
          await navigator.clipboard.writeText(value);
          const old=btn.textContent;
          btn.textContent='COPIADO';
          setTimeout(()=>btn.textContent=old,1000);
        }catch(err){}
      });
    });
    return root;
  }

  function apply(){
    const doc=deepestDoc();
    if(!doc?.head)return false;

    const host=doc.getElementById('inv5GiftInRsvp');
    const gift=doc.getElementById('giftExperience');
    if(!host||!gift)return false;

    ensureStyle(doc);

    let block=doc.getElementById(BLOCK_ID);
    if(!block){
      block=build(doc);
    }

    if(gift.nextElementSibling!==block){
      gift.insertAdjacentElement('afterend',block);
    }

    return true;
  }

  function run(){
    [0,120,300,650,1100,1800,3000,5000].forEach(ms=>setTimeout(apply,ms));
  }

  outer.addEventListener('load',run);
  run();
})();
