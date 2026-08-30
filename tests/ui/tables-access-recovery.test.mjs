import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const accessSource = fs.readFileSync(new URL('../../app_integral/js/modules/invitados/tables-access-recovery.js', import.meta.url), 'utf8');
const loaderSource = fs.readFileSync(new URL('../../app_integral/js/modules/invitados/tables-lazy-loader.js', import.meta.url), 'utf8');
const runtimeSource = fs.readFileSync(new URL('../../app_integral/js/modules/invitados/runtime-loader.js', import.meta.url), 'utf8');

test('Mesas access recovery restores a visible Mesas y asientos tab without writing planner data', () => {
  assert.match(accessSource, /Mesas y asientos/);
  assert.match(accessSource, /dataset\.view = 'tables'/);
  assert.match(accessSource, /getElementById\('tablesView'\)/);
  assert.doesNotMatch(accessSource, /localStorage\.setItem|writeBatch|setDoc|deleteDoc/);
});

test('Mesas loader fails open only after the editor exists', () => {
  assert.match(loaderSource, /FAIL_OPEN_MS = 1800/);
  assert.match(loaderSource, /querySelector\('#mgdTablesEditor'\)/);
  assert.match(loaderSource, /setReady\(view, true\)/);
});

test('Invitados runtime loads the recovery before the Mesas lazy loader', () => {
  const recovery = runtimeSource.indexOf("tables-access-recovery.js");
  const loader = runtimeSource.indexOf("tables-lazy-loader.js");
  assert.ok(recovery >= 0, 'recovery module must be imported');
  assert.ok(loader > recovery, 'recovery module should load before lazy tables runtime');
});
