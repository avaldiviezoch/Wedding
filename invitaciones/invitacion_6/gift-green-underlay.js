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

  function apply(){
    const doc=deepestDoc();
    if(!doc?.head)return false;

    const host=doc.getElementById('inv5GiftInRsvp');
    const gift=doc.getElementById('giftExperience');
    if(!host||!gift)return false;

    let style=doc.getElementById(STYLE_ID);
    if(!style){
      style=doc.createElement('style');
      style.id=STYLE_ID;
      doc.head.appendChild(style);
    }

    style.textContent=`
      #inv5GiftInRsvp{
        overflow:visible!important;
      }
      #${BLOCK_ID}{
        display:block!important;
        position:relative!important;
        width:100%!important;
        height:clamp(120px,22vw,165px)!important;
        min-height:120px!important;
        margin:-1px 0 0!important;
        padding:0!important;
        background:#6D7559!important;
        background-image:none!important;
        border:0!important;
        border-radius:0 0 22px 22px!important;
        box-shadow:none!important;
        opacity:1!important;
        visibility:visible!important;
        z-index:1!important;
        pointer-events:none!important;
      }
    `;

    let block=doc.getElementById(BLOCK_ID);
    if(!block){
      block=doc.createElement('div');
      block.id=BLOCK_ID;
      block.setAttribute('aria-hidden','true');
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
