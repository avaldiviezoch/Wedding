// Router interno de módulos.
export function navigateToModule(moduleName) {
  window.location.hash = moduleName ? `#${moduleName}` : '';
}
export function currentModule() {
  return window.location.hash.replace(/^#/, '') || 'dashboard';
}
