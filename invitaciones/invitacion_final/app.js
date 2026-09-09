/* INVITACIÓN FINAL — único JS. Sin parches ni scripts auxiliares locales. */
(() => {
  'use strict';

  const WEDDING_DATE = new Date('2027-01-16T16:00:00-05:00');
  const N7_TOKEN = '8c7e5b5c261e4b85ad15a220ca70e0cc66d1336feee740c08027d0c324646167';
  const NATIVE_WIDGET = 'https://avaldiviezoch.github.io/Wedding/app_integral/js/modules/invitados/rsvp-native-widget.js?v=20260820-5b2';

  const entryLayer = document.getElementById('entryLayer');
  const video = document.getElementById('entryVideo');
  let entryStarted = false;

  function finishEntry() {
    if (!entryLayer) return;
    entryLayer.classList.add('is-finished');
    document.body.style.overflow = 'auto';
  }

  function prepareVideo() {
    if (!video) {
      finishEntry();
      return;
    }
    video.autoplay = false;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.pause();
    try { video.currentTime = 0.001; } catch (error) {}
  }

  function startEntry() {
    if (!video || entryStarted) return;
    entryStarted = true;
    entryLayer?.classList.add('is-playing');
    const play = video.play();
    if (play && typeof play.catch === 'function') {
      play.catch(() => {
        entryStarted = false;
        entryLayer?.classList.remove('is-playing');
      });
    }
  }

  prepareVideo();
  if (video) {
    ['loadedmetadata', 'loadeddata', 'canplay'].forEach(eventName => {
      video.addEventListener(eventName, () => {
        if (!entryStarted) {
          video.pause();
          try { if (video.currentTime < 0.001) video.currentTime = 0.001; } catch (error) {}
        }
      });
    });
    video.addEventListener('ended', finishEntry, { once:true });
    video.addEventListener('error', finishEntry, { once:true });
    video.load();
  }
  entryLayer?.addEventListener('click', startEntry);
  entryLayer?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      startEntry();
    }
  });

  function updateCountdown() {
    const root = document.getElementById('countdown');
    if (!root) return;
    const remaining = Math.max(0, WEDDING_DATE.getTime() - Date.now());
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    root.innerHTML = [
      ['Días', days],
      ['Horas', hours],
      ['Min', minutes],
      ['Seg', seconds]
    ].map(([label, value]) => `<div><strong>${String(value).padStart(2, '0')}</strong><span>${label}</span></div>`).join('');
  }
  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  function toggle(button, panel) {
    if (!button || !panel) return;
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    button.setAttribute('aria-expanded', String(willOpen));
  }

  const rsvpButton = document.getElementById('openRsvpBtn');
  const rsvpPanel = document.getElementById('rsvp-panel');
  rsvpButton?.addEventListener('click', () => toggle(rsvpButton, rsvpPanel));

  const musicButton = document.getElementById('openMusicBtn');
  const musicPanel = document.getElementById('music-request-panel');
  musicButton?.addEventListener('click', () => toggle(musicButton, musicPanel));

  const giftButton = document.getElementById('giftToggle');
  const giftDetails = document.getElementById('giftDetails');
  giftButton?.addEventListener('click', () => toggle(giftButton, giftDetails));

  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const value = button.dataset.copy || '';
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = 'COPIADO';
        window.setTimeout(() => { button.textContent = original; }, 1100);
      } catch (error) {
        button.textContent = original;
      }
    });
  });

  document.querySelectorAll('[data-mgd-rsvp-token],[data-mgd-music-token]').forEach(host => {
    if (host.hasAttribute('data-mgd-rsvp-token')) host.setAttribute('data-mgd-rsvp-token', N7_TOKEN);
    if (host.hasAttribute('data-mgd-music-token')) host.setAttribute('data-mgd-music-token', N7_TOKEN);
  });

  import(NATIVE_WIDGET).catch(error => {
    console.error('[Invitación final] No se pudo cargar el widget nativo de confirmación/música.', error);
  });
})();
