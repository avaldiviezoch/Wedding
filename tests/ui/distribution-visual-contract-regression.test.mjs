import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const capacity = readFileSync(new URL('phase2-capacity.js', root), 'utf8');

test('renderer dinámico distingue las tres formas físicamente', () => {
  assert.match(capacity, /if \(shape === 'round'\)[\s\S]*svgEl\('circle'/);
  assert.match(capacity, /else \{[\s\S]*svgEl\('rect'/);
  assert.match(capacity, /'data-table-shape':shape/);
  assert.ok(capacity.includes('authoritativeTableRenderer:true'));
});

test('nombres, números y etiqueta central permanecen horizontales dentro del renderer dueño', () => {
  assert.match(capacity, /transform:`translate\(\$\{local\.x\.toFixed\(1\)\} \$\{local\.y\.toFixed\(1\)\}\) rotate\(\$\{-rotation\}\)`/);
  assert.match(capacity, /class:'chair-wrap'[\s\S]*transform:`rotate\(\$\{-rotation\}\)`/);
  assert.match(capacity, /class:'table-title'[\s\S]*transform:`rotate\(\$\{-rotation\}\)`/);
  assert.match(capacity, /class:'table-meta'[\s\S]*transform:`rotate\(\$\{-rotation\}\)`/);
  assert.ok(capacity.includes('uprightTextNative:true'));
});

test('renderer final conserva handle de rotación y metadata de capacidad', () => {
  assert.match(capacity, /appendTableLabels\(group, item, capacity\);\s*appendRotateHandle\(group, item\);/);
  assert.ok(capacity.includes("meta.textContent = `${capacity} personas`"));
  assert.ok(capacity.includes('rotationHandleNative:true'));
});