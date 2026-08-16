(() => {
  'use strict';

  const VERSION = '20260816-1418-stable2';
  let timer = 0;
  let attempts = 0;

  function apply(frame) {
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return false; }
    if (!doc?.head || !doc.getElementById('mgdTablesEditor')) return false;

    let style = doc.getElementById('mgdTablesStablePolish');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'mgdTablesStablePolish';
      doc.head.appendChild(style);
    }

    style.textContent = `
      /* Hotfix estable: mesas grandes, limpias y sin microcontroles experimentales */
      #tablesView.mgd-tables-enhanced{overflow:visible!important}
      .mgd-tables-editor{padding-top:22px!important}
      .mgd-tables-layout{grid-template-columns:minmax(0,1fr) minmax(270px,310px)!important;gap:22px!important}
      .mgd-table-stage{padding:22px!important;border-radius:24px!important}
      .mgd-table-grid{grid-template-columns:repeat(auto-fit,minmax(350px,1fr))!important;gap:20px!important}
      .mgd-table-card{min-height:390px!important;border-radius:22px!important;padding-top:10px!important;background:rgba(255,255,255,.82)!important}
      .mgd-table-visual{transform:scale(1.16);transform-origin:center center;margin:32px auto 28px!important}
      .mgd-table-meta{padding:8px 20px 20px!important}

      /* Nombre de mesa: hasta 2 líneas y siempre dentro de cualquier forma */
      .mgd-table-body{gap:0!important;padding:10px 8px!important;overflow:hidden!important}
      .mgd-table-body strong{
        display:-webkit-box!important;
        width:88%!important;
        max-width:88%!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        white-space:normal!important;
        overflow-wrap:anywhere!important;
        word-break:break-word!important;
        -webkit-box-orient:vertical!important;
        -webkit-line-clamp:2!important;
        line-height:1.05!important;
        font-size:10px!important;
        text-align:center!important;
      }
      .mgd-table-body.round strong,.mgd-table-body.square strong{width:80%!important;max-width:80%!important;font-size:9.5px!important}
      .mgd-table-body.rectangular strong{width:92%!important;max-width:92%!important;font-size:10.5px!important}
      .mgd-table-body span{display:block!important;margin-top:7px!important;font-size:8.5px!important;line-height:1!important;color:#786f66!important;white-space:nowrap!important}

      .mgd-seat{width:34px!important;height:34px!important;margin:-17px 0 0 -17px!important;font-size:11px!important}
      .mgd-table-edit{width:40px!important;height:40px!important;top:12px!important;right:12px!important;font-size:18px!important}
      .mgd-guests-panel{border-radius:22px!important}
      .mgd-guests-head{padding:18px 18px 12px!important}
      .mgd-guests-head h3{font-size:18px!important}
      .mgd-guests-head p{font-size:12px!important;line-height:1.45!important}
      .mgd-search{width:calc(100% - 36px)!important;margin:0 18px 12px!important;min-height:44px!important;font-size:13px!important}
      .mgd-filter-row{padding:0 18px 12px!important}
      .mgd-filter{min-height:34px!important;padding:8px 11px!important;font-size:11px!important}
      .mgd-guest-item{min-height:58px!important}
      .mgd-btn{min-height:44px!important;font-size:13px!important}
      .mgd-add-table{padding-inline:18px!important}

      /* Guardar cambios: texto negro y fondo claro */
      #mgdSaveTable,#mgdSaveTable.mgd-btn.primary{
        color:#111!important;
        background:#f3eee4!important;
        border-color:rgba(47,52,45,.20)!important;
        text-shadow:none!important;
      }
      #mgdSaveTable:hover{color:#000!important;background:#e8dfd2!important}

      /* Si quedaron nodos de una versión anterior en memoria, no se muestran */
      [data-table-order-drag],
      [data-table-order-prev],
      [data-table-order-next],
      .mgd-table-order-controls,
      .mgd-table-move-handle,
      .mgd-canvas-toolbar,
      .mgd-table-canvas-toolbar,
      #mgdTablesCanvasToolbar{display:none!important}

      @media (max-width:1100px){
        .mgd-tables-layout{grid-template-columns:1fr!important}
        .mgd-guests-panel{position:relative!important;top:auto!important}
        .mgd-table-grid{grid-template-columns:repeat(auto-fit,minmax(320px,1fr))!important}
      }
      @media (max-width:720px){
        .mgd-table-stage{padding:14px!important}
        .mgd-table-grid{grid-template-columns:1fr!important;gap:16px!important}
        .mgd-table-card{min-height:370px!important}
        .mgd-table-visual{transform:scale(1.10);margin:28px auto 22px!important}
        .mgd-tables-topbar{align-items:flex-start!important;flex-wrap:wrap!important}
        .mgd-add-table{width:100%!important;justify-content:center!important}
      }
    `;

    const root = doc.getElementById('mgdTablesEditor');
    root?.setAttribute('data-stable-runtime', VERSION);
    return true;
  }

  function scan() {
    attempts += 1;
    const workspace = document.getElementById('unifiedWorkspace');
    if (workspace) {
      for (const frame of workspace.querySelectorAll('iframe')) {
        if (apply(frame)) {
          clearInterval(timer);
          timer = 0;
          return;
        }
      }
    }
    if (attempts >= 25 && timer) {
      clearInterval(timer);
      timer = 0;
    }
  }

  scan();
  if (!timer) timer = setInterval(scan, 120);
})();