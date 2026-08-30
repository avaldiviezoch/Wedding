(() => {
  'use strict';

  const body = document.body;
  const shell = document.getElementById('editorialShell');
  const navigation = document.getElementById('editorialNavigation');
  const menuButton = document.getElementById('editorialMenuButton');
  const legacyMenuButton = document.getElementById('menuButton');
  const legacyQuickNav = document.getElementById('moduleQuickNav');
  const dateOutput = document.getElementById('editorialWeddingDate');
  const weddingOutput = document.getElementById('editorialWeddingName');
  const weddingContext = document.getElementById('moduleWeddingName');
  let opener = null;

  if (!shell || !navigation || !menuButton) return;

  function closeNavigation({ restoreFocus = true } = {}) {
    shell.classList.remove('editorial-navigation-open');
    navigation.setAttribute('aria-hidden', 'true');
    menuButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) opener?.focus();
  }

  function openNavigation(trigger) {
    opener = trigger;
    shell.classList.add('editorial-navigation-open');
    navigation.setAttribute('aria-hidden', 'false');
    menuButton.setAttribute('aria-expanded', 'true');
    navigation.querySelector('a,button')?.focus();
  }

  function formatDate(value) {
    const parts = String(value || '2027-01-16').split('-');
    return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : '16.01.2027';
  }

  function renderContext() {
    dateOutput.textContent = formatDate(localStorage.getItem('planificador_bodas_fecha_v1'));
    const name = weddingContext?.textContent?.trim();
    if (name) weddingOutput.textContent = name;
  }

  function openModule(moduleName) {
    closeNavigation({ restoreFocus: false });
    if (window.WeddingPlannerAuthGuard?.authenticated !== true) {
      legacyMenuButton?.click();
      return;
    }
    const legacyLink = document.querySelector(`.unified-module-link[data-module="${moduleName}"]`);
    if (legacyLink) legacyLink.click();
  }

  function goHome() {
    closeNavigation({ restoreFocus: false });
    document.getElementById('unifiedHomeButton')?.click();
  }

  menuButton.addEventListener('click', () => {
    if (shell.classList.contains('editorial-navigation-open')) closeNavigation();
    else openNavigation(menuButton);
  });
  document.getElementById('editorialContextButton')?.addEventListener('click', () => legacyMenuButton?.click());
  document.querySelectorAll('[data-shell-close]').forEach((element) => element.addEventListener('click', () => closeNavigation()));
  document.querySelectorAll('[data-shell-module]').forEach((element) => element.addEventListener('click', (event) => { event.preventDefault(); openModule(element.dataset.shellModule); }));
  document.querySelectorAll('[data-shell-home]').forEach((element) => element.addEventListener('click', (event) => { event.preventDefault(); goHome(); }));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && shell.classList.contains('editorial-navigation-open')) closeNavigation(); });
  window.addEventListener('migrandia:datachange', renderContext);
  window.addEventListener('migrandia:wedding-context', renderContext);
  window.addEventListener('migrandia:auth', renderContext);
  window.addEventListener('hashchange', () => { renderContext(); closeNavigation({ restoreFocus: false }); });

  legacyQuickNav.hidden = true;
  renderContext();
})();
