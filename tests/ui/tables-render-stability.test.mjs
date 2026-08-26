import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TABLES_FINAL_STYLE_VERSION,
  setTablesFinalStyleHref,
  tablesFinalStyleReady,
  tablesFinalStyleState,
  trackTablesFinalStyle
} from '../../app_integral/js/modules/invitados/tables-style-readiness.js';

class FakeLink extends EventTarget {
  constructor() {
    super();
    this.dataset = {};
    this.sheet = null;
    this.href = '';
  }
}

test('Mesas remains gated until the canonical stylesheet is parsed', () => {
  const link = new FakeLink();
  trackTablesFinalStyle(link);

  assert.equal(link.dataset.mgdTablesStyleBound, TABLES_FINAL_STYLE_VERSION);
  assert.equal(tablesFinalStyleState(link), 'loading');
  assert.equal(tablesFinalStyleReady(link), false);

  link.sheet = { cssRules: [] };
  link.dispatchEvent(new Event('load'));

  assert.equal(tablesFinalStyleState(link), 'loaded');
  assert.equal(tablesFinalStyleReady(link), true);
});

test('Mesas keeps one canonical final-style URL and resets readiness only when it changes', () => {
  const link = new FakeLink();
  const canonical = `css/modules/invitados-tables-old-look.css?v=${TABLES_FINAL_STYLE_VERSION}`;

  setTablesFinalStyleHref(link, canonical);
  assert.equal(link.href, canonical);
  assert.equal(tablesFinalStyleState(link), 'loading');

  link.sheet = { cssRules: [] };
  link.dispatchEvent(new Event('load'));
  setTablesFinalStyleHref(link, canonical);

  assert.equal(link.href, canonical);
  assert.equal(tablesFinalStyleState(link), 'loaded');
});

test('Mesas exposes an explicit error fallback without treating it as loaded', () => {
  const link = new FakeLink();
  trackTablesFinalStyle(link);
  link.dispatchEvent(new Event('error'));

  assert.equal(tablesFinalStyleState(link), 'error');
  assert.equal(tablesFinalStyleReady(link), false);
});
