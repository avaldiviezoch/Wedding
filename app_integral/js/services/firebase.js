// Canonical public entrypoint for Firebase/Auth.
// Keep this file intentionally tiny: historical imports use different query strings,
// but every wrapper now converges on one shared core module URL, preventing duplicate
// auth observers, autosave timers and DOM handlers.
export * from './firebase-core.js?v=20260818-auth-perf1';
