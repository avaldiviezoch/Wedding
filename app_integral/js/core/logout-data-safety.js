(() => {
  'use strict';

  const VERSION = '20260830-logout-data-safety2';
  const LOCAL_OWNER_KEY = 'migrandia_local_owner_uid_v1';
  const LOGOUT_BACKUP_BLOCKED = 'MIGRANDIA_LOGOUT_BACKUP_BLOCKED';

  function install() {
    const bridge = window.WeddingPlannerBridge;
    if (!bridge || typeof bridge.clearLocalUserData !== 'function' || typeof bridge.buildCloudBackup !== 'function') return false;
    if (bridge.__mgdLogoutDataSafety === VERSION) return true;

    const originalClear = bridge.clearLocalUserData.bind(bridge);
    const originalBuildCloudBackup = bridge.buildCloudBackup.bind(bridge);

    bridge.clearLocalUserData = async (...args) => {
      const authenticated = window.WeddingPlannerAuthGuard?.authenticated === true;

      // Logout must never erase the last local safety copy. Switching wedding or
      // changing to a different authenticated user still uses the canonical clear.
      if (!authenticated) {
        const ownerUid = localStorage.getItem(LOCAL_OWNER_KEY) || '';
        setTimeout(() => {
          if (ownerUid && !localStorage.getItem(LOCAL_OWNER_KEY)) {
            localStorage.setItem(LOCAL_OWNER_KEY, ownerUid);
          }
        }, 0);
        console.info('[Mi Gran Día] Estado local preservado al cerrar sesión.');
        return;
      }

      return originalClear(...args);
    };

    bridge.buildCloudBackup = async (...args) => {
      const authenticated = window.WeddingPlannerAuthGuard?.authenticated === true;

      // The current logout flow marks the shell unauthenticated before attempting
      // its legacy final save. Abort before buildCloudBackup so Firestore receives
      // zero writes from logout. Normal authenticated autosaves remain untouched.
      if (!authenticated) {
        console.info('[Mi Gran Día] Escritura en nube bloqueada durante cierre de sesión.');
        throw new Error(LOGOUT_BACKUP_BLOCKED);
      }

      return originalBuildCloudBackup(...args);
    };

    bridge.__mgdLogoutDataSafety = VERSION;
    return true;
  }

  if (install()) return;

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (install() || attempts >= 40) clearInterval(timer);
  }, 50);
})();
