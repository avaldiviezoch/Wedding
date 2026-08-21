import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../app_integral/applu.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../app_integral/css/modules/auth-premium.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../../app_integral/js/core/auth-dialog-hardening.js', import.meta.url), 'utf8');

assert.match(html, /<label class="auth-field-label" for="authEmail">Correo electrónico<\/label>/);
assert.match(html, /<label class="auth-field-label" for="authPassword">Contraseña<\/label>/);
assert.match(html, /id="authEmail"[^>]*aria-describedby="authStatus"/);
assert.match(html, /id="authPassword"[^>]*aria-describedby="authStatus"/);
assert.match(html, /js\/core\/auth-dialog-hardening\.js\?v=20260821-task7b/);
assert.match(css, /\.auth-field-label\{/);
assert.match(js, /event\.key === 'Escape'/);
assert.match(js, /event\.key !== 'Tab'/);
assert.match(js, /restoreFocus\(\)/);
