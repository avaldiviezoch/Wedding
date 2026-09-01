const VERSION = '20260901-table-trigger-compat1';
const workspaceObserverState = { observer: null };

function isDistributionDocument(doc) {
  return Boolean(doc?.getElementById('planner') && doc.getElementById('itemsLayer') && doc.getElementById('selectionForm'));
}

function patchTableTrigger(frame) {
  if (!(frame instanceof HTMLIFrameElement)) return;
  let doc;
  try { doc = frame.contentDocument; } catch (_) { return; }
  if (!isDistributionDocument(doc)) return;

  // El control estable del planner es data-add="table". No dependemos del copy
  // visible ("Mesa circular 10 personas", "Mesa", etc.). El módulo de geometría
  // heredado todavía localiza temporalmente el control por texto, así que añadimos
  // un marcador oculto y no destructivo para que pueda encontrar el botón real.
  const source = doc.querySelector('button[data-add="table"]');
  if (!source || source.querySelector('[data-mgd-table-trigger-marker]')) return;

  const marker = doc.createElement('span');
  marker.hidden = true;
  marker.dataset.mgdTableTriggerMarker = VERSION;
  marker.textContent = 'Mesa 10 personas';
  source.prepend(marker);
}

function scan() {
  const workspace = document.getElementById('unifiedWorkspace');
  if (!workspace) return;
  workspace.querySelectorAll('iframe').forEach((frame) => {
    if (frame.dataset.mgdTableTriggerCompat !== VERSION) {
      frame.dataset.mgdTableTriggerCompat = VERSION;
      frame.addEventListener('load', () => patchTableTrigger(frame));
    }
    patchTableTrigger(frame);
  });
}

function start() {
  const workspace = document.getElementById('unifiedWorkspace');
  if (!workspace) return;
  if (!workspaceObserverState.observer) {
    workspaceObserverState.observer = new MutationObserver(scan);
    workspaceObserverState.observer.observe(workspace, { childList: true });
  }
  scan();
}

window.MiGranDiaDistributionTableTriggerCompat = Object.freeze({ version: VERSION, refresh: scan });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
