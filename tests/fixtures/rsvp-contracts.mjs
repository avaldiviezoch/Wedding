const TEST_EDIT_TOKEN = 'test-edit-token-0000000000000000000000000001';

export const TEST_IDS = Object.freeze({
  weddingId: 'wedding-contract-test',
  activeToken: 'public-contract-token-test',
  pausedToken: 'paused-contract-token-test',
  responseId: 'response-contract-test',
  editToken: TEST_EDIT_TOKEN
});

export function publicConfigFixture(overrides = {}) {
  return {
    version: 1,
    weddingId: TEST_IDS.weddingId,
    weddingName: 'Evento ficticio de prueba',
    active: true,
    maxGuests: 3,
    allowTentative: true,
    ...overrides
  };
}

export function publicRsvpPayloadFixture(overrides = {}) {
  return {
    version: 1,
    name: 'Invitado Ficticio',
    attendance: 'confirmed',
    quantity: 1,
    companions: [],
    menu: '',
    email: '',
    phone: '',
    restriction: '',
    notes: '',
    customData: {},
    editToken: TEST_IDS.editToken,
    clientDate: '2000-01-01T00:00:00.000Z',
    source: 'public-rsvp',
    submittedAt: null,
    updatedAt: null,
    ...overrides
  };
}

// Fixtures descriptivos: reproducen las formas observadas sin importar módulos de navegador.
export const surfacePayloadFixtures = Object.freeze({
  rsvpPublic: publicRsvpPayloadFixture(),
  nativeWidget: publicRsvpPayloadFixture({
    customData: {
      mgdMusic: JSON.stringify({ version: 1, songs: [{ title: 'Canción ficticia', artist: 'Artista ficticio' }], message: '' })
    }
  }),
  nativeWidgetV2: publicRsvpPayloadFixture({
    customData: {
      mgdMusic: JSON.stringify({ version: 1, songs: [{ title: 'Canción ficticia', artist: 'Artista ficticio' }], message: '' })
    }
  })
});

export function musicOnlyPayloadFixture(overrides = {}) {
  return {
    version: 1,
    source: 'music-widget',
    customData: {
      mgdMusic: JSON.stringify({
        version: 1,
        songs: [{ title: 'Canción ficticia', artist: 'Artista ficticio' }],
        message: 'Mensaje ficticio',
        guestName: '',
        updatedAtClient: '2000-01-01T00:00:00.000Z'
      })
    },
    editToken: TEST_IDS.editToken,
    clientDate: '2000-01-01T00:00:00.000Z',
    submittedAt: null,
    updatedAt: null,
    ...overrides
  };
}

export function managementPayloadFixture(overrides = {}) {
  return {
    version: 1,
    token: TEST_IDS.activeToken,
    responseId: TEST_IDS.responseId,
    weddingId: TEST_IDS.weddingId,
    side: 'ambos',
    group: 'amigos',
    tags: ['fixture'],
    linkedGuestIds: ['guest-contract-test'],
    reviewed: true,
    updatedAt: null,
    ...overrides
  };
}

export function managementDocumentId(token = TEST_IDS.activeToken, responseId = TEST_IDS.responseId) {
  return `${token}__${responseId}`;
}
