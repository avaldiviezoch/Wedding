(() => {
  'use strict';

  const VERSION = '20260816-2115-modules-responsive1';
  const MOBILE = '(max-width: 760px)';

  function isMobile() {
    return window.matchMedia(MOBILE).matches;
  }

  function ensureViewport(doc) {
    if (!doc?.head) return;
    let meta = doc.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = doc.createElement('meta');
      meta.name = 'viewport';
      doc.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
  }

  function injectResponsiveCss(doc) {
    if (!doc?.head || doc.getElementById('mgdModuleResponsiveCss')) return;
    const style = doc.createElement('style');
    style.id = 'mgdModuleResponsiveCss';
    style.textContent = `
      *,*::before,*::after{box-sizing:border-box}
      html,body{width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:hidden!important}
      body{margin-left:0!important;margin-right:0!important}
      img,svg,video,canvas{max-width:100%;height:auto}
      iframe{max-width:100%!important}
      table{max-width:100%}
      input,select,textarea,button{max-width:100%;min-width:0}

      @media(max-width:760px){
        body{font-size:14px!important}
        main,.app,.page,.page-shell,.shell,.wrapper,.container,.content,.main,.main-content,.workspace,.dashboard,.dashboard-content,.module-shell,.module-content{
          width:100%!important;max-width:100%!important;min-width:0!important;margin-left:0!important;margin-right:0!important
        }
        .container,.wrapper,.content,.main-content,.module-content{padding-left:10px!important;padding-right:10px!important}
        .grid,.dashboard-grid,.cards,.cards-grid,.form-grid,.filters-grid,.stats-grid,.kpi-grid{
          grid-template-columns:1fr!important
        }
        .row,.toolbar,.actions,.filters,.header-actions,.form-actions,.button-group{
          flex-wrap:wrap!important
        }
        .row>* , .toolbar>* , .filters>* , .form-grid>* , .grid>*{
          min-width:0!important;max-width:100%!important
        }
        table{display:block!important;width:100%!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch}
        .table-wrap,.table-wrapper,.table-responsive{width:100%!important;max-width:100%!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch}
        dialog,.modal,.modal-content,.sheet,.panel,.card{
          max-width:calc(100vw - 16px)!important
        }
        input,select,textarea{font-size:16px!important}
      }
    `;
    doc.head.appendChild(style);
  }

  function fixFrame(frame) {
    if (!(frame instanceof HTMLIFrameElement)) return;
    const apply = () => {
      if (!isMobile()) return;
      try {
        const doc = frame.contentDocument;
        if (!doc?.documentElement) return;
        ensureViewport(doc);
        injectResponsiveCss(doc);
        doc.documentElement.dataset.mgdResponsiveModule = VERSION;
      } catch (_) {}
    };
    if (frame.dataset.mgdResponsiveBound !== VERSION) {
      frame.dataset.mgdResponsiveBound = VERSION;
      frame.addEventListener('load', apply);
    }
    apply();
  }

  function normalizeWorkspace() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;
    workspace.querySelectorAll('iframe').forEach(fixFrame);
    if (isMobile()) {
      workspace.style.width = '100%';
      workspace.style.maxWidth = '100vw';
      workspace.style.minWidth = '0';
      workspace.style.overflowX = 'hidden';
    } else {
      workspace.style.removeProperty('width');
      workspace.style.removeProperty('max-width');
      workspace.style.removeProperty('min-width');
      workspace.style.removeProperty('overflow-x');
    }
  }

  function bind() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace || workspace.dataset.mgdResponsiveObserver === VERSION) return;
    workspace.dataset.mgdResponsiveObserver = VERSION;
    new MutationObserver(normalizeWorkspace).observe(workspace, { childList:true, subtree:true });
    normalizeWorkspace();
    window.matchMedia(MOBILE).addEventListener?.('change', normalizeWorkspace);
    window.addEventListener('orientationchange', () => setTimeout(normalizeWorkspace, 120));
    window.addEventListener('resize', normalizeWorkspace, { passive:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once:true });
  else bind();
})();
