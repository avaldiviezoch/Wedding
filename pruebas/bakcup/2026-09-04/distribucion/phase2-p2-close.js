(() => {
  if (document.documentElement.dataset.phase2P2Close === 'ready') return;
  document.documentElement.dataset.phase2P2Close = 'ready';

  const byId = (id) => document.getElementById(id);
  const fab = byId('p2MobileFab');
  const actions = byId('p2MobileActions');
  const backdrop = byId('p2MobileBackdrop');
  const toolsPanel = document.querySelector('.tools-panel');
  const propertiesPanel = document.querySelector('.properties-panel');
  if (!fab || !actions || !backdrop || !toolsPanel || !propertiesPanel) return;

  const openPanel = () => document.querySelector('.tools-panel.p2-sheet-open,.properties-panel.p2-sheet-open');

  function clearMenuPosition() {
    actions.classList.remove('p2-menu-up', 'p2-menu-down');
    actions.style.removeProperty('top');
    actions.style.removeProperty('bottom');
  }

  function resetFabPosition() {
    fab.style.removeProperty('top');
    fab.style.bottom = 'calc(16px + env(safe-area-inset-bottom))';
    clearMenuPosition();
  }

  function positionFabAboveSheet(panel) {
    if (!panel || !panel.classList.contains('p2-sheet-open')) {
      resetFabPosition();
      return;
    }
    requestAnimationFrame(() => {
      const rect = panel.getBoundingClientRect();
      const buttonHeight = fab.offsetHeight || 56;
      const minimumTop = 72;
      const desiredBottom = Math.max(12, window.innerHeight - rect.top + 10);
      const maximumBottom = Math.max(12, window.innerHeight - minimumTop - buttonHeight);
      fab.style.top = 'auto';
      fab.style.bottom = `${Math.min(desiredBottom, maximumBottom)}px`;
      updateFabMenuDirection();
    });
  }

  function updateFabMenuDirection() {
    const rect = fab.getBoundingClientRect();
    const estimatedMenuHeight = Math.max(220, actions.scrollHeight || 0);
    const availableAbove = rect.top - 12;
    const availableBelow = window.innerHeight - rect.bottom - 12;
    const openDown = availableAbove < estimatedMenuHeight && availableBelow > availableAbove;

    clearMenuPosition();
    actions.classList.add(openDown ? 'p2-menu-down' : 'p2-menu-up');
    if (openDown) {
      actions.style.top = `${Math.max(8, rect.bottom + 10)}px`;
      actions.style.bottom = 'auto';
    } else {
      actions.style.bottom = `${Math.max(8, window.innerHeight - rect.top + 10)}px`;
      actions.style.top = 'auto';
    }
  }

  function closeMobileUi() {
    toolsPanel.classList.remove('p2-sheet-open');
    propertiesPanel.classList.remove('p2-sheet-open');
    actions.classList.remove('show');
    backdrop.classList.remove('show');
    fab.textContent = '+';
    resetFabPosition();
  }

  function syncAfterAction() {
    requestAnimationFrame(() => {
      const panel = openPanel();
      if (panel) positionFabAboveSheet(panel);
      else if (actions.classList.contains('show')) updateFabMenuDirection();
      else resetFabPosition();
    });
  }

  actions.addEventListener('click', (event) => {
    const target = event.target.closest('button,label');
    if (!target) return;
    const text = target.textContent.trim();
    if (text === 'Herramientas' || text === 'Propiedades') syncAfterAction();
    else if (text === 'Cerrar') requestAnimationFrame(resetFabPosition);
  });

  fab.addEventListener('click', syncAfterAction);
  backdrop.addEventListener('click', () => requestAnimationFrame(resetFabPosition));

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!openPanel() && !actions.classList.contains('show')) return;
    event.preventDefault();
    closeMobileUi();
  });

  window.addEventListener('resize', () => {
    const panel = openPanel();
    if (panel) positionFabAboveSheet(panel);
    else if (actions.classList.contains('show')) updateFabMenuDirection();
  });

  window.MiGranDiaDistributionPhase2Close = Object.freeze({
    status: 'ready',
    escapeClosesMobileUi: true,
    dynamicFab: true,
    adaptiveMenuDirection: true,
    positionFabAboveSheet,
    updateFabMenuDirection,
    resetFabPosition,
    closeMobileUi
  });
})();
