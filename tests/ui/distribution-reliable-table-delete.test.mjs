import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

for (const file of [
  '../../app_integral/js/legacy/appludesktop-script-01.js',
  '../../app_integral/js/legacy/applumovil-script-01.js'
]) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');

  test(`${file}: borrar mesa fuerza guardado antes de avisar al adaptador`, () => {
    assert.match(source, /async function notifyDeletedTables\(items=\[\]\)/);
    assert.match(source, /clearTimeout\(autosaveTimer\)/);
    assert.match(source, /while\(autosaveInProgress\)/);
    assert.match(source, /await saveCurrentProposal\(\{silent:true\}\)/);

    const savePos = source.indexOf('await saveCurrentProposal({silent:true})');
    const eventPos = source.indexOf("type:'MIGRANDIA_DISTRIBUTION_CHANGED'", savePos);
    assert.ok(savePos >= 0 && eventPos > savePos, 'el aviso debe ocurrir después del guardado');
  });

  test(`${file}: botón, teclado y limpiar notifican las mesas realmente eliminadas`, () => {
    assert.match(source, /const removed=elements\.filter\(e=>ids\.has\(e\.id\)\)/);
    assert.match(source, /const removed=elements\.filter\(element=>removableIds\.has\(element\.id\)\)/);
    assert.match(source, /const removed=elements\.slice\(\)/);
    assert.ok((source.match(/void notifyDeletedTables\(removed\)/g) || []).length >= 3);
  });
}
