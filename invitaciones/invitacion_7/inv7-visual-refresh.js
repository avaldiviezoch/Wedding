(()=>{
  const outer=document.getElementById('invite');
  if(!outer)return;
  const STYLE_ID='inv7-visible-refresh-20260831';

  function apply(){
    try{
      const d1=outer.contentDocument||outer.contentWindow.document;
      const f1=d1?.getElementById('inviteFrame');
      const d2=f1?(f1.contentDocument||f1.contentWindow.document):null;
      const f2=d2?.getElementById('inv5');
      const doc=f2?(f2.contentDocument||f2.contentWindow.document):null;
      if(!doc?.head)return false;

      let style=doc.getElementById(STYLE_ID);
      if(!style){
        style=doc.createElement('style');
        style.id=STYLE_ID;
        doc.head.appendChild(style);
      }

      style.textContent=`
        #inv6PrimeraEntrada .inv6-top-note,
        #inv6PrimeraEntrada .inv6-couple{
          font-family:'Inv6EyesomeReal',cursive!important;
        }
        html body #sat-inv6-photo-collage .photo-1{
          left:0!important;
        }
        html body #sat-inv6-photo-collage .photo-2{
          right:0!important;
        }
      `;
      return true;
    }catch(e){return false;}
  }

  function run(){
    [0,120,300,650,1100,1800,3000,5000,8000].forEach(ms=>setTimeout(apply,ms));
  }

  outer.addEventListener('load',run);
  run();
})();
