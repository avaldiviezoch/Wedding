(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;
  const GUARD_STYLE_ID='inv6-agreed-gift-visibility-guard';

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

  function ensureGuardStyle(doc){
    if(!doc?.head)return;
    let style=doc.getElementById(GUARD_STYLE_ID);
    if(!style){
      style=doc.createElement('style');
      style.id=GUARD_STYLE_ID;
      doc.head.appendChild(style);
    }
    style.textContent=`
      html body #rsvpSection #inv5GiftInRsvp{
        display:block!important;
        visibility:visible!important;
        opacity:1!important;
        position:relative!important;
        width:100%!important;
        height:auto!important;
        min-height:1px!important;
        overflow:visible!important;
        z-index:20!important;
      }
      html body #rsvpSection #inv5GiftInRsvp #giftExperience{
        display:flex!important;
        visibility:visible!important;
        opacity:1!important;
        position:relative!important;
        flex-direction:column!important;
        width:100%!important;
        height:auto!important;
        min-height:1px!important;
        overflow:visible!important;
      }
      html body #rsvpSection #inv5GiftInRsvp .gift-stage-heading,
      html body #rsvpSection #inv5GiftInRsvp .gift-animation-stage,
      html body #rsvpSection #inv5GiftInRsvp #giftMainMedia,
      html body #rsvpSection #inv5GiftInRsvp .gift-main-media{
        display:block!important;
        visibility:visible!important;
        opacity:1!important;
      }
      html body #rsvpSection #inv5GiftInRsvp #giftMainMedia,
      html body #rsvpSection #inv5GiftInRsvp .gift-main-media{
        height:auto!important;
        max-height:none!important;
      }
    `;
  }

  function forceVisible(el,display){
    if(!el)return;
    el.classList.remove('hidden');
    el.removeAttribute('hidden');
    el.style.setProperty('display',display||'block','important');
    el.style.setProperty('visibility','visible','important');
    el.style.setProperty('opacity','1','important');
  }

  function restore(){
    const doc=deepestDoc();
    if(!doc)return false;

    doc.getElementById('inv6-gift-rebuild')?.remove();
    doc.getElementById('sat-inv6-gift-paper-wrap')?.remove();
    doc.getElementById('inv6-gift-rebuild-style')?.remove();
    doc.getElementById('inv6-hide-legacy-gift-style')?.remove();

    const giftExperience=doc.getElementById('giftExperience');
    const rsvpSection=doc.getElementById('rsvpSection');
    const rsvpCard=rsvpSection?.querySelector('.final-card');
    if(!giftExperience||!rsvpCard)return false;

    let host=doc.getElementById('inv5GiftInRsvp');
    if(!host){
      host=doc.createElement('div');
      host.id='inv5GiftInRsvp';
      host.className='inv5-gift-in-rsvp';
      host.setAttribute('aria-label','Regalo');
    }

    if(host.parentNode!==rsvpCard)rsvpCard.appendChild(host);
    if(giftExperience.parentNode!==host)host.appendChild(giftExperience);

    ensureGuardStyle(doc);

    forceVisible(rsvpSection,'block');
    forceVisible(rsvpCard,'block');
    rsvpCard.style.setProperty('overflow','visible','important');
    rsvpCard.style.setProperty('height','auto','important');
    rsvpCard.style.setProperty('max-height','none','important');

    forceVisible(host,'block');
    host.style.setProperty('position','relative','important');
    host.style.setProperty('width','100%','important');
    host.style.setProperty('height','auto','important');
    host.style.setProperty('min-height','1px','important');
    host.style.setProperty('overflow','visible','important');
    host.style.setProperty('z-index','20','important');

    forceVisible(giftExperience,'flex');
    giftExperience.style.setProperty('position','relative','important');
    giftExperience.style.setProperty('width','100%','important');
    giftExperience.style.setProperty('height','auto','important');
    giftExperience.style.setProperty('min-height','1px','important');
    giftExperience.style.setProperty('overflow','visible','important');

    const heading=giftExperience.querySelector('.gift-stage-heading');
    const stage=giftExperience.querySelector('.gift-animation-stage');
    const media=giftExperience.querySelector('#giftMainMedia,.gift-main-media');
    if(heading&&stage&&heading.nextElementSibling!==stage){
      giftExperience.insertBefore(heading,stage);
    }
    forceVisible(heading,'block');
    forceVisible(stage,'block');
    forceVisible(media,'block');
    if(media){
      media.style.setProperty('height','auto','important');
      media.style.setProperty('max-height','none','important');
    }

    const legacySection=doc.getElementById('giftSection');
    if(legacySection&&!legacySection.contains(giftExperience))legacySection.remove();

    return true;
  }

  let observer=null;
  let watchedDoc=null;
  let repairTimer=null;

  function needsRepair(doc){
    const host=doc?.getElementById('inv5GiftInRsvp');
    const gift=doc?.getElementById('giftExperience');
    const media=doc?.querySelector('#inv5GiftInRsvp #giftMainMedia,#inv5GiftInRsvp .gift-main-media');
    if(!host||!gift||gift.parentNode!==host||!media)return true;
    const hs=getComputedStyle(host);
    const gs=getComputedStyle(gift);
    const ms=getComputedStyle(media);
    return hs.display==='none'||hs.visibility==='hidden'||hs.opacity==='0'||
      gs.display==='none'||gs.visibility==='hidden'||gs.opacity==='0'||
      ms.display==='none'||ms.visibility==='hidden'||ms.opacity==='0';
  }

  function queueRepair(){
    clearTimeout(repairTimer);
    repairTimer=setTimeout(()=>{
      const doc=deepestDoc();
      if(doc&&needsRepair(doc))restore();
    },40);
  }

  function watch(){
    const doc=deepestDoc();
    if(!doc?.body)return;
    if(observer&&watchedDoc===doc)return;
    observer?.disconnect();
    watchedDoc=doc;
    observer=new MutationObserver(queueRepair);
    observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden']});
  }

  function schedule(){
    [0,100,250,500,900,1400,2200,3500,5500,8000,12000,18000,26000,40000].forEach(ms=>setTimeout(()=>{restore();watch();},ms));
  }

  outer.addEventListener('load',()=>{
    observer?.disconnect();
    observer=null;
    watchedDoc=null;
    schedule();
  });
  schedule();
})();
