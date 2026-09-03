(() => {
  if (document.documentElement.dataset.phase2P2Close === 'ready') return;
  document.documentElement.dataset.phase2P2Close = 'ready';

  const byId = (id) => document.getElementById(id);

  function computeFabMenuDirection({ fabTop, fabBottom, menuHeight, viewportHeight }) {
    const estimatedMenuHeight = Math.max(210, Number(menuHeight) || 0);
    const availableAbove = Math.max(0, Number(fabTop) - 12);
    const availableBelow = Math.max(0, Number(viewportHeight) - Number(fabBottom) - 12);
    return availableAbove < estimatedMenuHeight && availableBelow > availableAbove ? 'down' : 'up';
  }

  function computeFabBottomForPanel({ panelTop, viewportHeight, buttonHeight = 56, minimumTop = 88 }) {
    const desiredBottom = Math.max(12, Number(viewportHeight) - Number(panelTop) + 10);
    const maximumBottom = Math.max(12, Number(viewportHeight) - Number(minimumTop) - Number(buttonHeight));
    return Math.min(desiredBottom, maximumBottom);
  }

  function resetFabPosition() {
    const fab = byId('p2MobileFab');
    if (!fab) return;
    fab.style.top = 'auto';
    fab.style.bottom = 'calc(16px + env(safe-area-inset-bottom))';
    fab.dataset.menuDirection = 'up';
  }

  function positionFabAboveOpenSheet() {
    const fab = byId('p2MobileFab');
    const panel = document.querySelector('.tools-panel.p2-sheet-open,.properties-panel.p2-sheet-open');
    if (!fab || !panel) {
      resetFabPosition();
      return;
    }
    requestAnimationFrame(() => {
      const panelRect = panel.getBoundingClientRect();
      const bottom = computeFabBottomForPanel({
        panelTop: panelRect.top,
        viewportHeight: window.innerHeight,
        buttonHeight: fab.offsetHeight || 56
      });
      fab.style.top = 'auto';
      fab.style.bottom = `${bottom}px`;
      updateFabMenuDirection();
    });
  }

  function updateFabMenuDirection() {
    const fab = byId('p2MobileFab');
    const menu = byId('p2MobileActions');
    if (!fab || !menu) return 'up';
    const rect = fab.getBoundingClientRect();
    const direction = computeFabMenuDirection({
      fabTop: rect.top,
      fabBottom: rect.bottom,
      menuHeight: menu.scrollHeight,
      viewportHeight: window.innerHeight
    });
    fab.dataset.menuDirection = direction;
    menu.classList.toggle('menu-down', direction === 'down');
    menu.classList.toggle('menu-up', direction === 'up');
    if (menu.classList.contains('show')) {
      if (direction === 'down') {
        menu.style.bottom = 'auto';
        menu.style.top = `${Math.min(window.innerHeight - 12, rect.bottom + 10)}px`;
      } else {
        menu.style.top = 'auto';
        menu.style.bottom = `${Math.max(12, window.innerHeight - rect.top + 10)}px`;
      }
    } else {
      menu.style.top = '';
      menu.style.bottom = '';
    }
    return direction;
  }

  function closeParityMobileUi() {
    document.querySelector('.tools-panel')?.classList.remove('p2-sheet-open');
    document.querySelector('.properties-panel')?.classList.remove('p2-sheet-open');
    const actions = byId('p2MobileActions');
    const backdrop = byId('p2MobileBackdrop');
    const fab = byId('p2MobileFab');
    actions?.classList.remove('show', 'menu-up', 'menu-down');
    if (actions) {
      actions.style.top = '';
      actions.style.bottom = '';
    }
    backdrop?.classList.remove('show');
    if (fab) fab.textContent = '+';
    resetFabPosition();
  }

  function closeOnEscape(event) {
    if (event.key !== 'Escape') return;
    const finalOverlay = byId('p2FinalOverlay');
    if (finalOverlay && !finalOverlay.hidden) {
      finalOverlay.hidden = true;
      document.body.classList.remove('p2-final-open');
      return;
    }
    closeParityMobileUi();
  }

  function installParityHooks() {
    const fab = byId('p2MobileFab');
    const actions = byId('p2MobileActions');
    const backdrop = byId('p2MobileBackdrop');
    if (!fab || !actions || fab.dataset.p2ParityHooks === 'ready') return;
    fab.dataset.p2ParityHooks = 'ready';

    fab.addEventListener('click', () => {
      requestAnimationFrame(() => {
        if (actions.classList.contains('show')) updateFabMenuDirection();
        else positionFabAboveOpenSheet();
      });
    });

    actions.addEventListener('click', (event) => {
      const text = event.target?.textContent?.trim();
      if (text === 'Herramientas' || text === 'Propiedades') {
        window.setTimeout(positionFabAboveOpenSheet, 0);
      } else if (text === 'Cerrar') {
        closeParityMobileUi();
      }
    });

    backdrop?.addEventListener('click', () => window.setTimeout(resetFabPosition, 0));
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', () => {
      if (document.querySelector('.p2-sheet-open')) positionFabAboveOpenSheet();
      else if (actions.classList.contains('show')) updateFabMenuDirection();
      else resetFabPosition();
    });
    window.addEventListener('orientationchange', () => window.setTimeout(() => {
      if (document.querySelector('.p2-sheet-open')) positionFabAboveOpenSheet();
      else resetFabPosition();
    }, 80));

    resetFabPosition();
  }

  window.MiGranDiaDistributionPhase2P2Parity = Object.freeze({
    computeFabMenuDirection,
    computeFabBottomForPanel,
    closeOnEscape: true,
    fabFollowsSheet: true,
    menuDirection: true,
    status: 'ready'
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installParityHooks, { once: true });
  } else {
    installParityHooks();
  }
})();