/* REGLA INVITACIÓN FINAL:
   Solo existen index.html, styles.css y app.js.
   No crear parches ni archivos adicionales. Toda lógica futura se integra aquí. */

(() => {
  const video = document.getElementById('entryVideo');
  if (!video) return;

  const finish = () => {
    video.classList.add('is-finished');
    window.setTimeout(() => video.remove(), 260);
  };

  video.addEventListener('ended', finish, { once:true });

  const play = video.play();
  if (play && typeof play.catch === 'function') {
    play.catch(() => {});
  }
})();
