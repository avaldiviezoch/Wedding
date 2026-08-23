(() => {
  function apply(doc){
    if(!doc) return;

    const second=doc.querySelector('.paper-section');
    if(!second) return;

    const normalize=value=>(value||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/\s+/g,' ')
      .trim()
      .toLowerCase();

    const forbiddenTexts=[
      'cuenta regresiva',
      'cada dia falta menos',
      '16 de enero',
      'estamos contando los dias para compartir este momento tan especial contigo.'
    ];

    // Elimina directamente del DOM cualquier contenido textual superpuesto de la tarjeta.
    second.querySelectorAll('#countdownOverlay,.countdown-overlay').forEach(el=>el.remove());

    const imageWrap=second.querySelector('.countdown-image-wrap');
    if(!imageWrap) return;

    // Revierte cualquier bloque/overlay artificial agregado anteriormente.
    imageWrap.querySelectorAll('.inv6-card-cleaner').forEach(el=>el.remove());

    [...imageWrap.querySelectorAll('*')].forEach(el=>{
      if(el.matches('img,picture,source')) return;
      const text=normalize(el.textContent);
      if(!text) return;
      if(forbiddenTexts.some(target=>text===target||text.includes(target))){
        el.remove();
      }
    });

    // Garantiza una sola aparición del bloque de texto exterior a la tarjeta.
    second.querySelectorAll('.inv6-between-text').forEach(el=>el.remove());

    const block=doc.createElement('div');
    block.className='inv6-between-text';
    block.innerHTML=`
      <p class="inv6-between-lead">Nos encantaría que seas parte de este<br>momento tan especial para nosotros!</p>
      <p class="inv6-between-script">¡Falta poco para el gran día y queremos<br>celebrarlo contigo!</p>`;
    second.insertBefore(block,imageWrap);

    // Conserva exactamente el tamaño actual de la segunda imagen.
    doc.getElementById('inv6-second-image-size-guard')?.remove();
    const sizeStyle=doc.createElement('style');
    sizeStyle.id='inv6-second-image-size-guard';
    sizeStyle.textContent=`
      .paper-section .countdown-image-wrap{
        position:relative !important;
        width:100% !important;
        max-width:none !important;
        margin-left:0 !important;
        margin-right:0 !important;
        padding-left:0 !important;
        padding-right:0 !important;
      }
      .paper-section .countdown-image{
        display:block !important;
        width:100% !important;
        max-width:none !important;
        height:auto !important;
        margin:0 !important;
        padding:0 !important;
      }
    `;
    doc.head.appendChild(sizeStyle);

    doc.getElementById('inv6-between-text-style')?.remove();
    const style=doc.createElement('style');
    style.id='inv6-between-text-style';
    style.textContent=`
      .paper-section .inv6-between-text{
        width:100% !important;
        margin:0 !important;
        padding:8px 22px 12px !important;
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
        transform:translateY(-26px) !important;
      }
      .paper-section .inv6-between-script{
        margin:11px auto 0 !important;
        padding:0 !important;
        font-family:'Amsterdam Four','Great Vibes',cursive !important;
        font-size:clamp(24px,5.6vw,39px) !important;
        line-height:.92 !important;
        font-weight:400 !important;
        color:#252525 !important;
      }
      @media(max-width:540px){
        .paper-section .inv6-between-text{
          padding:6px 18px 10px !important;
        }
        .paper-section .inv6-between-lead{
          font-size:clamp(14px,4vw,17px) !important;
          transform:translateY(-22px) !important;
        }
        .paper-section .inv6-between-script{
          margin-top:10px !important;
          font-size:clamp(23px,6.8vw,31px) !important;
        }
      }
    `;
    doc.head.appendChild(style);
  }

  window.inv6ApplyBetweenText=apply;
})();
