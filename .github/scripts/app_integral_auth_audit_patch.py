from pathlib import Path
import re

VERSION = '20260814-1047-auth3'
ROOT = Path('app_integral')


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'No se encontró bloque para {label}')
    return text.replace(old, new, 1)

# --- firebase.js: un solo estado de autenticación y transición visual estable ---
p = ROOT / 'js/services/firebase.js'
s = p.read_text(encoding='utf-8')

s = replace_once(
    s,
    "const moduleSessionLogout = document.getElementById('moduleSessionLogout');\n",
    "const moduleSessionLogout = document.getElementById('moduleSessionLogout');\nconst mainDrawer = document.getElementById('mainDrawer');\nconst backdrop = document.getElementById('backdrop');\nconst unifiedLoader = document.getElementById('unifiedLoader');\n",
    'referencias UI auth'
)
s = replace_once(
    s,
    "let legacyMode = false;\n",
    "let legacyMode = false;\nlet authTransitioning = false;\nlet logoutInProgress = false;\n",
    'estado transición auth'
)

old_auth = """function openAuth() {
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
"""
new_auth = """function setAuthControlsBusy(busy) {
  authTransitioning = Boolean(busy);
  [googleLoginButton, emailLoginButton, emailRegisterButton].forEach((button) => {
    if (button) button.disabled = Boolean(busy);
  });
  authOverlay?.toggleAttribute('data-auth-busy', Boolean(busy));
}

function closePrivatePanels() {
  document.body.classList.remove('menu-open', 'module-view', 'wedding-modal-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir menú');
  mainDrawer?.setAttribute('aria-hidden', 'true');
  backdrop?.setAttribute('aria-hidden', 'true');
  unifiedLoader?.classList.remove('show');

  document.querySelectorAll('.module.open').forEach((module) => {
    module.classList.remove('open');
    module.querySelector('.module-toggle')?.setAttribute('aria-expanded', 'false');
  });

  const weddingsModal = document.getElementById('weddingWorkspaceModal');
  weddingsModal?.classList.remove('show');
  weddingsModal?.setAttribute('aria-hidden', 'true');
  const createWeddingSheet = document.getElementById('createWeddingSheet');
  createWeddingSheet?.classList.remove('show');
  createWeddingSheet?.setAttribute('aria-hidden', 'true');
}

function openAuth() {
  if (logoutInProgress) return;
  pendingOpenMenu = true;
  closePrivatePanels();
  authOverlay.classList.add('show');
  authOverlay.setAttribute('aria-hidden', 'false');
  authStatus.textContent = '';
  setAuthControlsBusy(false);
  setTimeout(() => googleLoginButton.focus(), 40);
}

window.WeddingPlannerRequestAuth = () => {
  if (logoutInProgress) return;

  // Si Firebase ya conoce al usuario pero todavía está restaurando la boda,
  // no volvemos a disparar click sobre el mismo botón: eso generaba recursión.
  if (auth.currentUser) {
    pendingOpenMenu = true;
    closeAuth(true);
    return;
  }

  openAuth();
};

function closeAuth(force = false) {
  authOverlay.classList.remove('show');
  authOverlay.setAttribute('aria-hidden', 'true');
  if (force) authStatus.textContent = '';
}

function lockPlanner() {
  document.body.classList.add('auth-locked');
  document.body.classList.remove('auth-hydrating');
  closePrivatePanels();
  menuButton.disabled = false;
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
  document.body.classList.remove('auth-locked', 'auth-hydrating');
  menuButton.disabled = false;
  closeAuth(true);
  window.dispatchEvent(new Event('hashchange'));
}
"""
s = replace_once(s, old_auth, new_auth, 'flujo abrir/cerrar auth')

s = replace_once(
    s,
    """function reactivateGoogleButton(message = '') {
  googleLoginButton.disabled = false;
  googleLoginButton.removeAttribute('aria-busy');
  if (message !== undefined) authStatus.textContent = message;
}
""",
    """function reactivateGoogleButton(message = '') {
  setAuthControlsBusy(false);
  googleLoginButton.removeAttribute('aria-busy');
  if (message !== undefined) authStatus.textContent = message;
}
""",
    'reactivar Google'
)

start = s.index("googleLoginButton.addEventListener('click', async () => {")
end = s.index("\n\nemailLoginButton.addEventListener('click'", start)
s = s[:start] + """googleLoginButton.addEventListener('click', async () => {
  if (authTransitioning || logoutInProgress) return;
  const token = ++googleAttemptToken;
  setAuthControlsBusy(true);
  googleLoginButton.setAttribute('aria-busy', 'true');
  authStatus.textContent = 'Elige la cuenta de Google que deseas usar…';

  const attemptProvider = new GoogleAuthProvider();
  attemptProvider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, attemptProvider);
    if (token !== googleAttemptToken) return;
    if (result?.user) {
      authStatus.textContent = 'Acceso correcto. Cargando tu boda…';
      closeAuth(true);
    }
  } catch (error) {
    if (token !== googleAttemptToken) return;
    console.error('Google sign-in error:', error);
    const code = String(error?.code || '');
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/user-cancelled'
    ) {
      authStatus.textContent = 'Ventana de Google cerrada. Puedes pulsar “Continuar con Google” otra vez.';
    } else {
      authStatus.textContent = friendlyAuthError(error);
    }
  } finally {
    googleLoginButton.removeAttribute('aria-busy');
    if (token === googleAttemptToken && !auth.currentUser) {
      setAuthControlsBusy(false);
    }
  }
});
""" + s[end:]

s = replace_once(
    s,
    """emailLoginButton.addEventListener('click', async () => {
  authStatus.textContent = 'Ingresando…';
  try {
    await signInWithEmailAndPassword(auth, authEmail.value.trim(), authPassword.value);
  } catch (error) {
    authStatus.textContent = friendlyAuthError(error);
  }
});

emailRegisterButton.addEventListener('click', async () => {
  authStatus.textContent = 'Creando tu cuenta…';
  try {
    await createUserWithEmailAndPassword(auth, authEmail.value.trim(), authPassword.value);
  } catch (error) {
    authStatus.textContent = friendlyAuthError(error);
  }
});
""",
    """emailLoginButton.addEventListener('click', async () => {
  if (authTransitioning || logoutInProgress) return;
  authStatus.textContent = 'Ingresando…';
  setAuthControlsBusy(true);
  try {
    const result = await signInWithEmailAndPassword(auth, authEmail.value.trim(), authPassword.value);
    if (result?.user) {
      authStatus.textContent = 'Acceso correcto. Cargando tu boda…';
      closeAuth(true);
    }
  } catch (error) {
    authStatus.textContent = friendlyAuthError(error);
    setAuthControlsBusy(false);
  }
});

emailRegisterButton.addEventListener('click', async () => {
  if (authTransitioning || logoutInProgress) return;
  authStatus.textContent = 'Creando tu cuenta…';
  setAuthControlsBusy(true);
  try {
    const result = await createUserWithEmailAndPassword(auth, authEmail.value.trim(), authPassword.value);
    if (result?.user) {
      authStatus.textContent = 'Cuenta creada. Cargando tu boda…';
      closeAuth(true);
    }
  } catch (error) {
    authStatus.textContent = friendlyAuthError(error);
    setAuthControlsBusy(false);
  }
});
""",
    'login email'
)

s = replace_once(
    s,
    """authCloseButton.addEventListener('click', () => {
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
""",
    """function cancelAuthDialog() {
  pendingOpenMenu = false;
  googleAttemptToken++;
  reactivateGoogleButton('');
  closeAuth(true);
  closePrivatePanels();
  if (!auth.currentUser) lockPlanner();
}

authCloseButton.addEventListener('click', cancelAuthDialog);

authOverlay.addEventListener('click', (event) => {
  if (event.target === authOverlay) cancelAuthDialog();
});
""",
    'cancelar auth'
)

start = s.index('async function performLogout(button) {')
end = s.index("\n\nlogoutButton?.addEventListener", start)
s = s[:start] + """async function performLogout(button) {
  const currentUser = auth.currentUser;
  if (!currentUser || logoutInProgress) return;

  logoutInProgress = true;
  pendingOpenMenu = false;
  googleAttemptToken++;
  if (button) button.disabled = true;

  // El usuario queda visualmente fuera en el mismo instante en que pulsa salir.
  authResolved = true;
  lockPlanner();
  accountCard.classList.remove('show');
  cloudState.textContent = 'Cerrando sesión…';

  try {
    try {
      await writeCloudBackup(currentUser);
    } catch (error) {
      console.error('Final cloud save before logout failed:', error);
    }

    hydrated = false;
    await window.WeddingPlannerBridge?.clearLocalUserData?.();
    localStorage.removeItem(LOCAL_OWNER_KEY);
    await signOut(auth);
    history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo(0, 0);
  } catch (error) {
    console.error('Logout failed:', error);
    if (auth.currentUser) {
      unlockPlanner(auth.currentUser);
      window.WeddingPlannerBridge?.showToast?.('No se pudo cerrar la sesión. Inténtalo nuevamente.');
    }
  } finally {
    logoutInProgress = false;
    if (button) button.disabled = false;
  }
}
""" + s[end:]

start = s.index('onAuthStateChanged(auth, async (user) => {')
end = s.index("\n\nif (!document.querySelector('link[data-weddings-style]'))", start)
s = s[:start] + """onAuthStateChanged(auth, async (user) => {
  authResolved = true;

  if (user) {
    // Firebase ya autenticó. El modal se cierra antes de restaurar todos los datos.
    closeAuth(true);
    setAuthControlsBusy(false);
    closePrivatePanels();
    document.body.classList.add('auth-locked', 'auth-hydrating');
    menuButton.disabled = true;

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

    window.dispatchEvent(
      new CustomEvent('migrandia:auth', {
        detail: { authenticated: true, uid: user.uid }
      })
    );

    if (pendingOpenMenu) {
      pendingOpenMenu = false;
      setTimeout(() => {
        if (window.WeddingPlannerAuthGuard?.authenticated === true) menuButton.click();
      }, 40);
    }
    return;
  }

  // Sin sesión, se bloquea ANTES de cualquier limpieza asíncrona.
  lockPlanner();
  setAuthControlsBusy(false);
  const hadAuthenticatedUser = Boolean(activeUid);
  activeUid = '';
  hydrated = false;

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
  setWeddingContext({ id: '', name: '', role: 'viewer', legacyMode: false });
  window.dispatchEvent(
    new CustomEvent('migrandia:auth', { detail: { authenticated: false } })
  );
});
""" + s[end:]

s = re.sub(
    r"import\('\.\./modules/configuracion/weddings\.js(?:\?v=[^']+)?'\)\.catch",
    f"import('../modules/configuracion/weddings.js?v={VERSION}').catch",
    s,
    count=1
)
p.write_text(s, encoding='utf-8')

# --- Código visual legado: segunda barrera para el menú/módulos ---
p = ROOT / 'js/legacy/applu-script-01.js'
s = p.read_text(encoding='utf-8')
s = replace_once(
    s,
    """  function setMenu(open) {
    body.classList.toggle('menu-open', open);
""",
    """  function setMenu(open) {
    if (open && window.WeddingPlannerAuthGuard?.authenticated !== true) {
      open = false;
    }
    body.classList.toggle('menu-open', open);
""",
    'guard setMenu'
)
s = replace_once(
    s,
    """    toggle.addEventListener('click', () => {
      const willOpen = !module.classList.contains('open');
""",
    """    toggle.addEventListener('click', () => {
      if (window.WeddingPlannerAuthGuard?.authenticated !== true) {
        setMenu(false);
        window.WeddingPlannerRequestAuth?.();
        return;
      }
      const willOpen = !module.classList.contains('open');
""",
    'guard acordeón módulos'
)
s = replace_once(
    s,
    """  document.querySelectorAll('.pending').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      showToast(
""",
    """  document.querySelectorAll('.pending').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (window.WeddingPlannerAuthGuard?.authenticated !== true) {
        setMenu(false);
        window.WeddingPlannerRequestAuth?.();
        return;
      }

      showToast(
""",
    'guard pending'
)
s = replace_once(
    s,
    """    if (!message || typeof message !== 'object') {
      return;
    }

    if (
      message.source ===
""",
    """    if (!message || typeof message !== 'object') {
      return;
    }

    if (window.WeddingPlannerAuthGuard?.authenticated !== true) {
      return;
    }

    if (
      message.source ===
""",
    'guard mensajes iframe'
)
p.write_text(s, encoding='utf-8')

# --- CSS modular para ocultar TODO lo privado sin sesión ---
auth_css = ROOT / 'css/core/auth-guard.css'
auth_css.write_text("""/* Guard visual central del planificador. */
body.auth-locked .modules,
body.auth-locked .unified-workspace,
body.auth-locked .module-quick-nav,
body.auth-locked .unified-home-button,
body.auth-locked .module-session-logout,
body.auth-locked .wedding-workspace-modal,
body.auth-locked .create-wedding-sheet,
body.auth-locked .unified-loader {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

body.auth-hydrating .menu-button {
  opacity: .7;
  cursor: wait;
}
""", encoding='utf-8')

# --- Un solo URL de firebase.js en todo el grafo de módulos ---
p = ROOT / 'js/modules/configuracion/weddings.js'
s = p.read_text(encoding='utf-8')
s = re.sub(r"await import\('./weddings-legacy\.js(?:\?v=[^']+)?'\);", f"await import('./weddings-legacy.js?v={VERSION}');", s, count=1)
s = re.sub(r"const firebaseApi = await import\('../../services/firebase\.js(?:\?v=[^']+)?'\);", f"const firebaseApi = await import('../../services/firebase.js?v={VERSION}');", s, count=1)
p.write_text(s, encoding='utf-8')

p = ROOT / 'js/modules/configuracion/weddings-legacy.js'
s = p.read_text(encoding='utf-8')
s = re.sub(r"} from '../../services/firebase\.js(?:\?v=[^']+)?';", f"}} from '../../services/firebase.js?v={VERSION}';", s, count=1)
p.write_text(s, encoding='utf-8')

# --- HTML: cache bust explícito y CSS de guard separado ---
p = ROOT / 'applu.html'
s = p.read_text(encoding='utf-8')
if 'css/core/auth-guard.css' not in s:
    s = s.replace(
        '<link rel="stylesheet" href="css/legacy/applu-style-01.css">',
        f'<link rel="stylesheet" href="css/legacy/applu-style-01.css">\n  <link rel="stylesheet" href="css/core/auth-guard.css?v={VERSION}">',
        1
    )
s = re.sub(r'src="js/legacy/applu-script-01\.js(?:\?v=[^"]+)?"', f'src="js/legacy/applu-script-01.js?v={VERSION}"', s, count=1)
s = re.sub(r'src="js/services/firebase\.js(?:\?v=[^"]+)?"', f'src="js/services/firebase.js?v={VERSION}"', s, count=1)
s = re.sub(r'src="js/modules/configuracion/invite-direct\.js(?:\?v=[^"]+)?"', f'src="js/modules/configuracion/invite-direct.js?v={VERSION}"', s, count=1)
p.write_text(s, encoding='utf-8')

print('PATCH_AUTH_AUDIT_OK')
