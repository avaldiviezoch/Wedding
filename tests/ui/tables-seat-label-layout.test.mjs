import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const editor = readFileSync(
  new URL('../../app_integral/js/modules/invitados/tables-editor.js', import.meta.url),
  'utf8'
);
const css = readFileSync(
  new URL('../../app_integral/css/modules/invitados-tables-editor.css', import.meta.url),
  'utf8'
);
const distribution = readFileSync(
  new URL('../../app_integral/js/modules/distribucion/index.js', import.meta.url),
  'utf8'
);

test('Mesas coloca etiquetas fuera de las sillas con anclaje radial como Distribución', () => {
  assert.match(editor, /labelRadiusX = radiusX \+ 34/);
  assert.match(editor, /labelRadiusY = radiusY \+ 34/);
  assert.match(editor, /labelAnchor = cos > \.28 \? 'start' : cos < -\.28 \? 'end' : 'middle'/);
  assert.match(editor, /data-anchor="\$\{esc\(position\.labelAnchor \|\| 'middle'\)\}"/);
  assert.match(css, /\.mgd-seat-label\[data-anchor="start"\]/);
  assert.match(css, /\.mgd-seat-label\[data-anchor="end"\]/);
  assert.match(css, /\.mgd-seat-label\[data-anchor="middle"\]/);
});

test('Mesas y Distribución comparten el criterio start end middle para nombres', () => {
  assert.match(distribution, /anchor=cos>\.28\?'start':cos<-\.28\?'end':'middle'/);
  assert.match(editor, /'start'.*'end'.*'middle'/s);
});
