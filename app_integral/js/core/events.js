// Bus de eventos compartido entre módulos.
const bus = new EventTarget();

export function emit(eventName, detail = {}) {
  bus.dispatchEvent(new CustomEvent(eventName, { detail }));
}

export function on(eventName, handler) {
  bus.addEventListener(eventName, handler);
  return () => bus.removeEventListener(eventName, handler);
}
