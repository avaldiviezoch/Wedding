(() => {
  'use strict';

  const VERSION = '20260814-1532-uicopy3';

  const cleanStatus = (value = '') => {
    const text = String(value || '').trim();
    if (!text) return '';
    const lower = text.toLowerCase();

    if (lower.includes('configuración publicada en firebase')) return 'Formulario publicado correctamente';
    if (lower.includes('bandeja rsvp conectada')) return 'Confirmaciones actualizadas';
    if (lower.includes('clasificación rsvp guardada')) return 'Clasificación guardada';
    if (lower.includes('cargando rsvp')) return 'Cargando confirmaciones…';
    if (lower.includes('missing or insufficient permissions') || lower.includes('permission-denied')) {
      return 'No tienes permiso para realizar esta acción.';
    }
    if (lower.includes('firebase') || lower.includes('supabase') || lower.includes('firestore')) {
      return 'No se pudo completar la acción. Inténtalo nuevamente.';
    }

    return text
      .replace(/\bRSVP\b/gi, 'confirmación')
      .replace(/\s*·\s*revisión manual/gi, '')
      .trim();
  };

  function setText(root, selector, text) {
    const node = root.querySelector(selector);
    if (node && node.textContent !== text) node.textContent = text;
  }

  function setPlaceholder(root, selector, text) {
    const node = root.querySelector(selector);
    if (node && node.getAttribute('placeholder') !== text) node.setAttribute('placeholder', text);
  }

  function simplifyRsvpUi(doc) {
    const panel = doc?.getElementById('rsvpNativeView');
    const tab = doc?.getElementById('rsvpNativeTab');
    if (tab && tab.textContent !== 'Confirmaciones') tab.textContent = 'Confirmaciones';
    if (!panel) return false;

    setText(panel, '.rsvp-admin-eyebrow', 'Módulo de confirmación de invitación digital');
    setText(panel, '.rsvp-admin-hero h2', 'Confirmaciones de asistencia');

    const heroDescription = panel.querySelector('.rsvp-admin-hero p');
    if (heroDescription) heroDescription.textContent = 'Recibe y organiza las respuestas enviadas desde tus invitaciones digitales.';

    panel.querySelector('.rsvp-safety-note')?.remove();

    panel.querySelectorAll('[data-rsvp-pane-tab]').forEach((button) => {
      const key = button.dataset.rsvpPaneTab;
      if (key === 'responses') button.textContent = 'Confirmaciones';
      if (key === 'form') button.textContent = 'Formulario';
      if (key === 'integrate') button.textContent = 'Integrar';
    });

    const responseHead = panel.querySelector('[data-rsvp-pane="responses"] .rsvp-card-head');
    if (responseHead) {
      setText(responseHead, 'h3', 'Confirmaciones recibidas');
      setText(responseHead, 'p', 'Revisa cada respuesta, clasifícala y, si corresponde, vincúlala con tu lista de invitados.');
    }

    const formHead = panel.querySelector('[data-rsvp-pane="form"] .rsvp-card-head');
    if (formHead) {
      setText(formHead, 'h3', 'Campos del formulario');
      setText(formHead, 'p', 'Define la información que podrán completar tus invitados.');
    }

    panel.querySelectorAll('.rsvp-base-field small').forEach((small) => {
      if (small.textContent.trim().toLowerCase() === 'base') small.textContent = 'Incluido';
    });

    setText(panel, '#rsvpSaveConfig', 'Guardar y publicar');

    const integrateHead = panel.querySelector('[data-rsvp-pane="integrate"] .rsvp-card-head');
    if (integrateHead) {
      setText(integrateHead, 'h3', 'Integrar en tu invitación digital');
      setText(integrateHead, 'p', 'Comparte el enlace o integra el formulario dentro de tu invitación digital.');
    }

    const integrateBoxes = panel.querySelectorAll('[data-rsvp-pane="integrate"] .rsvp-code-box');
    if (integrateBoxes[0]) {
      setText(integrateBoxes[0], 'label', 'Enlace de confirmación');
      setPlaceholder(integrateBoxes[0], '#rsvpPublicUrl', 'Guarda el formulario para generar el enlace');
    }
    if (integrateBoxes[1]) {
      setText(integrateBoxes[1], 'label', 'Código para integrar');
      setPlaceholder(integrateBoxes[1], '#rsvpEmbedCode', 'Aquí aparecerá el código para integrar');
      setText(integrateBoxes[1], '#rsvpCopyEmbed', 'Copiar código');
    }

    const note = panel.querySelector('[data-rsvp-pane="integrate"] .rsvp-note');
    if (note) note.textContent = 'Las respuestas aparecerán automáticamente en la pestaña Confirmaciones.';

    panel.querySelectorAll('.rsvp-link-help').forEach((help) => {
      help.textContent = 'La cantidad indicada es referencial. Tú decides exactamente a qué personas de tu lista corresponde cada confirmación.';
    });

    panel.querySelectorAll('.rsvp-toggle-copy span').forEach((node) => {
      node.textContent = node.textContent.replace(/Dato opcional del RSVP/gi, 'Dato opcional del formulario');
    });

    const syncState = panel.querySelector('#rsvpSyncState');
    if (syncState) {
      const next = cleanStatus(syncState.textContent);
      if (next && next !== syncState.textContent) syncState.textContent = next;
    }

    return true;
  }

  function bindPanel(doc) {
    const panel = doc?.getElementById('rsvpNativeView');
    if (!panel) return false;
    simplifyRsvpUi(doc);
    if (panel.dataset.mgdUiCopyBound === VERSION) return true;
    panel.dataset.mgdUiCopyBound = VERSION;

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        simplifyRsvpUi(doc);
      });
    });
    observer.observe(panel, { childList: true, subtree: true, characterData: true });
    return true;
  }

  function watchFrame(frame) {
    let doc;
    try { doc = frame.contentDocument; } catch (_) { return; }
    if (!doc?.body || !doc.getElementById('guestList')) return;

    if (bindPanel(doc)) return;
    if (doc.documentElement.dataset.mgdUiCopyWait === VERSION) return;
    doc.documentElement.dataset.mgdUiCopyWait = VERSION;

    const waitObserver = new MutationObserver(() => {
      if (bindPanel(doc)) waitObserver.disconnect();
    });
    waitObserver.observe(doc.body, { childList: true, subtree: true });
  }

  function scan() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace) return;
    workspace.querySelectorAll('iframe').forEach((frame) => {
      if (!frame.dataset.mgdUiCopyLoadBound) {
        frame.dataset.mgdUiCopyLoadBound = VERSION;
        frame.addEventListener('load', () => setTimeout(() => watchFrame(frame), 20));
      }
      watchFrame(frame);
    });
  }

  function bindWorkspace() {
    const workspace = document.getElementById('unifiedWorkspace');
    if (!workspace || workspace.dataset.mgdUiCopyObserver === VERSION) return;
    workspace.dataset.mgdUiCopyObserver = VERSION;
    new MutationObserver(scan).observe(workspace, { childList: true, subtree: true });
    scan();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindWorkspace, { once: true });
  else bindWorkspace();
})();
