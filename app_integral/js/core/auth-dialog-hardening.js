(() => {
  const overlay = document.getElementById('authOverlay');
  const card = overlay?.querySelector('[role="dialog"]');
  const closeButton = document.getElementById('authCloseButton');
  const fallbackFocus = document.getElementById('menuButton');
  let returnFocus = null;

  if (!overlay || !card) return;

  function isOpen() {
    return overlay.getAttribute('aria-hidden') !== 'true' && overlay.classList.contains('show');
  }

  function rememberFocus() {
    const active = document.activeElement;
    if (active instanceof HTMLElement && !overlay.contains(active)) returnFocus = active;
  }

  function restoreFocus() {
    const target = returnFocus?.isConnected ? returnFocus : fallbackFocus;
    returnFocus = null;
    target?.focus?.({ preventScroll: true });
  }

  function focusableNodes() {
    return [...card.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')]
      .filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
  }

  const observer = new MutationObserver(() => {
    if (isOpen()) {
      rememberFocus();
      return;
    }
    if (returnFocus) restoreFocus();
  });

  observer.observe(overlay, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });

  overlay.addEventListener('keydown', (event) => {
    if (!isOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeButton?.click();
      return;
    }
    if (event.key !== 'Tab') return;
    const nodes = focusableNodes();
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();
