import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const editor = readFileSync(
  new URL('../../app_integral/js/modules/invitados/tables-editor.js', import.meta.url),
  'utf8'
);
const oldLook = readFileSync(
  new URL('../../app_integral/js/modules/invitados/tables-old-look.js', import.meta.url),
  'utf8'
);
const oldLookCss = readFileSync(
  new URL('../../app_integral/css/modules/invitados-tables-old-look.css', import.meta.url),
  'utf8'
);

test('Mesas muestra una sola etiqueta visible por silla', () => {
  assert.doesNotMatch(editor, /class="mgd-seat-label"/);
  assert.match(oldLook, /seat\.dataset\.seatLabel = shortSeatLabel\(seat\)/);
  assert.match(oldLook, /if \(!seat\?\.dataset\?\.guestId\) return 'Asiento'/);
  assert.match(oldLookCss, /content:attr\(data-seat-label\)/);
});

test('la etiqueta conservada cambia de Asiento al nombre del invitado', () => {
  assert.match(oldLook, /const name = title\.split\('·'\)\[0\]\.trim\(\)/);
  assert.match(oldLook, /return name \|\| 'Invitado'/);
});
