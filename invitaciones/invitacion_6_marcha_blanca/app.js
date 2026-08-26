(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const entry = $('#entry');
  const enterButton = $('#enterButton');
  const skipIntro = $('#skipIntro');
  const entryVideo = $('#entryVideo');
  const entryStatus = $('#entryStatus');
  const music = $('#backgroundMusic');
  const musicToggle = $('#musicToggle');
  let entered = false;
  let musicWanted = true;

  function finishEntry() {
    if (!entry || entered) return;
    entered = true;
    entry.classList.add('is-leaving');
    setTimeout(() => {
      entry.remove();
      $('#invitation')?.focus({preventScroll:true});
    }, 280);
    if (musicWanted) playMusic();
  }

  async function playMusic() {
    if (!music) return;
    try {
      music.muted = false;
      music.volume = .62;
      await music.play();
      musicToggle?.classList.add('is-playing');
      musicToggle?.setAttribute('aria-pressed','true');
      musicToggle?.setAttribute('aria-label','Pausar música');
    } catch (_) {
      musicToggle?.classList.remove('is-playing');
      musicToggle?.setAttribute('aria-pressed','false');
    }
  }

  async function startEntry() {
    if (!entryVideo || entered) return finishEntry();
    enterButton.disabled = true;
    entryStatus.textContent = '';
    entry.classList.add('is-playing');
    skipIntro.hidden = false;
    try {
      entryVideo.currentTime = 0;
      entryVideo.muted = false;
      entryVideo.volume = 1;
      await entryVideo.play();
      enterButton.hidden = true;
    } catch (_) {
      entryStatus.textContent = 'La introducción no pudo reproducirse; abrimos la invitación directamente.';
      finishEntry();
    } finally {
      enterButton.disabled = false;
    }
  }

  enterButton?.addEventListener('click', startEntry);
  skipIntro?.addEventListener('click', () => {
    try { entryVideo.pause(); } catch (_) {}
    finishEntry();
  });
  entryVideo?.addEventListener('ended', finishEntry, {once:true});
  entryVideo?.addEventListener('error', finishEntry, {once:true});

  musicToggle?.addEventListener('click', async () => {
    if (!music) return;
    if (music.paused) {
      musicWanted = true;
      await playMusic();
    } else {
      musicWanted = false;
      music.pause();
      musicToggle.classList.remove('is-playing');
      musicToggle.setAttribute('aria-pressed','false');
      musicToggle.setAttribute('aria-label','Reproducir música');
    }
  });

  const target = new Date('2027-01-16T14:00:00-05:00').getTime();
  function updateCountdown() {
    const delta = Math.max(0, target - Date.now());
    const sec = Math.floor(delta / 1000);
    const values = {
      days: Math.floor(sec / 86400),
      hours: Math.floor((sec % 86400) / 3600),
      minutes: Math.floor((sec % 3600) / 60),
      seconds: sec % 60
    };
    Object.entries(values).forEach(([key, value]) => {
      const el = document.querySelector(`[data-${key}]`);
      if (el) el.textContent = String(value).padStart(key === 'days' ? 1 : 2, '0');
    });
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  const giftToggle = $('#giftToggle');
  const giftDetails = $('#giftDetails');
  giftToggle?.addEventListener('click', () => {
    const open = giftDetails.hidden;
    giftDetails.hidden = !open;
    giftToggle.setAttribute('aria-expanded', String(open));
    giftToggle.textContent = open ? 'Ocultar opciones' : 'Ver opciones';
  });

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy-target]');
    if (!button) return;
    const targetEl = document.getElementById(button.dataset.copyTarget);
    if (!targetEl) return;
    const value = targetEl.textContent.trim();
    try {
      await navigator.clipboard.writeText(value);
      const old = button.textContent;
      button.textContent = 'Copiado';
      setTimeout(() => button.textContent = old, 1400);
    } catch (_) {
      window.prompt('Copia este dato:', value);
    }
  });

  window.addEventListener('mgd:rsvp-attendance', (event) => {
    const attendance = event?.detail?.attendance;
    const musicHost = document.querySelector('[data-mgd-music-token]');
    if (!musicHost) return;
    musicHost.dataset.rsvpAttendance = attendance || '';
  });

  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      img.classList.add('media-error');
      if (!img.alt) img.hidden = true;
    }, {once:true});
  });
})();
