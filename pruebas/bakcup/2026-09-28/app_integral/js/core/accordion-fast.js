(() => {
  'use strict';

  const VERSION = '20260817-1342-accordion-navfree1';

  function setOpen(module, open) {
    if (!module) return;
    module.classList.toggle('open', Boolean(open));
    const toggle = module.querySelector(':scope > .module-toggle');
    toggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function bind() {
    if (!document.body || document.documentElement.dataset.mgdAccordionFast === VERSION) return;
    document.documentElement.dataset.mgdAccordionFast = VERSION;

    // El acordeón principal solo controla la apertura visual del menú.
    // No debe limpiar ni marcar como activo el workspace de los módulos:
    // cada router/renderizador es responsable de sustituir su propio contenido.
    document.addEventListener('click', (event) => {
      const toggle = event.target instanceof Element
        ? event.target.closest('.module-toggle')
        : null;
      if (!toggle) return;

      const module = toggle.closest('.module');
      if (!module) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const willOpen = !module.classList.contains('open');
      document.querySelectorAll('.modules .module.open').forEach((item) => {
        if (item !== module) setOpen(item, false);
      });
      setOpen(module, willOpen);
    }, true);

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
