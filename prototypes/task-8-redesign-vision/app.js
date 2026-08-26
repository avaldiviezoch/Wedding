const navItems = document.querySelectorAll('[data-view]');
const panels = document.querySelectorAll('[data-panel]');
const directionButtons = document.querySelectorAll('[data-direction]');
const body = document.body;

navItems.forEach((item) => {
  item.addEventListener('click', () => {
    const view = item.dataset.view;

    navItems.forEach((button) => {
      button.classList.toggle('is-active', button === item);
    });

    panels.forEach((panel) => {
      panel.classList.toggle('is-visible', panel.dataset.panel === view);
    });
  });
});

directionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const direction = button.dataset.direction;

    body.classList.remove('direction-a', 'direction-b', 'direction-c');
    body.classList.add(direction);

    directionButtons.forEach((option) => {
      option.classList.toggle('is-active', option === button);
    });
  });
});
