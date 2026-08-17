(() => {
  'use strict';

  const VERSION = '20260817-autosave-ui-v2-iframes';
  const WORKSPACE_ID = 'unifiedWorkspace';
  const MODULES = new Set([
    'checklist','presupuesto','proveedores','invitados',
    'distribucion','cronograma','invitaciones','musica',
    'documentos','configuracion'
  ]);
  const observedDocs = new WeakSet();
  const boundFrames = new WeakSet();
  let queued = 0;

  function normalize(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function currentModule() {
    return normalize(location.hash.replace(/^#/, ''));
  }

  function controlText(control) {
    return normalize(control?.textContent || control?.value || control?.getAttribute?.('aria-label'));
  }

  function identity(control) {
    return normalize([
      control?.id,
      control?.name,
      control?.className,
      control?.getAttribute?.('data-action'),
      control?.getAttribute?.('data-testid')
    ].filter(Boolean).join(' '));
  }

  function nearbyText(control) {
    const scope = control?.closest?.('form,[role="dialog"],.modal,.dialog,.sheet,.drawer,.panel,.card,.editor,.form,.content') || control?.parentElement;
    return normalize(scope?.textContent || '');
  }

  function isGenericSave(text) {
    return /^(guardar|guardar cambios|guardar cambio|guardar datos|guardar todo)$/i.test(text);
  }

  function isSaveAs(text) {
    return /^guardar como(?:\.\.\.)?$/i.test(text);
  }

  function isPersistenceOnly(control, text) {
    const signal = `${identity(control)} ${text}`;
    return /guardar (?:en )?la nube|guardar nube|guardar respaldo|guardar backup|backup|cloud.?save|save.?cloud|sync.?now|sincronizar ahora|guardar datos en nube|guardar todo en nube/.test(signal);
  }

  function isRealCopyAction(control) {
    const context = `${identity(control)} ${nearbyText(control)}`;
    return /plantilla|versi[oó]n|copia|duplic|escenario|modelo|alternativa|nuevo nombre|save.?as/.test(context);
  }

  function semanticLabel(control, moduleId) {
    const context = `${identity(control)} ${nearbyText(control)}`;

    if (/fecha|weddingdate|date/.test(context)) return 'Aplicar fecha';
    if (/tarea|task|checklist/.test(context)) return /editar|actualizar|modificar/.test(context) ? 'Actualizar tarea' : 'Confirmar tarea';
    if (/proveedor|provider/.test(context)) return /editar|actualizar|modificar/.test(context) ? 'Actualizar proveedor' : 'Confirmar proveedor';
    if (/invitad|guest/.test(context)) return /editar|actualizar|modificar/.test(context) ? 'Actualizar invitado' : 'Confirmar invitado';
    if (/presupuesto|budget|gasto|pago|monto/.test(context)) return 'Aplicar cambios';
    if (/mesa|distribuci[oó]n|layout|plano|seat/.test(context)) return 'Aplicar cambios';
    if (/cronograma|evento|actividad|timeline|schedule/.test(context)) return 'Aplicar cambios';
    if (/m[uú]sica|playlist|canci[oó]n|song|dj/.test(context)) return 'Aplicar cambios';
    if (/invitaci[oó]n/.test(context)) return 'Aplicar cambios';

    return MODULES.has(moduleId) ? 'Aplicar cambios' : 'Aplicar cambios';
  }

  function replaceLabel(control, label) {
    if (!control || !label) return;
    if (!control.dataset.mgdAutosaveOriginalLabel) {
      control.dataset.mgdAutosaveOriginalLabel = String(control.textContent || control.value || '').trim();
    }

    const tagName = String(control.tagName || '').toLowerCase();
    const type = normalize(control.getAttribute?.('type'));
    if (tagName === 'input' && /^(button|submit)$/.test(type)) {
      control.value = label;
    } else {
      const textNodes = Array.from(control.childNodes || []).filter(node => node.nodeType === 3 && node.textContent.trim());
      if (textNodes.length === 1) textNodes[0].textContent = label;
      else if (!control.querySelector?.('svg,img,use,path')) control.textContent = label;
      else {
        const labelNode = Array.from(control.children || []).find(child => !child.matches?.('svg,img'));
        if (labelNode) labelNode.textContent = label;
        else control.setAttribute('aria-label', label);
      }
    }
    control.dataset.mgdAutosaveSemantic = 'true';
  }

  function hideRedundant(control) {
    if (!control || control.dataset.mgdAutosaveRedundant === 'true') return;
    control.dataset.mgdAutosaveRedundant = 'true';
    control.hidden = true;
    control.setAttribute('aria-hidden', 'true');
    control.setAttribute('tabindex', '-1');
  }

  function processControl(control, moduleId) {
    if (!control || control.nodeType !== 1) return;
    const text = controlText(control);
    if (!text) return;

    if (isPersistenceOnly(control, text)) {
      hideRedundant(control);
      return;
    }

    if (isSaveAs(text)) {
      if (!isRealCopyAction(control)) replaceLabel(control, 'Crear copia');
      return;
    }

    if (isGenericSave(text)) replaceLabel(control, semanticLabel(control, moduleId));
  }

  function scanDocument(doc, moduleId) {
    if (!doc?.documentElement || !doc.body) return;
    const id = MODULES.has(moduleId) ? moduleId : currentModule();
    doc.documentElement.dataset.mgdPersistence = 'firebase-autosave';
    doc.querySelectorAll('button,input[type="button"],input[type="submit"],[role="button"],.btn,.button').forEach(control => processControl(control, id));
  }

  function observeDocument(doc, moduleId) {
    if (!doc?.body) return;
    scanDocument(doc, moduleId);
    if (observedDocs.has(doc)) return;
    observedDocs.add(doc);

    const observer = new MutationObserver(() => {
      requestAnimationFrame(() => scanDocument(doc, currentModule() || moduleId));
    });
    observer.observe(doc.body, { childList:true, subtree:true });
  }

  function bindFrame(frame, moduleId) {
    if (!(frame instanceof HTMLIFrameElement)) return;
    if (!boundFrames.has(frame)) {
      boundFrames.add(frame);
      frame.addEventListener('load', () => {
        try { observeDocument(frame.contentDocument, currentModule()); } catch (_) {}
      });
    }
    try { observeDocument(frame.contentDocument, moduleId); } catch (_) {}
  }

  function scanAll() {
    queued = 0;
    const moduleId = currentModule();
    scanDocument(document, moduleId);

    const workspace = document.getElementById(WORKSPACE_ID);
    workspace?.querySelectorAll('iframe').forEach(frame => bindFrame(frame, moduleId));
  }

  function queueScan() {
    if (queued) return;
    queued = requestAnimationFrame(scanAll);
  }

  function bind() {
    const workspace = document.getElementById(WORKSPACE_ID);
    if (!workspace) return;

    new MutationObserver(queueScan).observe(workspace, { childList:true, subtree:true });
    window.addEventListener('hashchange', queueScan);
    document.addEventListener('migrandia:datachange', queueScan);
    scanAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once:true });
  else bind();

  window.MGDAutosaveUI = Object.freeze({ version: VERSION, refresh: queueScan });
})();
