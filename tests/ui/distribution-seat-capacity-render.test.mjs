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

for (const [name, source] of [['desktop', desktop], ['mobile', mobile]]) {
  test(`${name}: Distribución renderiza exactamente la capacidad real de la mesa`, () => {
    assert.match(source, /function tableSeatCapacity\(item\)/);
    assert.match(source, /for\(let i=0;i<count;i\+\+\)/);
    assert.match(source, /Math\.PI\*2\*i\/count/);
    assert.match(source, /chairMarkup\(tableR,tableSeatCapacity\(item\)\)/);
    assert.match(source, /\$\{tableSeatCapacity\(item\)\} personas/);
    assert.doesNotMatch(source, /for\(let i=0;i<10;i\+\+\)\{\s*const a = \(Math\.PI\*2\*i\/10\)/);
  });

  test(`${name}: asignación y limpieza respetan capacidades distintas de 10`, () => {
    assert.match(source, /Array\(tableSeatCapacity\(table\)\)\.fill\(null\)/);
    assert.match(source, /seat<tableSeatCapacity\(table\)/);
    assert.match(source, /reduce\(\(sum,table\)=>sum\+tableSeatCapacity\(table\),0\)/);
  });
}
