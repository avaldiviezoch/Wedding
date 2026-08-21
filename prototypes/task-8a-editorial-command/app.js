const body = document.body;
const shell = document.querySelector('.app-shell');
const views = document.querySelectorAll('[data-panel]');
const navButtons = document.querySelectorAll('[data-view]');
const fontButtons = document.querySelectorAll('[data-font]');
const toast = document.querySelector('.toast');
const modalBackdrop = document.querySelector('.modal-backdrop');
const sheet = document.querySelector('.bottom-sheet');
let lastTrigger = null;

function showView(viewName) {
  views.forEach((view) => {
    view.classList.toggle('is-visible', view.dataset.panel === viewName);
  });

  navButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.view === viewName);
  });
}

function openLayer(layer, trigger) {
  lastTrigger = trigger;
  layer.hidden = false;
  const firstControl = layer.querySelector('button, input, select');
  if (firstControl) firstControl.focus();
}

function closeLayer(layer) {
  layer.hidden = true;
  if (lastTrigger) lastTrigger.focus();
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.view));
});

fontButtons.forEach((button) => {
  button.addEventListener('click', () => {
    body.classList.remove('font-trial-1', 'font-trial-2', 'font-trial-3');
    body.classList.add(button.dataset.font);
    fontButtons.forEach((option) => {
      option.classList.toggle('is-active', option === button);
    });
  });
});

document.addEventListener('click', (event) => {
  const actionTarget = event.target.closest('[data-action]');
  const action = actionTarget?.dataset.action;
  if (!action) return;

  if (action === 'show-toast') {
    toast.classList.add('is-visible');
    window.setTimeout(() => toast.classList.remove('is-visible'), 1400);
  }

  if (action === 'open-modal') openLayer(modalBackdrop, actionTarget);
  if (action === 'close-modal') closeLayer(modalBackdrop);
  if (action === 'open-sheet') openLayer(sheet, actionTarget);
  if (action === 'close-sheet') closeLayer(sheet);

  if (action === 'toggle-reduced') {
    const isReduced = shell.dataset.motion === 'reduced';
    shell.dataset.motion = isReduced ? 'standard' : 'reduced';
    body.classList.toggle('reduced-motion', !isReduced);
  }

  if (action === 'celebrate') {
    const spark = document.querySelector('.spark');
    spark.classList.add('is-celebrating');
    window.setTimeout(() => spark.classList.remove('is-celebrating'), 360);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!modalBackdrop.hidden) closeLayer(modalBackdrop);
  if (!sheet.hidden) closeLayer(sheet);
});
