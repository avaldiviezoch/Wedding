(() => {
  'use strict';

  const VERSION = '20260816-1908-accordion1';

  function setOpen(module, open) {
    if (!module) return;
    module.classList.toggle('open', Boolean(open));
    const toggle = module.querySelector(':scope > .module-toggle');
    toggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function bind() {
    if (!document.body || document.documentElement.dataset.mgdAccordionFast === VERSION) return;
    document.documentElement.dataset.mgdAccordionFast = VERSION;

    // El acordeón principal es UI local: no debe esperar Firebase, auth ni módulos.
    document.addEventListener('click', (event) => {
      const toggle = event.target instanceof Element
        ? event.target.closest('.module-toggle')
        : null;
      if (!toggle) return;

      const module = toggle.closest('.module');
      if (!module) return;

      // Tomamos control antes del legacy para evitar doble toggle cuando ese JS termine de cargar.
      event.preventDefault();
      event.stopImmediatePropagation();

      const willOpen = !module.classList.contains('open');
      document.querySelectorAll('.modules .module.open').forEach((item) => {
        if (item !== module) setOpen(item, false);
      });
      setOpen(module, willOpen);
    }, true);

    // Estado ARIA consistente desde el primer frame interactivo.
    document.querySelectorAll('.modules .module').forEach((module) => {
      setOpen(module, module.classList.contains('open'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
