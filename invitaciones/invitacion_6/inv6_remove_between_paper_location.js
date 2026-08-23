(() => {
  const STYLE_ID='inv6-paper-to-location-style';
  const GREEN_BLOCK_ID='inv6-green-location-from-inv1';
  let greenImagePromise=null;

  function ensureSpacing(doc){
    let style=doc.getElementById(STYLE_ID);
    if(!style){
      style=doc.createElement('style');
      style.id=STYLE_ID;
      doc.head.appendChild(style);
    }
    style.textContent=`
      #inv6TornPaperMessage + .location-section{margin-top:clamp(22px,4.5vw,36px)!important;}
      #${GREEN_BLOCK_ID}{width:100%!important;margin:0!important;padding:0!important;background:transparent!important;position:relative!important;overflow:hidden!important;}
      #${GREEN_BLOCK_ID} .church-green-wrap{width:100%!important;max-width:680px!important;margin:0 auto!important;padding:0!important;position:relative!important;overflow:hidden!important;background:transparent!important;}
      #${GREEN_BLOCK_ID} .inv6-green-location-img{display:block!important;width:100%!important;height:auto!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;object-fit:contain!important;user-select:none!important;-webkit-user-drag:none!important;}
      #${GREEN_BLOCK_ID} .church-overlay-content{position:absolute!important;inset:0!important;z-index:2!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;text-align:center!important;padding:105px 32px 120px!important;box-sizing:border-box!important;color:#FBF8EF!important;pointer-events:none!important;}
      #${GREEN_BLOCK_ID} .church-kicker{margin:0 0 16px!important;font-family:'Cormorant Garamond',serif!important;font-size:13px!important;line-height:1.2!important;letter-spacing:5px!important;font-weight:400!important;color:#D9D6B9!important;text-transform:uppercase!important;white-space:nowrap!important;}
      #${GREEN_BLOCK_ID} .church-title{margin:0 0 24px!important;font-family:'Great Vibes',cursive!important;font-size:clamp(52px,11vw,72px)!important;line-height:.90!important;font-weight:400!important;color:#FBF8EF!important;text-align:center!important;width:100%!important;max-width:520px!important;}
      #${GREEN_BLOCK_ID} .church-title span{display:block!important;white-space:nowrap!important;}
      #${GREEN_BLOCK_ID} .church-main-copy{margin:0 0 34px!important;font-family:'Cormorant Garamond',serif!important;font-size:clamp(18px,4.5vw,25px)!important;line-height:1.35!important;font-weight:400!important;color:#FBF8EF!important;max-width:320px!important;width:100%!important;text-wrap:balance!important;}
      #${GREEN_BLOCK_ID} .church-place-name{margin:0 0 14px!important;font-family:'Great Vibes',cursive!important;font-size:clamp(46px,10vw,64px)!important;line-height:1!important;font-weight:400!important;color:#F2E4AB!important;width:100%!important;white-space:nowrap!important;}
      #${GREEN_BLOCK_ID} .church-address{margin:0 0 34px!important;font-family:'Cormorant Garamond',serif!important;font-size:clamp(18px,4.6vw,24px)!important;line-height:1.4!important;font-weight:400!important;color:#FBF8EF!important;border-bottom:1px solid rgba(217,214,185,.45)!important;padding:0 4px 6px!important;max-width:390px!important;width:auto!important;white-space:nowrap!important;}
      #${GREEN_BLOCK_ID} .church-note{margin:0 0 28px!important;font-family:'Cormorant Garamond',serif!important;font-size:clamp(17px,4.2vw,22px)!important;line-height:1.45!important;font-weight:400!important;color:rgba(251,248,239,.88)!important;max-width:330px!important;width:100%!important;text-wrap:balance!important;}
      #${GREEN_BLOCK_ID} .church-map-button{display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:13px 28px!important;border-radius:999px!important;background:#FBF8EF!important;color:#3F482E!important;text-decoration:none!important;font-family:'Montserrat',sans-serif!important;font-size:11px!important;line-height:1!important;letter-spacing:2.8px!important;font-weight:500!important;white-space:nowrap!important;pointer-events:auto!important;border:0!important;box-shadow:none!important;}
      @media(max-width:540px){
        #inv6TornPaperMessage + .location-section{margin-top:24px!important;}
        #${GREEN_BLOCK_ID} .church-overlay-content{padding:82px 20px 95px!important;}
      }
      @media(max-width:390px){
        #${GREEN_BLOCK_ID} .church-overlay-content{padding-left:16px!important;padding-right:16px!important;}
        #${GREEN_BLOCK_ID} .church-title{font-size:clamp(48px,13vw,58px)!important;}
        #${GREEN_BLOCK_ID} .church-place-name{font-size:clamp(42px,11vw,52px)!important;}
        #${GREEN_BLOCK_ID} .church-address{font-size:clamp(16px,4.35vw,19px)!important;letter-spacing:-.01em!important;}
      }
    `;
  }

  function getGreenImageSrc(){
    if(greenImagePromise) return greenImagePromise;
    greenImagePromise=fetch('../invitacion_1/invitacion_1.html?v=20260823-green-location-1',{cache:'force-cache'})
      .then(r=>{if(!r.ok) throw new Error(`No se pudo leer Invitación 1 (${r.status})`); return r.text();})
      .then(html=>{
        const sourceDoc=new DOMParser().parseFromString(html,'text/html');
        const src=sourceDoc.querySelector('img.church-green-img')?.getAttribute('src')||'';
        if(!src.startsWith('data:image/')) throw new Error('No se encontró church-green-img en Invitación 1');
        return src;
      })
      .catch(err=>{greenImagePromise=null;throw err;});
    return greenImagePromise;
  }

  function syncMapLink(location,button){
    if(!location||!button) return;
    const sourceButton=location.querySelector('a.map-button,a[href*="maps"],a[href*="google.com/maps"]');
    if(!sourceButton) return;
    const href=sourceButton.getAttribute('href');
    if(href) button.setAttribute('href',href);
    const target=sourceButton.getAttribute('target');
    const rel=sourceButton.getAttribute('rel');
    if(target) button.setAttribute('target',target); else button.removeAttribute('target');
    if(rel) button.setAttribute('rel',rel); else button.removeAttribute('rel');
  }

  async function insertGreenImage(doc,location){
    let block=doc.getElementById(GREEN_BLOCK_ID);
    if(!block){
      block=doc.createElement('section');
      block.id=GREEN_BLOCK_ID;
      block.setAttribute('aria-label','Ubicación de la ceremonia y recepción');
      block.innerHTML=`<div class="church-green-wrap"><img class="inv6-green-location-img" alt="" aria-hidden="true"><div class="church-overlay-content"><div class="church-kicker">UBICACIÓN</div><div class="church-title"><span>Ceremonia</span><span>&amp; Recepción</span></div><p class="church-main-copy">La boda y la recepción se realizarán en el mismo lugar.</p><div class="church-place-name">Residencia Privada</div><div class="church-address">Calle Acapulco 480, La Molina</div><p class="church-note">Te esperamos para compartir juntos cada momento de este día tan especial.</p><a class="church-map-button" href="#">VER UBICACIÓN</a></div></div>`;
      location.insertAdjacentElement('afterend',block);
    }else if(block.previousElementSibling!==location){
      location.insertAdjacentElement('afterend',block);
    }
    syncMapLink(location,block.querySelector('.church-map-button'));
    const img=block.querySelector('.inv6-green-location-img');
    if(!img || (img.getAttribute('src')||'').startsWith('data:image/')) return;
    try{img.src=await getGreenImageSrc();}catch(err){console.warn('[Invitación 6] No se pudo cargar el fondo verde de Invitación 1:',err);}
  }

  function apply(doc){
    if(!doc) return;
    const hands=doc.getElementById('handsSection')||doc.querySelector('section.hands-section');
    const story=doc.getElementById('photoStorySection')||doc.querySelector('section.photo-story-section');
    hands?.remove();
    story?.remove();
    const torn=doc.getElementById('inv6TornPaperMessage');
    const location=doc.querySelector('section.location-section');
    if(torn&&location&&torn.nextElementSibling!==location){
      let node=torn.nextElementSibling;
      while(node&&node!==location){const next=node.nextElementSibling;node.remove();node=next;}
    }
    ensureSpacing(doc);
    if(location) insertGreenImage(doc,location);
  }

  window.inv6RemoveBetweenPaperAndLocation=apply;
})();
