import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TABLE_GEOMETRY_HELP_TEXT,
  alignGeometryLimits,
  mutationTouchesGeometry
} from '../../app_integral/js/modules/distribucion/table-capacity-dom.js';

test('alignGeometryLimits is idempotent and does not mutate the DOM again when values are already aligned', () => {
  let maxWrites = 0;
  let textWrites = 0;
  let maxValue = '8';
  let helpValue = 'texto anterior';

  const input = {
    get max() { return maxValue; },
    set max(value) { maxWrites += 1; maxValue = String(value); }
  };
  const help = {
    get textContent() { return helpValue; },
    set textContent(value) { textWrites += 1; helpValue = String(value); }
  };
  const doc = {
    querySelectorAll(selector) {
      return selector === '.mgd-table-geometry-help' ? [help] : [input];
    }
  };

  assert.equal(alignGeometryLimits(doc), true);
  assert.equal(maxValue, '5');
  assert.equal(helpValue, TABLE_GEOMETRY_HELP_TEXT);
  assert.equal(maxWrites, 1);
  assert.equal(textWrites, 1);

  assert.equal(alignGeometryLimits(doc), true);
  assert.equal(maxWrites, 1, 'a second alignment must not rewrite max');
  assert.equal(textWrites, 1, 'a second alignment must not rewrite textContent');
});

test('the observer ignores its own text-node mutation and only reacts when geometry UI is inserted', () => {
  const ownTextMutation = [{ addedNodes: [{ nodeType: 3 }] }];
  assert.equal(mutationTouchesGeometry(ownTextMutation), false);

  const geometryPanel = {
    nodeType: 1,
    matches(selector) { return selector.includes('.mgd-table-geometry-panel'); },
    querySelector() { return null; }
  };
  assert.equal(mutationTouchesGeometry([{ addedNodes: [geometryPanel] }]), true);
});

test('the DOM-only freeze fix does not contain persistence or Firebase operations', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../../app_integral/js/modules/distribucion/table-capacity-dom.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|updateDoc|deleteDoc|writeBatch/i);
});
