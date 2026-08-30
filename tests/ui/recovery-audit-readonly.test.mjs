import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../recovery.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../../app_integral/js/core/recovery-audit.js', import.meta.url), 'utf8');

assert.match(html, /Recuperación de datos/);
assert.match(html, /solo lectura/i);
assert.match(js, /\bgetDoc\b/);
assert.match(js, /\bgetDocs\b/);
assert.match(js, /downloadBackup/);
assert.doesNotMatch(js, /\b(setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/);
assert.doesNotMatch(js, /localStorage\.(setItem|removeItem|clear)\s*\(/);
assert.doesNotMatch(js, /firebase-core\.js/);
assert.doesNotMatch(js, /WeddingPlannerBridge/);
