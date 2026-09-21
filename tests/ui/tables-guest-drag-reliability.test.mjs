import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const editor = readFileSync(
  new URL('../../app_integral/js/modules/invitados/tables-editor.js', import.meta.url),
  'utf8'
);

test('arrastrar invitado conserva un fallback de id durante el drag', () => {
  assert.match(editor, /let draggingGuestId = ''/);
  assert.match(editor, /\|\| draggingGuestId/);
  assert.match(editor, /draggingGuestId = guestSource\.dataset\.guestId \|\| ''/);
});

test('drop sobre silla ocupada usa otra silla libre de la misma mesa', () => {
  assert.match(editor, /const isOccupiedByOther = seatGuestId && seatGuestId !== String\(guestId\)/);
  assert.match(editor, /if \(isOccupiedByOther\) return assignGuest\(guestId, seat\.dataset\.tableId\)/);
  assert.match(editor, /return assignGuest\(guestId, seat\.dataset\.tableId, Number\(seat\.dataset\.seatIndex\)\)/);
});

test('dragover declara efecto move y el dragend limpia el estado', () => {
  assert.match(editor, /event\.dataTransfer\.dropEffect = 'move'/);
  assert.match(editor, /root\.addEventListener\('dragend',[\s\S]*draggingGuestId = ''/);
});


test('invitado sentado también puede iniciar drag hacia otra mesa', () => {
  assert.match(editor, /closest\('\[data-guest-id\]\[draggable="true"\]'\)/);
  assert.match(editor, /firstFreeSeat\(data, table, guest\.id\)/);
});

test('desasignar limpia mesa y silla y el contador se deriva del estado canónico', () => {
  assert.match(editor, /guest\.tableId = '';[\s\S]*guest\.seatId = '';[\s\S]*guest\.seatNumber = null;/);
  assert.match(editor, /const assigned = guestsAtTable\(data, table\.id\);[\s\S]*const occupied = assigned\.length;/);
  assert.match(editor, /Math\.max\(0, table\.capacity - occupied\)/);
});
