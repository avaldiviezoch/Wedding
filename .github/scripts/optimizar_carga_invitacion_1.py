from pathlib import Path

p = Path('invitacion_1.html')
s = p.read_text(encoding='utf-8')
marker = 'OPTIMIZACION_CARGA_INVITACION_1_V1'
if marker in s:
    raise SystemExit('La optimización ya está aplicada')

head_block = r'''
<!-- OPTIMIZACION_CARGA_INVITACION_1_V1 -->
<link rel="preconnect" href="https://raw.githubusercontent.com" crossorigin>
<link rel="preconnect" href="https://lh3.googleusercontent.com" crossorigin>
<link rel="preconnect" href="https://drive.google.com" crossorigin>
<link rel="dns-prefetch" href="//raw.githubusercontent.com">
<link rel="dns-prefetch" href="//lh3.googleusercontent.com">
<link rel="dns-prefetch" href="//drive.google.com">
<style id="loading-optimization-1">
  img.media-load-failed{opacity:0 !important; visibility:hidden !important;}
  .media-loading-soft{background:rgba(255,255,255,.08);}
</style>
'''

body_block = r'''
<script id="loading-optimization-script-1">
(() => {
  const isImageUrl = (url) => /\.(png|jpe?g|gif|webp|avif)(\?|#|$)/i.test(url || '');
  const normalize = (url) => {
    try { return new URL(url, document.baseURI).href; } catch (_) { return url; }
  };

  // Evita el icono de imagen rota y deja que el fondo/diseño de la sección permanezca limpio.
  const protectImage = (img) => {
    if (!img || img.dataset.loadProtected === '1') return;
    img.dataset.loadProtected = '1';
    img.decoding = 'async';
    img.addEventListener('error', () => {
      img.classList.add('media-load-failed');
      const parent = img.parentElement;
      if (parent) parent.classList.add('media-loading-soft');
    }, { once:true });
    img.addEventListener('load', () => {
      img.classList.remove('media-load-failed');
      const parent = img.parentElement;
      if (parent) parent.classList.remove('media-loading-soft');
    });
  };

  document.querySelectorAll('img').forEach(protectImage);

  // Si el HTML inserta imágenes después, también quedan protegidas.
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.tagName === 'IMG') protectImage(node);
        node.querySelectorAll?.('img').forEach(protectImage);
      }
    }
  });
  mo.observe(document.documentElement, { childList:true, subtree:true });

  const urls = [];
  const seen = new Set();
  const add = (u) => {
    if (!u || u.startsWith('data:') || u.startsWith('blob:')) return;
    const n = normalize(u);
    if (!isImageUrl(n) || seen.has(n)) return;
    seen.add(n);
    urls.push(n);
  };

  document.querySelectorAll('img').forEach(img => add(img.currentSrc || img.src));
  document.querySelectorAll('[style*="background"]').forEach(el => {
    const style = el.getAttribute('style') || '';
    for (const m of style.matchAll(/url\(["']?([^"')]+)["']?\)/g)) add(m[1]);
  });

  const preloadOne = (url) => new Promise(resolve => {
    const i = new Image();
    i.decoding = 'async';
    i.onload = i.onerror = () => resolve();
    i.src = url;
  });

  const preloadQueue = async (items, concurrency = 2) => {
    let index = 0;
    const worker = async () => {
      while (index < items.length) {
        const current = items[index++];
        await preloadOne(current);
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  };

  // Primer bloque: pocas imágenes y con prioridad alta para no bloquear toda la invitación.
  const critical = urls.slice(0, 5);
  critical.forEach((url, idx) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    if (idx < 2) link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
  });
  preloadQueue(critical, 3);

  // El resto se descarga progresivamente cuando el navegador ya tiene aire.
  const remaining = urls.slice(5);
  const startBackgroundPreload = () => preloadQueue(remaining, 2);
  if ('requestIdleCallback' in window) {
    requestIdleCallback(startBackgroundPreload, { timeout: 2500 });
  } else {
    setTimeout(startBackgroundPreload, 1200);
  }

  // Cache persistente para siguientes aperturas cuando GitHub Pages permita Service Worker.
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./wedding-sw.js').catch(() => {});
    }, { once:true });
  }
})();
</script>
'''

if '</head>' not in s or '</body>' not in s:
    raise SystemExit('Estructura HTML inesperada')

s = s.replace('</head>', head_block + '\n</head>', 1)
s = s.replace('</body>', body_block + '\n</body>', 1)
p.write_text(s, encoding='utf-8')
