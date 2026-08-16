(() => {
  'use strict';

  const VERSION = '20260816-1545-fast-tables1';
  const CSS_HREF = new URL(`css/modules/invitados-tables-old-look.css?v=${VERSION}`, document.baseURI).href;
  let timer = 0;
  let attempts = 0;

  function ensureFinalFix(doc) {
    let style = doc.getElementById('mgdTablesFinalFix');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'mgdTablesFinalFix';
      doc.head.appendChild(style);
    }
    style.textContent = `
      #mgdTablesEditor[data-old-table-look="1"] .mgd-table-body strong{
        display:-webkit-box!important;
        width:88%!important;
        max-width:88%!important;
        min-width:0!important;
        max-height:2.45em!important;
        overflow:hidden!important;
        text-overflow:clip!important;
        white-space:normal!important;
        overflow-wrap:anywhere!important;
        word-break:break-word!important;
        -webkit-box-orient:vertical!important;
        -webkit-line-clamp:2!important;
        line-clamp:2!important;
        line-height:1.08!important;
        font-size:10px!important;
        text-align:center!important;
      }
      #mgdTablesEditor[data-old-table-look="1"] .mgd-table-body.round strong{width:76%!important;max-width:76%!important;font-size:8.8px!important}
      #mgdTablesEditor[data-old-table-look="1"] .mgd-table-body.square strong{width:82%!important;max-width:82%!important;font-size:9.2px!important}
      #mgdTablesEditor[data-old-table-look="1"] .mgd-table-body.rectangular strong{width:93%!important;max-width:93%!important;font-size:9.8px!important}
      #mgdTablesEditor[data-old-table-look="1"] .mgd-table-body span{display:block!important;margin-top:8px!important;font-size:7.8px!important;line-height:1!important;white-space:nowrap!important}

      #mgdSaveTable,
      #mgdTablesModal #mgdSaveTable,
      .mgd-modal-actions #mgdSaveTable.mgd-btn.primary{
        color:#111!important;
        background:#eee7dc!important;
        border-color:rgba(47,52,45,.22)!important;
        text-shadow:none!important;
        opacity:1!important;
      }
      #mgdSaveTable:hover,
      #mgdTablesModal #mgdSaveTable:hover{color:#000!important;background:#dfd4c5!important}
    `;
  }

  function ensureCss(doc) {
    let link = doc.querySelector('link[data-mgd-tables-old-look]');
    if (!link) {
      link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.dataset.mgdTablesOldLook = VERSION;
      doc.head.appendChild(link);
    }
    if (link.href !== CSS_HREF) link.href = CSS_HREF;
    ensureFinalFix(doc);
  }

  function shortSeatLabel(seat) {
    if (!seat?.dataset?.guestId) return 'Asiento';
    const title = String(seat.getAttribute('title') || '').trim();
    if (!title) return 'Invitado';
    const name = title.split('·')[0].trim();
    return name || 'Invitado';
  }

  function decorate(doc) {
    const editor = doc.getElementById('mgdTablesEditor');
    if (!editor) return false;
    ensureCss(doc);
    editor.dataset.oldTableLook = '1';
    editor.dataset.oldTableLookVersion = VERSION;
    editor.querySelectorAll('.mgd-table-edit').forEach((button) => {
      button.dataset.oldLookEdit = VERSION;
      button.textContent = '✎';
      button.setAttribute('title', 'Editar mesa');
    });
    editor.querySelectorAll('.mgd-seat').forEach((seat) => {
      seat.dataset.seatLabel = shortSeatLabel(seat);
    });
    return true;
  }

  function ensureObserver(doc) {
    const host = doc.body;
    if (!host || doc.documentElement.dataset.mgdOldLookObserver === VERSION) return;
    doc.documentElement.dataset.mgdOldLookObserver = VERSION;
    let scheduled = false;
    new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        decorate(doc);
      });
    }).observe(host, { childList:true, subtree:true });
  }

  function apply(frame) {
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return false; }
    if (!doc?.head || !doc.body || !doc.getElementById('tablesView')) return false;
    ensureObserver(doc);
    return decorate(doc);
  }

  function scan() {
    attempts += 1;
    const workspace = document.getElementById('unifiedWorkspace');
    let found = false;
    if (workspace) {
      workspace.querySelectorAll('iframe').forEach((frame) => {
        if (frame.dataset.mgdOldLookLoadBound !== VERSION) {
          frame.dataset.mgdOldLookLoadBound = VERSION;
          frame.addEventListener('load', () => setTimeout(() => apply(frame), 40));
        }
        if (apply(frame)) found = true;
      });
    }
    if (found || attempts >= 20) {
      if (timer) clearInterval(timer);
      timer = 0;
    }
  }

  scan();
  if (!timer) timer = setInterval(scan, 80);
})();
