import { timingSafeEqual } from 'node:crypto';

const EDITABLE_ROLES = new Set(['owner', 'admin', 'editor']);
const SANITIZED_ROLES = new Set(['provider', 'viewer']);
const RSVP_FIELDS = new Set([
  'name', 'attendance', 'quantity', 'companions', 'menu', 'email', 'phone',
  'restriction', 'notes', 'customData', 'clientDate'
]);

export class RsvpError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RsvpError';
    this.code = code;
  }
}

function requiredString(value, name, min, max) {
  if (typeof value !== 'string' || value.length < min || value.length > max) {
    throw new RsvpError('invalid-argument', `${name} no es válido.`);
  }
  return value;
}

function cleanText(value, max) {
  if (typeof value !== 'string') throw new RsvpError('invalid-argument', 'El tipo de un campo no es válido.');
  return value.trim().slice(0, max);
}

function sameSecret(presented, stored) {
  if (typeof presented !== 'string' || typeof stored !== 'string') return false;
  const left = Buffer.from(presented);
  const right = Buffer.from(stored);
  return left.length === right.length && timingSafeEqual(left, right);
}

function assertAllowedKeys(input, allowed) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new RsvpError('invalid-argument', 'Los cambios no son válidos.');
  }
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) throw new RsvpError('permission-denied', `El campo ${key} no puede modificarse.`);
  }
}

function validCustomValue(value) {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function mergeCustomData(existing, incoming) {
  const current = existing && typeof existing === 'object' && !Array.isArray(existing) ? existing : {};
  const patch = incoming && typeof incoming === 'object' && !Array.isArray(incoming) ? incoming : {};
  const result = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (!/^[a-zA-Z0-9_-]{1,50}$/.test(key) || key === 'mgdMusic') {
      throw new RsvpError('invalid-argument', 'customData contiene una clave no permitida.');
    }
    if (!validCustomValue(value) || (typeof value === 'string' && value.length > 500)) {
      throw new RsvpError('invalid-argument', 'customData contiene un valor no permitido.');
    }
    if (value === null) delete result[key];
    else result[key] = value;
  }
  if (Object.keys(result).length > 15) throw new RsvpError('invalid-argument', 'customData excede el límite permitido.');
  return result;
}

function normalizeMusic(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RsvpError('invalid-argument', 'La música no es válida.');
  }
  const songs = Array.isArray(value.songs) ? value.songs : [];
  if (songs.length < 1 || songs.length > 10) throw new RsvpError('invalid-argument', 'La lista de canciones no es válida.');
  const normalizedSongs = songs.map((song) => ({
    title: cleanText(song?.title || '', 140),
    artist: cleanText(song?.artist || '', 140)
  })).filter((song) => song.title || song.artist);
  if (!normalizedSongs.length) throw new RsvpError('invalid-argument', 'Se requiere al menos una canción.');
  return {
    version: 1,
    songs: normalizedSongs,
    message: cleanText(value.message || '', 500),
    guestName: cleanText(value.guestName || '', 120),
    updatedAtClient: cleanText(value.updatedAtClient || '', 60)
  };
}

function applyRsvpChanges(existing, changes, maxGuests) {
  assertAllowedKeys(changes, RSVP_FIELDS);
  const next = { ...existing, version: 1, source: 'public-rsvp' };
  if ('name' in changes) next.name = cleanText(changes.name, 120);
  if ('attendance' in changes) next.attendance = changes.attendance;
  if ('quantity' in changes) next.quantity = changes.quantity;
  if ('companions' in changes) next.companions = changes.companions;
  if ('menu' in changes) next.menu = cleanText(changes.menu, 120);
  if ('email' in changes) next.email = cleanText(changes.email, 120);
  if ('phone' in changes) next.phone = cleanText(changes.phone, 60);
  if ('restriction' in changes) next.restriction = cleanText(changes.restriction, 160);
  if ('notes' in changes) next.notes = cleanText(changes.notes, 700);
  if ('clientDate' in changes) next.clientDate = cleanText(changes.clientDate, 60);
  if ('customData' in changes) next.customData = mergeCustomData(existing.customData, changes.customData);
  validateRsvp(next, maxGuests);
  return next;
}

function validateRsvp(data, maxGuests) {
  if (!data.name || typeof data.name !== 'string' || data.name.length > 120) throw new RsvpError('invalid-argument', 'El nombre no es válido.');
  if (!['confirmed', 'declined', 'tentative'].includes(data.attendance)) throw new RsvpError('invalid-argument', 'La asistencia no es válida.');
  if (!Number.isInteger(data.quantity) || data.quantity < 0 || data.quantity > maxGuests) throw new RsvpError('invalid-argument', 'La cantidad no es válida.');
  if ((data.attendance === 'declined' && data.quantity !== 0) || (data.attendance !== 'declined' && data.quantity < 1)) {
    throw new RsvpError('invalid-argument', 'La cantidad no coincide con la asistencia.');
  }
  if (!Array.isArray(data.companions) || data.companions.length > maxGuests || data.companions.some((item) => typeof item !== 'string' || item.length > 120)) {
    throw new RsvpError('invalid-argument', 'Los acompañantes no son válidos.');
  }
  for (const [key, max] of Object.entries({ menu: 120, email: 120, phone: 60, restriction: 160, notes: 700, clientDate: 60 })) {
    if (typeof data[key] !== 'string' || data[key].length > max) throw new RsvpError('invalid-argument', `${key} no es válido.`);
  }
  if (!data.customData || typeof data.customData !== 'object' || Array.isArray(data.customData) || Object.keys(data.customData).length > 15) {
    throw new RsvpError('invalid-argument', 'customData no es válido.');
  }
}

export async function updatePublicRsvp(data, repository) {
  const token = requiredString(data?.token, 'token', 1, 180);
  const responseId = requiredString(data?.responseId, 'responseId', 1, 180);
  const editToken = requiredString(data?.editToken, 'editToken', 30, 180);
  const operation = data?.operation;
  if (!['rsvp', 'music'].includes(operation)) throw new RsvpError('invalid-argument', 'La operación no es válida.');

  const config = await repository.getPublicConfig(token);
  if (!config || config.active !== true) throw new RsvpError('not-found', 'El RSVP no está disponible.');
  const maxGuests = Number.isInteger(config.maxGuests) && config.maxGuests > 0 ? config.maxGuests : 1;
  await repository.mutateResponse(token, responseId, (existing) => {
    if (!existing) throw new RsvpError('not-found', 'La respuesta no existe.');
    if (!sameSecret(editToken, existing.editToken)) throw new RsvpError('permission-denied', 'No se pudo autorizar la actualización.');

    let next;
    if (operation === 'rsvp') {
      next = applyRsvpChanges(existing, data.changes, maxGuests);
    } else {
      assertAllowedKeys(data.changes, new Set(['mgdMusic']));
      const music = normalizeMusic(data.changes.mgdMusic);
      next = {
        ...existing,
        customData: { ...(existing.customData || {}), mgdMusic: JSON.stringify(music) }
      };
      if (Object.keys(next.customData).length > 15) throw new RsvpError('invalid-argument', 'customData excede el límite permitido.');
    }
    delete next.id;
    next.editToken = existing.editToken;
    next.submittedAt = existing.submittedAt || repository.serverTimestamp();
    next.updatedAt = repository.serverTimestamp();
    return next;
  });
  return { ok: true, responseId };
}

export async function listSanitizedRsvp(data, auth, repository) {
  if (!auth?.uid) throw new RsvpError('unauthenticated', 'Se requiere autenticación.');
  const weddingId = requiredString(data?.weddingId, 'weddingId', 1, 180);
  const token = requiredString(data?.token, 'token', 1, 180);
  const requestedLimit = Number(data?.limit || 50);
  const pageSize = Math.max(1, Math.min(100, Number.isInteger(requestedLimit) ? requestedLimit : 50));
  const membership = await repository.getMembership(weddingId, auth.uid);
  if (!membership || membership.status !== 'active' || !SANITIZED_ROLES.has(membership.role)) {
    throw new RsvpError('permission-denied', 'No se pudo autorizar la lectura.');
  }
  const config = await repository.getPublicConfig(token);
  if (!config || config.weddingId !== weddingId) throw new RsvpError('permission-denied', 'No se pudo autorizar la lectura.');
  const page = await repository.listResponses(token, pageSize, data?.cursor || null);
  return {
    items: page.items.map(({ editToken: _secret, ...item }) => item),
    nextCursor: page.nextCursor || null
  };
}

export function rolePolicy(role) {
  return {
    fullRead: EDITABLE_ROLES.has(role),
    sanitizedRead: SANITIZED_ROLES.has(role),
    administrativeWrite: EDITABLE_ROLES.has(role)
  };
}
