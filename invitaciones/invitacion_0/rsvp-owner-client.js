import { getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app-check.js';
import {
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

export const LEGACY_RSVP_MESSAGE = 'Esta confirmación pertenece al sistema anterior y no puede modificarse desde aquí. Solicita el cambio a los organizadores.';
const RSVP_APP_NAME = 'mgd-rsvp-anonymous';
const APP_CHECK_SITE_KEY = '6LeukOAtAAAAAJODsmEu9XyMLnyb6JH9TNYizFHk';
const APP_CHECK_HOSTS = new Set(['migrandiapp.com','www.migrandiapp.com','avaldiviezoch.github.io']);

function enableAppCheck(app) {
  const host = String(globalThis.location?.hostname || '').trim().toLowerCase();
  if (!APP_CHECK_HOSTS.has(host)) return;
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    if (!String(error?.code || '').includes('already-initialized')) throw error;
  }
}

function isNotFound(error) {
  return String(error?.code || '').includes('not-found');
}

function isPermissionDenied(error) {
  return String(error?.code || '').includes('permission-denied');
}

function ownershipError(cause) {
  const error = new Error(LEGACY_RSVP_MESSAGE, { cause });
  error.code = 'rsvp-owner-mismatch';
  return error;
}

function customDataFields(customData = {}) {
  return Object.fromEntries(
    Object.entries(customData).map(([key, value]) => [`customData.${key}`, value])
  );
}

export async function ensureRsvpIdentity(app) {
  const rsvpApp = getApps().find((candidate) => candidate.name === RSVP_APP_NAME)
    || initializeApp(app.options, RSVP_APP_NAME);
  enableAppCheck(rsvpApp);
  const auth = getAuth(rsvpApp);
  const user = auth.currentUser || (await signInAnonymously(auth)).user;
  return { db: getFirestore(rsvpApp), user };
}

export async function saveOwnedRsvp({ app, token, responseId, payload }) {
  const { db, user } = await ensureRsvpIdentity(app);
  const ref = doc(db, 'publicRsvp', token, 'responses', responseId);
  const { customData = {}, submittedAt: _submittedAt, updatedAt: _updatedAt, ownerUid: _ownerUid, editToken: _editToken, ...fields } = payload;

  try {
    await updateDoc(ref, {
      ...fields,
      ...customDataFields(customData),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    if (!isNotFound(error) && !isPermissionDenied(error)) throw error;
    try {
      await setDoc(ref, {
        ...fields,
        customData,
        ownerUid: user.uid,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (createError) {
      if (isPermissionDenied(createError)) throw ownershipError(createError);
      throw createError;
    }
  }
}

export async function saveOwnedRsvpMusic({ app, token, responseId, music }) {
  const { db, user } = await ensureRsvpIdentity(app);
  const ref = doc(db, 'publicRsvp', token, 'responses', responseId);
  const serialized = typeof music === 'string' ? music : JSON.stringify(music);

  try {
    await updateDoc(ref, {
      'customData.mgdMusic': serialized,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    if (!isNotFound(error) && !isPermissionDenied(error)) throw error;
    try {
      await setDoc(ref, {
        version: 1,
        source: 'music-widget',
        customData: { mgdMusic: serialized },
        ownerUid: user.uid,
        clientDate: new Date().toISOString(),
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (createError) {
      if (isPermissionDenied(createError)) throw ownershipError(createError);
      throw createError;
    }
  }
}

