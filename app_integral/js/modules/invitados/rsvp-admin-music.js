import { db, getWeddingContext } from '../../services/firebase.js?v=20260814-1136-collab1';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const VERSION = '20260816-1605-rsvp-admin-music1';
const installedDocs = new WeakMap();

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalize(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseMusic(value) {
  if (!value) return [];
  let parsed = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch (_) { return []; }
  }
  const songs = Array.isArray(parsed?.songs) ? parsed.songs : [];
  return songs
    .map((item) => ({
      title: String(item?.title || '').trim().slice(0, 140),
      artist: String(item?.artist || '').trim().slice(0, 140)
    }))
    .filter((item) => item.title || item.artist)
    .slice(0, 5);
}

function responseMusic(item) {
  return parseMusic(item?.customData?.mgdMusic);
}

function injectStyles(doc) {
  if (doc.getElementById('mgdRsvpAdminMusicStyles')) return;
  const style = doc.createElement('style');
  style.id = 'mgdRsvpAdminMusicStyles';
  style.textContent = `
    .rsvp-music-admin-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:14px}
    .rsvp-music-admin-kpi{padding:14px;border:1px solid #e5e2d9;border-radius:15px;background:#faf9f5}
    .rsvp-music-admin-kpi span{display:block;color:#888e83;font-size:10px;font-weight:750;text-transform:uppercase;letter-spacing:.06em}
    .rsvp-music-admin-kpi strong{display:block;margin-top:5px;color:#343b31;font-size:23px;line-height:1}
    .rsvp-music-admin-list{display:grid;gap:9px}
    .rsvp-music-admin-row{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.9fr) auto;gap:12px;align-items:center;padding:13px 14px;border:1px solid #e5e2d9;border-radius:15px;background:#fff}
    .rsvp-music-admin-song strong,.rsvp-music-admin-person strong{display:block;color:#343b31;font-size:12px}
    .rsvp-music-admin-song span,.rsvp-music-admin-person span{display:block;margin-top:3px;color:#858b81;font-size:10px}
    .rsvp-music-admin-count{display:grid;place-items:center;min-width:34px;height:28px;padding:0 9px;border-radius:999px;background:#eef0e6;color:#6f7856;font-size:10px;font-weight:850}
    .rsvp-music-admin-empty{padding:28px;border:1px dashed #dad8cf;border-radius:16px;text-align:center;color:#858b81;font-size:11px;line-height:1.55}
    .rsvp-music-response-box{margin-top:8px;padding:9px 10px;border-radius:12px;background:#f3f5ed;color:#626b58;font-size:10px;line-height:1.5}
    .rsvp-music-response-box strong{color:#566149}
    .rsvp-chip.is-music{background:#eef0e6;color:#63704e;border-color:#dce1d0}
    @media(max-width:700px){.rsvp-music-admin-summary{grid-template-columns:1fr}.rsvp-music-admin-row{grid-template-columns:1fr auto}.rsvp-music-admin-person{grid-column:1}.rsvp-music-admin-count{grid-column:2;grid-row:1 / span 2}}
  `;
  doc.head.appendChild(style);
}

function ensureUi(doc) {
  const shell = doc.querySelector('.rsvp-admin-shell');
  const tabs = shell?.querySelector('.rsvp-admin-tabs');
  if (!shell || !tabs) return null;

  let tab = tabs.querySelector('[data-rsvp-pane-tab="music"]');
  if (!tab) {
    tab = doc.createElement('button');
    tab.className = 'rsvp-admin-tab';
    tab.type = 'button';
    tab.dataset.rsvpPaneTab = 'music';
    tab.textContent = '♫ Música';
    tabs.appendChild(tab);
    tab.addEventListener('click', () => {
      doc.querySelectorAll('[data-rsvp-pane-tab]').forEach((item) => item.classList.toggle('is-active', item === tab));
      doc.querySelectorAll('[data-rsvp-pane]').forEach((pane) => pane.classList.toggle('is-active', pane.dataset.rsvpPane === 'music'));
    });
  }

  let pane = shell.querySelector('[data-rsvp-pane="music"]');
  if (!pane) {
    pane = doc.createElement('section');
    pane.className = 'rsvp-pane';
    pane.dataset.rsvpPane = 'music';
    pane.innerHTML = `
      <div class="rsvp-card">
        <div class="rsvp-card-head">
          <div>
            <h3>Música solicitada por tus invitados</h3>
            <p>Las canciones pertenecen a la misma respuesta RSVP, pero se administran de forma independiente. Cambiar asistencia no elimina la música y guardar música no modifica la confirmación.</p>
          </div>
          <span class="rsvp-sync-state" id="rsvpMusicSyncState">Cargando música…</span>
        </div>
        <div class="rsvp-music-admin-summary">
          <article class="rsvp-music-admin-kpi"><span>Invitados con música</span><strong id="rsvpMusicGuests">0</strong></article>
          <article class="rsvp-music-admin-kpi"><span>Pedidos musicales</span><strong id="rsvpMusicRequests">0</strong></article>
          <article class="rsvp-music-admin-kpi"><span>Canciones únicas</span><strong id="rsvpMusicUnique">0</strong></article>
        </div>
        <div class="rsvp-music-admin-list" id="rsvpMusicAdminList"></div>
      </div>`;
    shell.appendChild(pane);
  }
  return { tab, pane };
}

function annotateResponseCards(doc, items) {
  const byId = new Map(items.map((item) => [String(item.id), item]));
  doc.querySelectorAll('[data-rsvp-response-id]').forEach((card) => {
    const item = byId.get(String(card.dataset.rsvpResponseId));
    const songs = responseMusic(item);
    card.querySelectorAll('[data-mgd-music-chip],[data-mgd-music-box]').forEach((node) => node.remove());
    if (!songs.length) return;

    const tags = card.querySelector('.rsvp-admin-tags');
    if (tags) {
      const chip = doc.createElement('span');
      chip.className = 'rsvp-chip rsvp-admin-tag is-music';
      chip.dataset.mgdMusicChip = 'true';
      chip.textContent = `♫ ${songs.length} canción${songs.length === 1 ? '' : 'es'}`;
      tags.appendChild(chip);
    }

    const main = card.querySelector('.rsvp-response-main');
    if (main) {
      const box = doc.createElement('div');
      box.className = 'rsvp-music-response-box';
      box.dataset.mgdMusicBox = 'true';
      box.innerHTML = `<strong>Música:</strong> ${songs.map((song) => escapeHtml([song.title, song.artist].filter(Boolean).join(' — '))).join(' · ')}`;
      main.appendChild(box);
    }
  });
}

function render(doc, items) {
  const entries = [];
  items.forEach((item) => {
    responseMusic(item).forEach((song) => entries.push({ responseId: item.id, name: item.name || 'Sin nombre', attendance: item.attendance || '', ...song }));
  });

  const unique = new Map();
  entries.forEach((entry) => {
    const key = `${normalize(entry.title)}|${normalize(entry.artist)}`;
    if (!unique.has(key)) unique.set(key, { ...entry, people: [] });
    const target = unique.get(key);
    if (!target.people.includes(entry.name)) target.people.push(entry.name);
  });

  const guestCount = new Set(entries.map((entry) => String(entry.responseId))).size;
  const setText = (id, value) => { const el = doc.getElementById(id); if (el) el.textContent = String(value); };
  setText('rsvpMusicGuests', guestCount);
  setText('rsvpMusicRequests', entries.length);
  setText('rsvpMusicUnique', unique.size);

  const state = doc.getElementById('rsvpMusicSyncState');
  if (state) {
    state.textContent = entries.length ? 'Música sincronizada con RSVP' : 'Sin pedidos musicales';
    state.className = `rsvp-sync-state${entries.length ? ' is-success' : ''}`;
  }

  const host = doc.getElementById('rsvpMusicAdminList');
  if (host) {
    if (!entries.length) {
      host.innerHTML = '<div class="rsvp-music-admin-empty">Todavía ningún invitado ha guardado música en el RSVP. Cuando lo haga, aparecerá aquí automáticamente vinculada a su confirmación.</div>';
    } else {
      host.innerHTML = [...unique.values()]
        .sort((a, b) => b.people.length - a.people.length || a.title.localeCompare(b.title, 'es'))
        .map((item) => `
          <article class="rsvp-music-admin-row">
            <div class="rsvp-music-admin-song"><strong>${escapeHtml(item.title || 'Canción sin título')}</strong><span>${escapeHtml(item.artist || 'Artista no indicado')}</span></div>
            <div class="rsvp-music-admin-person"><strong>${escapeHtml(item.people.join(', '))}</strong><span>${item.people.length === 1 ? 'Pedido por este invitado' : 'Coincidencia entre varios invitados'}</span></div>
            <span class="rsvp-music-admin-count">${item.people.length}×</span>
          </article>`).join('');
    }
  }
  annotateResponseCards(doc, items);
}

async function resolveToken() {
  const context = getWeddingContext();
  if (!context?.id || context.legacyMode) return '';
  const snap = await getDoc(doc(db, 'weddings', context.id, 'rsvpConfig', 'main'));
  return snap.exists() ? String(snap.data()?.token || '').trim() : '';
}

async function startSubscription(doc, state) {
  state.unsubscribe?.();
  state.unsubscribe = null;
  const token = await resolveToken().catch(() => '');
  if (!token) {
    render(doc, []);
    const node = doc.getElementById('rsvpMusicSyncState');
    if (node) node.textContent = 'Publica primero el RSVP';
    return;
  }

  const ref = collection(db, 'publicRsvp', token, 'responses');
  const apply = (snap) => render(doc, snap.docs.map((entry) => ({ id: entry.id, ...(entry.data() || {}) })));
  state.unsubscribe = onSnapshot(query(ref, orderBy('submittedAt', 'desc')), apply, () => {
    state.unsubscribe?.();
    state.unsubscribe = onSnapshot(ref, apply, (error) => {
      console.error('RSVP admin music snapshot error:', error);
      const node = doc.getElementById('rsvpMusicSyncState');
      if (node) {
        node.textContent = 'No se pudo leer la música';
        node.className = 'rsvp-sync-state is-error';
      }
    });
  });
}

function install(doc) {
  if (!doc?.body || !doc.querySelector('.rsvp-admin-shell')) return false;
  if (installedDocs.has(doc)) return true;
  injectStyles(doc);
  ensureUi(doc);
  const state = { unsubscribe: null, observer: null };
  installedDocs.set(doc, state);

  state.observer = new MutationObserver(() => {
    if (!doc.querySelector('[data-rsvp-pane-tab="music"]')) ensureUi(doc);
  });
  state.observer.observe(doc.querySelector('.rsvp-admin-shell'), { childList: true, subtree: true });

  ['rsvpRefreshButton', 'rsvpSaveConfig', 'rsvpRegenerateLink'].forEach((id) => {
    doc.getElementById(id)?.addEventListener('click', () => setTimeout(() => startSubscription(doc, state), 700));
  });

  startSubscription(doc, state);
  return true;
}

function scan() {
  const docs = [document];
  document.querySelectorAll('iframe').forEach((frame) => {
    try { if (frame.contentDocument) docs.push(frame.contentDocument); } catch (_) {}
  });
  docs.forEach(install);
}

const observer = new MutationObserver(scan);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('load', scan);
scan();
