(() => {
  function apply(doc){
    if(!doc) return;

    const second=doc.querySelector('.paper-section');
    if(!second) return;

    // Mantiene la imagen en su tamaño y posición actuales.
    // Solo elimina el contenido superpuesto interno de la sección.
    second.querySelector('.countdown-overlay')?.remove();

    // El bloque superior ya existe en la invitación base; elimina cualquier
    // copia adicional creada por ajustes anteriores.
    second.querySelectorAll('.inv6-between-text').forEach(el=>el.remove());
    doc.getElementById('inv6-between-text-style')?.remove();
  }

  window.inv6ApplyBetweenText=apply;
})();
