(() => {
  const frame = document.getElementById('phase2Frame');
  if (!frame) return;

  function loadP1ProposalPreview(doc) {
    if (doc.documentElement.dataset.phase2P1ProposalPreviewHost === 'ready') return;
    doc.documentElement.dataset.phase2P1ProposalPreviewHost = 'ready';
    const script = doc.createElement('script');
    script.src = 'phase2-p1-proposal-preview.js?v=20260902-p1c-1';
    script.dataset.phase2P1ProposalPreview = 'runtime';
    script.onerror = () => console.error('No se pudieron cargar las vistas previas P1 de Propuestas.');
    doc.body.appendChild(script);
  }

  function loadP1Spatial(doc) {
    if (doc.documentElement.dataset.phase2P1SpatialHost === 'ready') return;
    doc.documentElement.dataset.phase2P1SpatialHost = 'ready';

    const style = doc.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'phase2-p1-spatial.css?v=20260902-p1c-1';
    style.dataset.phase2P1Spatial = 'style';
    doc.head.appendChild(style);

    const script = doc.createElement('script');
    script.src = 'phase2-p1-spatial.js?v=20260902-p1c-1';
    script.dataset.phase2P1Spatial = 'runtime';
    script.onload = () => loadP1ProposalPreview(doc);
    script.onerror = () => console.error('No se pudo cargar el bloque espacial P1 de Distribución.');
    doc.body.appendChild(script);
  }

  function loadP1Editor(doc) {
    if (doc.documentElement.dataset.phase2P1EditorHost === 'ready') return;
    doc.documentElement.dataset.phase2P1EditorHost = 'ready';
    const script = doc.createElement('script');
    script.src = 'phase2-p1-editor.js?v=20260902-p1b-1';
    script.dataset.phase2P1Editor = 'runtime';
    script.onload = () => loadP1Spatial(doc);
    script.onerror = () => console.error('No se pudo cargar el bloque de editor P1 de Distribución.');
    doc.body.appendChild(script);
  }

  function loadP1(doc) {
    if (doc.documentElement.dataset.phase2P1Host === 'ready') return;
    doc.documentElement.dataset.phase2P1Host = 'ready';
    const script = doc.createElement('script');
    script.src = 'phase2-p1.js?v=20260902-p1-2';
    script.dataset.phase2P1 = 'runtime';
    script.onload = () => loadP1Editor(doc);
    script.onerror = () => console.error('No se pudo cargar la paridad P1 de interacciones de Distribución.');
    doc.body.appendChild(script);
  }

  function install() {
    const doc = frame.contentDocument;
    if (!doc || doc.documentElement.dataset.phase2P0Host === 'ready') return;
    doc.documentElement.dataset.phase2P0Host = 'ready';

    const style = doc.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'phase2-p0.css?v=20260902-p0-1';
    style.dataset.phase2P0 = 'style';
    doc.head.appendChild(style);

    const script = doc.createElement('script');
    script.src = 'phase2-p0.js?v=20260902-p0-1';
    script.dataset.phase2P0 = 'runtime';
    script.onload = () => loadP1(doc);
    script.onerror = () => console.error('No se pudo cargar la paridad P0 de Distribución.');
    doc.body.appendChild(script);
  }

  frame.addEventListener('load', install);
  try {
    if (frame.contentDocument?.readyState === 'complete') install();
  } catch (_) {}
})();
