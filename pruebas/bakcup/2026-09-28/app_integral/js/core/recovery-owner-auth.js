import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  GoogleAuthProvider,
  browserSessionPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDCRuQgMjnm7KcAN_qo8AHPD3ueyis4-LY',
  authDomain: 'migrandia.firebaseapp.com',
  projectId: 'migrandia',
  storageBucket: 'migrandia.firebasestorage.app',
  messagingSenderId: '7432985765',
  appId: '1:7432985765:web:b3a4844f41ac2a1376c14c'
};

const app = getApps()[0] || initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const card = document.getElementById('ownerAuthCard');
const googleButton = document.getElementById('ownerGoogleButton');
const emailButton = document.getElementById('ownerEmailButton');
const emailInput = document.getElementById('ownerEmail');
const passwordInput = document.getElementById('ownerPassword');
const statusEl = document.getElementById('ownerAuthStatus');

function setBusy(busy) {
  googleButton.disabled = Boolean(busy);
  emailButton.disabled = Boolean(busy);
  emailInput.disabled = Boolean(busy);
  passwordInput.disabled = Boolean(busy);
}

function friendlyError(error) {
  const code = String(error?.code || '');
  if (code.includes('invalid-credential')) return 'Correo o contraseña incorrectos.';
  if (code.includes('invalid-email')) return 'Revisa el correo electrónico.';
  if (code.includes('popup-closed')) return 'La ventana de Google se cerró antes de terminar.';
  if (code.includes('popup-blocked')) return 'El navegador bloqueó la ventana de Google.';
  return String(error?.message || error || 'No se pudo iniciar sesión.');
}

async function loginGoogle() {
  setBusy(true);
  statusEl.textContent = 'Abriendo acceso de Google…';
  try {
    await setPersistence(auth, browserSessionPersistence);
    await signInWithPopup(auth, provider);
  } catch (error) {
    statusEl.textContent = friendlyError(error);
    setBusy(false);
  }
}

async function loginEmail() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) {
    statusEl.textContent = 'Completa correo y contraseña.';
    return;
  }

  setBusy(true);
  statusEl.textContent = 'Verificando la cuenta…';
  try {
    await setPersistence(auth, browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    statusEl.textContent = friendlyError(error);
    setBusy(false);
  }
}

googleButton.addEventListener('click', loginGoogle);
emailButton.addEventListener('click', loginEmail);
passwordInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') loginEmail();
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    card.hidden = false;
    setBusy(false);
    if (!statusEl.textContent) statusEl.textContent = 'Esperando la cuenta propietaria.';
    return;
  }

  setBusy(true);
  card.dataset.authenticated = 'true';
  statusEl.textContent = `Sesión detectada: ${user.displayName || user.email || 'propietaria'}. Iniciando escaneo de solo lectura…`;
});
