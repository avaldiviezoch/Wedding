import { initializeApp } from 'firebase-admin/app';
import { FieldValue, FieldPath, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { listSanitizedRsvp, RsvpError, updatePublicRsvp } from './src/rsvp-core.mjs';

initializeApp();
const db = getFirestore();
const REGION = 'us-central1';

function publicRepository() {
  return {
    serverTimestamp: () => FieldValue.serverTimestamp(),
    async getPublicConfig(token) {
      const snap = await db.doc(`publicRsvp/${token}`).get();
      return snap.exists ? snap.data() : null;
    },
    async mutateResponse(token, responseId, mutate) {
      const ref = db.doc(`publicRsvp/${token}/responses/${responseId}`);
      await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref);
        const next = mutate(snap.exists ? snap.data() : null);
        transaction.set(ref, next);
      });
    }
  };
}

function administrativeRepository() {
  return {
    async getMembership(weddingId, uid) {
      const snap = await db.doc(`weddings/${weddingId}/members/${uid}`).get();
      return snap.exists ? snap.data() : null;
    },
    async getPublicConfig(token) {
      const snap = await db.doc(`publicRsvp/${token}`).get();
      return snap.exists ? snap.data() : null;
    },
    async listResponses(token, pageSize, cursor) {
      let query = db.collection(`publicRsvp/${token}/responses`).orderBy(FieldPath.documentId()).limit(pageSize);
      if (cursor) query = query.startAfter(cursor);
      const snaps = await query.get();
      const items = snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() }));
      return { items, nextCursor: snaps.size === pageSize ? snaps.docs.at(-1).id : null };
    }
  };
}

function toHttpsError(error) {
  if (error instanceof RsvpError) return new HttpsError(error.code, error.message);
  logger.error('RSVP backend error', { name: error?.name || 'Error', code: error?.code || 'unknown' });
  return new HttpsError('internal', 'No se pudo completar la operación.');
}

export const updatePublicRsvpResponse = onCall(
  { region: REGION, cors: true, enforceAppCheck: false, maxInstances: 10 },
  async (request) => {
    try {
      return await updatePublicRsvp(request.data, publicRepository());
    } catch (error) {
      throw toHttpsError(error);
    }
  }
);

export const listSanitizedRsvpResponses = onCall(
  { region: REGION, cors: true, enforceAppCheck: false, maxInstances: 10 },
  async (request) => {
    try {
      return await listSanitizedRsvp(request.data, request.auth, administrativeRepository());
    } catch (error) {
      throw toHttpsError(error);
    }
  }
);
