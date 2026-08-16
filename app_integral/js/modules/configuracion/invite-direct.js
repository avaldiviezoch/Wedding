(() => {
  // Capa ligera de soporte visual y diagnóstico. No crea otra instancia Firebase.
  const FORM_ID = 'inviteWeddingMemberForm';
  const STATUS_ID = 'inviteWeddingStatus';
  const ACCOUNT_STYLE_VERSION = '20260814-1121-account1';
  const INVITATIONS_VERSION = '20260816-1702-five-invites1';
  const INVITATION_URLS = Object.freeze({
    1: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_1/',
    2: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_2/',
    3: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_3/',
    4: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_4/',
    5: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_5/'
  });

  // El enlace oficial y app_integral usan la misma hoja de estilo.
  if (!document.querySelector('link[data-account-card-style]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = `css/modules/account-card.css?v=${ACCOUNT_STYLE_VERSION}`;
    style.dataset.accountCardStyle = 'true';
    document.head.appendChild(style);
  }

  // weddings.js crea la tarjeta de boda activa dentro de .account-copy.
  // Para el nuevo diseño la movemos al nivel principal de #accountCard.
  // Mover un nodo conserva sus listeners, id y comportamiento Firebase.
  function organizeAccountCard() {
    const card = document.getElementById('accountCard');
    const activeWedding = document.getElementById('activeWeddingButton');
    if (!card || !activeWedding) return false;

    if (activeWedding.parentElement !== card) {
      card.appendChild(activeWedding);
    }
    card.dataset.accountLayout = 'premium-v1';
    return true;
  }

  if (!organizeAccountCard()) {
    const observer = new MutationObserver(() => {
      if (organizeAccountCard()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function setStatus(message = '', type = '') {
    const el = document.getElementById(STATUS_ID);
    if (!el) return;
    el.textContent = message;
    el.className = `invite-wedding-status${type ? ` is-${type}` : ''}`;
  }

  function invitationNumber(element) {
    const text = String(element?.textContent || '');
    const match = text.match(/invitaci[oó]n\s*(\d+)/i);
    return match ? Number(match[1]) : 0;
  }

  function closestInvitationItem(element) {
    if (!element) return null;
    return element.closest('[data-invitation],[data-invitacion],li,article,.invitation-item,.invite-item,.invitation-option,.invite-option,.template-card,.model-card') || element;
  }

  function findInvitationControls(doc) {
    return Array.from(doc.querySelectorAll('button,a,[role="button"],[data-invitation],[data-invitacion]'))
      .filter((element) => {
        const n = invitationNumber(element);
        return n >= 1 && n <= 5;
      });
  }

  function replaceFourWithFive(root) {
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      node.nodeValue = String(node.nodeValue || '')
        .replace(/Invitaci[oó]n\s*4/gi, 'Invitación 5')
        .replace(/invitacion_4/gi, 'invitacion_5');
    }
    [root, ...root.querySelectorAll('*')].forEach((element) => {
      Array.from(element.attributes || []).forEach((attr) => {
        if (!/4|invitacion_4/i.test(attr.value)) return;
        const value = attr.value
          .replace(/invitacion_4/gi, 'invitacion_5')
          .replace(/invitaci[oó]n[-_ ]?4/gi, 'invitacion_5');
        try { element.setAttribute(attr.name, value); } catch (_) {}
      });
    });
  }

  function ensurePrimaryBadge(doc, item) {
    if (!item) return;
    item.dataset.mgdInvitationPrimary = 'true';
    if (item.querySelector('.mgd-invitation-primary-badge')) return;
    const badge = doc.createElement('span');
    badge.className = 'mgd-invitation-primary-badge';
    badge.textContent = 'Invitación principal';
    badge.style.cssText = 'display:inline-flex;align-items:center;margin-left:7px;padding:3px 7px;border-radius:999px;background:#667255;color:#fff;font-size:9px;font-weight:850;line-height:1.2;white-space:nowrap;vertical-align:middle;';
    const label = Array.from(item.querySelectorAll('strong,b,span,p,div')).find((el) => /invitaci[oó]n\s*5/i.test(el.textContent || ''));
    (label || item).appendChild(badge);
  }

  function findPreviewFrame(doc, items) {
    const itemSet = new Set(items);
    return Array.from(doc.querySelectorAll('iframe')).find((frame) => {
      if (itemSet.has(frame)) return false;
      const rect = frame.getBoundingClientRect();
      return rect.width > 260 && rect.height > 300;
    }) || doc.querySelector('iframe');
  }

  function wireInvitationItem(doc, item, number, allItems) {
    if (!item || !INVITATION_URLS[number]) return;
    item.dataset.mgdInvitationNumber = String(number);
    const anchor = item.matches('a') ? item : item.querySelector('a');
    if (anchor) anchor.href = INVITATION_URLS[number];

    if (item.dataset.mgdInvitationWired === INVITATIONS_VERSION) return;
    item.dataset.mgdInvitationWired = INVITATIONS_VERSION;
    item.addEventListener('click', (event) => {
      if (event.target.closest('a[target="_blank"],button[data-open-external],[data-open-external]')) return;
      const frame = findPreviewFrame(doc, allItems);
      if (!frame) return;
      event.preventDefault();
      allItems.forEach((candidate) => {
        candidate.classList.remove('active','is-active','selected','is-selected');
        candidate.removeAttribute('aria-current');
      });
      item.classList.add('active');
      item.setAttribute('aria-current', 'true');
      if (frame.src !== INVITATION_URLS[number]) frame.src = INVITATION_URLS[number];
    }, true);
  }

  function enhanceInvitationDocument(doc) {
    if (!doc?.body) return false;
    let controls = findInvitationControls(doc);
    if (controls.length < 2) return false;

    const itemsByNumber = new Map();
    controls.forEach((control) => {
      const n = invitationNumber(control);
      if (!itemsByNumber.has(n)) itemsByNumber.set(n, closestInvitationItem(control));
    });

    // El módulo integrado histórico tenía 4 modelos. Añadimos únicamente el quinto.
    if (!itemsByNumber.has(5) && itemsByNumber.has(4)) {
      const template = itemsByNumber.get(4);
      const clone = template.cloneNode(true);
      replaceFourWithFive(clone);
      clone.classList.remove('active','is-active','selected','is-selected');
      clone.removeAttribute('aria-current');
      clone.removeAttribute('id');
      template.insertAdjacentElement('afterend', clone);
      itemsByNumber.set(5, clone);
    }

    const items = [1,2,3,4,5].map((n) => itemsByNumber.get(n)).filter(Boolean);
    items.forEach((item) => {
      const n = Number(item.dataset.mgdInvitationNumber) || invitationNumber(item);
      if (n >= 1 && n <= 5) wireInvitationItem(doc, item, n, items);
    });
    ensurePrimaryBadge(doc, itemsByNumber.get(5));
    doc.body.dataset.mgdFiveInvitations = INVITATIONS_VERSION;
    return itemsByNumber.size >= 5;
  }

  function inspectInvitationFrames() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;
    workspace.querySelectorAll('iframe').forEach((frame) => {
      const inspect = () => {
        try {
          const doc = frame.contentDocument;
          if (!doc?.body) return;
          if (!/invitaci[oó]n/i.test(doc.body.innerText || '')) return;
          enhanceInvitationDocument(doc);
        } catch (_) {}
      };
      if (frame.dataset.mgdInvitationFiveListener !== INVITATIONS_VERSION) {
        frame.dataset.mgdInvitationFiveListener = INVITATIONS_VERSION;
        frame.addEventListener('load', () => {
          inspect();
          setTimeout(inspect, 120);
          setTimeout(inspect, 700);
        });
      }
      inspect();
    });
  }

  function startInvitationEnhancer() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;
    inspectInvitationFrames();
    if (workspace.dataset.mgdInvitationFiveObserver === INVITATIONS_VERSION) return;
    workspace.dataset.mgdInvitationFiveObserver = INVITATIONS_VERSION;
    new MutationObserver(inspectInvitationFrames).observe(workspace, { childList: true, subtree: true });
  }

  startInvitationEnhancer();
  document.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('[data-module="invitaciones"],[data-quick-module="invitaciones"]')) {
      setTimeout(startInvitationEnhancer, 0);
      setTimeout(inspectInvitationFrames, 180);
      setTimeout(inspectInvitationFrames, 850);
    }
  }, true);

  // IMPORTANTE: este archivo no intercepta la navegación de módulos.
  // Invitaciones vuelve a ser gestionado por el cargador integrado de Mi Gran Día
  // dentro de #unifiedWorkspace, igual que el resto de módulos.
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element
      ? event.target.closest(`#${FORM_ID} button`)
      : null;
    if (!target) return;

    // Si el módulo estable está conectado, no tocamos el evento.
    if (target.dataset.inviteController === 'stable-v2') return;

    event.preventDefault();
    event.stopImmediatePropagation();
    setStatus('El controlador de invitaciones todavía no terminó de cargar. Recarga esta pantalla e inténtalo nuevamente.', 'error');
  }, true);
})();
