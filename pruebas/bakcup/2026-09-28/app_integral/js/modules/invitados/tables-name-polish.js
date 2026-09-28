(() => {
  'use strict';

  const VERSION = '20260816-1405-namefit1';
  let timer = 0;
  let observer = null;

  function fontForName(text) {
    const length = String(text || '').trim().length;
    if (length <= 11) return '14px';
    if (length <= 16) return '12px';
    if (length <= 21) return '10.5px';
    if (length <= 25) return '9.5px';
    return '8.5px';
  }

  function fitNames(doc) {
    doc.querySelectorAll('.mgd-table-body strong').forEach((node) => {
      node.style.setProperty('font-size', fontForName(node.textContent), 'important');
    });
  }

  function apply(frame) {
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return false; }
    if (!doc?.head || !doc.getElementById('mgdTablesEditor')) return false;

    if (!doc.getElementById('mgdTablesNamePolish')) {
      const style = doc.createElement('style');
      style.id = 'mgdTablesNamePolish';
      style.textContent = `
        /* Guardar cambios: siempre legible */
        #mgdSaveTable,
        .mgd-modal-actions #mgdSaveTable.mgd-btn.primary{
          color:#111 !important;
          background:#f3eee4 !important;
          border-color:rgba(47,52,45,.18) !important;
          text-shadow:none !important;
        }
        #mgdSaveTable:hover{
          color:#000 !important;
          background:#e9e1d5 !important;
        }

        /* Nombre de mesa adaptable a cualquier forma */
        .mgd-table-body{
          gap:0 !important;
          padding:10px 8px !important;
          overflow:hidden !important;
        }
        .mgd-table-body strong{
          display:-webkit-box !important;
          width:88% !important;
          max-width:88% !important;
          min-width:0 !important;
          max-height:2.25em !important;
          overflow:hidden !important;
          text-overflow:ellipsis !important;
          white-space:normal !important;
          overflow-wrap:anywhere !important;
          word-break:break-word !important;
          -webkit-box-orient:vertical !important;
          -webkit-line-clamp:2 !important;
          line-clamp:2 !important;
          line-height:1.05 !important;
          text-align:center !important;
          flex:0 1 auto !important;
        }
        .mgd-table-body span{
          display:block !important;
          margin-top:7px !important;
          font-size:9px !important;
          line-height:1 !important;
          color:#786f66 !important;
          white-space:nowrap !important;
          flex:0 0 auto !important;
        }

        .mgd-table-body.round strong,
        .mgd-table-body.square strong{
          width:82% !important;
          max-width:82% !important;
        }

        .mgd-table-body.rectangular strong{
          width:90% !important;
          max-width:90% !important;
        }
      `;
      doc.head.appendChild(style);
    }

    fitNames(doc);

    const root = doc.getElementById('mgdTablesEditor');
    if (root && root.dataset.mgdNamePolish !== VERSION) {
      root.dataset.mgdNamePolish = VERSION;
      observer?.disconnect();
      observer = new MutationObserver(() => fitNames(doc));
      observer.observe(root, { childList:true, subtree:true, characterData:true });
    }

    return true;
  }

  function scan() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;
    for (const frame of workspace.querySelectorAll('iframe')) {
      if (apply(frame)) {
        if (timer) clearInterval(timer);
        timer = 0;
        return;
      }
    }
  }

  scan();
  timer = setInterval(scan, 150);
  setTimeout(() => { if (timer) clearInterval(timer); timer = 0; }, 8000);
})();
