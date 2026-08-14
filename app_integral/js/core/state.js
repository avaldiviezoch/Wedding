// Estado transversal liviano. Los datos persistentes viven en services/.
const state = new Map();
export function setState(key, value) { state.set(key, value); }
export function getState(key, fallback = null) { return state.has(key) ? state.get(key) : fallback; }
