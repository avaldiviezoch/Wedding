import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const desktop = readFileSync(
  new URL('../../app_integral/js/legacy/appludesktop-script-01.js', import.meta.url),
  'utf8'
);
const mobile = readFileSync(
  new URL('../../app_integral/js/legacy/applumovil-script-01.js', import.meta.url),
  'utf8'
);
const adapter = readFileSync(
  new URL('../../app_integral/js/modules/distribucion/index.js', import.meta.url),
  'utf8'
);

for (const [name, source] of [['desktop', desktop], ['móvil', mobile]]) {
  test(`renderer único de etiquetas en ${name} usa el ángulo final en pantalla`, () => {
    assert.match(source, /function guestLabelsMarkup\(item,tableRadius\)/);
    assert.match(source, /const screenAngle=localAngle\+rotationRad/);
    assert.match(source, /const screenCos=Math\.cos\(screenAngle\)/);
    assert.match(source, /rotate\(\$\{-rotationDeg\}\)/);
    assert.match(source, /class="guest-seat-label"/);
  });
}

test('adaptador no vuelve a crear etiquetas canónicas duplicadas', () => {
  assert.doesNotMatch(adapter, /mgd-canonical-guest-label/);
  assert.doesNotMatch(adapter, /hideGuestLabels/);
  assert.doesNotMatch(adapter, /legacyLabels\.forEach/);
});

test('botón superior oculta el renderer sobreviviente sin tocar persistencia', () => {
  assert.match(adapter, /\\.mgd-hide-guest-labels \\.guest-seat-label\\{display:none\\}/);
  assert.match(adapter, /classList\\.toggle\\('mgd-hide-guest-labels'\\)/);
  assert.doesNotMatch(adapter, /guestLabels\\.dispatchEvent/);
  assert.doesNotMatch(adapter, /mgd-canonical-guest-label/);
});
