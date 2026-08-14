// Persistencia local compartida.
export function readLocal(key, fallback = null) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
}
export function writeLocal(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
