(() => {
  function apply(doc){
    if(!doc) return;

    const second=doc.querySelector('.paper-section');
    if(!second) return;

    // Solo elimina el contenido superpuesto interno de esta sección.
    second.querySelector('.countdown-overlay')?.remove();

    // El bloque superior ya existe en la invitación base; elimina cualquier
    // copia adicional creada por ajustes anteriores.
    second.querySelectorAll('.inv6-between-text').forEach(el=>el.remove());

    // Protección final: restaura exactamente el ancho base de la Invitación 5
    // y evita que un estilo anterior en caché vuelva a encoger la segunda imagen.
    doc.getElementById('inv6-second-image-size-guard')?.remove();
    const style=doc.createElement('style');
    style.id='inv6-second-image-size-guard';
    style.textContent=`
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
    doc.head.appendChild(style);

    doc.getElementById('inv6-between-text-style')?.remove();
  }

  window.inv6ApplyBetweenText=apply;
})();
