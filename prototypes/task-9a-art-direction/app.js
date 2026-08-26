(() => {
  const body = document.body;
  const views = [...document.querySelectorAll('.view')];
  const navButtons = [...document.querySelectorAll('[data-view]')];
  const overlay = document.querySelector('.overlay');
  const dialog = document.querySelector('.dialog');
  const sheet = document.querySelector('.sheet');
  let trigger = null;

  function open(panel, opener) {
    trigger = opener;
    overlay.hidden = false;
    panel.hidden = false;
    body.style.overflow = 'hidden';
    panel.querySelector('[tabindex="-1"]').focus();
  }

  function close() {
    overlay.hidden = true;
    dialog.hidden = true;
    sheet.hidden = true;
    body.style.overflow = '';
    trigger?.focus();
  }

  function selectView(name) {
    views.forEach((view) => view.classList.toggle('is-visible', view.id === name));
    navButtons.forEach((button) => {
      const active = button.dataset.view === name;
      button.classList.toggle('is-active', active);
      button.toggleAttribute('aria-current', active);
    });
    document.querySelector('#workspace').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: document.documentElement.matches(':focus-visible') ? 'smooth' : 'auto' });
  }

  navButtons.forEach((button) => button.addEventListener('click', () => selectView(button.dataset.view)));
  document.querySelectorAll('[data-open-modal]').forEach((button) => button.addEventListener('click', () => open(dialog, button)));
  document.querySelectorAll('[data-open-sheet]').forEach((button) => button.addEventListener('click', () => open(sheet, button)));
  document.querySelectorAll('.close').forEach((button) => button.addEventListener('click', close));
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !overlay.hidden) close(); });
})();
