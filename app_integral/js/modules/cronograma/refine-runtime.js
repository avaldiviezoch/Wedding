(() => {
  'use strict';

  const VERSION = '20260817-cronograma-refine-production-1';
  const MODULE_ID = 'cronograma';
  const STYLE_ID = 'mgdCronogramaRefineStyles';
  const BODY_CLASS = 'mgd-cronograma-refine';
  const WORKSPACE_ID = 'unifiedWorkspace';

  function isCronogramaActive() {
    return location.hash.replace(/^#/, '').trim().toLowerCase() === MODULE_ID;
  }

  function styleHref() {
    return new URL('css/modules/cronograma-refine.css', document.baseURI).href;
  }

  function classifyActions(doc) {
    doc.querySelectorAll('button,.btn,.button,[role="button"]').forEach(control => {
      const text = String(control.textContent || control.getAttribute('aria-label') || '').trim().toLowerCase();
      if (!text) return;
      if (/eliminar|borrar|restablecer/.test(text)) control.classList.add('mgd-danger');
      if (/agregar|añadir|nuevo|nueva|guardar|crear/.test(text) && !/guardar como/.test(text)) control.classList.add('mgd-primary');
    });
  }

  function annotateStatus(doc) {
    doc.querySelectorAll('[data-status],.status,.badge,.chip,.tag').forEach(node => {
      const value = String(node.dataset?.status || node.textContent || '').trim().toLowerCase();
      if (/completad|listo|aprobado/.test(value)) node.dataset.status = 'completado';
      else if (/progreso|coordin|curso/.test(value)) node.dataset.status = 'en-progreso';
      else if (/pendiente|por cerrar|falta/.test(value)) node.dataset.status = 'pendiente';
    });
  }

  function patchDocument(doc) {
    if (!doc?.documentElement || !doc.body) return false;
    if (!isCronogramaActive()) return false;

    doc.documentElement.classList.add(BODY_CLASS);
    doc.body.classList.add(BODY_CLASS);
    doc.documentElement.dataset.mgdCronogramaRefine = VERSION;

    let link = doc.getElementById(STYLE_ID);
    if (!link) {
      link = doc.createElement('link');
      link.id = STYLE_ID;
      link.rel = 'stylesheet';
      link.href = styleHref();
      doc.head?.appendChild(link);
    }

    classifyActions(doc);
    annotateStatus(doc);
    return true;
  }

  function patchFrame(frame) {
    if (!(frame instanceof HTMLIFrameElement)) return;
    if (frame.dataset.mgdCronogramaRefineBound !== VERSION) {
      frame.dataset.mgdCronogramaRefineBound = VERSION;
      frame.addEventListener('load', () => {
        if (!isCronogramaActive()) return;
        try { patchDocument(frame.contentDocument); } catch (_) {}
      });
    }
    if (!isCronogramaActive()) return;
    try { patchDocument(frame.contentDocument); } catch (_) {}
  }

  function patchWorkspace() {
    const workspace = document.getElementById(WORKSPACE_ID);
    if (!workspace) return;

    document.body.classList.toggle('mgd-cronograma-host-active', isCronogramaActive());
    if (!isCronogramaActive()) return;

    workspace.dataset.mgdCronogramaRefine = VERSION;
    workspace.querySelectorAll('iframe').forEach(patchFrame);

    // El cronograma heredado puede reconstruir tarjetas, modales o filtros en caliente.
    // Reanotamos únicamente clases visuales; no interceptamos datos, eventos ni persistencia.
    workspace.querySelectorAll('iframe').forEach(frame => {
      try {
        const doc = frame.contentDocument;
        if (doc) {
          classifyActions(doc);
          annotateStatus(doc);
        }
      } catch (_) {}
    });
  }

  function bind() {
    const workspace = document.getElementById(WORKSPACE_ID);
    if (!workspace) return;

    const observer = new MutationObserver(() => requestAnimationFrame(patchWorkspace));
    observer.observe(workspace, { childList: true, subtree: true });

    document.addEventListener('click', event => {
      const trigger = event.target instanceof Element
        ? event.target.closest('[data-module],[data-quick-module]')
        : null;
      if (!trigger) return;
      const moduleId = String(trigger.dataset.module || trigger.dataset.quickModule || '').trim().toLowerCase();
      if (moduleId === MODULE_ID) setTimeout(patchWorkspace, 0);
    }, true);

    window.addEventListener('hashchange', () => setTimeout(patchWorkspace, 0));
    window.addEventListener('resize', patchWorkspace, { passive: true });
    patchWorkspace();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
