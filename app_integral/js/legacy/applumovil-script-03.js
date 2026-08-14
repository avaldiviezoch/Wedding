
(() => {
  const loader = document.getElementById('appLoader');
  if (!loader) return;

  // Empieza a desvanecerse a los 4.4 segundos y se retira por completo a los 5 segundos.
  window.setTimeout(() => {
    loader.classList.add('loader-leaving');
  }, 4400);

  window.setTimeout(() => {
    loader.remove();
    document.body.classList.remove('is-loading');
  }, 5000);
})();
