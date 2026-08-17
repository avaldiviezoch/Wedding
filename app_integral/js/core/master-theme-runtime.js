(() => {
  'use strict';

  const VERSION = '20260817-master-theme-runtime-v6-direct-nav';
  const WORKSPACE_ID = 'unifiedWorkspace';
  const STYLE_ID = 'mgdMasterThemeStyles';
  const CHECKLIST_STYLE_ID = 'mgdChecklistRefineStyles';
  const MODULES = new Set([
    'checklist','presupuesto','proveedores','invitados',
    'distribucion','cronograma','invitaciones','musica',
    'documentos','configuracion'
  ]);

  function loadNavigationGuard() {
    if (document.querySelector('script[data-mgd-module-navigation-guard]')) return;
    const script = document.createElement('script');
    script.src = new URL(`js/core/module-navigation-guard.js?v=${VERSION}`, document.baseURI).href;
    script.defer = true;
    script.dataset.mgdModuleNavigationGuard = VERSION;
    document.head.appendChild(script);
  }

  function currentModule() {
    return location.hash.replace(/^#/, '').trim().toLowerCase();
  }

  function frameThemeHref() {
    return new URL(`css/core/master-frame-theme.css?v=${VERSION}`, document.baseURI).href;
  }

  function checklistThemeHref() {
    return new URL(`css/modules/checklist-refine.css?v=${VERSION}`, document.baseURI).href;
  }

  function classifyActions(doc) {
    doc.querySelectorAll('button,.btn,.button,[role="button"]').forEach(control => {
      const text = String(control.textContent || control.getAttribute('aria-label') || '').trim().toLowerCase();
      if (!text) return;
      control.classList.remove('mgd-master-primary','mgd-master-danger');
      if (/eliminar|borrar|restablecer|quitar/.test(text)) {
        control.classList.add('mgd-master-danger');
        return;
      }
      if (/agregar|añadir|nuevo|nueva|guardar|crear|confirmar|resolver/.test(text) && !/guardar como/.test(text)) {
        control.classList.add('mgd-master-primary');
      }
    });
  }

  function annotateStatus(doc) {
    doc.querySelectorAll('[data-status],.status,.badge,.chip,.tag,[class*="status"]').forEach(node => {
      const value = String(node.dataset?.status || node.textContent || '').trim().toLowerCase();
      if (/completad|listo|aprobado|confirmado|pagado/.test(value)) node.dataset.mgdStatus = 'success';
      else if (/progreso|coordin|curso|parcial/.test(value)) node.dataset.mgdStatus = 'progress';
      else if (/pendiente|por cerrar|falta|vencido/.test(value)) node.dataset.mgdStatus = 'pending';
    });
  }

  function decorateChecklist(doc) {
    if (!doc?.body) return;
    doc.documentElement.classList.add('mgd-checklist-refine');
    doc.body.classList.add('mgd-checklist-refine');

    let link = doc.getElementById(CHECKLIST_STYLE_ID);
    if (!link) {
      link = doc.createElement('link');
      link.id = CHECKLIST_STYLE_ID;
      link.rel = 'stylesheet';
      link.href = checklistThemeHref();
      doc.head?.appendChild(link);
    }

    doc.querySelectorAll('h1,h2,.page-title,.module-title,.workspace-title').forEach(title => {
      const text = String(title.textContent || '').trim().toLowerCase();
      if (/checklist|tareas|pendientes/.test(text)) title.classList.add('mgd-checklist-title');
    });

    doc.querySelectorAll('input[type="checkbox"]').forEach(box => {
      const row = box.closest('li,tr,[class*="task"],[class*="item"],[class*="row"],[class*="card"]');
      if (!row || row === doc.body || row === doc.documentElement) return;
      row.classList.add('mgd-checklist-task');
      row.classList.toggle('mgd-checklist-done', Boolean(box.checked));
      if (box.dataset.mgdChecklistBound !== VERSION) {
        box.dataset.mgdChecklistBound = VERSION;
        box.addEventListener('change', () => row.classList.toggle('mgd-checklist-done', Boolean(box.checked)));
      }
    });

    doc.querySelectorAll('[class*="summary"],[class*="progress-card"],[class*="stats"]').forEach(node => node.classList.add('mgd-checklist-summary'));
    doc.querySelectorAll('[class*="filter"],[class*="tabs"],[class*="segmented"],select,input[type="search"]').forEach(node => {
      const holder = node.matches('select,input[type="search"]') ? node.closest('[class*="filter"],[class*="toolbar"],[class*="controls"]') : node;
      if (holder) holder.classList.add('mgd-checklist-filter');
    });
  }

  function clearChecklistDecor(doc) {
    if (!doc?.body) return;
    doc.documentElement.classList.remove('mgd-checklist-refine');
    doc.body.classList.remove('mgd-checklist-refine');
  }

  function patchDocument(doc, moduleId) {
    if (!doc?.documentElement || !doc.body) return false;
    doc.documentElement.classList.add('mgd-master-theme');
    doc.body.classList.add('mgd-master-theme');
    doc.documentElement.dataset.mgdModule = moduleId || 'unknown';
    doc.documentElement.dataset.mgdMasterTheme = VERSION;

    let link = doc.getElementById(STYLE_ID);
    if (!link) {
      link = doc.createElement('link');
      link.id = STYLE_ID;
      link.rel = 'stylesheet';
      link.href = frameThemeHref();
      doc.head?.appendChild(link);
    }

    classifyActions(doc);
    annotateStatus(doc);
    if (moduleId === 'checklist') decorateChecklist(doc);
    else clearChecklistDecor(doc);
    return true;
  }

  function patchFrame(frame, moduleId) {
    if (!(frame instanceof HTMLIFrameElement)) return;
    if (frame.dataset.mgdMasterThemeBound !== VERSION) {
      frame.dataset.mgdMasterThemeBound = VERSION;
      frame.addEventListener('load', () => {
        try { patchDocument(frame.contentDocument, currentModule()); } catch (_) {}
      });
    }
    try { patchDocument(frame.contentDocument, moduleId); } catch (_) {}
  }

  function patchWorkspace() {
    const workspace = document.getElementById(WORKSPACE_ID);
    if (!workspace) return;
    const moduleId = currentModule();
    const active = MODULES.has(moduleId) || Boolean(moduleId);
    document.body.classList.toggle('mgd-master-host-active', active && document.body.classList.contains('module-view'));
    document.body.classList.toggle('mgd-checklist-host-active', moduleId === 'checklist' && document.body.classList.contains('module-view'));
    workspace.dataset.mgdMasterTheme = VERSION;
    workspace.dataset.mgdModule = moduleId || '';
    workspace.querySelectorAll('iframe').forEach(frame => patchFrame(frame, moduleId));
    classifyActions(workspace);
    annotateStatus(workspace);
  }

  function bind() {
    const workspace = document.getElementById(WORKSPACE_ID);
    if (!workspace) return;
    loadNavigationGuard();

    const observer = new MutationObserver(() => requestAnimationFrame(patchWorkspace));
    observer.observe(workspace, { childList:true, subtree:true });
    new MutationObserver(() => requestAnimationFrame(patchWorkspace)).observe(document.body, { attributes:true, attributeFilter:['class'] });

    document.addEventListener('click', event => {
      const trigger = event.target instanceof Element ? event.target.closest('[data-module],[data-quick-module]') : null;
      if (!trigger) return;
      setTimeout(patchWorkspace, 0);
    }, true);

    window.addEventListener('hashchange', () => setTimeout(patchWorkspace, 0));
    window.addEventListener('resize', patchWorkspace, { passive:true });
    patchWorkspace();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once:true });
  else bind();
})();
