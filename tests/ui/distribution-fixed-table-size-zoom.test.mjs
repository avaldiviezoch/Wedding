import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const seatsSource = readFileSync(new URL('engine/seats.js', root), 'utf8');
const dimensionsSource = readFileSync(new URL('engine/physical-dimensions.js', root), 'utf8');
const transitionSource = readFileSync(new URL('engine/table-transition.js', root), 'utf8');
const appSource = readFileSync(new URL('app.js', root), 'utf8');
const p0Source = readFileSync(new URL('phase2-p0.js', root), 'utf8');

function engine() {
  const context = { window:{}, Object, Number, Math, Error, Array };
  vm.createContext(context);
  vm.runInContext(seatsSource, context);
  vm.runInContext(dimensionsSource, context);
  vm.runInContext(transitionSource, context);
  return context.window.MiGranDiaDistributionEngine;
}

for (const shape of ['round','square','rectangular']) {
  test(`${shape}: 4/6/8/10/12/14/16 no cambian el tamaño físico de la mesa`, () => {
    const { physicalDimensions:d, tableTransition:t } = engine();
    const table = {
      id:'t1', type:'table', tableShape:shape, capacity:10, shape:shape==='round'?'table':'rect',
      tabletopWidthM:shape==='rectangular'?1.8:1.2,
      tabletopHeightM:shape==='rectangular'?.75:1.2,
      widthM:0, heightM:0, x:100, y:100, rotation:0, label:'Mesa', color:'#fff', locked:false, layerId:'tables',
      seats:Array(10).fill(null)
    };
    d.applyToTable(table);
    const expected=[table.tabletopWidthM,table.tabletopHeightM];
    for (const capacity of [4,6,8,10,12,14,16]) {
      const result=t.transition(table,{capacity});
      assert.equal(result.ok,true);
      assert.deepEqual([table.tabletopWidthM,table.tabletopHeightM],expected);
      assert.equal(table.capacity,capacity);
      assert.equal(table.seats.length,capacity);
    }
  });
}

test('zoom panorámico cambia solo la vista y no geometría de mesas', () => {
  assert.match(appSource, /function setZoom\(next\)\{zoom=/);
  const zoomBody = appSource.match(/function setZoom\(next\)\{([^}]*)\}/)?.[1] || '';
  assert.match(zoomBody, /planner\.style\.width/);
  assert.doesNotMatch(zoomBody, /widthM|heightM|tabletopWidthM|tabletopHeightM|capacity|seats/);
});

test('P0 aplica realmente el bootstrap vacío después de cargar app.js', () => {
  assert.match(p0Source, /assignGuests: false/);
  assert.match(p0Source, /resizePlannerSurface\(\);[\s\S]*initialState\(\);/);
});
