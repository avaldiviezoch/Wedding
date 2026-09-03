(() => {
  const frame = document.getElementById('phase2Frame');
  if (!frame) return;

  const ENGINE_SCRIPTS = [
    'engine/geometry.js',
    'engine/collisions.js',
    'engine/clearance.js',
    'engine/round-table-contract.js',
    'engine/square-table-contract.js',
    'engine/rectangular-table-contract.js',
    'engine/tables.js',
    'engine/seats.js',
    'engine/capacity-layout.js',
    'engine/measurements.js',
    'engine/validation.js',
    'state/memory-store.js',
    'adapters/mock-app-lu.js'
  ];

  const RENDERER_UI_SCRIPTS = [
    'renderer/tables.js',
    'renderer/chairs.js',
    'renderer/labels.js',
    'renderer/tents.js',
    'ui/planner.js',
    'ui/inspector.js',
    'ui/layers.js',
    'ui/risks.js',
    'ui/proposals.js',
    'ui/mobile.js'
  ];

  function loadScript(doc, src, onload) {
    const script = doc.createElement('script');
    script.src = src.includes('?') ? src : `${src}?v=20260903-cap1`;
    script.onload = onload || null;
    script.onerror = () => console.error(`No se pudo cargar ${src}`);
    doc.body.appendChild(script);
  }

  function loadSeries(doc, scripts, done, index = 0) {
    if (index >= scripts.length) return done?.();
    loadScript(doc, scripts[index], () => loadSeries(doc, scripts, done, index + 1));
  }

  function loadEngine(doc, done, index = 0) {
    if (index >= ENGINE_SCRIPTS.length) return done?.();
    loadScript(doc, ENGINE_SCRIPTS[index], () => loadEngine(doc, done, index + 1));
  }

  function loadRendererUi(doc) {
    loadSeries(doc, RENDERER_UI_SCRIPTS, () => loadScript(doc, 'phase2-renderer-ui-bridge.js', () => loadScript(doc, 'phase2-square.js', () => loadScript(doc, 'phase2-rectangular.js', () => loadScript(doc, 'phase2-capacity.js')))));
  }

  function loadSanitize(doc) {
    if (doc.documentElement.dataset.phase2SanitizeHost === 'ready') return;
    doc.documentElement.dataset.phase2SanitizeHost = 'ready';
    loadEngine(doc, () => loadScript(doc, 'phase2-sanitize.js', () => loadRendererUi(doc)));
  }

  function loadP2Close(doc) {
    if (doc.documentElement.dataset.phase2P2CloseHost === 'ready') return;
    doc.documentElement.dataset.phase2P2CloseHost = 'ready';
    const style = doc.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'phase2-p2-close.css?v=20260903-p21-1';
    style.dataset.phase2P2Close = 'style';
    doc.head.appendChild(style);
    const script = doc.createElement('script');
    script.src = 'phase2-p2-close.js?v=20260903-p21-1';
    script.dataset.phase2P2Close = 'runtime';
    script.onload = () => loadSanitize(doc);
    script.onerror = () => console.error('No se pudo cargar el cierre P2.1 de Distribución.');
    doc.body.appendChild(script);
  }

  function loadP2(doc) {
    if (doc.documentElement.dataset.phase2P2Host === 'ready') return;
    doc.documentElement.dataset.phase2P2Host = 'ready';
    const style = doc.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'phase2-p2.css?v=20260903-p2-1';
    style.dataset.phase2P2 = 'style';
    doc.head.appendChild(style);
    const script = doc.createElement('script');
    script.src = 'phase2-p2.js?v=20260903-p2-1';
    script.dataset.phase2P2 = 'runtime';
    script.onload = () => loadP2Close(doc);
    script.onerror = () => console.error('No se pudo cargar P2 de Distribución.');
    doc.body.appendChild(script);
  }

  function loadP1ProposalPreview(doc) {
    if (doc.documentElement.dataset.phase2P1ProposalPreviewHost === 'ready') return;
    doc.documentElement.dataset.phase2P1ProposalPreviewHost = 'ready';
    const script = doc.createElement('script');
    script.src = 'phase2-p1-proposal-preview.js?v=20260902-p1c-1';
    script.dataset.phase2P1ProposalPreview = 'runtime';
    script.onload = () => loadP2(doc);
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
  try { if (frame.contentDocument?.readyState === 'complete') install(); } catch (_) {}
})();