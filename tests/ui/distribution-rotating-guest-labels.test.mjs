import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

for (const file of [
  '../../app_integral/js/legacy/appludesktop-script-01.js',
  '../../app_integral/js/legacy/applumovil-script-01.js'
]) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');

  test(`${file}: etiquetas orbitan con la mesa y el texto queda horizontal`, () => {
    assert.match(source, /const rotationDeg=Number\(item\.rotation\)\|\|0/);
    assert.match(source, /const screenAngle=localAngle\+rotationRad/);
    assert.match(source, /rotate\(\$\{-rotationDeg\}\)/);
    assert.match(source, /const anchor=screenCos>\.28\?'start':screenCos<-\.28\?'end':'middle'/);
    assert.match(source, /dominant-baseline="middle"/);
    assert.match(source, /class="guest-seat-label"/);
  });
}
