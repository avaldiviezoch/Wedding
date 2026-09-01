import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  TABLE_TYPES,
  TABLE_CAPACITY_OPTIONS,
  MAX_TABLE_CAPACITY,
  TABLE_CLEARANCE_M,
  standardTabletop,
  resolveTableGeometry,
  geometryPatch,
  legacyGeometryPatch,
  seatPositions
} from '../../app_integral/js/modules/distribucion/table-geometry-model.js';

const geometryRuntime = readFileSync(
  new URL('../../app_integral/js/modules/distribucion/table-geometry.js', import.meta.url),
  'utf8'
);
const distribution = readFileSync(
  new URL('../../app_integral/js/modules/distribucion/index.js', import.meta.url),
  'utf8'
);

test('only the three approved table types are supported and capacity stays capped at 16', () => {
  assert.deepEqual([...TABLE_TYPES], ['round', 'square', 'rectangular']);
  assert.deepEqual([...TABLE_CAPACITY_OPTIONS], [4, 6, 8, 10, 12, 14, 16]);
  assert.equal(MAX_TABLE_CAPACITY, 16);
  assert.equal(geometryPatch({}, { type: 'round', capacity: 99 }).capacity, 16);
});

test('standard dimensions are real tabletop sizes and operational footprints include chair clearance', () => {
  const round10 = standardTabletop('round', 10);
  assert.deepEqual(round10, { type: 'round', capacity: 10, widthM: 1.5, heightM: 1.5, presetCapacity: 10 });
  const geometry = resolveTableGeometry({ type: 'round', capacity: 10 });
  assert.equal(geometry.tabletopWidthM, 1.5);
  assert.equal(geometry.footprintWidthM, 1.5 + TABLE_CLEARANCE_M * 2);
  assert.equal(geometry.plannerShape, 'table');
});

test('custom measurements remain independent from capacity and keep the current planner scale model', () => {
  const patch = geometryPatch({}, {
    type: 'rectangular',
    capacity: 16,
    tabletopWidthM: 3.25,
    tabletopHeightM: 1.15
  });
  assert.equal(patch.capacity, 16);
  assert.equal(patch.tabletopWidthM, 3.25);
  assert.equal(patch.tabletopHeightM, 1.15);
  assert.equal(patch.dimensionsCustom, true);
  const legacy = legacyGeometryPatch(patch);
  assert.equal(legacy.shape, 'rect');
  assert.equal(legacy.widthM, 3.25 + TABLE_CLEARANCE_M * 2);
  assert.equal(legacy.heightM, 1.15 + TABLE_CLEARANCE_M * 2);
});

test('all approved shapes can display sixteen chair positions', () => {
  for (const type of TABLE_TYPES) {
    const geometry = resolveTableGeometry({ type, capacity: 16 });
    const positions = seatPositions(type, 16, geometry.tabletopWidthM, geometry.tabletopHeightM);
    assert.equal(positions.length, 16, type);
    assert.ok(positions.every((point) => Number.isFinite(point.xM) && Number.isFinite(point.yM)), type);
  }
});

test('shape, physical dimensions and capacity participate in Mesas ↔ Distribución synchronization', () => {
  assert.match(distribution, /sharedTableType/);
  assert.match(distribution, /tabletopWidthM/);
  assert.match(distribution, /tabletopHeightM/);
  assert.match(distribution, /legacyGeometryPatch/);
  assert.match(distribution, /shape:\s*element\.shape/);
  assert.match(distribution, /widthM:\s*element\.widthM/);
  assert.match(distribution, /heightM:\s*element\.heightM/);
  assert.match(distribution, /version:\s*4/);
});

test('seats 11 through 16 remain editable and cannot be erased by the ten-seat legacy view', () => {
  assert.match(geometryRuntime, /for \(let index = 10; index < Number\(table\.capacity\); index \+= 1\)/);
  assert.match(geometryRuntime, /data-mgd-extended-seat/);
  assert.match(distribution, /const controlledSeatCount = Math\.min\(legacySeats\.length, count\)/);
  assert.match(distribution, /seatIndex < controlledSeatCount/);
  assert.match(distribution, /los asientos 11–16 se preservan/);
});

test('Distribución creates and edits tables through the existing canonical bridge, not Firebase', () => {
  assert.match(geometryRuntime, /saveState\(next, source\)/);
  assert.match(geometryRuntime, /api\.syncNow\(\)/);
  assert.match(geometryRuntime, /distribucion-table-created/);
  assert.match(geometryRuntime, /distribucion-table-geometry/);
  assert.match(geometryRuntime, /mesa 10 personas/);
  assert.match(geometryRuntime, /original\.hidden = true/);
  assert.doesNotMatch(geometryRuntime, /\b(?:setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/);
  assert.doesNotMatch(geometryRuntime, /firebase(?:-firestore)?/i);
});
