(() => {
'use strict';

window.MiGranDiaModules = window.MiGranDiaModules || {};
window.MiGranDiaModules.invitaciones = { id: 'invitaciones' };

const VERSION = '20260817-panel-movil-invitaciones-1';
const STORAGE_KEY = 'migrandia_invitacion_activa_v1';
const INVITATIONS = Object.freeze([
  { id: 1, name: 'Invitación 1', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_1/' },
  { id: 2, name: 'Invitación 2', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_2/' },
  { id: 3, name: 'Invitación 3', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_3/' },
  { id: 4, name: 'Invitación 4', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_4/' },
  { id: 5, name: 'Invitación 5', url: 'https://avaldiviezoch.github.io/Wedding/invitaciones/invitacion_5/', official: true }
]);

function activeId() {
  const value = Number(localStorage.getItem(STORAGE_KEY) || 5);
  return INVITATIONS.some(item => item.id === value) ? value : 5;
}

function ensureStyles() {
  document.getElementById('mgdNativeInvitationsStyles')?.remove();
  document.getElementById('mgdInvitationMobilePanelStyles')?.remove();

  const style = document.createElement('style');
  style.id = 'mgdInvitationMobilePanelStyles';
  style.textContent = `
    .mgd-inv-panel{
      width:min(1180px,calc(100% - 32px));
      margin:20px auto 34px;
      display:grid;
      grid-template-columns:300px minmax(0,1fr);
      gap:18px;
      color:#37372f;
      font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    }
    .mgd-inv-selector,
    .mgd-inv-preview-card{
      background:#fff;
      border:1px solid #e4dfdc;
      border-radius:18px;
      box-shadow:0 12px 30px rgba(63,48,51,.07);
      overflow:hidden;
    }
    .mgd-inv-selector-head{padding:25px 20px 14px;border-bottom:1px solid #eee9e6}
    .mgd-inv-eyebrow{display:block;margin-bottom:9px;color:#a46b76;font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
    .mgd-inv-selector h2{margin:0;font:600 28px/1.02 Georgia,"Times New Roman",serif;color:#33342e}
    .mgd-inv-selector-head p{margin:11px 0 0;color:#8b8784;font-size:10px;line-height:1.55}
    .mgd-inv-list{display:grid;gap:9px;padding:13px}
    .mgd-inv-option{
      width:100%;min-height:58px;padding:9px 10px;
      display:flex;align-items:center;gap:10px;
      border:1px solid #e7e1de;border-radius:13px;background:#fff;
      color:#3a3836;text-align:left;cursor:pointer;transition:.16s ease;
    }
    .mgd-inv-option:hover{border-color:#cdb8bc;transform:translateY(-1px);box-shadow:0 5px 15px rgba(90,62,69,.07)}
    .mgd-inv-option.is-active{background:#b17782;border-color:#b17782;color:#fff;box-shadow:none}
    .mgd-inv-number{
      width:35px;height:35px;flex:0 0 35px;display:grid;place-items:center;
      border-radius:11px;background:#f3e7e9;color:#a66c77;font-size:14px;font-weight:900;
    }
    .mgd-inv-option.is-active .mgd-inv-number{background:#fff;color:#a66c77}
    .mgd-inv-option-copy{min-width:0;flex:1}
    .mgd-inv-option-copy strong{display:block;font-size:11px;font-weight:850}
    .mgd-inv-option-copy small{display:block;margin-top:2px;font-size:8px;opacity:.72}
    .mgd-inv-pencil{font-size:13px;opacity:.72}
    .mgd-inv-official{
      display:inline-flex;align-items:center;margin-top:5px;padding:3px 7px;
      border-radius:999px;background:#f0e2e5;color:#9d5e6a;font-size:7px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;
    }
    .mgd-inv-option.is-active .mgd-inv-official{background:rgba(255,255,255,.18);color:#fff}

    .mgd-inv-preview-card{padding:13px;background:#fff}
    .mgd-inv-toolbar{
      min-height:55px;display:flex;align-items:center;justify-content:space-between;gap:14px;
      padding:9px 11px;margin-bottom:12px;border:1px solid #e5dfdc;border-radius:13px;background:#fff;
    }
    .mgd-inv-toolbar-title span{display:block;margin-bottom:3px;color:#92908d;font-size:7px;font-weight:850;letter-spacing:.06em;text-transform:uppercase}
    .mgd-inv-toolbar-title strong{display:block;font-size:11px;color:#3c3b38}
    .mgd-inv-toolbar-title em{display:block;margin-top:2px;color:#a66c77;font-size:8px;font-style:normal;font-weight:800}
    .mgd-inv-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end}
    .mgd-inv-actions button,.mgd-inv-actions a{
      border:1px solid #ddd7d4;border-radius:10px;background:#fff;color:#3f3d3b;
      padding:8px 12px;font-size:9px;font-weight:800;text-decoration:none;cursor:pointer;
    }
    .mgd-inv-actions .mgd-inv-open{background:#b17782;border-color:#b17782;color:#fff}

    .mgd-inv-stage{
      position:relative;min-height:690px;display:flex;align-items:flex-start;justify-content:center;
      padding:18px 18px 0;border:1px solid #dddfe1;border-radius:14px;background:#f0f1f3;overflow:hidden;
    }
    .mgd-phone{
      position:relative;width:366px;height:720px;padding:9px;
      border-radius:45px;background:#252629;box-shadow:0 16px 38px rgba(0,0,0,.18);
    }
    .mgd-phone::before{
      content:"";position:absolute;z-index:4;top:9px;left:50%;transform:translateX(-50%);
      width:108px;height:25px;border-radius:0 0 17px 17px;background:#252629;
    }
    .mgd-phone-screen{position:relative;width:100%;height:100%;border-radius:37px;overflow:hidden;background:#fff}
    .mgd-phone-screen iframe{display:block;width:100%;height:100%;border:0;background:#fff}
    .mgd-inv-loading{
      position:absolute;inset:0;z-index:3;display:grid;place-items:center;padding:30px;text-align:center;
      background:#fff;color:#85807d;font-size:10px;transition:opacity .2s ease;
    }
    .mgd-inv-loading.is-hidden{opacity:0;pointer-events:none}

    @media(max-width:900px){
      .mgd-inv-panel{grid-template-columns:1fr;width:min(760px,calc(100% - 20px));margin-top:12px}
      .mgd-inv-selector-head{padding:17px 15px 12px}.mgd-inv-selector h2{font-size:22px}
      .mgd-inv-list{display:flex;overflow-x:auto;padding:10px}.mgd-inv-option{min-width:155px}
      .mgd-inv-stage{min-height:640px;padding:12px 8px 0}.mgd-phone{width:min(366px,94vw);height:650px}
    }
    @media(max-width:560px){
      .mgd-inv-panel{width:calc(100% - 12px);gap:10px}
      .mgd-inv-preview-card{padding:7px}.mgd-inv-toolbar{align-items:flex-start;flex-direction:column}
      .mgd-inv-actions{width:100%;justify-content:flex-start}.mgd-inv-actions button,.mgd-inv-actions a{padding:7px 9px}
      .mgd-phone{height:620px;border-radius:38px}.mgd-phone-screen{border-radius:30px}.mgd-phone::before{width:94px;height:22px}
    }
  `;
  document.head.appendChild(style);
}

function optionMarkup(item, selected) {
  return `
    <button class="mgd-inv-option${selected ? ' is-active' : ''}" type="button" data-invite-id="${item.id}">
      <span class="mgd-inv-number">${item.id}</span>
      <span class="mgd-inv-option-copy">
        <strong>${item.name}</strong>
        <small>Lista</small>
        ${item.official ? '<span class="mgd-inv-official">Invitación oficial</span>' : ''}
      </span>
      <span class="mgd-inv-pencil" aria-hidden="true">⌁</span>
    </button>`;
}

function render() {
  const workspace = document.getElementById('unifiedWorkspace');
  if (!workspace) return false;

  ensureStyles();

  const selected = activeId();
  const current = INVITATIONS.find(item => item.id === selected) || INVITATIONS[4];

  workspace.innerHTML = `
    <section class="mgd-inv-panel" data-invitations-layout="mobile-preview" data-version="${VERSION}">
      <aside class="mgd-inv-selector">
        <div class="mgd-inv-selector-head">
          <span class="mgd-inv-eyebrow">Modelos disponibles</span>
          <h2>Selecciona una invitación</h2>
          <p>Pulsa un modelo para mostrarlo al costado. Usa el lápiz para editar su enlace.</p>
        </div>
        <div class="mgd-inv-list">
          ${INVITATIONS.map(item => optionMarkup(item, item.id === current.id)).join('')}
        </div>
      </aside>

      <section class="mgd-inv-preview-card">
        <div class="mgd-inv-toolbar">
          <div class="mgd-inv-toolbar-title">
            <span>Vista previa móvil</span>
            <strong id="mgdInvTitle">${current.name}</strong>
            <em id="mgdInvOfficial">${current.official ? 'Invitación oficial' : ''}</em>
          </div>
          <div class="mgd-inv-actions">
            <button type="button" id="mgdInvReload">Recargar</button>
            <button type="button" id="mgdInvCopy">Copiar enlace</button>
            <a class="mgd-inv-open" id="mgdInvOpen" href="${current.url}" target="_blank" rel="noopener">Abrir aparte</a>
          </div>
        </div>

        <div class="mgd-inv-stage">
          <div class="mgd-phone">
            <div class="mgd-phone-screen">
              <div class="mgd-inv-loading" id="mgdInvLoading">Cargando ${current.name}…</div>
              <iframe id="mgdInvFrame" src="${current.url}" title="${current.name}" allow="autoplay; fullscreen"></iframe>
            </div>
          </div>
        </div>
      </section>
    </section>`;

  const frame = document.getElementById('mgdInvFrame');
  const loading = document.getElementById('mgdInvLoading');
  const title = document.getElementById('mgdInvTitle');
  const official = document.getElementById('mgdInvOfficial');
  const open = document.getElementById('mgdInvOpen');
  const copy = document.getElementById('mgdInvCopy');
  let currentItem = current;

  function select(id) {
    const item = INVITATIONS.find(inv => inv.id === Number(id));
    if (!item) return;
    currentItem = item;
    localStorage.setItem(STORAGE_KEY, String(item.id));

    workspace.querySelectorAll('[data-invite-id]').forEach(button => {
      button.classList.toggle('is-active', Number(button.dataset.inviteId) === item.id);
    });

    title.textContent = item.name;
    official.textContent = item.official ? 'Invitación oficial' : '';
    open.href = item.url;
    loading.textContent = `Cargando ${item.name}…`;
    loading.classList.remove('is-hidden');
    frame.title = item.name;
    frame.src = item.url;
  }

  workspace.querySelectorAll('[data-invite-id]').forEach(button => {
    button.addEventListener('click', () => select(button.dataset.inviteId));
  });

  frame.addEventListener('load', () => loading.classList.add('is-hidden'));

  document.getElementById('mgdInvReload')?.addEventListener('click', () => {
    loading.classList.remove('is-hidden');
    try { frame.contentWindow.location.reload(); }
    catch (_) { frame.src = currentItem.url; }
  });

  copy?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentItem.url);
      const before = copy.textContent;
      copy.textContent = 'Copiado ✓';
      setTimeout(() => { copy.textContent = before; }, 1200);
    } catch (_) {
      window.prompt('Copia el enlace de la invitación:', currentItem.url);
    }
  });

  document.body.classList.add('module-view');
  document.querySelectorAll('[data-quick-module]').forEach(button => {
    button.classList.toggle('active', button.dataset.quickModule === 'invitaciones');
  });

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
  document.getElementById('mainDrawer')?.setAttribute('aria-hidden', 'true');
  document.getElementById('backdrop')?.setAttribute('aria-hidden', 'true');
  history.replaceState({ module: 'invitaciones' }, '', `${location.pathname}${location.search}#invitaciones`);
  render();
}, true);

window.addEventListener('hashchange', () => {
  if (location.hash.toLowerCase() === '#invitaciones' && window.WeddingPlannerAuthGuard?.authenticated) render();
});

if (location.hash.toLowerCase() === '#invitaciones') queueMicrotask(render);
})();