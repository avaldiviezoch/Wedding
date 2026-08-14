import { db, getWeddingContext } from '../../services/firebase.js?v=20260814-1136-collab1';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const PUBLIC_RSVP_BASE = 'https://avaldiviezoch.github.io/Wedding/rsvp.html';
const EDITABLE_ROLES = new Set(['owner', 'admin', 'editor']);

export const RSVP_ATTENDANCE = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  declined: 'No asistirá',
  tentative: 'Por confirmar'
};

export const RSVP_DEFAULT_FIELDS = Object.freeze({
  companions: { enabled: true, required: false, label: 'Acompañantes' },
  menu: { enabled: false, required: false, label: 'Menú / plato' },
  email: { enabled: false, required: false, label: 'Correo' },
  phone: { enabled: false, required: false, label: 'Teléfono / WhatsApp' },
  restriction: { enabled: false, required: false, label: 'Restricción alimentaria' },
  notes: { enabled: false, required: false, label: 'Mensaje u observaciones' }
});

function cloneDefaultFields() {
  return Object.fromEntries(
    Object.entries(RSVP_DEFAULT_FIELDS).map(([key, value]) => [key, { ...value }])
  );
}

function cleanText(value, max = 300) {
  return String(value ?? '').trim().slice(0, max);
}

function cleanBoolean(value) {
  return value === true;
}

function cleanFieldConfig(input = {}) {
  const result = cloneDefaultFields();
  Object.keys(result).forEach((key) => {
    const source = input?.[key] || {};
    result[key] = {
      enabled: cleanBoolean(source.enabled),
      required: cleanBoolean(source.required),
      label: cleanText(source.label || result[key].label, 60) || result[key].label
    };
    if (!result[key].enabled) result[key].required = false;
  });
  return result;
}

function cleanCustomFields(fields = []) {
  if (!Array.isArray(fields)) return [];
  return fields
    .slice(0, 15)
    .map((field, index) => {
      const type = ['text', 'textarea', 'select', 'yesno'].includes(field?.type)
        ? field.type
        : 'text';
      const label = cleanText(field?.label || `Campo ${index + 1}`, 70);
      const key = cleanText(field?.key || `custom_${index + 1}`, 50)
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '') || `custom_${index + 1}`;
      const options = type === 'select'
        ? (Array.isArray(field?.options) ? field.options : String(field?.options || '').split('\n'))
            .map((item) => cleanText(item, 70))
            .filter(Boolean)
            .slice(0, 20)
        : [];
      return {
        key,
        label,
        type,
        required: cleanBoolean(field?.required),
        options
      };
    })
    .filter((field) => field.label);
}

function normalizeConfig(raw = {}, context = getWeddingContext()) {
  const maxGuests = Math.max(1, Math.min(20, Math.floor(Number(raw.maxGuests) || 4)));
  const token = cleanText(raw.token, 160);
  return {
    version: 1,
    weddingId: cleanText(context?.id || raw.weddingId, 180),
    weddingName: cleanText(raw.weddingName || context?.name || 'Nuestra boda', 120),
    token,
    active: raw.active !== false,
    formTitle: cleanText(raw.formTitle || 'Confirma tu asistencia', 100),
    welcomeText: cleanText(
      raw.welcomeText || 'Nos encantará compartir este día contigo. Confírmanos tu asistencia.',
      500
    ),
    maxGuests,
    allowTentative: raw.allowTentative !== false,
    fields: cleanFieldConfig(raw.fields || RSVP_DEFAULT_FIELDS),
    menuOptions: (Array.isArray(raw.menuOptions) ? raw.menuOptions : String(raw.menuOptions || '').split('\n'))
      .map((item) => cleanText(item, 80))
      .filter(Boolean)
      .slice(0, 30),
    customFields: cleanCustomFields(raw.customFields),
    updatedAt: raw.updatedAt || null
  };
}

function requireWedding() {
  const context = getWeddingContext();
  if (!context?.id || context.legacyMode) {
    throw new Error('No hay una boda activa disponible para RSVP.');
  }
  return context;
}

function requireEditor() {
  const context = requireWedding();
  if (!EDITABLE_ROLES.has(context.role)) {
    throw new Error('Tu rol no permite modificar el RSVP de esta boda.');
  }
  return context;
}

export function generateRsvpToken() {
  if (crypto?.randomUUID) {
    return `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`;
  }
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function publicRsvpUrl(token) {
  const cleanToken = cleanText(token, 160);
  return cleanToken ? `${PUBLIC_RSVP_BASE}?token=${encodeURIComponent(cleanToken)}` : '';
}

export function rsvpEmbedCode(token, height = 780) {
  const url = publicRsvpUrl(token);
  if (!url) return '';
  const safeHeight = Math.max(500, Math.min(1400, Math.floor(Number(height) || 780)));
  return `<iframe\n  src="${url}"\n  title="Confirmar asistencia"\n  style="width:100%;min-height:${safeHeight}px;border:0;border-radius:24px;overflow:hidden;"\n  loading="lazy"\n  referrerpolicy="strict-origin-when-cross-origin"\n></iframe>`;
}

export async function loadRsvpConfig() {
  const context = requireWedding();
  const ref = doc(db, 'weddings', context.id, 'rsvpConfig', 'main');
  const snap = await getDoc(ref);
  if (!snap.exists()) return normalizeConfig({}, context);
  return normalizeConfig(snap.data() || {}, context);
}

export async function saveRsvpConfig(input = {}) {
  const context = requireEditor();
  const current = await loadRsvpConfig();
  const normalized = normalizeConfig({ ...current, ...input }, context);
  if (!normalized.token) normalized.token = generateRsvpToken();

  const privateRef = doc(db, 'weddings', context.id, 'rsvpConfig', 'main');
  const publicRef = doc(db, 'publicRsvp', normalized.token);
  const batch = writeBatch(db);

  batch.set(privateRef, {
    ...normalized,
    weddingId: context.id,
    weddingName: context.name || normalized.weddingName,
    updatedAt: serverTimestamp()
  }, { merge: true });

  batch.set(publicRef, {
    version: 1,
    weddingId: context.id,
    weddingName: context.name || normalized.weddingName,
    active: normalized.active,
    formTitle: normalized.formTitle,
    welcomeText: normalized.welcomeText,
    maxGuests: normalized.maxGuests,
    allowTentative: normalized.allowTentative,
    fields: normalized.fields,
    menuOptions: normalized.menuOptions,
    customFields: normalized.customFields,
    updatedAt: serverTimestamp()
  }, { merge: true });

  await batch.commit();
  return { ...normalized, weddingName: context.name || normalized.weddingName };
}

export async function regenerateRsvpToken(input = {}) {
  const context = requireEditor();
  const current = await loadRsvpConfig();
  const oldToken = current.token;
  const newToken = generateRsvpToken();

  if (oldToken) {
    await setDoc(doc(db, 'publicRsvp', oldToken), {
      active: false,
      replacedAt: serverTimestamp()
    }, { merge: true });
  }

  return saveRsvpConfig({ ...current, ...input, token: newToken, active: true });
}

function responseCollection(token) {
  return collection(db, 'publicRsvp', token, 'responses');
}

function responseFromSnap(snap) {
  const data = snap.data() || {};
  return {
    id: snap.id,
    ...data,
    submittedAtDate: data.submittedAt?.toDate?.() || null,
    updatedAtDate: data.updatedAt?.toDate?.() || null
  };
}

export async function listRsvpResponses(token) {
  requireWedding();
  if (!token) return [];
  try {
    const snaps = await getDocs(query(responseCollection(token), orderBy('submittedAt', 'desc')));
    return snaps.docs.map(responseFromSnap);
  } catch (_) {
    const snaps = await getDocs(responseCollection(token));
    return snaps.docs.map(responseFromSnap).sort((a, b) => {
      const ta = a.submittedAtDate?.getTime?.() || 0;
      const tb = b.submittedAtDate?.getTime?.() || 0;
      return tb - ta;
    });
  }
}

export function subscribeRsvpResponses(token, onData, onError = console.error) {
  requireWedding();
  if (!token) {
    onData?.([]);
    return () => {};
  }
  const q = query(responseCollection(token), orderBy('submittedAt', 'desc'));
  return onSnapshot(q, (snaps) => {
    onData?.(snaps.docs.map(responseFromSnap));
  }, onError);
}

export async function deleteRsvpResponse(token, responseId) {
  requireEditor();
  if (!token || !responseId) return;
  await deleteDoc(doc(db, 'publicRsvp', token, 'responses', responseId));
}

export async function loadPublicRsvpConfig(token) {
  const cleanToken = cleanText(token, 160);
  if (!cleanToken) throw new Error('El enlace RSVP no es válido.');
  const snap = await getDoc(doc(db, 'publicRsvp', cleanToken));
  if (!snap.exists()) throw new Error('Este formulario RSVP no existe o fue reemplazado.');
  const data = snap.data() || {};
  if (data.active !== true) throw new Error('Este formulario RSVP ya no está activo.');
  return normalizeConfig({ ...data, token: cleanToken }, { id: data.weddingId, name: data.weddingName });
}
