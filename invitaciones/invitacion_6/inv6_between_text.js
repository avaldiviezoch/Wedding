(() => {
  function apply(doc){
    if(!doc) return;

    const second=doc.querySelector('.paper-section');
    if(!second) return;

    // Quita únicamente el contenido superpuesto de esta sección.
    // No modifica la imagen, su tamaño, márgenes ni posición.
    second.querySelector('.countdown-overlay')?.remove();

    const imageWrap=second.querySelector('.countdown-image-wrap');
    if(!imageWrap) return;

    let block=second.querySelector('.inv6-between-text');
    if(!block){
      block=doc.createElement('div');
      block.className='inv6-between-text';
      block.innerHTML=`
        <p class="inv6-between-lead">Nos encantaría que seas parte de este<br>momento tan especial para nosotros!</p>
        <p class="inv6-between-script">¡Falta poco para el gran día y queremos<br>celebrarlo contigo!</p>`;
      second.insertBefore(block,imageWrap);
    }

    doc.getElementById('inv6-between-text-style')?.remove();
    const style=doc.createElement('style');
    style.id='inv6-between-text-style';
    style.textContent=`
      .paper-section .inv6-between-text{
        width:100% !important;
        margin:0 !important;
        padding:38px 24px 30px !important;
        text-align:center !important;
        background:transparent !important;
        color:#202020 !important;
      }
      .paper-section .inv6-between-lead{
        margin:0 auto !important;
        padding:0 !important;
        font-family:Arial,'Helvetica Neue',sans-serif !important;
        font-size:clamp(15px,3.2vw,21px) !important;
        line-height:1.08 !important;
        font-weight:700 !important;
        letter-spacing:-.025em !important;
        color:#202020 !important;
      }
      .paper-section .inv6-between-script{
        margin:14px auto 0 !important;
        padding:0 !important;
        font-family:'Amsterdam Four','Great Vibes',cursive !important;
        font-size:clamp(24px,5.6vw,39px) !important;
        line-height:.92 !important;
        font-weight:400 !important;
        color:#252525 !important;
      }
      @media(max-width:540px){
        .paper-section .inv6-between-text{
          padding:34px 18px 26px !important;
        }
        .paper-section .inv6-between-lead{
          font-size:clamp(14px,4vw,17px) !important;
        }
        .paper-section .inv6-between-script{
          margin-top:11px !important;
          font-size:clamp(23px,6.8vw,31px) !important;
        }
      }
    `;
    doc.head.appendChild(style);
  }

  window.inv6ApplyBetweenText=apply;
})();
