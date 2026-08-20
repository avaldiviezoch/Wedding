import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  listSanitizedRsvp,
  rolePolicy,
  RsvpError,
  updatePublicRsvp
} from '../../functions/src/rsvp-core.mjs';
import {
  musicOnlyPayloadFixture,
  publicRsvpPayloadFixture,
  TEST_IDS
} from '../fixtures/rsvp-contracts.mjs';

function repositoryFixture({ config, response, membership, responses } = {}) {
  let stored = response === undefined ? publicRsvpPayloadFixture() : structuredClone(response);
  return {
    serverTimestamp: () => 'SERVER_TIMESTAMP_TEST',
    get stored() { return stored; },
    async getPublicConfig(token) {
      if (token !== TEST_IDS.activeToken) return null;
      return config === undefined ? { active: true, weddingId: TEST_IDS.weddingId, maxGuests: 3 } : config;
    },
    async mutateResponse(_token, responseId, mutate) {
      const current = responseId === TEST_IDS.responseId ? structuredClone(stored) : null;
      stored = structuredClone(mutate(current));
    },
    async getMembership(_weddingId, uid) {
      if (uid === 'outsider') return null;
      return membership || { status: 'active', role: uid };
    },
    async listResponses(_token, pageSize) {
      const items = responses || [{ id: TEST_IDS.responseId, ...publicRsvpPayloadFixture() }];
      return { items: items.slice(0, pageSize), nextCursor: null };
    }
  };
}

function rsvpRequest(overrides = {}) {
  return {
    token: TEST_IDS.activeToken,
    responseId: TEST_IDS.responseId,
    editToken: TEST_IDS.editToken,
    operation: 'rsvp',
    changes: {
      name: 'Invitado Backend Ficticio',
      attendance: 'confirmed',
      quantity: 1,
      companions: [],
      menu: '', email: '', phone: '', restriction: '', notes: 'Actualizado',
      customData: {},
      clientDate: '2000-01-02T00:00:00.000Z'
    },
    ...overrides
  };
}

function musicRequest(music = {}) {
  return {
    token: TEST_IDS.activeToken,
    responseId: TEST_IDS.responseId,
    editToken: TEST_IDS.editToken,
    operation: 'music',
    changes: {
      mgdMusic: {
        version: 1,
        songs: [{ title: 'Canción Backend Ficticia', artist: 'Artista Ficticio' }],
        message: 'Mensaje ficticio', guestName: '',
        updatedAtClient: '2000-01-02T00:00:00.000Z',
        ...music
      }
    }
  };
}

async function rejectsCode(action, code) {
  await assert.rejects(action, (error) => error instanceof RsvpError && error.code === code);
}

describe('seguridad del endpoint público RSVP', () => {
  test('token correcto permite update y conserva editToken', async () => {
    const repo = repositoryFixture();
    await updatePublicRsvp(rsvpRequest(), repo);
    assert.equal(repo.stored.editToken, TEST_IDS.editToken);
    assert.equal(repo.stored.notes, 'Actualizado');
  });

  test('token incorrecto es rechazado', async () => {
    await rejectsCode(() => updatePublicRsvp(rsvpRequest({ editToken: 'x'.repeat(40) }), repositoryFixture()), 'permission-denied');
  });

  test('token ausente es rechazado', async () => {
    await rejectsCode(() => updatePublicRsvp(rsvpRequest({ editToken: undefined }), repositoryFixture()), 'invalid-argument');
  });

  test('responseId inexistente es rechazado', async () => {
    await rejectsCode(() => updatePublicRsvp(rsvpRequest({ responseId: 'missing-response' }), repositoryFixture()), 'not-found');
  });

  test('token RSVP inválido es rechazado', async () => {
    await rejectsCode(() => updatePublicRsvp(rsvpRequest({ token: 'missing-token' }), repositoryFixture()), 'not-found');
  });

  test('RSVP pausado es rechazado', async () => {
    await rejectsCode(() => updatePublicRsvp(rsvpRequest(), repositoryFixture({ config: { active: false } })), 'not-found');
  });

  test('respeta maxGuests de la configuración pública', async () => {
    const repo = repositoryFixture({ config: { active: true, weddingId: TEST_IDS.weddingId, maxGuests: 2 } });
    await assert.rejects(
      updatePublicRsvp(rsvpRequest({ changes: { ...rsvpRequest().changes, quantity: 3 } }), repo),
      (error) => error instanceof RsvpError && error.code === 'invalid-argument'
    );
  });

  test('campos sensibles o administrativos son rechazados', async () => {
    await rejectsCode(() => updatePublicRsvp(rsvpRequest({ changes: { editToken: 'reemplazo' } }), repositoryFixture()), 'permission-denied');
    await rejectsCode(() => updatePublicRsvp(rsvpRequest({ changes: { reviewed: true } }), repositoryFixture()), 'permission-denied');
  });

  test('respuestas antiguas con editToken continúan siendo editables', async () => {
    const oldResponse = publicRsvpPayloadFixture({ customData: { legado: 'valor' } });
    const repo = repositoryFixture({ response: oldResponse });
    await updatePublicRsvp(rsvpRequest(), repo);
    assert.equal(repo.stored.customData.legado, 'valor');
  });
});

describe('preservación de música y customData', () => {
  test('música primero y RSVP después preserva mgdMusic', async () => {
    const first = musicOnlyPayloadFixture();
    const repo = repositoryFixture({ response: first });
    await updatePublicRsvp(rsvpRequest(), repo);
    assert.equal(repo.stored.customData.mgdMusic, first.customData.mgdMusic);
    assert.equal(repo.stored.source, 'public-rsvp');
  });

  test('RSVP primero y música después preserva datos RSVP', async () => {
    const repo = repositoryFixture();
    await updatePublicRsvp(musicRequest(), repo);
    assert.equal(repo.stored.name, 'Invitado Ficticio');
    assert.equal(JSON.parse(repo.stored.customData.mgdMusic).songs[0].title, 'Canción Backend Ficticia');
  });

  test('actualización RSVP posterior preserva música', async () => {
    const repo = repositoryFixture();
    await updatePublicRsvp(musicRequest(), repo);
    const storedMusic = repo.stored.customData.mgdMusic;
    await updatePublicRsvp(rsvpRequest({ changes: { ...rsvpRequest().changes, notes: 'Segunda actualización' } }), repo);
    assert.equal(repo.stored.customData.mgdMusic, storedMusic);
  });

  test('otros campos custom legítimos no se borran accidentalmente', async () => {
    const repo = repositoryFixture({ response: publicRsvpPayloadFixture({ customData: { transporte: 'bus' } }) });
    await updatePublicRsvp(rsvpRequest({ changes: { ...rsvpRequest().changes, customData: { alergiaDeclarada: true } } }), repo);
    assert.deepEqual(repo.stored.customData, { transporte: 'bus', alergiaDeclarada: true });
  });

  test('ausencia de música no crea una estructura inválida', async () => {
    const repo = repositoryFixture();
    await updatePublicRsvp(rsvpRequest(), repo);
    assert.equal('mgdMusic' in repo.stored.customData, false);
  });

  test('múltiples actualizaciones de música conservan RSVP', async () => {
    const repo = repositoryFixture();
    await updatePublicRsvp(musicRequest(), repo);
    await updatePublicRsvp(musicRequest({ songs: [{ title: 'Segunda canción', artist: '' }] }), repo);
    assert.equal(repo.stored.attendance, 'confirmed');
    assert.equal(JSON.parse(repo.stored.customData.mgdMusic).songs[0].title, 'Segunda canción');
  });
});

describe('lectura administrativa saneada', () => {
  for (const role of ['provider', 'viewer']) {
    test(`${role} recibe respuestas sin editToken`, async () => {
      const result = await listSanitizedRsvp(
        { weddingId: TEST_IDS.weddingId, token: TEST_IDS.activeToken },
        { uid: role },
        repositoryFixture()
      );
      assert.equal(result.items.length, 1);
      assert.equal('editToken' in result.items[0], false);
    });
  }

  test('usuario no autenticado es rechazado', async () => {
    await rejectsCode(() => listSanitizedRsvp(
      { weddingId: TEST_IDS.weddingId, token: TEST_IDS.activeToken }, null, repositoryFixture()
    ), 'unauthenticated');
  });

  test('usuario ajeno es rechazado', async () => {
    await rejectsCode(() => listSanitizedRsvp(
      { weddingId: TEST_IDS.weddingId, token: TEST_IDS.activeToken }, { uid: 'outsider' }, repositoryFixture()
    ), 'permission-denied');
  });

  test('no confía en un rol enviado por el cliente', async () => {
    await rejectsCode(() => listSanitizedRsvp(
      { weddingId: TEST_IDS.weddingId, token: TEST_IDS.activeToken, role: 'viewer' },
      { uid: 'outsider' }, repositoryFixture()
    ), 'permission-denied');
  });

  test('no permite consultar token de otra boda', async () => {
    await rejectsCode(() => listSanitizedRsvp(
      { weddingId: 'otra-boda', token: TEST_IDS.activeToken }, { uid: 'viewer' }, repositoryFixture()
    ), 'permission-denied');
  });

  test('owner, admin y editor conservan política de lectura completa y escritura', () => {
    for (const role of ['owner', 'admin', 'editor']) {
      assert.deepEqual(rolePolicy(role), { fullRead: true, sanitizedRead: false, administrativeWrite: true });
    }
  });

  test('provider y viewer mantienen solo lectura saneada', () => {
    for (const role of ['provider', 'viewer']) {
      assert.deepEqual(rolePolicy(role), { fullRead: false, sanitizedRead: true, administrativeWrite: false });
    }
  });
});
