(() => {
'use strict';
window.MiGranDiaModules = window.MiGranDiaModules || {};
window.MiGranDiaModules.invitaciones = { id: 'invitaciones' };

const VERSION = '20260817-native-invitaciones-4';
const STORAGE_KEY = 'migrandia_invitacion_activa_v1';
const INVITATIONS = Object.freeze([
  { id: 1, name: 'Invitación 1', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_1/' },
  { id: 2, name: 'Invitación 2', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_2/' },
  { id: 3, name: 'Invitación 3', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_3/' },
  { id: 4, name: 'Invitación 4', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_4/' },
  { id: 5, name: 'Invitación 5', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_5/', primary: true }
]);

function activeId() {
  const value = Number(localStorage.getItem(STORAGE_KEY) || 5);
  return INVITATIONS.some(item => item.id === value) ? value : 5;
}

function ensureStyles() {
  if (document.getElementById('mgdNativeInvitationsStyles')) return;
  const style = document.createElement('style');
  style.id = 'mgdNativeInvitationsStyles';
  style.textContent = `
    .mgd-invites{height:100%;min-height:calc(100vh - 78px);display:grid;grid-template-columns:280px minmax(0,1fr);background:#f6f3ed;color:#30372f;overflow:hidden}
    .mgd-invites-sidebar{padding:22px 16px;border-right:1px solid rgba(91,101,78,.16);background:rgba(255,255,255,.92);overflow:auto}
    .mgd-invites-eyebrow{display:block;color:#7c846f;font-size:10px;font-weight:850;letter-spacing:.16em;text-transform:uppercase}
    .mgd-invites-sidebar h2{margin:7px 0 5px;font:500 27px/1.05 Georgia,serif;color:#30372f}.mgd-invites-sidebar>p{margin:0 0 18px;color:#858b80;font-size:11px;line-height:1.5}
    .mgd-invites-list{display:grid;gap:8px}.mgd-invite-item{width:100%;display:flex;align-items:center;gap:11px;text-align:left;padding:12px;border:1px solid #e4e0d7;border-radius:15px;background:#fff;color:#3a4137;cursor:pointer;transition:.18s ease}
    .mgd-invite-item:hover{transform:translateY(-1px);border-color:#cbd1bf;box-shadow:0 8px 22px rgba(57,65,50,.08)}.mgd-invite-item.is-active{background:#667255;color:#fff;border-color:#667255;box-shadow:0 9px 24px rgba(87,99,72,.22)}
    .mgd-invite-number{display:grid;place-items:center;flex:0 0 34px;width:34px;height:34px;border-radius:50%;background:#eef1e8;color:#667255;font-size:12px;font-weight:900}.mgd-invite-item.is-active .mgd-invite-number{background:rgba(255,255,255,.18);color:#fff}
    .mgd-invite-copy{min-width:0;display:block}.mgd-invite-copy strong{display:block;font-size:12px}.mgd-invite-copy small{display:block;margin-top:3px;font-size:9px;opacity:.7}
    .mgd-primary-badge{display:inline-flex;margin-top:6px;padding:4px 7px;border-radius:999px;background:#e7ecde;color:#5c674b;font-size:8px;font-weight:900;letter-spacing:.08em}.mgd-invite-item.is-active .mgd-primary-badge{background:rgba(255,255,255,.18);color:#fff}
    .mgd-invites-main{min-width:0;display:flex;flex-direction:column;padding:15px 16px 16px;overflow:hidden}.mgd-invites-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;padding:11px 13px;border:1px solid #e2ded5;border-radius:15px;background:rgba(255,255,255,.93)}
    .mgd-invites-toolbar strong{font-size:13px}.mgd-invites-toolbar span{display:block;margin-top:2px;color:#868c81;font-size:9px}.mgd-invites-actions{display:flex;gap:7px}.mgd-invites-actions button,.mgd-invites-actions a{border:1px solid #dedad1;border-radius:10px;background:#fff;color:#4f5848;padding:8px 10px;font-size:10px;font-weight:800;text-decoration:none;cursor:pointer}
    .mgd-invite-preview{position:relative;flex:1;min-height:520px;border:1px solid #ddd9d0;border-radius:18px;background:#ddd;overflow:hidden;box-shadow:0 12px 30px rgba(45,49,41,.1)}.mgd-invite-preview iframe{display:block;width:100%;height:100%;border:0;background:#fff}.mgd-invite-loading{position:absolute;inset:0;display:grid;place-items:center;background:#f3f0ea;color:#757d70;font-size:11px;z-index:2;transition:.2s}.mgd-invite-loading.is-hidden{opacity:0;pointer-events:none}
    @media(max-width:820px){.mgd-invites{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr);overflow:auto}.mgd-invites-sidebar{padding:12px;border-right:0;border-bottom:1px solid rgba(91,101,78,.16);overflow:visible}.mgd-invites-sidebar h2{font-size:20px}.mgd-invites-sidebar>p{margin-bottom:10px}.mgd-invites-list{display:flex;overflow-x:auto;gap:7px;padding-bottom:3px}.mgd-invite-item{min-width:150px;padding:9px}.mgd-invite-number{width:28px;height:28px;flex-basis:28px}.mgd-invites-main{min-height:680px;padding:10px}.mgd-invites-toolbar{align-items:flex-start;flex-wrap:wrap}.mgd-invite-preview{min-height:600px}}
  `;
  document.head.appendChild(style);
}

function itemMarkup(item, selected) {
  return `<button class="mgd-invite-item${selected ? ' is-active' : ''}" type="button" data-native-invite="${item.id}">
    <span class="mgd-invite-number">${item.id}</span>
    <span class="mgd-invite-copy"><strong>${item.name}</strong><small>Modelo ${item.id}</small>${item.primary ? '<span class="mgd-primary-badge">OFICIAL</span>' : ''}</span>
  </button>`;
}

function render() {
  const workspace = document.getElementById('unifiedWorkspace');
  if (!workspace) return false;
  ensureStyles();
  const selected = activeId();
  const current = INVITATIONS.find(item => item.id === selected) || INVITATIONS[4];
  workspace.innerHTML = `<section class="mgd-invites" data-native-invitations="${VERSION}">
    <aside class="mgd-invites-sidebar"><span class="mgd-invites-eyebrow">Modelos disponibles</span><h2>Selecciona una invitación</h2><p>Tienes 5 invitaciones disponibles. La Invitación 5 es la versión oficial.</p><div class="mgd-invites-list">${INVITATIONS.map(item => itemMarkup(item, item.id === current.id)).join('')}</div></aside>
    <div class="mgd-invites-main"><div class="mgd-invites-toolbar"><div><strong id="mgdInviteTitle">${current.name}</strong><span id="mgdInviteStatus">${current.primary ? 'Invitación oficial' : 'Vista previa integrada'}</span></div><div class="mgd-invites-actions"><button type="button" id="mgdInviteReload">↻ Recargar</button><button type="button" id="mgdInviteCopy">Copiar enlace</button><a id="mgdInviteOpen" href="${current.url}" target="_blank" rel="noopener">Abrir completa ↗</a></div></div><div class="mgd-invite-preview"><div class="mgd-invite-loading" id="mgdInviteLoading">Cargando ${current.name}…</div><iframe id="mgdInviteFrame" src="${current.url}" title="${current.name}" allow="autoplay; fullscreen"></iframe></div></div>
  </section>`;

  const frame = document.getElementById('mgdInviteFrame');
  const loading = document.getElementById('mgdInviteLoading');
  const title = document.getElementById('mgdInviteTitle');
  const status = document.getElementById('mgdInviteStatus');
  const open = document.getElementById('mgdInviteOpen');
  const copy = document.getElementById('mgdInviteCopy');
  let currentItem = current;
  const select = (id) => {
    const item = INVITATIONS.find(inv => inv.id === Number(id));
    if (!item) return;
    currentItem = item;
    localStorage.setItem(STORAGE_KEY, String(item.id));
    workspace.querySelectorAll('[data-native-invite]').forEach(button => button.classList.toggle('is-active', Number(button.dataset.nativeInvite) === item.id));
    title.textContent = item.name;
    status.textContent = item.primary ? 'Invitación oficial' : 'Vista previa integrada';
    open.href = item.url;
    loading.textContent = `Cargando ${item.name}…`;
    loading.classList.remove('is-hidden');
    if (frame.src !== item.url) frame.src = item.url;
  };
  workspace.querySelectorAll('[data-native-invite]').forEach(button => button.addEventListener('click', () => select(button.dataset.nativeInvite)));
  frame.addEventListener('load', () => loading.classList.add('is-hidden'));
  document.getElementById('mgdInviteReload')?.addEventListener('click', () => { loading.classList.remove('is-hidden'); try { frame.contentWindow.location.reload(); } catch (_) { frame.src = frame.src; } });
  copy?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentItem.url);
      const original = copy.textContent;
      copy.textContent = 'Enlace copiado ✓';
      setTimeout(() => { copy.textContent = original; }, 1400);
    } catch (_) {
      window.prompt('Copia el enlace de la invitación:', currentItem.url);
    }
  });
  document.body.classList.add('module-view');
  document.querySelectorAll('[data-quick-module]').forEach(button => button.classList.toggle('active', button.dataset.quickModule === 'invitaciones'));
  return true;
}

function isTrigger(target) {
  return target instanceof Element && Boolean(target.closest('[data-module="invitaciones"],[data-quick-module="invitaciones"]'));
}

document.addEventListener('click', (event) => {
  if (!isTrigger(event.target)) return;
  const guard = window.WeddingPlannerAuthGuard;
  if (guard?.ready && !guard.authenticated) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  document.body.classList.remove('menu-open');
  document.getElementById('mainDrawer')?.setAttribute('aria-hidden','true');
  document.getElementById('backdrop')?.setAttribute('aria-hidden','true');
  history.replaceState({module:'invitaciones'},'',`${location.pathname}${location.search}#invitaciones`);
  render();
}, true);

window.addEventListener('hashchange', () => {
  if (location.hash.toLowerCase() === '#invitaciones' && window.WeddingPlannerAuthGuard?.authenticated) render();
});

if (location.hash.toLowerCase() === '#invitaciones') queueMicrotask(render);
})();