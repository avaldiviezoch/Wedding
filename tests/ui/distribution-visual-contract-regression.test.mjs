import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const capacity = readFileSync(new URL('phase2-capacity.js', root), 'utf8');
const visualFix = readFileSync(new URL('phase2-visual-contract-fix.js', root), 'utf8');

test('renderer dinámico distingue las tres formas físicamente', () => {
  assert.match(capacity, /if \(shape === 'round'\)[\s\S]*svgEl\('circle'/);
  assert.match(capacity, /else \{[\s\S]*svgEl\('rect'/);
  assert.match(capacity, /'data-table-shape':shape/);
});

test('nombres se contrarrotan respecto a la rotación de mesa', () => {
  assert.match(capacity, /rotate\(\$\{\-\(Number\(item\.rotation\) \|\| 0\)\}\)/);
  assert.match(visualFix, /const counter = -rotation/);
  assert.match(visualFix, /tag\.setAttribute\('transform',[\s\S]*rotate\(\$\{counter\}\)/);
});
