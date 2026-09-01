import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../pruebas/distribucion/index.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../../pruebas/distribucion/app.js', import.meta.url), 'utf8');

test('el laboratorio de Distribución permanece aislado de persistencia y Firebase', () => {
  const source = `${html}\n${js}`;
  assert.doesNotMatch(source, /\blocalStorage\b/);
  assert.doesNotMatch(source, /\bsessionStorage\b/);
  assert.doesNotMatch(source, /\bindexedDB\b/);
  assert.doesNotMatch(source, /\b(?:firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i);
});

test('el baseline de Distribución conserva mesa circular, sillas y nombres', () => {
  assert.match(js, /type:'round'/);
  assert.match(js, /capacity:BASE_TABLE\.capacity/);
  assert.match(js, /class:'chair'/);
  assert.match(js, /class:'guest-tag'/);
  assert.match(html, /Mesa circular/);
});
