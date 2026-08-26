import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const [html, css, js] = await Promise.all([
  readFile(new URL('app_integral/applu.html', root), 'utf8'),
  readFile(new URL('app_integral/css/core/editorial-command-shell.css', root), 'utf8'),
  readFile(new URL('app_integral/js/core/editorial-command-shell.js', root), 'utf8')
]);

test('Editorial shell preserves the existing module routing contracts', () => {
  for (const moduleName of ['checklist', 'presupuesto', 'proveedores', 'invitados', 'distribucion', 'cronograma', 'invitaciones', 'musica']) {
    assert.match(html, new RegExp(`data-shell-module="${moduleName}"`));
    assert.match(html, new RegExp(`data-module="${moduleName}"`));
  }
  assert.match(js, /\.unified-module-link\[data-module=/);
  assert.match(js, /WeddingPlannerAuthGuard\?\.authenticated/);
});

test('Editorial shell is V2-scoped, responsive, and has no override escape hatch', () => {
  assert.match(html, /<body class="auth-locked mgd-v2">/);
  assert.match(css, /@layer mgd\.shell/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(min-width: 900px\)/);
  assert.equal(css.includes('!important'), false);
  assert.equal(css.includes('linear-gradient'), false);
});

test('Mobile navigation exposes dialog-like state and Escape restoration', () => {
  assert.match(html, /aria-controls="editorialNavigation"/);
  assert.match(html, /data-shell-close/);
  assert.match(js, /event\.key === 'Escape'/);
  assert.match(js, /opener\?\.focus\(\)/);
  assert.match(css, /min-height: 44px/);
});
