const VERSION = '20260814-1448-mobile1';
let activeDoc = null;
let drawerOpen = false;

function ensureStyle(doc) {
  if (doc.getElementById('mgdTablesMobileStyle')) return;
  const style = doc.createElement('style');
  style.id = 'mgdTablesMobileStyle';
  style.textContent = `
    .mgd-mobile-guests-button,.mgd-mobile-guests-close,.mgd-mobile-guests-backdrop{display:none}
    @media(max-width:900px){
      .mgd-mobile-guests-button{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:10px 13px;border:1px solid rgba(78,88,72,.14);border-radius:12px;background:#fff;color:#2f342d;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
      .mgd-mobile-guests-button b{display:grid;place-items:center;min-width:21px;height:21px;padding:0 6px;border-radius:999px;background:#eef1e9;color:#65705b;font-size:10px}
      .mgd-tables-layout{display:block!important}
      .mgd-guests-panel{position:fixed!important;z-index:10016;top:auto!important;left:10px;right:10px;bottom:10px;max-height:min(72vh,620px);transform:translateY(calc(100% + 28px));opacity:0;pointer-events:none;transition:transform .22s ease,opacity .18s ease;border-radius:22px!important;box-shadow:0 22px 70px rgba(34,38,31,.24)!important}
      .mgd-tables-editor.is-guests-open .mgd-guests-panel{transform:translateY(0);opacity:1;pointer-events:auto}
      .mgd-mobile-guests-close{display:grid;place-items:center;position:absolute;z-index:2;top:11px;right:11px;width:34px;height:34px;border:1px solid rgba(78,88,72,.14);border-radius:50%;background:#fff;color:#74796f;font:inherit;font-size:20px;cursor:pointer}
      .mgd-mobile-guests-backdrop{display:block;position:fixed;z-index:10015;inset:0;background:rgba(41,45,38,.25);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .18s ease}
      .mgd-tables-editor.is-guests-open .mgd-mobile-guests-backdrop{opacity:1;pointer-events:auto}
      .mgd-guests-head{padding-right:54px!important}
      .mgd-guest-list{max-height:min(42vh,390px)!important;padding-bottom:max(16px,env(safe-area-inset-bottom))!important}
      body:has(.mgd-tables-editor.is-guests-open){overflow:hidden}
    }
    @media(max-width:620px){
      .mgd-mobile-guests-button{margin-left:0}
      .mgd-tables-topbar .mgd-save-state{margin-left:auto}
      .mgd-guests-panel{left:6px;right:6px;bottom:6px;max-height:78vh}
    }
    @media(prefers-reduced-motion:reduce){.mgd-guests-panel,.mgd-mobile-guests-backdrop{transition:none!important}}
  `;
  doc.head.appendChild(style);
}

function counts(root) {
  const text = root.querySelector('.mgd-stage-head span')?.textContent || '';
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function applyOpenState(root) {
  root?.classList.toggle('is-guests-open', drawerOpen);
}

function decorate(root, doc) {
  if (!root) return;
  ensureStyle(doc);
  const topbar = root.querySelector('.mgd-tables-topbar');
  const panel = root.querySelector('#mgdGuestsPanel');
  if (!topbar || !panel) return;

  let button = topbar.querySelector('#mgdMobileGuestsButton');
  if (!button) {
    button = doc.createElement('button');
    button.id = 'mgdMobileGuestsButton';
    button.className = 'mgd-mobile-guests-button';
    button.type = 'button';
    button.innerHTML = '<span>Invitados</span><b>0</b>';
    const add = topbar.querySelector('#mgdAddTable');
    add?.insertAdjacentElement('beforebegin', button);
  }
  const badge = button.querySelector('b');
  if (badge) badge.textContent = String(counts(root));

  if (!panel.querySelector('.mgd-mobile-guests-close')) {
    const close = doc.createElement('button');
    close.className = 'mgd-mobile-guests-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Cerrar invitados');
    close.textContent = '×';
    panel.appendChild(close);
  }

  let backdrop = root.querySelector('.mgd-mobile-guests-backdrop');
  if (!backdrop) {
    backdrop = doc.createElement('button');
    backdrop.className = 'mgd-mobile-guests-backdrop';
    backdrop.type = 'button';
    backdrop.setAttribute('aria-label', 'Cerrar panel de invitados');
    panel.insertAdjacentElement('beforebegin', backdrop);
  }

  applyOpenState(root);
}

function bindRoot(root, doc) {
  if (!root || root.dataset.mgdMobilePanelBound === VERSION) return;
  root.dataset.mgdMobilePanelBound = VERSION;
  decorate(root, doc);

  root.addEventListener('click', (event) => {
    if (event.target.closest('#mgdMobileGuestsButton')) {
      drawerOpen = true;
      applyOpenState(root);
      setTimeout(() => root.querySelector('#mgdGuestSearch')?.focus(), 80);
      return;
    }
    if (event.target.closest('.mgd-mobile-guests-close,.mgd-mobile-guests-backdrop')) {
      drawerOpen = false;
      applyOpenState(root);
      return;
    }

    if (event.target.closest('.mgd-guest-item[data-guest-id]')) {
      drawerOpen = false;
      return;
    }
    if (event.target.closest('[data-guest-filter]')) drawerOpen = true;
  }, true);

  root.addEventListener('input', (event) => {
    if (event.target.id === 'mgdGuestSearch') drawerOpen = true;
  }, true);
}

function bindFrame(frame) {
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return false; }
  const root = doc?.getElementById('mgdTablesEditor');
  if (!doc?.body || !root) return false;
  activeDoc = doc;
  bindRoot(root, doc);
  decorate(root, doc);

  if (!doc.documentElement.dataset.mgdMobilePanelObserver) {
    doc.documentElement.dataset.mgdMobilePanelObserver = VERSION;
    const observer = new MutationObserver(() => {
      const nextRoot = doc.getElementById('mgdTablesEditor');
      if (!nextRoot) return;
      bindRoot(nextRoot, doc);
      decorate(nextRoot, doc);
    });
    observer.observe(doc.body, { childList: true, subtree: true });
  }
  return true;
}

function scan() {
  const frames = [...document.querySelectorAll('#unifiedWorkspace iframe, iframe')];
  for (const frame of frames) {
    if (bindFrame(frame)) break;
  }
}

const rootObserver = new MutationObserver(scan);
rootObserver.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', scan);
window.addEventListener('load', scan);
window.addEventListener('migrandia:wedding-context', () => {
  drawerOpen = false;
  setTimeout(scan, 60);
});
if (document.readyState !== 'loading') scan();
