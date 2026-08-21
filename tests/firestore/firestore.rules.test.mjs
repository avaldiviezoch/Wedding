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
import {
  managementDocumentId,
  managementPayloadFixture,
  legacyRsvpPayloadFixture,
  musicOnlyPayloadFixture,
  publicConfigFixture,
  publicRsvpPayloadFixture,
  surfacePayloadFixtures,
  TEST_IDS
} from '../fixtures/rsvp-contracts.mjs';

const projectId = 'demo-mi-gran-dia';
let environment;

function dbFor(uid = null, token = {}) {
  return uid
    ? environment.authenticatedContext(uid, token).firestore()
    : environment.unauthenticatedContext().firestore();
}

function anonymousDb(uid = TEST_IDS.ownerUid) {
  return dbFor(uid, { firebase: { sign_in_provider: 'anonymous' } });
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

function validRsvp(ownerUid = TEST_IDS.ownerUid) {
  return publicRsvpPayloadFixture({
    ownerUid,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

function validMusicOnly(ownerUid = TEST_IDS.ownerUid) {
  return musicOnlyPayloadFixture({
    ownerUid,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

function legacyRsvp() {
  return legacyRsvpPayloadFixture({
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
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

  test('un invitado anónimo puede crear una respuesta propia, pero no leerla', async () => {
    const response = doc(anonymousDb(), 'publicRsvp', 'public-token', 'responses', 'response-a');
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

  test('el mismo UID anónimo actualiza y otro UID no', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'publicRsvp', 'public-token', 'responses', 'response-a'), validRsvp());
    });
    await assertSucceeds(updateDoc(doc(anonymousDb(), 'publicRsvp', 'public-token', 'responses', 'response-a'), { notes: 'Actualización propia' }));
    await assertFails(updateDoc(doc(anonymousDb('anonymous-other'), 'publicRsvp', 'public-token', 'responses', 'response-a'), { notes: 'Intento ajeno' }));
  });
});

describe('contrato RSVP público observado', () => {
  test('rechaza una respuesta sin el nombre obligatorio', async () => {
    const response = doc(anonymousDb(), 'publicRsvp', 'public-token', 'responses', 'missing-name');
    const payload = validRsvp();
    delete payload.name;
    await assertFails(setDoc(response, payload));
  });

  test('rechaza tipos inválidos en los campos validados por Rules', async () => {
    const response = doc(anonymousDb(), 'publicRsvp', 'public-token', 'responses', 'invalid-types');
    await assertFails(setDoc(response, { ...validRsvp(), quantity: '1', companions: {} }));
  });

  test('ownerUid se guarda y editToken no forma parte de una respuesta nueva', async () => {
    const response = doc(anonymousDb(), 'publicRsvp', 'public-token', 'responses', 'keeps-owner');
    await assertSucceeds(setDoc(response, validRsvp()));
    let stored;
    await environment.withSecurityRulesDisabled(async (context) => {
      stored = await getDoc(doc(context.firestore(), 'publicRsvp', 'public-token', 'responses', 'keeps-owner'));
    });
    assert.equal(stored.data().ownerUid, TEST_IDS.ownerUid);
    assert.equal('editToken' in stored.data(), false);
  });

  test('crear exige Anonymous Auth y ownerUid igual al UID autenticado', async () => {
    await assertFails(setDoc(doc(dbFor(), 'publicRsvp', 'public-token', 'responses', 'no-auth'), validRsvp()));
    await assertFails(setDoc(doc(anonymousDb(), 'publicRsvp', 'public-token', 'responses', 'wrong-owner'), validRsvp('anonymous-other')));
    await assertFails(setDoc(doc(dbFor('provider'), 'publicRsvp', 'public-token', 'responses', 'provider-create'), validRsvp('provider')));
  });

  test('ownerUid no puede cambiarse ni eliminarse', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'publicRsvp', 'public-token', 'responses', 'immutable-owner'), validRsvp());
    });
    const ref = doc(anonymousDb(), 'publicRsvp', 'public-token', 'responses', 'immutable-owner');
    await assertFails(updateDoc(ref, { ownerUid: 'anonymous-other' }));
    const withoutOwner = validRsvp();
    delete withoutOwner.ownerUid;
    await assertFails(setDoc(ref, withoutOwner));
  });

  test('la configuración pausada bloquea nuevas respuestas públicas', async () => {
    await assertFails(setDoc(
      doc(anonymousDb(), 'publicRsvp', 'paused-token', 'responses', 'paused-response'),
      validRsvp()
    ));
  });

  test('un miembro puede consultar configuración pausada y un invitado no', async () => {
    await assertSucceeds(getDoc(doc(dbFor('viewer'), 'publicRsvp', 'paused-token')));
    await assertFails(getDoc(doc(dbFor(), 'publicRsvp', 'paused-token')));
  });

  test('owner, admin y editor conservan escritura administrativa sobre respuestas', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'publicRsvp', 'public-token', 'responses', 'admin-write'), legacyRsvp());
    });
    for (const role of ['owner', 'admin', 'editor']) {
      await assertSucceeds(updateDoc(
        doc(dbFor(role), 'publicRsvp', 'public-token', 'responses', 'admin-write'),
        { notes: `Revisión ficticia ${role}` }
      ));
    }
  });

  test('provider y viewer leen pero no escriben respuestas', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'publicRsvp', 'public-token', 'responses', 'read-only-role'), validRsvp());
    });
    for (const role of ['provider', 'viewer']) {
      const response = doc(dbFor(role), 'publicRsvp', 'public-token', 'responses', 'read-only-role');
      await assertSucceeds(getDoc(response));
      await assertFails(updateDoc(response, { notes: `Intento ${role}` }));
    }
  });

  test('una respuesta legacy no puede actualizarse públicamente ni apropiarse con ownerUid', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'publicRsvp', 'public-token', 'responses', 'legacy'), legacyRsvp());
    });
    await assertFails(updateDoc(doc(dbFor(), 'publicRsvp', 'public-token', 'responses', 'legacy'), { notes: 'Sin auth' }));
    await assertFails(updateDoc(doc(anonymousDb(), 'publicRsvp', 'public-token', 'responses', 'legacy'), { ownerUid: TEST_IDS.ownerUid, notes: 'Apropiación' }));
    await assertFails(updateDoc(doc(anonymousDb(), 'publicRsvp', 'public-token', 'responses', 'legacy'), { editToken: TEST_IDS.editToken, notes: 'Token legacy' }));
    await assertFails(updateDoc(doc(dbFor('outsider'), 'publicRsvp', 'public-token', 'responses', 'legacy'), { notes: 'Ajeno' }));
  });
});

describe('contrato de música observado', () => {
  test('permite que música cree primero un documento mínimo', async () => {
    await assertSucceeds(setDoc(
      doc(anonymousDb(), 'publicRsvp', 'public-token', 'responses', 'music-first'),
      validMusicOnly()
    ));
  });

  test('música → RSVP preserva mgdMusic', async () => {
    const response = doc(anonymousDb(), 'publicRsvp', 'public-token', 'responses', 'music-then-rsvp');
    await assertSucceeds(setDoc(response, validMusicOnly()));
    await assertSucceeds(setDoc(response, {
      ...validRsvp(),
      customData: validMusicOnly().customData
    }, { merge: true }));
    await environment.withSecurityRulesDisabled(async (context) => {
      const stored = await getDoc(doc(context.firestore(), 'publicRsvp', 'public-token', 'responses', 'music-then-rsvp'));
      assert.equal(stored.data().customData.mgdMusic, validMusicOnly().customData.mgdMusic);
    });
  });

  test('RSVP → música → RSVP preserva música y campos custom adicionales', async () => {
    const response = doc(anonymousDb(), 'publicRsvp', 'public-token', 'responses', 'rsvp-music-rsvp');
    await assertSucceeds(setDoc(response, validRsvp()));
    await assertSucceeds(updateDoc(response, {
      'customData.mgdMusic': validMusicOnly().customData.mgdMusic,
      'customData.transporte': 'bus',
      updatedAt: serverTimestamp()
    }));
    await assertSucceeds(updateDoc(response, { notes: 'Nueva actualización', updatedAt: serverTimestamp() }));
    await environment.withSecurityRulesDisabled(async (context) => {
      const stored = await getDoc(doc(context.firestore(), 'publicRsvp', 'public-token', 'responses', 'rsvp-music-rsvp'));
      assert.equal(stored.data().customData.mgdMusic, validMusicOnly().customData.mgdMusic);
      assert.equal(stored.data().customData.transporte, 'bus');
    });
  });

  test('una respuesta sin música sigue siendo válida', async () => {
    await assertSucceeds(setDoc(doc(anonymousDb(), 'publicRsvp', 'public-token', 'responses', 'without-music'), validRsvp()));
  });
});

describe('contrato rsvpManagement observado', () => {
  test('usa y conserva el identificador token__responseId', async () => {
    const id = managementDocumentId('public-token', 'management-response');
    assert.equal(id, 'public-token__management-response');
    const ref = doc(dbFor('editor'), 'weddings', 'wedding-a', 'rsvpManagement', id);
    await assertSucceeds(setDoc(ref, managementPayloadFixture({
      token: 'public-token', responseId: 'management-response', weddingId: 'wedding-a', updatedAt: serverTimestamp()
    })));
    assert.equal((await assertSucceeds(getDoc(ref))).data().responseId, 'management-response');
  });

  test('owner, admin y editor escriben gestión; provider y viewer solo leen', async () => {
    for (const role of ['owner', 'admin', 'editor']) {
      await assertSucceeds(setDoc(
        doc(dbFor(role), 'weddings', 'wedding-a', 'rsvpManagement', `public-token__${role}`),
        managementPayloadFixture({ token: 'public-token', responseId: role, weddingId: 'wedding-a', updatedAt: serverTimestamp() })
      ));
    }
    for (const role of ['provider', 'viewer']) {
      const ref = doc(dbFor(role), 'weddings', 'wedding-a', 'rsvpManagement', 'public-token__owner');
      await assertSucceeds(getDoc(ref));
      await assertFails(setDoc(ref, { reviewed: false }, { merge: true }));
    }
  });

  test('usuario ajeno no puede leer ni escribir gestión RSVP', async () => {
    const ref = doc(dbFor('outsider'), 'weddings', 'wedding-a', 'rsvpManagement', 'public-token__owner');
    await assertFails(getDoc(ref));
    await assertFails(setDoc(ref, managementPayloadFixture()));
  });

  test('Rules no validan la forma token__responseId del ID administrativo', async () => {
    await assertSucceeds(setDoc(
      doc(dbFor('editor'), 'weddings', 'wedding-a', 'rsvpManagement', 'id-arbitrario-observado'),
      managementPayloadFixture({ weddingId: 'wedding-a', updatedAt: serverTimestamp() })
    ));
  });
});

describe('compatibilidad descriptiva de payloads', () => {
  test('las superficies productivas comparten el esquema ownerUid', () => {
    assert.deepEqual(Object.keys(surfacePayloadFixtures.nativeWidget).sort(), Object.keys(surfacePayloadFixtures.rsvpPublic).sort());
    assert.equal(surfacePayloadFixtures.rsvpPublic.ownerUid, TEST_IDS.ownerUid);
    assert.equal('editToken' in surfacePayloadFixtures.rsvpPublic, false);
    assert.equal('ownerUid' in surfacePayloadFixtures.nativeWidgetV2Legacy, false);
    assert.equal(typeof surfacePayloadFixtures.nativeWidgetV2Legacy.editToken, 'string');
  });

  test('widgets nativos incorporan música local y rsvp-public no la incorpora', () => {
    assert.equal(surfacePayloadFixtures.rsvpPublic.customData.mgdMusic, undefined);
    assert.equal(typeof surfacePayloadFixtures.nativeWidget.customData.mgdMusic, 'string');
    assert.equal(typeof surfacePayloadFixtures.nativeWidgetV2Legacy.customData.mgdMusic, 'string');
  });

  test('configuración pública observada conserva weddingId y estado activo', () => {
    const config = publicConfigFixture();
    assert.equal(config.weddingId, TEST_IDS.weddingId);
    assert.equal(config.active, true);
  });
});

test('el propietario conserva control de su documento de usuario y otros no', async () => {
  const own = doc(dbFor('owner'), 'users', 'owner');
  await assertSucceeds(setDoc(own, { preference: true }));
  assert.equal((await assertSucceeds(getDoc(own))).data().preference, true);
  await assertFails(getDoc(doc(dbFor('viewer'), 'users', 'owner')));
});

