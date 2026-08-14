// Núcleo de la App Integral de Bodas.
// Desde aquí se coordinará el arranque general cuando terminemos de migrar legacy.

export const APP_VERSION = '0.1.0';

export function initAppCore() {
  document.documentElement.dataset.appIntegral = 'ready';
}
