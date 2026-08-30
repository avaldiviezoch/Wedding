import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../../owner-recovery.html', import.meta.url), 'utf8');
const auth = readFileSync(new URL('../../app_integral/js/core/recovery-owner-auth.js', import.meta.url), 'utf8');
const audit = readFileSync(new URL('../../app_integral/js/core/recovery-audit.js', import.meta.url), 'utf8');

assert.match(page, /Rescate del propietario/);
assert.match(page, /solo lectura/i);
assert.match(page, /recovery-audit\.js\?v=20260830-recovery1/);
assert.match(auth, /signInWithPopup/);
assert.match(auth, /signInWithEmailAndPassword/);
assert.doesNotMatch(auth, /firebase-firestore/);
assert.doesNotMatch(auth, /setDoc|writeBatch|deleteDoc|updateDoc|addDoc/);
assert.doesNotMatch(audit, /setDoc|writeBatch|deleteDoc|updateDoc|addDoc/);
