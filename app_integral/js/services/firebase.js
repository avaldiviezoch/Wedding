// Canonical public entrypoint for Firebase/Auth.
// Keep this file intentionally tiny: historical imports use different query strings,
// but every wrapper now converges on one shared core module URL, preventing duplicate
// auth observers, autosave timers and DOM handlers.
import '../core/logout-data-safety.js?v=20260830-logout-data-safety1';
import '../core/account-menu-bootstrap.js?v=20260830-account-menu8';
import '../core/automatic-login-recovery.js?v=20260830-auto-recovery1';
export * from './firebase-core.js?v=20260819-empty-onboarding2';