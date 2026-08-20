import { getApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { doc, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-functions.js';

function callable(name) {
  return httpsCallable(getFunctions(getApp(), 'us-central1'), name);
}

function isNotFound(error) {
  return String(error?.code || '').includes('not-found');
}

function rsvpChanges(payload) {
  const customData = { ...(payload.customData || {}) };
  delete customData.mgdMusic;
  return {
    name: payload.name,
    attendance: payload.attendance,
    quantity: payload.quantity,
    companions: payload.companions,
    menu: payload.menu,
    email: payload.email,
    phone: payload.phone,
    restriction: payload.restriction,
    notes: payload.notes,
    customData,
    clientDate: payload.clientDate
  };
}

export async function savePublicRsvp({ db, token, responseId, editToken, payload }) {
  const updatePublic = callable('updatePublicRsvpResponse');
  try {
    await updatePublic({ token, responseId, editToken, operation: 'rsvp', changes: rsvpChanges(payload) });
    const rawMusic = payload.customData?.mgdMusic;
    if (rawMusic) {
      const music = typeof rawMusic === 'string' ? JSON.parse(rawMusic) : rawMusic;
      await updatePublic({ token, responseId, editToken, operation: 'music', changes: { mgdMusic: music } });
    }
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await setDoc(doc(db, 'publicRsvp', token, 'responses', responseId), payload);
  }
}

export async function savePublicRsvpMusic({ db, token, responseId, editToken, music }) {
  const updatePublic = callable('updatePublicRsvpResponse');
  try {
    await updatePublic({ token, responseId, editToken, operation: 'music', changes: { mgdMusic: music } });
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await setDoc(doc(db, 'publicRsvp', token, 'responses', responseId), {
      version: 1,
      source: 'music-widget',
      customData: { mgdMusic: JSON.stringify(music) },
      editToken,
      clientDate: new Date().toISOString(),
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

export async function listSanitizedResponses({ weddingId, token }) {
  const listSanitized = callable('listSanitizedRsvpResponses');
  const items = [];
  let cursor = null;
  do {
    const response = await listSanitized({ weddingId, token, limit: 100, cursor });
    items.push(...(response.data?.items || []));
    cursor = response.data?.nextCursor || null;
  } while (cursor);
  return items;
}
