(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;
  const STYLE_ID='inv6-gift-green-underlay-style';

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
    if(!doc?.head||!doc.getElementById('inv5GiftInRsvp'))return false;
    let style=doc.getElementById(STYLE_ID);
    if(!style){
      style=doc.createElement('style');
      style.id=STYLE_ID;
      doc.head.appendChild(style);
    }
    style.textContent=`
      #inv5GiftInRsvp .gift-experience.is-revealed .gift-reveal-content{
        background:#6D7559!important;
        background-image:none!important;
        color:#FFFDF8!important;
        border-radius:0 0 22px 22px!important;
      }
      #inv5GiftInRsvp .gift-experience.is-revealed .gift-reveal-title,
      #inv5GiftInRsvp .gift-experience.is-revealed .gift-reveal-text,
      #inv5GiftInRsvp .gift-experience.is-revealed .gift-physical-note,
      #inv5GiftInRsvp .gift-experience.is-revealed .gift-replay-btn{
        color:#FFFDF8!important;
      }
      #inv5GiftInRsvp .gift-experience.is-revealed .gift-reveal-content::before,
      #inv5GiftInRsvp .gift-experience.is-revealed .gift-reveal-content::after{
        color:rgba(255,253,248,.62)!important;
      }
    `;
    return true;
  }

  function run(){
    [0,150,350,700,1200,2200,4000].forEach(ms=>setTimeout(apply,ms));
  }

  outer.addEventListener('load',run);
  run();
})();
