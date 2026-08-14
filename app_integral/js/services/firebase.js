
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
  import {
    getAuth, GoogleAuthProvider, signInWithPopup,
    getRedirectResult, signInWithEmailAndPassword,
    createUserWithEmailAndPassword, signOut, onAuthStateChanged,
    setPersistence, browserLocalPersistence
  } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
  import {
    getFirestore, doc, getDoc, setDoc, collection, getDocs,
    writeBatch, serverTimestamp
  } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

  const firebaseConfig = {
    apiKey: "AIzaSyDCRuQgMjnm7KcAN_qo8AHPD3ueyis4-LY",
    authDomain: "migrandia.firebaseapp.com",
    projectId: "migrandia",
    storageBucket: "migrandia.firebasestorage.app",
    messagingSenderId: "7432985765",
    appId: "1:7432985765:web:b3a4844f41ac2a1376c14c"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const moduleSessionLogout = document.getElementById('moduleSessionLogout');
  moduleSessionLogout?.addEventListener('click', async () => {
    try {
      if (typeof flushCloudSync === 'function') {
        try { await flushCloudSync(); } catch (_) {}
      }
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      document.body.classList.remove('menu-open', 'module-view');
      history.replaceState(null, '', location.pathname + location.search);
      window.scrollTo(0, 0);
    }
  });

  const db = getFirestore(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await setPersistence(auth, browserLocalPersistence);

  const menuButton = document.getElementById('menuButton');
  const authOverlay = document.getElementById('authOverlay');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const authStatus = document.getElementById('authStatus');
  const googleLoginButton = document.getElementById('googleLoginButton');
  const emailLoginButton = document.getElementById('emailLoginButton');
  const emailRegisterButton = document.getElementById('emailRegisterButton');
  const authCloseButton = document.getElementById('authCloseButton');
  const accountCard = document.getElementById('accountCard');
  const accountAvatar = document.getElementById('accountAvatar');
  const accountName = document.getElementById('accountName');
  const accountEmail = document.getElementById('accountEmail');
  const cloudState = document.getElementById('cloudState');
  const logoutButton = document.getElementById('logoutButton');

  let pendingOpenMenu = false;
  let activeUid = '';
  let cloudBusy = false;
  let cloudTimer = 0;
  let hydrated = false;
  let authResolved = false;
  const CHUNK_SIZE = 180000;
  const LOCAL_OWNER_KEY = 'migrandia_local_owner_uid_v1';

  function openAuth() {
    pendingOpenMenu = true;
    authOverlay.classList.add('show');
    authOverlay.setAttribute('aria-hidden', 'false');
    authStatus.textContent = '';
    googleLoginButton.disabled = false;
    emailLoginButton.disabled = false;
    emailRegisterButton.disabled = false;
    setTimeout(() => googleLoginButton.focus(), 40);
  }

  window.WeddingPlannerRequestAuth = () => {
    if (auth.currentUser) {
      pendingOpenMenu = false;
      menuButton.click();
      return;
    }
    openAuth();
  };

  function closeAuth(force = false) {
    if (!force && auth.currentUser && pendingOpenMenu) return;
    authOverlay.classList.remove('show');
    authOverlay.setAttribute('aria-hidden', 'true');
  }

  function lockPlanner() {
    document.body.classList.add('auth-locked');
    document.body.classList.remove('menu-open', 'module-view');
    window.WeddingPlannerAuthGuard.ready = authResolved;
    window.WeddingPlannerAuthGuard.authenticated = false;
    window.WeddingPlannerAuthGuard.uid = '';
    closeAuth(true);
    if (location.hash) {
      history.replaceState({ module: 'home' }, '', location.pathname + location.search);
    }
  }

  function unlockPlanner(user) {
    window.WeddingPlannerAuthGuard.ready = true;
    window.WeddingPlannerAuthGuard.authenticated = true;
    window.WeddingPlannerAuthGuard.uid = user.uid;
    document.body.classList.remove('auth-locked');
    closeAuth(true);
    window.dispatchEvent(new Event('hashchange'));
  }

  function friendlyAuthError(error) {
    const code = String(error?.code || '');
    if (code.includes('invalid-credential')) return 'Correo o contraseña incorrectos.';
    if (code.includes('email-already-in-use')) return 'Ese correo ya tiene una cuenta.';
    if (code.includes('weak-password')) return 'La contraseña debe tener al menos 6 caracteres.';
    if (code.includes('invalid-email')) return 'Revisa el correo electrónico.';
    if (code.includes('popup-closed')) return 'La ventana de Google se cerró antes de terminar. Vuelve a intentarlo.';
    if (code.includes('popup-blocked')) return 'El navegador bloqueó la ventana de Google. Permite ventanas emergentes para este sitio y vuelve a intentarlo.';
    if (code.includes('cancelled-popup-request')) return 'Ya hay una ventana de acceso abierta. Termina ese acceso o vuelve a intentarlo.';
    if (code.includes('unauthorized-domain')) return `Firebase no tiene autorizado este dominio (${location.hostname}). Agrégalo en Authentication → Configuración → Dominios autorizados.`;
    if (code.includes('operation-not-allowed')) return 'Activa este método de acceso en Firebase Authentication.';
    return 'No se pudo iniciar sesión. Inténtalo nuevamente.';
  }

  function splitText(text) {
    const chunks = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) chunks.push(text.slice(i, i + CHUNK_SIZE));
    return chunks.length ? chunks : [''];
  }

  async function readCloudBackup(uid) {
    const metaRef = doc(db, 'users', uid, 'cloudSync', 'main');
    const metaSnap = await getDoc(metaRef);
    if (!metaSnap.exists()) return null;

    const count = Number(metaSnap.data().chunkCount || 0);
    if (!count) return null;
    const parts = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        getDoc(doc(db, 'users', uid, 'cloudChunks', String(index).padStart(5, '0')))
      )
    );
    const text = parts.map((snap) => snap.exists() ? String(snap.data().data || '') : '').join('');
    return text ? JSON.parse(text) : null;
  }

  async function writeCloudBackup(user, silent = false) {
    if (!user || cloudBusy || !hydrated) return;
    const bridge = window.WeddingPlannerBridge;
    if (!bridge) return;

    cloudBusy = true;
    if (!silent) cloudState.textContent = 'Guardando en la nube…';
    try {
      const backup = await bridge.buildCloudBackup();
      const text = JSON.stringify(backup);
      const chunks = splitText(text);
      const metaRef = doc(db, 'users', user.uid, 'cloudSync', 'main');
      const previous = await getDoc(metaRef);
      const oldCount = previous.exists() ? Number(previous.data().chunkCount || 0) : 0;

      let batch = writeBatch(db);
      let ops = 0;
      async function commitIfNeeded(force = false) {
        if (ops >= 430 || (force && ops)) { await batch.commit(); batch = writeBatch(db); ops = 0; }
      }

      for (let index = 0; index < chunks.length; index++) {
        batch.set(doc(db, 'users', user.uid, 'cloudChunks', String(index).padStart(5, '0')), {
          index, data: chunks[index]
        });
        ops++; await commitIfNeeded();
      }
      for (let index = chunks.length; index < oldCount; index++) {
        batch.delete(doc(db, 'users', user.uid, 'cloudChunks', String(index).padStart(5, '0')));
        ops++; await commitIfNeeded();
      }
      batch.set(metaRef, { chunkCount: chunks.length, bytes: text.length, updatedAt: serverTimestamp(), version: 1 }); ops++;
      batch.set(doc(db, 'users', user.uid), {
        email: user.email || '', displayName: user.displayName || '', lastSeenAt: serverTimestamp()
      }, { merge: true }); ops++;
      await commitIfNeeded(true);

      cloudState.textContent = 'Guardado en la nube';
      localStorage.setItem('migrandia_cloud_sync_meta_v1', new Date().toISOString());
    } catch (error) {
      console.error('Firebase sync error:', error);
      cloudState.textContent = 'No se pudo sincronizar';
      if (!silent) bridge.showToast('No se pudo guardar en Firebase. Revisa las reglas de Firestore.');
    } finally {
      cloudBusy = false;
    }
  }

  function scheduleCloudSave(delay = 2500) {
    if (!auth.currentUser || !hydrated) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(() => writeCloudBackup(auth.currentUser, true), delay);
  }

  async function hydrateUser(user) {
    const bridge = window.WeddingPlannerBridge;
    if (!bridge) return;
    hydrated = false;
    cloudState.textContent = 'Cargando tus datos…';
    try {
      const cloudBackup = await readCloudBackup(user.uid);
      const localOwner = localStorage.getItem(LOCAL_OWNER_KEY) || '';

      if (cloudBackup) {
        await bridge.restoreCloudBackup(cloudBackup);
        
      } else if (localOwner && localOwner !== user.uid) {
        // Este navegador pertenecía a otra cuenta: jamás reutilizar esos datos.
        await bridge.clearLocalUserData();
      }

      localStorage.setItem(LOCAL_OWNER_KEY, user.uid);
      hydrated = true;
      cloudState.textContent = cloudBackup ? 'Sincronizado' : 'Preparando primera copia…';
      if (!cloudBackup) await writeCloudBackup(user);
    } catch (error) {
      console.error('Firebase load error:', error);
      hydrated = true;
      cloudState.textContent = 'Sincronización pendiente';
      bridge.showToast('Sesión iniciada, pero Firestore todavía no permite guardar.');
    }
  }

  let googleAttemptToken = 0;

  function reactivateGoogleButton(message = '') {
    googleLoginButton.disabled = false;
    googleLoginButton.removeAttribute('aria-busy');
    if (message !== undefined) authStatus.textContent = message;
  }

  googleLoginButton.addEventListener('click', async () => {
    // Cada clic es un intento independiente. El botón NO se bloquea.
    const token = ++googleAttemptToken;
    googleLoginButton.disabled = false;
    googleLoginButton.setAttribute('aria-busy', 'true');
    authStatus.textContent = 'Elige la cuenta de Google que deseas usar…';

    const attemptProvider = new GoogleAuthProvider();
    attemptProvider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, attemptProvider);

      if (token !== googleAttemptToken) return;

      if (result?.user) {
        authStatus.textContent = 'Acceso correcto. Abriendo tu planificador…';
      }
    } catch (error) {
      // Si hubo un clic posterior, el popup viejo ya no manda.
      if (token !== googleAttemptToken) return;

      console.error('Google sign-in error:', error);
      const code = String(error?.code || '');

      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/user-cancelled'
      ) {
        authStatus.textContent =
          'Ventana de Google cerrada. Puedes pulsar “Continuar con Google” otra vez.';
      } else {
        authStatus.textContent = friendlyAuthError(error);
      }
    } finally {
      if (token === googleAttemptToken && !auth.currentUser) {
        reactivateGoogleButton(authStatus.textContent);
      }
    }
  });
emailLoginButton.addEventListener('click', async () => {
    authStatus.textContent = 'Ingresando…';
    try { await signInWithEmailAndPassword(auth, authEmail.value.trim(), authPassword.value); }
    catch (error) { authStatus.textContent = friendlyAuthError(error); }
  });

  emailRegisterButton.addEventListener('click', async () => {
    authStatus.textContent = 'Creando tu cuenta…';
    try { await createUserWithEmailAndPassword(auth, authEmail.value.trim(), authPassword.value); }
    catch (error) { authStatus.textContent = friendlyAuthError(error); }
  });

  authPassword.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') emailLoginButton.click();
  });
  authCloseButton.addEventListener('click', () => {
    pendingOpenMenu = false;
    googleAttemptToken++;
    reactivateGoogleButton('');
    authStatus.textContent = '';
    closeAuth(true);
  });
  authOverlay.addEventListener('click', (event) => {
    if (event.target === authOverlay) {
      pendingOpenMenu = false;
      googleAttemptToken++;
      reactivateGoogleButton('');
      authStatus.textContent = '';
      closeAuth(true);
    }
  });
  logoutButton.addEventListener('click', async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    logoutButton.disabled = true;
    cloudState.textContent = 'Cerrando sesión…';
    try {
      await writeCloudBackup(currentUser);
    } catch (error) {
      console.error('Final cloud save before logout failed:', error);
    }
    hydrated = false;
    try {
      await window.WeddingPlannerBridge?.clearLocalUserData?.();
      localStorage.removeItem(LOCAL_OWNER_KEY);
    } finally {
      await signOut(auth);
      logoutButton.disabled = false;
      document.body.classList.remove('menu-open', 'module-view');
      history.replaceState(null, '', location.pathname + location.search);
      window.scrollTo(0,0);
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key && (event.key.startsWith('planificador_bodas_') || event.key.startsWith('eventPlanner'))) {
      scheduleCloudSave();
    }
  });
  window.addEventListener('message', () => scheduleCloudSave(3500));
  window.addEventListener('migrandia:datachange', () => scheduleCloudSave(400));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') scheduleCloudSave(0);
  });
  setInterval(() => { if (auth.currentUser && hydrated) writeCloudBackup(auth.currentUser, true); }, 15000);

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      document.body.classList.remove('menu-open', 'module-view');
      if (location.hash) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    }

    authResolved = true;
    if (user) {
      accountCard.classList.add('show');
      accountName.textContent = user.displayName || 'Mi Gran Día';
      accountEmail.textContent = user.email || '';
      if (user.photoURL) {
        accountAvatar.src = user.photoURL;
        accountAvatar.classList.add('show');
      } else {
        accountAvatar.removeAttribute('src');
        accountAvatar.classList.remove('show');
      }

      if (activeUid && activeUid !== user.uid) {
        await window.WeddingPlannerBridge?.clearLocalUserData?.();
      }
      activeUid = user.uid;
      await hydrateUser(user);
      unlockPlanner(user);

      if (pendingOpenMenu) {
        pendingOpenMenu = false;
        setTimeout(() => menuButton.click(), 80);
      }
    } else {
      const hadAuthenticatedUser = Boolean(activeUid);
      activeUid = ''; hydrated = false;
      if (hadAuthenticatedUser) {
        await window.WeddingPlannerBridge?.clearLocalUserData?.();
        localStorage.removeItem(LOCAL_OWNER_KEY);
      }
      accountCard.classList.remove('show');
      accountName.textContent = '';
      accountEmail.textContent = '';
      accountAvatar.removeAttribute('src');
      accountAvatar.classList.remove('show');
      cloudState.textContent = 'Inicia sesión para sincronizar';
      pendingOpenMenu = false;
      lockPlanner();
    }
  });
