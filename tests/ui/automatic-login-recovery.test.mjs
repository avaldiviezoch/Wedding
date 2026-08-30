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
assert.doesNotMatch(recovery, /\b(?:setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\s*\(/);
assert.match(firebaseEntry, /automatic-login-recovery\.js\?v=20260830-auto-recovery1/);
