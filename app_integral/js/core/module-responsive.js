(() => {
  'use strict';

  const VERSION = '20260817-1932-modules-responsive3-distribucion-native';
  const MOBILE = '(max-width: 760px)';

  function isMobile() {
    return window.matchMedia(MOBILE).matches;
  }

  function currentModule() {
    return location.hash.replace(/^#/, '').trim().toLowerCase();
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
        html,body{min-height:100%!important;height:auto!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important}
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

  function ensureParentResponsiveCss() {
    if (document.getElementById('mgdParentModuleResponsiveCss')) return;
    const style = document.createElement('style');
    style.id = 'mgdParentModuleResponsiveCss';
    style.textContent = `
      @media(max-width:760px){
        body.module-view #unifiedWorkspace{
          position:fixed!important;
          inset:64px 0 0!important;
          width:100%!important;
          max-width:100vw!important;
          height:calc(100dvh - 64px)!important;
          min-height:0!important;
          overflow-x:hidden!important;
          overflow-y:auto!important;
          -webkit-overflow-scrolling:touch!important;
          overscroll-behavior-y:contain!important;
          touch-action:pan-y!important;
        }
        body.module-view #unifiedWorkspace .mgd-inv-panel{
          min-height:max-content!important;
          height:auto!important;
          padding-bottom:calc(24px + env(safe-area-inset-bottom))!important;
          touch-action:pan-y!important;
        }
        body.module-view #unifiedWorkspace .mgd-inv-preview-card{
          overflow:visible!important;
        }
        body.module-view #unifiedWorkspace .mgd-inv-stage{
          overflow:visible!important;
          min-height:0!important;
          height:auto!important;
          padding-bottom:16px!important;
          touch-action:pan-y!important;
        }
        body.module-view #unifiedWorkspace .mgd-phone{
          height:min(650px,calc(100dvh - 190px))!important;
          min-height:500px!important;
        }
        body.module-view #unifiedWorkspace .mgd-phone-screen{
          overflow:auto!important;
          -webkit-overflow-scrolling:touch!important;
          overscroll-behavior:contain!important;
          touch-action:pan-y!important;
        }
        body.module-view #unifiedWorkspace .mgd-phone-screen iframe{
          display:block!important;
          width:100%!important;
          height:100%!important;
          min-height:100%!important;
          pointer-events:auto!important;
          touch-action:pan-y!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function fixFrame(frame) {
    if (!(frame instanceof HTMLIFrameElement)) return;
    const apply = () => {
      if (!isMobile()) return;
      try {
        const doc = frame.contentDocument;
        if (!doc?.documentElement) return;
        ensureViewport(doc);
        if (currentModule() === 'distribucion') {
          doc.getElementById('mgdModuleResponsiveCss')?.remove();
          doc.documentElement.dataset.mgdResponsiveModule = 'distribucion-css';
          return;
        }
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
    ensureParentResponsiveCss();
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;
    workspace.querySelectorAll('iframe').forEach(fixFrame);
    if (isMobile()) {
      workspace.style.width = '100%';
      workspace.style.maxWidth = '100vw';
      workspace.style.minWidth = '0';
      workspace.style.overflowX = 'hidden';
      workspace.style.overflowY = 'auto';
      workspace.style.webkitOverflowScrolling = 'touch';
    } else {
      workspace.style.removeProperty('width');
      workspace.style.removeProperty('max-width');
      workspace.style.removeProperty('min-width');
      workspace.style.removeProperty('overflow-x');
      workspace.style.removeProperty('overflow-y');
      workspace.style.removeProperty('-webkit-overflow-scrolling');
    }
  }

  function bind() {
    ensureParentResponsiveCss();
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace || workspace.dataset.mgdResponsiveObserver === VERSION) return;
    workspace.dataset.mgdResponsiveObserver = VERSION;
    new MutationObserver(normalizeWorkspace).observe(workspace, { childList:true, subtree:true });
    normalizeWorkspace();
    window.matchMedia(MOBILE).addEventListener?.('change', normalizeWorkspace);
    window.addEventListener('orientationchange', () => setTimeout(normalizeWorkspace, 120));
    window.addEventListener('resize', normalizeWorkspace, { passive:true });
    window.addEventListener('hashchange', () => setTimeout(normalizeWorkspace, 0));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once:true });
  else bind();
})();
