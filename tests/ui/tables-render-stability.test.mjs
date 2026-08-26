import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const loader = readFileSync(new URL('../../app_integral/js/modules/invitados/tables-lazy-loader.js', import.meta.url), 'utf8');
const entry = readFileSync(new URL('../../app_integral/js/modules/invitados/tables-editor-entry.js', import.meta.url), 'utf8');
const oldLook = readFileSync(new URL('../../app_integral/js/modules/invitados/tables-old-look.js', import.meta.url), 'utf8');

const entryVersion = entry.match(/FINAL_STYLE_VERSION = '([^']+)'/)?.[1];
const oldLookVersion = oldLook.match(/const VERSION = '([^']+)'/)?.[1];

assert.equal(entryVersion, oldLookVersion, 'the preloaded old-look stylesheet must match the runtime stylesheet version');
assert.match(loader, /editor\.dataset\.oldTableLook !== '1'/);
assert.match(loader, /editor\.dataset\.stableRuntime/);
assert.match(loader, /getElementById\('mgdTablesFinalFix'\)/);
assert.match(loader, /getElementById\('mgdTablesStablePolish'\)/);
assert.doesNotMatch(loader, /link\.addEventListener\('load', \(\) => setReady\(view, true\)/);
