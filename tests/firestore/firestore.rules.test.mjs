import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';

const projectId = 'demo-mi-gran-dia';
let environment;

function dbFor(uid = null, token = {}) {
  return uid
    ? environment.authenticatedContext(uid, token).firestore()
    : environment.unauthenticatedContext().firestore();
}

async function seed() {
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'weddings', 'wedding-a'), { ownerUid: 'owner', name: 'Boda A' });
    for (const [uid, role] of Object.entries({ owner: 'owner', admin: 'admin', editor: 'editor', provider: 'provider', viewer: 'viewer' })) {
      await setDoc(doc(db, 'weddings', 'wedding-a', 'members', uid), { uid, role, status: 'active', email: `${uid}@example.test` });
    }
    await setDoc(doc(db, 'publicRsvp', 'public-token'), {
      weddingId: 'wedding-a', active: true, maxGuests: 3
    });
    await setDoc(doc(db, 'publicRsvp', 'paused-token'), {
      weddingId: 'wedding-a', active: false, maxGuests: 2
    });
  });
}

function validRsvp(editToken = 'x'.repeat(40)) {
  return {
    version: 1,
    name: 'Invitado de prueba',
    attendance: 'confirmed',
    quantity: 1,
    companions: [],
    menu: '',
    email: '',
    phone: '',
    restriction: '',
    notes: '',
    customData: {},
    editToken,
    clientDate: new Date(0).toISOString(),
    source: 'public-rsvp',
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync('app_integral/firebase/firestore.rules', 'utf8')
    }
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await seed();
});

after(async () => {
  await environment?.cleanup();
});

describe('datos privados y roles', () => {
  test('un usuario no autenticado no puede leer datos privados', async () => {
    await assertFails(getDoc(doc(dbFor(), 'weddings', 'wedding-a')));
  });

  test('un miembro activo puede leer su boda', async () => {
    for (const role of ['owner', 'admin', 'editor', 'provider', 'viewer']) {
      await assertSucceeds(getDoc(doc(dbFor(role), 'weddings', 'wedding-a')));
    }
  });

  test('solo owner puede actualizar el documento principal de la boda', async () => {
    await assertSucceeds(updateDoc(doc(dbFor('owner'), 'weddings', 'wedding-a'), { name: 'Boda actualizada' }));
    for (const role of ['admin', 'editor', 'provider', 'viewer']) {
      await assertFails(updateDoc(doc(dbFor(role), 'weddings', 'wedding-a'), { name: `Intento ${role}` }));
    }
  });

  test('owner, admin y editor escriben planner; provider y viewer no', async () => {
    for (const role of ['owner', 'admin', 'editor']) {
      await assertSucceeds(setDoc(doc(dbFor(role), 'weddings', 'wedding-a', 'cloudSync', role), { payload: role }));
    }
    for (const role of ['provider', 'viewer']) {
      await assertFails(setDoc(doc(dbFor(role), 'weddings', 'wedding-a', 'cloudSync', role), { payload: role }));
    }
  });
});

describe('RSVP público', () => {
  test('la configuración activa es pública y la pausada no', async () => {
    await assertSucceeds(getDoc(doc(dbFor(), 'publicRsvp', 'public-token')));
    await assertFails(getDoc(doc(dbFor(), 'publicRsvp', 'paused-token')));
  });

  test('un invitado puede crear una respuesta válida, pero no leerla', async () => {
    const response = doc(dbFor(), 'publicRsvp', 'public-token', 'responses', 'response-a');
    await assertSucceeds(setDoc(response, validRsvp()));
    await assertFails(getDoc(response));
  });

  test('un miembro activo puede leer respuestas y un extraño no', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'publicRsvp', 'public-token', 'responses', 'response-a'), validRsvp());
    });
    await assertSucceeds(getDoc(doc(dbFor('viewer'), 'publicRsvp', 'public-token', 'responses', 'response-a')));
    await assertFails(getDoc(doc(dbFor('outsider'), 'publicRsvp', 'public-token', 'responses', 'response-a')));
  });

  test('una actualización pública exige conservar el editToken', async () => {
    const originalToken = 'a'.repeat(40);
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'publicRsvp', 'public-token', 'responses', 'response-a'), validRsvp(originalToken));
    });
    const response = doc(dbFor(), 'publicRsvp', 'public-token', 'responses', 'response-a');
    await assertSucceeds(setDoc(response, { ...validRsvp(originalToken), notes: 'Actualización válida' }));
    await assertFails(setDoc(response, validRsvp('b'.repeat(40))));
  });
});

test('el propietario conserva control de su documento de usuario y otros no', async () => {
  const own = doc(dbFor('owner'), 'users', 'owner');
  await assertSucceeds(setDoc(own, { preference: true }));
  assert.equal((await assertSucceeds(getDoc(own))).data().preference, true);
  await assertFails(getDoc(doc(dbFor('viewer'), 'users', 'owner')));
});


