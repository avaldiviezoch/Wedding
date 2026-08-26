import { TABLES_FINAL_STYLE_VERSION as FINAL_STYLE_VERSION, setTablesFinalStyleHref, trackTablesFinalStyle } from './tables-style-readiness.js';
const FINAL_STYLE_URL = new URL(`css/modules/invitados-tables-old-look.css?v=${FINAL_STYLE_VERSION}`, document.baseURI).href;

function preloadFinalStyle() {
  document.querySelectorAll('#unifiedWorkspace iframe, iframe').forEach((frame) => {
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return; }
    if (!doc?.head || !doc.getElementById('tablesView')) return;
    let link = doc.querySelector('link[data-mgd-tables-old-look]');
    if (!link) {
      link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.dataset.mgdTablesOldLook = FINAL_STYLE_VERSION;
      setTablesFinalStyleHref(link, FINAL_STYLE_URL);
      doc.head.appendChild(link);
    } else if (link.href !== FINAL_STYLE_URL) {
      setTablesFinalStyleHref(link, FINAL_STYLE_URL);
    } else trackTablesFinalStyle(link);
  });
}

preloadFinalStyle();
await import('./tables-editor.js?v=20260819-empty-onboarding1');
await Promise.all([
  import('./tables-stable-polish.js?v=20260816-1440-stable-name1'),
  import('./tables-old-look.js?v=20260816-1545-fast-tables1')
]);
