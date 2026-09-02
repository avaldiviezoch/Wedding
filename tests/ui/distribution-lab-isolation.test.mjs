import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../pruebas/distribucion/index.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../../pruebas/distribucion/app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../pruebas/distribucion/styles.css', import.meta.url), 'utf8');

test('el laboratorio de Distribución permanece aislado de persistencia y servicios remotos', () => {
  const source = `${html}\n${js}`;
  assert.doesNotMatch(source, /\blocalStorage\b/);
  assert.doesNotMatch(source, /\bsessionStorage\b/);
  assert.doesNotMatch(source, /\bindexedDB\b/);
  assert.doesNotMatch(source, /\b(?:firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i);
});

test('el panel expone las herramientas visibles del Distribución estable', () => {
  for (const type of ['table','dance','couple','bar','dj','altar','cake','photo','mirror']) {
    assert.match(html, new RegExp(`data-add="${type}"`));
  }
  for (const id of ['btnDrawTent','btnMeasure','btnClearMeasures','btnUndo','btnRedo','btnPresentation','btnToggleLock','btnBringFront','btnSendBack','btnAlignNow','btnShowAllLayers','btnUnlockAllLayers','validationBox','guestList','seatEditor','proposalModal']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test('el cambio de color es inmediato para cualquier elemento seleccionado', () => {
  assert.match(js, /selColor\.addEventListener\('input',\(\)=>liveColor\(selColor\.value\)\)/);
  assert.match(js, /function liveColor\(value\)/);
  assert.match(js, /item\.color=value/);
  assert.match(js, /item\.fillColor=value/);
});

test('el gestor de riesgos replica superposición y cercanía de mesas del estable', () => {
  assert.match(js, /function conflictIds\(\)/);
  assert.match(js, /if\(intersects\(visible\[i\],visible\[j\]\)\)/);
  assert.match(js, /Hay \$\{conflicts\.size\} elemento\(s\) involucrados en superposición/);
  assert.match(js, /tableClearanceMarginM=\.60/);
  assert.match(js, /menos de 60 cm libres entre sus áreas de circulación/);
  assert.match(css, /\.has-conflict \.tabletop/);
  assert.match(css, /#c84242/);
});

test('la validación conserva control de invitados y capacidad', () => {
  assert.match(js, /Quedan \$\{unassigned\} invitado\(s\) sin asignar/);
  assert.match(js, /La capacidad total \(\$\{capacity\}\) es menor al número de invitados/);
  assert.match(js, /function guestAssignmentMap\(\)/);
  assert.match(js, /btnAssignSequential/);
  assert.match(js, /btnClearAssignments/);
});

test('la mesa baseline mantiene sillas y etiquetas de invitados alrededor', () => {
  assert.match(js, /BASE_TABLE/);
  assert.match(js, /capacity:10/);
  assert.match(js, /class:'chair'/);
  assert.match(js, /class:'guest-tag'/);
  assert.match(js, /renderGuestLabel/);
  assert.match(html, /Mesa circular/);
});

test('el laboratorio incluye selección múltiple, capas, guías, bloqueo y copiar-pegar', () => {
  assert.match(js, /selectedIds/);
  assert.match(js, /applySmartGuides/);
  assert.match(js, /lockedLayers/);
  assert.match(js, /hiddenLayers/);
  assert.match(js, /copySelectedPlannerItems/);
  assert.match(js, /pastePlannerItems/);
  assert.match(js, /event\.ctrlKey\|\|event\.metaKey/);
});
