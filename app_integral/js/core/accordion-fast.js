(() => {
  'use strict';

  const VERSION = '20260816-2108-accordion-isolation1';

  function moduleFromTarget(target) {
    if (!(target instanceof Element)) return '';
    const control = target.closest('[data-quick-module],[data-module]');
    if (!control) return '';
    return String(control.dataset.quickModule || control.dataset.module || '').trim().toLowerCase();
  }

  function resetWorkspaceFor(nextModule) {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace || !nextModule) return;

    const previousModule = String(workspace.dataset.activeModule || '').toLowerCase();
    if (previousModule === nextModule && workspace.childElementCount) return;

    // Cada módulo debe arrancar con un workspace limpio. El legacy todavía
    // conserva algunos renderizadores que agregan contenido en vez de sustituirlo;
    // sin esta limpieza quedaban restos de Invitados/Invitaciones sobre Cronograma,
    // Distribución y otros módulos.
    workspace.replaceChildren();
    workspace.dataset.activeModule = nextModule;
    workspace.removeAttribute('data-mgd-invitations-fast');
    workspace.removeAttribute('data-mgd-invitados-runtime-observer');

    // Estilos que pertenecen exclusivamente al panel nativo de Invitaciones.
    // Se eliminan al salir para que no afecten el siguiente módulo.
    if (nextModule !== 'invitaciones') {
      document.getElementById('mgdNativeInvitationsStyles')?.remove();
      document.getElementById('mgdInvitationMobilePanelStyles')?.remove();
    }

    document.body.dataset.mgdActiveModule = nextModule;
  }

  // Se registra inmediatamente, antes de los routers de Invitados, Invitaciones
  // y del legacy. Así la limpieza ocurre ANTES de que el siguiente módulo pinte.
  document.addEventListener('click', (event) => {
    const nextModule = moduleFromTarget(event.target);
    if (!nextModule) return;
    resetWorkspaceFor(nextModule);
  }, true);

  window.addEventListener('hashchange', () => {
    const nextModule = location.hash.replace(/^#/, '').trim().toLowerCase();
    if (nextModule) resetWorkspaceFor(nextModule);
  });

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
