import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const restore = readFileSync(new URL('../../app_integral/js/core/controlled-guest-restore.js', import.meta.url), 'utf8');
const page = readFileSync(new URL('../../guest-restore.html', import.meta.url), 'utf8');

assert.match(restore, /planificador_bodas_invitados_v1/);
assert.match(restore, /planificador_bodas_datos_compartidos_v1/);
assert.match(restore, /migrandia_recovery_pre_guest_restore_v1/);
assert.match(restore, /\['owner', 'admin', 'editor'\]/);
assert.match(restore, /historical\.guests/);
assert.match(restore, /activeCanonicalTables/);
assert.match(restore, /activeSharedTables/);
assert.match(restore, /verifiedCount !== historical\.count/);
assert.match(restore, /writeBatch\(db\)/);
assert.match(restore, /cloudChunks/);
assert.match(restore, /cloudSync', 'main'/);
assert.doesNotMatch(restore, /switchWedding\s*\(/);
assert.doesNotMatch(restore, /restoreCloudBackup\s*\(/);
assert.doesNotMatch(restore, /publicRsvp|rsvpConfig|rsvpManagement/);
assert.doesNotMatch(restore, /automatic-login-recovery|deep-guest-recovery/);
assert.match(page, /Recuperar únicamente Invitados/);
assert.match(page, /no toca RSVP/);
assert.match(page, /controlled-guest-restore\.js\?v=20260830-controlled-guests1/);
