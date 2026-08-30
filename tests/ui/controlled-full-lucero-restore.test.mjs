import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const restore = readFileSync(new URL('../../app_integral/js/core/controlled-full-lucero-restore.js', import.meta.url), 'utf8');
const page = readFileSync(new URL('../../lucero-full-restore.html', import.meta.url), 'utf8');

assert.match(restore, /users', state\.user\.uid, 'incidentSnapshots'/);
assert.match(restore, /lucero-pre-full-restore-20260830/);
assert.match(restore, /users', user\.uid, 'cloudSync', 'main'/);
assert.match(restore, /weddings', activeWeddingId, 'cloudSync', 'main'/);
assert.match(restore, /weddingName\.toLocaleLowerCase\('es'\)\.includes\('lucero'\)/);
assert.match(restore, /historicalBackup\.data\.type !== 'migrandia_cloud_backup'/);
assert.match(restore, /historicalGuests <= activeGuests/);
assert.match(restore, /verified\.raw !== sourceRaw/);
assert.match(restore, /restoreLocalStorageFromBackup/);
assert.match(restore, /recoverySource: 'admin-historical-backup'/);
assert.doesNotMatch(restore, /rsvpConfig|publicRsvp|rsvpManagement/);
assert.doesNotMatch(restore, /switchWedding\s*\(/);
assert.doesNotMatch(restore, /signOut\s*\(/);
assert.match(page, /Restaurar la boda de Lucero/);
assert.match(page, /Cierra todas las pestañas normales de Mi Gran Día/);
assert.match(page, /controlled-full-lucero-restore\.js\?v=20260830-lucero-full-restore1/);
