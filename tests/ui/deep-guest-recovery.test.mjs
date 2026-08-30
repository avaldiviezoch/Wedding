import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const recovery = readFileSync(new URL('../../app_integral/js/core/deep-guest-recovery.js', import.meta.url), 'utf8');
const firebaseEntry = readFileSync(new URL('../../app_integral/js/services/firebase.js', import.meta.url), 'utf8');

assert.match(recovery, /planificador_bodas_invitados_v1/);
assert.match(recovery, /planificador_bodas_datos_compartidos_v1/);
assert.match(recovery, /AntonioEventPlannerMemory/);
assert.match(recovery, /indexedDbCandidates/);
assert.match(recovery, /localPlannerCandidates/);
assert.match(recovery, /cloudCandidates/);
assert.match(recovery, /currentGuestCount\(\) > 0/);
assert.match(recovery, /MIGRANDIA_RSVP_SYNC/);
assert.match(recovery, /deep-guest-recovery/);
assert.doesNotMatch(recovery, /\b(?:setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\s*\(/);
assert.match(firebaseEntry, /deep-guest-recovery\.js\?v=20260830-deep-guest-recovery1/);
