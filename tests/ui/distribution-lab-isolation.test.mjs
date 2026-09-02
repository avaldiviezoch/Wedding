import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../pruebas/distribucion/index.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../../pruebas/distribucion/app.js', import.meta.url), 'utf8');

test('el laboratorio de Distribución permanece aislado de persistencia y servicios remotos', () => {
  const source = `${html}\n${js}`;
  assert.doesNotMatch(source, /\blocalStorage\b/);
  assert.doesNotMatch(source, /\bsessionStorage\b/);
  assert.doesNotMatch(source, /\bindexedDB\b/);
  assert.doesNotMatch(source, /\b(?:firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i);
});

test('el panel completo expone las herramientas del Distribución estable', () => {
  for (const type of ['table','dance','couple','bar','dj','altar','cake','photo','mirror']) {
    assert.match(html, new RegExp(`data-add="${type}"`));
  }
  assert.match(html, /Herramientas/);
  assert.match(html, /Propiedades/);
  assert.match(html, /Capas/);
  assert.match(html, /Asientos de la mesa/);
  assert.match(html, /Nombres de invitados/);
  assert.match(html, /id="btnMeasure"/);
  assert.match(html, /id="btnUndo"/);
  assert.match(html, /id="btnRedo"/);
});

test('la mesa baseline mantiene sillas y etiquetas de invitados alrededor', () => {
  assert.match(js, /BASE_TABLE/);
  assert.match(js, /capacity:10/);
  assert.match(js, /class:'chair'/);
  assert.match(js, /class:'guest-tag'/);
  assert.match(js, /renderGuestLabel/);
  assert.match(html, /Mesa circular/);
});
