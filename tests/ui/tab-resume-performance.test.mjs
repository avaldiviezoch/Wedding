import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const menuFast = readFileSync(
  new URL('../../app_integral/js/core/menu-fast.js', import.meta.url),
  'utf8'
);
const autosaveUi = readFileSync(
  new URL('../../app_integral/js/core/autosave-ui.js', import.meta.url),
  'utf8'
);
const distribution = readFileSync(
  new URL('../../app_integral/js/modules/distribucion/index.js', import.meta.url),
  'utf8'
);

test('returning to the browser tab does not fan out focus/pageshow/visibility resume work', () => {
  assert.doesNotMatch(menuFast, /window\.addEventListener\('focus',\s*\(\)\s*=>\s*scheduleSurfaceRestore/);
  assert.match(menuFast, /if \(event\.persisted\) scheduleSurfaceRestore\('bfcache'\)/);
  assert.match(menuFast, /now - lastResumeAt < 300/);
  assert.match(menuFast, /resumeTimer = window\.setTimeout\(run, 90\)/);
});

test('hero video stays paused while a module is active', () => {
  assert.match(menuFast, /document\.hidden \|\| MODULE_HASHES\.has\(currentModule\(\)\)/);
  assert.match(menuFast, /video\.pause\?\.\(\)/);
});

test('autosave semantics process only newly added controls instead of rescanning the full iframe on each mutation', () => {
  assert.match(autosaveUi, /function processAddedNode/);
  assert.match(autosaveUi, /record\.addedNodes\.forEach/);
  assert.doesNotMatch(autosaveUi, /new MutationObserver\(\(\) => \{\s*requestAnimationFrame\(\(\) => scanDocument/);
});

test('Distribución polling sleeps while another module is active', () => {
  assert.match(distribution, /document\.hidden\|\|!String\(location\.hash\|\|''\)\.toLowerCase\(\)\.includes\('distribucion'\)/);
  assert.match(distribution, /\),500\)\}\);/);
});
