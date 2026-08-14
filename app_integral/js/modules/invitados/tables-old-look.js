(() => {
  'use strict';

  const VERSION = '20260814-1712-oldlook2';
  const CSS_HREF = new URL(`css/modules/invitados-tables-old-look.css?v=${VERSION}`, document.baseURI).href;
  let timer = 0;
  let attempts = 0;

  function ensureCss(doc) {
    let link = doc.querySelector('link[data-mgd-tables-old-look]');
    if (!link) {
      link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.dataset.mgdTablesOldLook = VERSION;
      doc.head.appendChild(link);
    }
    if (link.href !== CSS_HREF) link.href = CSS_HREF;
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
    const host = doc.getElementById('tablesView') || doc.body;
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
    }).observe(host, {
      childList: true,
      subtree: true
    });
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
          frame.addEventListener('load', () => setTimeout(() => apply(frame), 80));
        }
        if (apply(frame)) found = true;
      });
    }

    if (found || attempts >= 40) {
      if (timer) clearInterval(timer);
      timer = 0;
    }
  }

  scan();
  if (!timer) timer = setInterval(scan, 120);
})();
