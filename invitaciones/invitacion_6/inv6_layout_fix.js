(() => {
  function apply(doc){
    if(!doc) return;
    const section=doc.getElementById('inv6PrimeraEntrada');
    const copy=section?.querySelector('.inv6-first-copy');
    if(!section||!copy) return;

    doc.getElementById('inv6-layout-fix-style')?.remove();
    const style=doc.createElement('style');
    style.id='inv6-layout-fix-style';
    style.textContent=`
      #inv6PrimeraEntrada{
        position:relative !important;
        width:100% !important;
        margin:0 !important;
        padding:0 !important;
        background:#efe7d6 !important;
        overflow:visible !important;
      }
      #inv6PrimeraEntrada .inv6-first-image{
        position:relative !important;
        z-index:2 !important;
        display:block !important;
        width:100% !important;
        height:auto !important;
        margin:0 !important;
        padding:0 !important;
        border:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }
      #inv6PrimeraEntrada .inv6-first-copy{
        position:relative !important;
        left:auto !important;
        top:auto !important;
        width:100% !important;
        transform:none !important;
        z-index:1 !important;
        margin:-2px 0 0 !important;
        padding:30px 5.5% 84px !important;
        text-align:center !important;
        color:#303542 !important;
        background:#efe7d6 !important;
        pointer-events:none !important;
      }
      #inv6PrimeraEntrada .inv6-we-marry{
        margin:0 !important;
        font-family:Georgia,'Times New Roman',serif !important;
        font-size:clamp(26px,5.7vw,44px) !important;
        line-height:1.05 !important;
        letter-spacing:.01em !important;
        font-weight:400 !important;
        color:#303542 !important;
      }
      #inv6PrimeraEntrada .inv6-couple{
        margin:12px auto 0 !important;
        font-family:'Amsterdam Four','Great Vibes',cursive !important;
        font-size:clamp(45px,10.8vw,80px) !important;
        line-height:.92 !important;
        font-weight:400 !important;
        color:#777a50 !important;
        white-space:nowrap !important;
      }
      #inv6PrimeraEntrada .inv6-date{
        margin:20px 0 0 !important;
        transform:translateY(10px) !important;
        font-family:Georgia,'Times New Roman',serif !important;
        font-size:clamp(27px,5.9vw,45px) !important;
        line-height:1 !important;
        letter-spacing:.02em !important;
        color:#303542 !important;
      }
      #inv6PrimeraEntrada .inv6-countdown{
        width:min(94%,560px) !important;
        margin:76px auto 0 !important;
        display:grid !important;
        grid-template-columns:repeat(4,minmax(0,1fr)) !important;
        color:#67704b !important;
      }
      #inv6PrimeraEntrada .inv6-time{
        position:relative !important;
        min-width:0 !important;
        padding:0 6px !important;
      }
      #inv6PrimeraEntrada .inv6-time + .inv6-time::before{
        content:'' !important;
        position:absolute !important;
        left:0 !important;
        top:2% !important;
        width:1px !important;
        height:72% !important;
        background:rgba(103,112,75,.7) !important;
      }
      #inv6PrimeraEntrada .inv6-time strong{
        display:block !important;
        font-family:Georgia,'Times New Roman',serif !important;
        font-size:clamp(36px,8.8vw,66px) !important;
        line-height:.92 !important;
        font-weight:400 !important;
        letter-spacing:-.025em !important;
      }
      #inv6PrimeraEntrada .inv6-time span{
        display:block !important;
        margin-top:10px !important;
        font-family:Georgia,'Times New Roman',serif !important;
        font-size:clamp(13px,2.9vw,21px) !important;
        line-height:1 !important;
        font-weight:400 !important;
      }
      .paper-section{
        margin-top:82px !important;
      }
      @media(max-width:540px){
        #inv6PrimeraEntrada .inv6-first-copy{
          margin:-2px 0 0 !important;
          padding:26px 4.5% 78px !important;
        }
        #inv6PrimeraEntrada .inv6-we-marry{font-size:clamp(24px,6.9vw,34px) !important;}
        #inv6PrimeraEntrada .inv6-couple{margin-top:9px !important;font-size:clamp(40px,12.2vw,58px) !important;}
        #inv6PrimeraEntrada .inv6-date{margin-top:16px !important;font-size:clamp(24px,6.9vw,33px) !important;}
        #inv6PrimeraEntrada .inv6-countdown{margin-top:64px !important;width:96% !important;}
        #inv6PrimeraEntrada .inv6-time{padding:0 4px !important;}
        #inv6PrimeraEntrada .inv6-time strong{font-size:clamp(31px,10.2vw,46px) !important;}
        #inv6PrimeraEntrada .inv6-time span{font-size:clamp(12px,3.6vw,16px) !important;margin-top:8px !important;}
        .paper-section{margin-top:72px !important;}
      }
    `;
    doc.head.appendChild(style);
  }

  window.inv6ApplyLayoutFix=apply;
})();
