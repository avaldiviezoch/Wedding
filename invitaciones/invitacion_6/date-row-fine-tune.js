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

  function apply(){
    const doc=deepestDoc();
    if(!doc)return false;

    let style=doc.getElementById('inv6-date-row-fine-tune-style');
    if(!style){
      style=doc.createElement('style');
      style.id='inv6-date-row-fine-tune-style';
      doc.head.appendChild(style);
    }

    style.textContent=`
      .paper-section .invite-date-row > span:first-child{
        transform:translateX(10px)!important;
      }
      .paper-section .invite-date-row > span:last-child{
        transform:translateX(-10px)!important;
      }
    `;
    return true;
  }

  function schedule(){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(apply()||tries>=120)clearInterval(timer);
    },100);
  }

  outer.addEventListener('load',schedule);
  schedule();
})();
