(() => {
  'use strict';

  const VERSION = '20260830-module-context3';
  const ROLE_LABELS = {
    owner: 'Propietario',
    admin: 'Administrador',
    editor: 'Editor',
    provider: 'Proveedor',
    viewer: 'Visualizador'
  };

  function initials(value = '') {
    const parts = String(value).trim().split(/\s+/).filter(Boolean);
    return (parts.slice(0, 2).map((part) => part[0]).join('') || 'MGD').toUpperCase();
  }

  function activeModule() {
    return String(location.hash || '').replace(/^#/, '').split(/[/?&]/)[0].toLowerCase();
  }

  function renderActiveModule() {
    const current = activeModule();
    document.querySelectorAll('[data-quick-module]').forEach((button) => {
      const active = button.dataset.quickModule === current;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    const label = document.getElementById('moduleMobileTabs');
    const currentButton = document.querySelector(`[data-quick-module="${CSS.escape(current)}"]`);
    if (label) label.textContent = currentButton?.textContent?.trim() || 'Módulos';
  }

  function renderWeddingContext(event) {
    const context = event?.detail?.id ? event.detail : (window.WeddingPlannerWeddingContext || {});
    const name = document.getElementById('moduleWeddingName');
    const role = document.getElementById('moduleWeddingRole');
    if (name) name.textContent = context.name || 'Mi boda';
    if (role) {
      role.textContent = ROLE_LABELS[context.role] || context.role || 'Mi acceso';
      role.dataset.role = context.role || '';
      role.title = context.role === 'owner'
        ? 'Esta es tu boda'
        : `Estás participando como ${ROLE_LABELS[context.role] || context.role || 'colaborador'}`;
    }
  }

  function renderAccount() {
    const sourceName = document.getElementById('accountName');
    const sourceEmail = document.getElementById('accountEmail');
    const sourceAvatar = document.getElementById('accountAvatar');
    const nameText = sourceName?.textContent?.trim() || 'Mi cuenta';
    const emailText = sourceEmail?.textContent?.trim() || '';
    const image = document.getElementById('moduleAccountAvatar');
    const fallback = document.getElementById('moduleAccountInitials');
    const popoverName = document.getElementById('moduleAccountName');
    const popoverEmail = document.getElementById('moduleAccountEmail');
    const button = document.getElementById('moduleAccountButton');

    if (popoverName) popoverName.textContent = nameText;
    if (popoverEmail) popoverEmail.textContent = emailText;
    if (fallback) fallback.textContent = initials(nameText);
    if (button) button.setAttribute('aria-label', `Cuenta de ${nameText}`);

    const src = sourceAvatar?.getAttribute('src') || '';
    if (image) {
      if (src) {
        image.src = src;
        image.classList.add('show');
      } else {
        image.removeAttribute('src');
        image.classList.remove('show');
      }
    }
  }

  function closeMenus() {
    document.getElementById('moduleQuickNav')?.classList.remove('module-tabs-open');
    const account = document.getElementById('moduleAccountWrap');
    account?.classList.remove('is-open');
    document.getElementById('moduleAccountButton')?.setAttribute('aria-expanded', 'false');
  }

  function bind() {
    const nav = document.getElementById('moduleQuickNav');
    const weddingButton = document.getElementById('moduleWeddingButton');
    const mobileTabs = document.getElementById('moduleMobileTabs');
    if (!nav || nav.dataset.mgdContextBar === VERSION) return;
    nav.dataset.mgdContextBar = VERSION;

    weddingButton?.addEventListener('click', () => {
      closeMenus();
      const existing = document.getElementById('activeWeddingButton');
      if (existing) existing.click();
      else window.dispatchEvent(new Event('migrandia:open-weddings'));
    });

    // Delegación sobre la barra: el avatar puede ser reconstruido por el shell/legacy
    // sin perder la interacción ni duplicar el flujo de cierre de sesión.
    nav.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const logoutButton = target.closest('#moduleContextLogout');
      if (logoutButton && nav.contains(logoutButton)) {
        event.stopPropagation();
        closeMenus();
        document.getElementById('moduleSessionLogout')?.click();
        return;
      }

      const accountButton = target.closest('#moduleAccountButton');
      if (accountButton && nav.contains(accountButton)) {
        event.stopPropagation();
        nav.classList.remove('module-tabs-open');
        const accountWrap = accountButton.closest('#moduleAccountWrap') || document.getElementById('moduleAccountWrap');
        const open = !accountWrap?.classList.contains('is-open');
        accountWrap?.classList.toggle('is-open', open);
        accountButton.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
    });

    mobileTabs?.addEventListener('click', (event) => {
      event.stopPropagation();
      document.getElementById('moduleAccountWrap')?.classList.remove('is-open');
      nav.classList.toggle('module-tabs-open');
    });

    nav.querySelectorAll('[data-quick-module]').forEach((button) => {
      button.addEventListener('click', () => {
        nav.classList.remove('module-tabs-open');
        requestAnimationFrame(renderActiveModule);
      });
    });

    document.addEventListener('click', (event) => {
      if (!nav.contains(event.target)) closeMenus();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenus();
    });

    window.addEventListener('hashchange', renderActiveModule);
    window.addEventListener('migrandia:wedding-context', renderWeddingContext);
    window.addEventListener('migrandia:auth', renderAccount);
    window.addEventListener('migrandia:auth-resume', renderAccount);
    window.addEventListener('migrandia:resume', () => {
      renderActiveModule();
      renderWeddingContext();
      renderAccount();
    });

    const accountCard = document.getElementById('accountCard');
    if (accountCard) new MutationObserver(renderAccount).observe(accountCard, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'class']
    });

    renderActiveModule();
    renderWeddingContext();
    renderAccount();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
