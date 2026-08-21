(() => {
  'use strict';

  const WEDDING_DATE = new Date('2027-01-16T17:00:00-05:00');
  const countdown = document.getElementById('countdown');

  if (!countdown) return;

  const daysEl = countdown.querySelector('[data-days]');
  const hoursEl = countdown.querySelector('[data-hours]');
  const minutesEl = countdown.querySelector('[data-minutes]');
  const secondsEl = countdown.querySelector('[data-seconds]');

  const pad = (value) => String(value).padStart(2, '0');

  function renderCountdown() {
    const diff = Math.max(0, WEDDING_DATE.getTime() - Date.now());
    const totalSeconds = Math.floor(diff / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    daysEl.textContent = String(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);

    if (diff === 0) {
      countdown.setAttribute('aria-label', 'Hoy es nuestro gran día');
    }
  }

  renderCountdown();
  window.setInterval(renderCountdown, 1000);
})();
