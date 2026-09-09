/* REGLA INVITACIÓN FINAL
   Solo existen index.html, styles.css y app.js.
   No crear parches ni archivos adicionales. Toda lógica se integra aquí.

   BLOQUES CRÍTICOS INAMOVIBLES:
   - RSVP_URL + payload de confirmación conservados desde Invitación 7.
   - MUSIC_REQUEST_URL + MUSIC_INVITATION_NAME + payload musical conservados desde Invitación 7.
   No cambiar endpoints, nombres de campos ni comportamiento de envío sin autorización expresa. */

(() => {
  'use strict';

  const WEDDING_DATE = new Date('2027-01-16T16:00:00-05:00');

  /* CONFIRMACIÓN — conservado exactamente desde la lógica vigente de N7 */
  const RSVP_URL = 'https://script.google.com/macros/s/AKfycbz1BtAqB93LrqW5RrocmRa6UGAQirQoKFkbIelSydJVJIKBDghtrvfz_-m-iFsWdSqw/exec';
  let attendanceValue = '';
  let guestAmount = 1;

  /* PEDIDOS MUSICALES — conservado exactamente desde la lógica vigente de N7 */
  const MUSIC_REQUEST_URL = 'https://script.google.com/macros/s/AKfycbzrxfoPVuu5u1ZOn570xnSQfOeLHnt5oK8wiuksxKZCEpAVWkwehR5LlNZVJNkTJFli/exec';
  const MUSIC_INVITATION_NAME = 'Invitación 2';

  const entryLayer = document.getElementById('entryLayer');
  const video = document.getElementById('entryVideo');
  const app = document.getElementById('app');

  function revealInvitation() {
    if (!app || !entryLayer) return;
    app.hidden = false;
    document.body.style.overflow = 'auto';
    entryLayer.classList.add('is-finished');
    window.setTimeout(() => entryLayer.remove(), 300);
  }

  if (video) {
    video.addEventListener('ended', revealInvitation, { once:true });
    video.addEventListener('error', revealInvitation, { once:true });
    const play = video.play();
    if (play && typeof play.catch === 'function') play.catch(() => {});
  } else {
    revealInvitation();
  }

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
    ].map(([label,value]) => `<div class="countdown-item"><strong>${String(value).padStart(2,'0')}</strong><span>${label}</span></div>`).join('');
  }
  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  function togglePanel(button, panel) {
    if (!button || !panel) return;
    const open = panel.hidden;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  }

  const openRsvpBtn = document.getElementById('openRsvpBtn');
  const rsvpPanel = document.getElementById('rsvp-panel');
  openRsvpBtn?.addEventListener('click', () => togglePanel(openRsvpBtn, rsvpPanel));

  document.querySelectorAll('[data-attendance]').forEach(button => {
    button.addEventListener('click', () => {
      attendanceValue = button.dataset.attendance || '';
      document.querySelectorAll('[data-attendance]').forEach(item => item.classList.toggle('is-selected', item === button));
      const controls = document.getElementById('guestControls');
      if (controls) controls.hidden = attendanceValue !== 'Sí';
    });
  });

  document.querySelectorAll('[data-guest-step]').forEach(button => {
    button.addEventListener('click', () => {
      const delta = Number(button.dataset.guestStep || 0);
      guestAmount = Math.min(6, Math.max(1, guestAmount + delta));
      const counter = document.getElementById('guestCount');
      if (counter) counter.textContent = String(guestAmount);
    });
  });

  function sendRSVP() {
    const input = document.getElementById('guestName');
    const button = document.getElementById('submitRsvpBtn');
    const panel = document.getElementById('rsvp-panel');
    const success = document.getElementById('rsvp-success');
    const name = input ? input.value.trim() : '';

    if (!name || !attendanceValue) {
      alert('Por favor completa tu nombre y confirma si asistirás.');
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = 'Enviando...';
    }

    fetch(RSVP_URL, {
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        nombre:name,
        asistencia:attendanceValue,
        cantidad:attendanceValue === 'Sí' ? guestAmount : ''
      })
    }).catch(() => {}).finally(() => {
      if (panel) panel.hidden = true;
      if (openRsvpBtn) openRsvpBtn.setAttribute('aria-expanded','false');
      if (success) {
        success.hidden = false;
        success.removeAttribute('hidden');
      }
      if (button) {
        button.disabled = false;
        button.textContent = 'Enviar confirmación →';
      }
    });
  }
  document.getElementById('submitRsvpBtn')?.addEventListener('click', sendRSVP);

  const giftToggle = document.getElementById('giftToggle');
  const giftDetails = document.getElementById('giftDetails');
  giftToggle?.addEventListener('click', () => togglePanel(giftToggle, giftDetails));

  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const value = button.dataset.copy || '';
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = 'COPIADO';
        window.setTimeout(() => { button.textContent = original; }, 1000);
      } catch (error) {
        button.textContent = original;
      }
    });
  });

  const openMusicBtn = document.getElementById('openMusicBtn');
  const musicPanel = document.getElementById('music-request-panel');
  openMusicBtn?.addEventListener('click', () => togglePanel(openMusicBtn, musicPanel));

  function buildMusicRequestId() {
    const now = new Date();
    const pad = value => String(value).padStart(2,'0');
    const date = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const random = Math.random().toString(36).slice(2,7).toUpperCase();
    return `PM-${date}-${time}-${random}`;
  }

  function sendMusicRequest() {
    const name = (document.getElementById('musicGuestName')?.value || '').trim();
    const song = (document.getElementById('musicSongName')?.value || '').trim();
    const artist = (document.getElementById('musicArtistName')?.value || '').trim();
    const comment = (document.getElementById('musicComment')?.value || '').trim();
    const button = document.getElementById('submitMusicBtn');
    const panel = document.getElementById('music-request-panel');
    const success = document.getElementById('music-success');

    if (!name || !song || !artist) {
      alert('Por favor completa tu nombre, la canción y el artista.');
      return;
    }

    const requestId = buildMusicRequestId();
    const sentAt = new Date().toISOString();

    if (button) {
      button.disabled = true;
      button.textContent = 'Enviando...';
    }

    fetch(MUSIC_REQUEST_URL, {
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        fecha_hora:sentAt,
        fechaHora:sentAt,
        nombre:name,
        cancion:song,
        artista:artist,
        invitacion:MUSIC_INVITATION_NAME,
        estado:'Pendiente',
        id:requestId,
        observacion:'',
        comentario:comment
      })
    }).catch(() => {}).finally(() => {
      if (panel) panel.hidden = true;
      if (openMusicBtn) openMusicBtn.setAttribute('aria-expanded','false');
      if (success) {
        success.hidden = false;
        success.removeAttribute('hidden');
      }
      if (button) {
        button.disabled = false;
        button.textContent = 'Enviar pedido musical →';
      }
      ['musicGuestName','musicSongName','musicArtistName','musicComment'].forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
      });
    });
  }
  document.getElementById('submitMusicBtn')?.addEventListener('click', sendMusicRequest);
})();
