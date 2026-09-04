import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const root = new URL('../../pruebas/distribucion/', import.meta.url);
const indexSource = readFileSync(new URL('index.html', root), 'utf8');
const phase2Source = readFileSync(new URL('phase2.html', root), 'utf8');
const appSource = readFileSync(new URL('app.js', root), 'utf8');
const p0Source = readFileSync(new URL('phase2-p0.js', root), 'utf8');
const capacitySource = readFileSync(new URL('phase2-capacity.js', root), 'utf8');

const forbidden = /\b(?:localStorage|sessionStorage|indexedDB|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

test('app base se carga como script clásico para que las fases reemplacen el renderer real', () => {
  assert.doesNotMatch(indexSource, /<script\s+type=["']module["']\s+src=["']app\.js/);
  assert.match(indexSource, /<script\s+src=["']app\.js\?v=20260903-runtime-scope1["']><\/script>/);
  assert.match(appSource, /function render\(\)[\s\S]*renderTable\(item,scale,conflicts\)/);
  assert.match(p0Source, /renderTable\s*=\s*function phase2RenderTable/);
  assert.match(capacitySource, /renderTable\s*=\s*function phase2PhysicalDimensionAwareRenderTable/);
});

test('phase2 rompe caché también en el iframe, no solo en la página exterior', () => {
  assert.match(phase2Source, /index\.html\?phase=2-p0&v=20260904-fixedtable1/);
  assert.match(phase2Source, /phase2-host\.js\?v=20260904-fixedtable1/);
});

test('corrección de scope permanece aislada de persistencia real', () => {
  assert.doesNotMatch(indexSource + phase2Source, forbidden);
});
