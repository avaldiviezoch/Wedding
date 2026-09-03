(() => {
  const root = window.MiGranDiaDistributionState ||= {};
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function createMemoryStore(initialState = {}) {
    let state = clone(initialState);
    const listeners = new Set();
    return Object.freeze({
      getState() { return clone(state); },
      replace(nextState) { state = clone(nextState || {}); listeners.forEach((fn) => fn(clone(state))); },
      update(mutator) { const draft = clone(state); mutator(draft); state = draft; listeners.forEach((fn) => fn(clone(state))); },
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
    });
  }
  root.createMemoryStore = createMemoryStore;
})();