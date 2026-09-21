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


test('invitado ya sentado puede seleccionarse y moverse a otra mesa sin pasar por Sin mesa', () => {
  assert.match(editor, /closest\('\.mgd-seat\[data-table-id\]\[data-guest-id\]'\)/);
  assert.match(editor, /selectedGuestId = occupiedSeat\.dataset\.guestId \|\| ''/);
  assert.match(editor, /if \(table && selectedGuestId\) return assignGuest\(selectedGuestId, table\.dataset\.tableId\)/);
});
