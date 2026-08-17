(() => {
  'use strict';

  const FORM_ID = 'inviteWeddingMemberForm';
  const STATUS_ID = 'inviteWeddingStatus';
  const ACCOUNT_STYLE_VERSION = '20260814-1121-account1';
  const VERSION = '20260816-1958-invites-direct5';
  const URLS = Object.freeze({
    1: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_1/',
    2: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_2/',
    3: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_3/',
    4: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_4/',
    5: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_5/'
  });

  if (!document.querySelector('link[data-account-card-style]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `css/modules/account-card.css?v=${ACCOUNT_STYLE_VERSION}`;
    link.dataset.accountCardStyle = 'true';
    document.head.appendChild(link);
  }

  function organizeAccountCard() {
    const card = document.getElementById('accountCard');
    const activeWedding = document.getElementById('activeWeddingButton');
    if (!card || !activeWedding) return false;
    if (activeWedding.parentElement !== card) card.appendChild(activeWedding);
    card.dataset.accountLayout = 'premium-v1';
    return true;
  }

  if (!organizeAccountCard()) {
    const observer = new MutationObserver(() => {
      if (organizeAccountCard()) observer.disconnect();
    });
    observer.observe(document.body || document.documentElement, { childList: true });
  }

  function setStatus(message = '', type = '') {
    const el = document.getElementById(STATUS_ID);
    if (!el) return;
    el.textContent = message;
    el.className = `invite-wedding-status${type ? ` is-${type}` : ''}`;
  }

  function numberOf(el) {
    const explicit = Number(el?.dataset?.mgdInvitationNumber || el?.dataset?.invitation || el?.dataset?.invitacion || 0);
    if (explicit >= 1 && explicit <= 5) return explicit;
    const match = String(el?.textContent || '').match(/invitaci[oó]n\s*(\d+)/i);
    return match ? Number(match[1]) : 0;
  }

  function itemFor(control) {
    return control?.closest?.('[data-invitation],[data-invitacion],li,article,.invitation-item,.invite-item,.invitation-option,.invite-option,.template-card,.model-card') || control;
  }

  function controls(root) {
    return Array.from(root.querySelectorAll('[data-invitation],[data-invitacion],button,a,[role="button"]'))
      .filter((el) => {
        const n = numberOf(el);
        return n >= 1 && n <= 5;
      });
  }

  function cloneFive(doc, items) {
    if (items.has(5) || !items.has(4)) return;
    const source = items.get(4);
    const clone = source.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.remove('active', 'is-active', 'selected', 'is-selected');
    clone.removeAttribute('aria-current');
    clone.dataset.mgdInvitationNumber = '5';

    const all = [clone, ...clone.querySelectorAll('*')];
    all.forEach((el) => {
      Array.from(el.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.nodeValue = String(node.nodeValue || '').replace(/Invitaci[oó]n\s*4/gi, 'Invitación 5');
        }
      });
      Array.from(el.attributes || []).forEach((attr) => {
        const next = String(attr.value).replace(/invitacion_4/gi, 'invitacion_5');
        if (next !== attr.value) el.setAttribute(attr.name, next);
      });
    });

    source.insertAdjacentElement('afterend', clone);
    items.set(5, clone);
  }

  function badge(doc, item) {
    if (!item || item.querySelector('.mgd-invitation-primary-badge')) return;
    item.dataset.mgdInvitationPrimary = 'true';
    const badge = doc.createElement('span');
    badge.className = 'mgd-invitation-primary-badge';
    badge.textContent = 'Invitación principal';
    badge.style.cssText = 'display:inline-flex;align-items:center;margin-left:7px;padding:3px 7px;border-radius:999px;background:#667255;color:#fff;font-size:9px;font-weight:850;line-height:1.2;white-space:nowrap;vertical-align:middle;';
    const target = Array.from(item.querySelectorAll('strong,b,span,p,div')).find((el) => /invitaci[oó]n\s*5/i.test(el.textContent || '')) || item;
    target.appendChild(badge);
  }

  function preview(root) {
    return Array.from(root.querySelectorAll('iframe')).find((frame) => {
      const rect = frame.getBoundingClientRect();
      return rect.width > 260 && rect.height > 260;
    }) || null;
  }

  function enhanceRoot(root, doc) {
    if (!root || !doc) return false;
    if (root.dataset?.mgdInvitationsFast === VERSION) return true;

    const found = controls(root);
    if (found.length < 2) return false;

    const items = new Map();
    found.forEach((control) => {
      const n = numberOf(control);
      if (n && !items.has(n)) items.set(n, itemFor(control));
    });

    if (items.size < 2) return false;
    cloneFive(doc, items);

    const ordered = [1, 2, 3, 4, 5].map((n) => items.get(n)).filter(Boolean);
    const frame = preview(root);

    ordered.forEach((item, index) => {
      const n = Number(item.dataset.mgdInvitationNumber) || numberOf(item) || index + 1;
      item.dataset.mgdInvitationNumber = String(n);
      const anchor = item.matches('a') ? item : item.querySelector('a');
      if (anchor && URLS[n]) anchor.href = URLS[n];
      if (item.dataset.mgdInvitationWired === VERSION) return;
      item.dataset.mgdInvitationWired = VERSION;
      item.addEventListener('click', (event) => {
        if (!URLS[n]) return;
        if (event.target.closest('a[target="_blank"],[data-open-external]')) return;
        if (!frame) return;
        event.preventDefault();
        ordered.forEach((candidate) => {
          candidate.classList.remove('active', 'is-active', 'selected', 'is-selected');
          candidate.removeAttribute('aria-current');
        });
        item.classList.add('active');
        item.setAttribute('aria-current', 'true');
        if (frame.src !== URLS[n]) frame.src = URLS[n];
      }, true);
    });

    badge(doc, items.get(5));
    if (root.dataset) root.dataset.mgdInvitationsFast = VERSION;
    return items.has(5);
  }

  function bindFrame(frame) {
    if (!frame || frame.dataset.mgdInvitationsFrame === VERSION) return;
    frame.dataset.mgdInvitationsFrame = VERSION;
    const run = () => {
      try {
        const doc = frame.contentDocument;
        if (doc?.body) enhanceRoot(doc.body, doc);
      } catch (_) {}
    };
    frame.addEventListener('load', run);
    run();
  }

  function scanWorkspace() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;

    // El módulo histórico puede montarse directamente dentro del workspace.
    // Este era el caso que el parche anterior no cubría.
    enhanceRoot(workspace, document);

    // Compatibilidad con módulos históricos que todavía usan iframe.
    workspace.querySelectorAll('iframe').forEach(bindFrame);
  }

  function bindWorkspace() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace || workspace.dataset.mgdInvitationsObserver === VERSION) return;
    workspace.dataset.mgdInvitationsObserver = VERSION;
    new MutationObserver(scanWorkspace).observe(workspace, { childList: true });
    scanWorkspace();
  }

  bindWorkspace();
  document.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('[data-module="invitaciones"],[data-quick-module="invitaciones"]')) {
      requestAnimationFrame(scanWorkspace);
      setTimeout(scanWorkspace, 120);
    }
  }, true);

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest(`#${FORM_ID} button`) : null;
    if (!target || target.dataset.inviteController === 'stable-v2') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setStatus('El controlador de invitaciones todavía no terminó de cargar. Recarga esta pantalla e inténtalo nuevamente.', 'error');
  }, true);
})();