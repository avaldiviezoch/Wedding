import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const safety = readFileSync(new URL('../../app_integral/js/core/logout-data-safety.js', import.meta.url), 'utf8');
const firebaseEntry = readFileSync(new URL('../../app_integral/js/services/firebase.js', import.meta.url), 'utf8');

assert.match(safety, /migrandia_local_owner_uid_v1/);
assert.match(safety, /WeddingPlannerAuthGuard\?\.authenticated === true/);
assert.match(safety, /if \(!authenticated\)/);
assert.match(safety, /Estado local preservado al cerrar sesión/);
assert.match(safety, /return originalClear\(\.\.\.args\)/);
assert.match(safety, /localStorage\.setItem\(LOCAL_OWNER_KEY, ownerUid\)/);
assert.match(safety, /buildCloudBackup/);
assert.match(safety, /MIGRANDIA_LOGOUT_BACKUP_BLOCKED/);
assert.match(safety, /Escritura en nube bloqueada durante cierre de sesión/);
assert.match(safety, /return originalBuildCloudBackup\(\.\.\.args\)/);
assert.match(firebaseEntry, /logout-data-safety\.js\?v=20260830-logout-data-safety2/);
