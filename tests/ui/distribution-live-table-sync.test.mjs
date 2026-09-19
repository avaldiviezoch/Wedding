import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const distribution = readFileSync(
  new URL('../../app_integral/js/modules/distribucion/index.js', import.meta.url),
  'utf8'
);
const runtime = readFileSync(
  new URL('../../app_integral/js/modules/invitados/runtime-loader.js', import.meta.url),
  'utf8'
);

test('Mesas refreshes the live Distribución iframe after an external table-structure push', () => {
  assert.match(distribution, /const tableSig=/);
  assert.match(distribution, /beforeTables=tableSig\(p\.r\)/);
  assert.match(distribution, /tablesChanged=beforeTables!==tableSig\(nr\)/);
  assert.match(distribution, /if\(wr&&tablesChanged\)refreshLiveFrame\(c\)/);
  assert.match(distribution, /contentWindow\.location\.reload\(\)/);
  assert.doesNotMatch(runtime, /js\/modules\/distribucion\/(?:index|background-persistence)\.js/);
});

test('the live refresh waits for Distribución autosave and refuses to reload on save error', () => {
  assert.match(distribution, /function plannerSaveState\(c\)/);
  assert.match(distribution, /if\(state==='saving'\)\{deferPush\(c\);return\}/);
  assert.match(distribution, /if\(state==='error'\).*return/);
  assert.match(distribution, /if\(state==='saving'\)\{refreshLiveFrame\(c\);return\}/);
  assert.match(distribution, /se evitó refrescar porque hay cambios sin guardar/);
});

test('the live table refresh does not introduce Firestore or destructive remote writes', () => {
  assert.doesNotMatch(distribution, /\b(?:setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/);
  assert.doesNotMatch(distribution, /firebase(?:-firestore)?/i);
});


test('visual-only Distribución edits do not enter the table/invitation synchronization cycle', () => {
  assert.match(distribution, /const linkSig=/);
  assert.match(distribution, /const nextLink=linkSig\(p\.r\)/);
  assert.match(distribution, /if\(c\.link&&nextLink===c\.link\)return/);
  const linkSigBlock = distribution.match(/const linkSig=r=>JSON\.stringify\(\{[\s\S]*?\n\}\);/)?.[0] || '';
  assert.ok(linkSigBlock, 'linkSig must be present');
  assert.doesNotMatch(linkSigBlock, /\bx\s*:/);
  assert.doesNotMatch(linkSigBlock, /\by\s*:/);
  assert.doesNotMatch(linkSigBlock, /rotation/);
  assert.doesNotMatch(linkSigBlock, /hiddenLayers|lockedLayers|measurements|bgVisible/);
});
