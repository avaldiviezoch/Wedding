import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  doc,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

export const LEGACY_RSVP_MESSAGE = 'Esta confirmación pertenece al sistema anterior y no puede modificarse desde aquí. Solicita el cambio a los organizadores.';

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
  const auth = getAuth(app);
  if (auth.currentUser) return auth.currentUser;
  return (await signInAnonymously(auth)).user;
}

export async function saveOwnedRsvp({ app, db, token, responseId, payload }) {
  const user = await ensureRsvpIdentity(app);
  const ref = doc(db, 'publicRsvp', token, 'responses', responseId);
  const { customData = {}, submittedAt: _submittedAt, updatedAt: _updatedAt, ownerUid: _ownerUid, editToken: _editToken, ...fields } = payload;

  try {
    await updateDoc(ref, {
      ...fields,
      ...customDataFields(customData),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    if (!isNotFound(error)) {
      if (isPermissionDenied(error)) throw ownershipError(error);
      throw error;
    }
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

export async function saveOwnedRsvpMusic({ app, db, token, responseId, music }) {
  const user = await ensureRsvpIdentity(app);
  const ref = doc(db, 'publicRsvp', token, 'responses', responseId);
  const serialized = typeof music === 'string' ? music : JSON.stringify(music);

  try {
    await updateDoc(ref, {
      'customData.mgdMusic': serialized,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    if (!isNotFound(error)) {
      if (isPermissionDenied(error)) throw ownershipError(error);
      throw error;
    }
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

