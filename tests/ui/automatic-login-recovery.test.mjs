import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const recovery = readFileSync(new URL('../../app_integral/js/core/automatic-login-recovery.js', import.meta.url), 'utf8');
const firebaseEntry = readFileSync(new URL('../../app_integral/js/services/firebase.js', import.meta.url), 'utf8');

assert.match(recovery, /MIN_MEANINGFUL_BYTES/);
assert.match(recovery, /STRONG_RATIO/);
assert.match(recovery, /readWeddingRsvp/);
assert.match(recovery, /tryLegacyFallback/);
assert.match(recovery, /restoreCloudBackup/);
assert.match(recovery, /switchWedding\(best\.id\)/);
assert.match(recovery, /planificador_bodas_invitados_v1/);
assert.match(recovery, /planificador_bodas_datos_compartidos_v1/);
assert.match(recovery, /recoverGuestsFromBackups/);
assert.match(recovery, /currentGuestCount\(\) > 0/);
assert.match(recovery, /automatic-guest-recovery/);
assert.doesNotMatch(recovery, /\b(?:setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\s*\(/);
assert.match(firebaseEntry, /automatic-login-recovery\.js\?v=20260830-auto-recovery2/);
