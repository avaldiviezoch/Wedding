(() => {
'use strict';

window.MiGranDiaModules = window.MiGranDiaModules || {};
window.MiGranDiaModules.invitaciones = { id: 'invitaciones' };

const VERSION = '20260817-preview-v8-legacy-isolation';
const STORAGE_KEY = 'migrandia_invitacion_activa_v1';
const DEVICE_KEY = 'migrandia_invitacion_dispositivo_v1';
const INVITATIONS = Object.freeze([
  { id: 1, name: 'Invitación 1', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_1/' },
  { id: 2, name: 'Invitación 2', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_2/' },
  { id: 3, name: 'Invitación 3', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_3/' },
  { id: 4, name: 'Invitación 4', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_4/' },
  { id: 5, name: 'Invitación 5', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_5/', official: true }
]);
const DEVICES = Object.freeze([
  { id: 'compact', label: 'Compacto', width: 360, height: 800 },
  { id: 'standard', label: 'Estándar', width: 390, height: 844 },
  { id: 'large', label: 'Grande', width: 430, height: 932 }
]);

let activeModule = location.hash.replace(/^#/, '').toLowerCase() || '';
let cleanupObserver = null;

function activeId() {
  const value = Number(localStorage.getItem(STORAGE_KEY) || 5);
  return INVITATIONS.some(item => item.id === value) ? value : 5;
}

function activeDevice() {
  const id = localStorage.getItem(DEVICE_KEY) || 'standard';
  return DEVICES.find(device => device.id === id) || DEVICES[1];
}

function moduleFromTarget(target) {
  if (!(target instanceof Element)) return '';
  if (target.closest('#moduleQuickHome,#unifiedHomeButton,.module-quick-home,.unified-home-button')) return 'home';
  if (target.closest('#moduleSessionLogout,#logoutButton,.module-session-logout,.account-logout')) return 'logout';
  const trigger = target.closest('[data-module],[data-quick-module]');
  return trigger ? String(trigger.dataset.module || trigger.dataset.quickModule || '').trim().toLowerCase() : '';
}

function syncQuickNav(moduleId) {
  const normalized = String(moduleId || '').trim().toLowerCase();
  document.querySelectorAll('[data-quick-module]').forEach(button => {
    const buttonModule = String(button.dataset.quickModule || '').trim().toLowerCase();
    button.classList.toggle('active', Boolean(normalized) && normalized !== 'home' && normalized !== 'logout' && buttonModule === normalized);
    button.classList.toggle('is-active', Boolean(normalized) && normalized !== 'home' && normalized !== 'logout' && buttonModule === normalized);
    button.setAttribute('aria-current', buttonModule === normalized ? 'page' : 'false');
  });
}

function stopInvitationFrame(root) {
  const frame = root?.querySelector?.('#mgdInvFrame, iframe');
  if (!frame) return;
  try {
    const doc = frame.contentDocument;
    doc?.querySelectorAll('audio,video').forEach(media => {
      media.pause?.();
      media.muted = true;
    });
  } catch (_) {}
  try {
    frame.src = 'about:blank';
  } catch (_) {}
}

function restoreLegacyWorkspaceChildren(workspace) {
  if (!workspace) return;
  Array.from(workspace.children).forEach(child => {
    if (child.getAttribute?.('data-mgd-suppressed-by') !== 'invitaciones') return;
    child.hidden = false;
    child.removeAttribute('aria-hidden');
    child.removeAttribute('data-mgd-suppressed-by');
  });
}

function purgeInvitationUi() {
  document.querySelectorAll('.mgd-inv-panel,[data-invitations-layout="mobile-preview"],[data-owner-module="invitaciones"]').forEach(root => {
    stopInvitationFrame(root);
    root.remove();
  });

  document.getElementById('mgdInvitationMobilePanelStyles')?.remove();
  document.getElementById('mgdNativeInvitationsStyles')?.remove();
  document.body.classList.remove('mgd-invitaciones-native-active');

  if (activeModule !== 'invitaciones') {
    restoreLegacyWorkspaceChildren(document.getElementById('unifiedWorkspace'));
  }
}

function hideLegacyWorkspaceChildren(workspace) {
  Array.from(workspace.children).forEach(child => {
    const isNative = child.matches?.('.mgd-inv-panel,[data-invitations-layout="mobile-preview"],[data-owner-module="invitaciones"]');
    if (isNative) {
      child.hidden = false;
      child.removeAttribute('aria-hidden');
      child.removeAttribute('data-mgd-suppressed-by');
      return;
    }
    child.hidden = true;
    child.setAttribute('aria-hidden', 'true');
    child.setAttribute('data-mgd-suppressed-by', 'invitaciones');
  });
}

function ensureCleanupObserver() {
  const workspace = document.getElementById('unifiedWorkspace');
  if (!workspace || cleanupObserver) return;
  cleanupObserver = new MutationObserver(() => {
    if (activeModule === 'invitaciones') {
      document.body.classList.add('mgd-invitaciones-native-active');
      hideLegacyWorkspaceChildren(workspace);
      return;
    }
    purgeInvitationUi();
    restoreLegacyWorkspaceChildren(workspace);
  });
  cleanupObserver.observe(workspace, { childList: true, subtree: true });
}

function optionMarkup(item, selected) {
  return `<button class="mgd-inv-option${selected ? ' is-active' : ''}" type="button" data-invite-id="${item.id}"><span class="mgd-inv-number">${item.id}</span><span class="mgd-inv-option-copy"><strong>${item.name}</strong><small>Vista publicada</small>${item.official ? '<span class="mgd-inv-official">Invitación oficial</span>' : ''}</span></button>`;
}

function deviceMarkup(device, selected) {
  return `<button class="mgd-device-option${selected ? ' is-active' : ''}" type="button" data-device-id="${device.id}">${device.label} · ${device.width}×${device.height}</button>`;
}

function hidePreviewScrollbar(doc) {
  if (!doc) return;

  [doc.documentElement, doc.body].forEach(node => {
    if (!node) return;
    node.style.setProperty('scrollbar-width', 'none', 'important');
    node.style.setProperty('-ms-overflow-style', 'none', 'important');
  });

  if (doc.getElementById('mgdPreviewScrollbarStyle')) return;
  const style = doc.createElement('style');
  style.id = 'mgdPreviewScrollbarStyle';
  style.textContent = `
    html, body {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
    html::-webkit-scrollbar,
    body::-webkit-scrollbar {
      width: 0 !important;
      height: 0 !important;
      display: none !important;
    }
  `;
  (doc.head || doc.documentElement)?.appendChild(style);
}

function enableScrollablePreview(frame) {
  const patch = () => {
    try {
      const doc = frame.contentDocument || frame.contentWindow?.document;
      if (!doc) return;

      const body = doc.body;
      const introLocked = Boolean(
        body?.classList.contains('locked') &&
        doc.getElementById('envelope-screen') &&
        !doc.getElementById('envelope-screen')?.classList.contains('hide')
      );

      if (doc.documentElement) {
        doc.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
        doc.documentElement.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
      }

      if (body) {
        body.style.setProperty('overflow-x', 'hidden', 'important');
        body.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
        body.style.setProperty('touch-action', 'pan-y', 'important');
      }

      if (!introLocked) {
        doc.documentElement?.style.setProperty('overflow-y', 'auto', 'important');
        body?.style.setProperty('overflow-y', 'auto', 'important');
      } else {
        doc.documentElement?.style.removeProperty('overflow-y');
        body?.style.removeProperty('overflow-y');
      }

      hidePreviewScrollbar(doc);

      if (body && !body.dataset.mgdPreviewClassWatch) {
        body.dataset.mgdPreviewClassWatch = '1';
        const observer = new MutationObserver(() => patch());
        observer.observe(body, { attributes: true, attributeFilter: ['class'] });
      }

      const nested = doc.querySelector('iframe');
      if (!nested) return;
      nested.setAttribute('scrolling', 'no');
      nested.style.width = '100%';
      nested.style.display = 'block';
      nested.style.border = '0';

      const resizeNested = () => {
        try {
          const nestedDoc = nested.contentDocument || nested.contentWindow?.document;
          if (!nestedDoc) return;

          [nestedDoc.documentElement, nestedDoc.body].forEach(node => {
            if (!node) return;
            node.style.setProperty('overflow-x', 'hidden', 'important');
            node.style.setProperty('overflow-y', 'visible', 'important');
          });
          hidePreviewScrollbar(nestedDoc);

          const height = Math.max(
            nestedDoc.documentElement?.scrollHeight || 0,
            nestedDoc.body?.scrollHeight || 0,
            nestedDoc.documentElement?.offsetHeight || 0,
            nestedDoc.body?.offsetHeight || 0
          );
          if (height > 0) nested.style.height = `${height}px`;
        } catch (_) {}
      };

      nested.addEventListener('load', resizeNested, { once: true });
      resizeNested();
      setTimeout(resizeNested, 250);
      setTimeout(resizeNested, 900);
      setTimeout(resizeNested, 2200);
    } catch (_) {}
  };

  patch();
  setTimeout(patch, 150);
  setTimeout(patch, 600);
  setTimeout(patch, 1500);
}

function render() {
  const workspace = document.getElementById('unifiedWorkspace');
  if (!workspace) return false;

  activeModule = 'invitaciones';
  document.body.classList.add('mgd-invitaciones-native-active');
  purgeInvitationUi();
  document.body.classList.add('mgd-invitaciones-native-active');
  hideLegacyWorkspaceChildren(workspace);
  ensureCleanupObserver();

  const current = INVITATIONS.find(item => item.id === activeId()) || INVITATIONS[4];
  const currentDevice = activeDevice();
  const host = document.createElement('div');

  host.innerHTML = `<section class="mgd-inv-panel" data-owner-module="invitaciones" data-invitations-layout="mobile-preview" data-version="${VERSION}"><aside class="mgd-inv-selector"><div class="mgd-inv-selector-head"><span class="mgd-inv-eyebrow">Modelos disponibles</span><h2>Selecciona una invitación</h2><p>Pulsa un modelo para verlo. Cada opción abre directamente la versión publicada de esa invitación.</p></div><div class="mgd-inv-list">${INVITATIONS.map(item => optionMarkup(item, item.id === current.id)).join('')}</div></aside><section class="mgd-inv-preview-card"><div class="mgd-inv-toolbar"><div class="mgd-inv-toolbar-title"><span>Vista previa móvil</span><strong id="mgdInvTitle">${current.name}</strong><em id="mgdInvOfficial">${current.official ? 'Invitación oficial' : ''}</em></div><div class="mgd-inv-actions"><button type="button" id="mgdInvReload">Recargar</button><button type="button" id="mgdInvCopy">Copiar enlace</button><a class="mgd-inv-open" id="mgdInvOpen" href="${current.url}" target="_blank" rel="noopener">Abrir aparte</a></div></div><div class="mgd-device-bar"><span class="mgd-device-label">Simular tamaño real</span><div class="mgd-device-options">${DEVICES.map(device => deviceMarkup(device, device.id === currentDevice.id)).join('')}</div></div><div class="mgd-inv-stage"><div class="mgd-phone" id="mgdPhone" style="--device-width:${currentDevice.width}px;--device-height:${currentDevice.height}px"><div class="mgd-phone-screen"><div class="mgd-inv-loading" id="mgdInvLoading">Cargando ${current.name}…</div><iframe id="mgdInvFrame" scrolling="yes" title="${current.name}" allow="autoplay; fullscreen"></iframe></div></div></div><p class="mgd-mobile-note">Desliza dentro de la pantalla del teléfono para recorrer toda la invitación. “Abrir aparte” sigue disponible para probarla en el viewport real.</p></section></section>`;

  const panel = host.firstElementChild;
  if (!panel) return false;
  workspace.appendChild(panel);
  hideLegacyWorkspaceChildren(workspace);

  const frame = panel.querySelector('#mgdInvFrame');
  const loading = panel.querySelector('#mgdInvLoading');
  const title = panel.querySelector('#mgdInvTitle');
  const official = panel.querySelector('#mgdInvOfficial');
  const open = panel.querySelector('#mgdInvOpen');
  const copy = panel.querySelector('#mgdInvCopy');
  const phone = panel.querySelector('#mgdPhone');
  let currentItem = current;
  let loadGeneration = 0;
  let readinessTimer = 0;
  let fallbackTimer = 0;

  function clearLoadWatchers() {
    if (readinessTimer) window.clearInterval(readinessTimer);
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    readinessTimer = 0;
    fallbackTimer = 0;
  }

  function revealPreview(generation) {
    if (generation !== loadGeneration) return;
    clearLoadWatchers();
    loading.classList.add('is-hidden');
    enableScrollablePreview(frame);
  }

  function watchPreviewReadiness(generation) {
    clearLoadWatchers();
    readinessTimer = window.setInterval(() => {
      if (generation !== loadGeneration) return clearLoadWatchers();
      try {
        const doc = frame.contentDocument || frame.contentWindow?.document;
        if (doc && (doc.readyState === 'interactive' || doc.readyState === 'complete') && doc.body) {
          revealPreview(generation);
        }
      } catch (_) {}
    }, 90);

    fallbackTimer = window.setTimeout(() => revealPreview(generation), 3200);
  }

  function loadInvitation(item) {
    currentItem = item;
    const generation = ++loadGeneration;

    loading.textContent = `Cargando ${item.name}…`;
    loading.classList.remove('is-hidden');
    frame.title = item.name;
    watchPreviewReadiness(generation);
    frame.src = item.url;
  }

  function select(id) {
    const item = INVITATIONS.find(inv => inv.id === Number(id));
    if (!item) return;

    localStorage.setItem(STORAGE_KEY, String(item.id));
    panel.querySelectorAll('[data-invite-id]').forEach(button => {
      button.classList.toggle('is-active', Number(button.dataset.inviteId) === item.id);
    });
    title.textContent = item.name;
    official.textContent = item.official ? 'Invitación oficial' : '';
    open.href = item.url;
    loadInvitation(item);
  }

  function setDevice(id) {
    const device = DEVICES.find(item => item.id === id);
    if (!device || !phone) return;

    localStorage.setItem(DEVICE_KEY, device.id);
    phone.style.setProperty('--device-width', `${device.width}px`);
    phone.style.setProperty('--device-height', `${device.height}px`);
    panel.querySelectorAll('[data-device-id]').forEach(button => {
      button.classList.toggle('is-active', button.dataset.deviceId === device.id);
    });
  }

  panel.querySelectorAll('[data-invite-id]').forEach(button => {
    button.addEventListener('click', () => select(button.dataset.inviteId));
  });
  panel.querySelectorAll('[data-device-id]').forEach(button => {
    button.addEventListener('click', () => setDevice(button.dataset.deviceId));
  });

  frame.addEventListener('load', () => {
    revealPreview(loadGeneration);
  });

  panel.querySelector('#mgdInvReload')?.addEventListener('click', () => {
    const generation = ++loadGeneration;
    loading.textContent = `Cargando ${currentItem.name}…`;
    loading.classList.remove('is-hidden');
    watchPreviewReadiness(generation);
    try {
      frame.contentWindow.location.reload();
    } catch (_) {
      frame.src = currentItem.url;
    }
  });

  copy?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentItem.url);
      const before = copy.textContent;
      copy.textContent = 'Copiado ✓';
      setTimeout(() => {
        copy.textContent = before;
      }, 1200);
    } catch (_) {
      window.prompt('Copia el enlace de la invitación:', currentItem.url);
    }
  });

  document.body.classList.add('module-view');
  syncQuickNav('invitaciones');

  loadInvitation(current);
  return true;
}

function isTrigger(target) {
  return target instanceof Element && Boolean(target.closest('[data-module="invitaciones"],[data-quick-module="invitaciones"]'));
}

document.addEventListener('click', event => {
  const nextModule = moduleFromTarget(event.target);
  if (!nextModule) return;
  activeModule = nextModule;
  syncQuickNav(nextModule);
  if (nextModule !== 'invitaciones') {
    purgeInvitationUi();
    restoreLegacyWorkspaceChildren(document.getElementById('unifiedWorkspace'));
  }
}, true);

document.addEventListener('click', event => {
  if (!isTrigger(event.target)) return;
  const guard = window.WeddingPlannerAuthGuard;
  if (guard?.ready && !guard.authenticated) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  activeModule = 'invitaciones';
  syncQuickNav('invitaciones');
  document.body.classList.remove('menu-open');
  document.getElementById('mainDrawer')?.setAttribute('aria-hidden', 'true');
  document.getElementById('backdrop')?.setAttribute('aria-hidden', 'true');
  history.replaceState({ module: 'invitaciones' }, '', `${location.pathname}${location.search}#invitaciones`);
  render();
}, true);

window.addEventListener('hashchange', () => {
  activeModule = location.hash.replace(/^#/, '').toLowerCase();
  syncQuickNav(activeModule);
  if (activeModule === 'invitaciones' && window.WeddingPlannerAuthGuard?.authenticated) return void render();
  if (activeModule !== 'invitaciones') {
    purgeInvitationUi();
    restoreLegacyWorkspaceChildren(document.getElementById('unifiedWorkspace'));
  }
});

syncQuickNav(activeModule);
ensureCleanupObserver();
if (location.hash.toLowerCase() === '#invitaciones') queueMicrotask(render);
else purgeInvitationUi();
})();