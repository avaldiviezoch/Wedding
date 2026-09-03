(() => {
  const frame = document.getElementById('phase2Frame');
  if (!frame) return;

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
    script.onerror = () => console.error('No se pudo cargar la paridad P0 de Distribución.');
    doc.body.appendChild(script);
  }

  frame.addEventListener('load', install);
  try {
    if (frame.contentDocument?.readyState === 'complete') install();
  } catch (_) {}
})();
