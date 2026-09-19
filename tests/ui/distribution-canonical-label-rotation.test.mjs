import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const adapter = readFileSync(
  new URL('../../app_integral/js/modules/distribucion/index.js', import.meta.url),
  'utf8'
);
const dev = readFileSync(
  new URL('../../pruebas/distribucion/phase2-p0.js', import.meta.url),
  'utf8'
);

test('adaptador canónico usa el ángulo final en pantalla igual que el entorno de desarrollo', () => {
  assert.match(dev, /const worldAngle = angle \+ \(Number\(parentRotation\) \|\| 0\) \* Math\.PI \/ 180/);
  assert.match(adapter, /const worldAngle=localAngle\+\(groupRotation\*Math\.PI\/180\)/);
  assert.match(adapter, /const worldCos=Math\.cos\(worldAngle\)/);
  assert.match(adapter, /anchor=worldCos>\.28\?'start':worldCos<-\.28\?'end':'middle'/);
});

test('texto se contra-rota para permanecer horizontal', () => {
  assert.match(adapter, /rotate\(\$\{-groupRotation\}\)/);
  assert.match(adapter, /dominant-baseline','middle'/);
  assert.match(adapter, /data-seat-index/);
});
