import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const host = readFileSync(new URL('../../pruebas/distribucion/phase2-host.js', import.meta.url), 'utf8');
const source = readFileSync(new URL('../../pruebas/distribucion/phase2-p2.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../pruebas/distribucion/phase2-p2.css', import.meta.url), 'utf8');

const forbiddenPersistence = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

test('P2 carga después de P1.3 y permanece aislado de persistencia', () => {
  assert.match(host, /script\.onload\s*=\s*\(\)\s*=>\s*loadP2\(doc\)/);
  assert.match(host, /phase2-p2\.js\?v=20260904-fixedtable2/);
  assert.match(host, /phase2-p2\.css\?v=20260904-fixedtable2/);
  assert.doesNotMatch(`${host}\n${source}`, forbiddenPersistence);
  assert.doesNotThrow(() => new Function(source));
});

test('JSON de sesión incluye propuestas completas y versión explícita', () => {
  assert.match(source, /const SESSION_VERSION = 2/);
  assert.match(source, /kind: 'mi-gran-dia-distribucion-lab-session'/);
  assert.match(source, /currentProposalId/);
  assert.match(source, /proposals: proposals\.slice\(0, MAX_PROPOSALS\)/);
  assert.match(source, /state: sanitizeState\(proposal\.state\)/);
  assert.match(source, /const MAX_PROPOSALS = 20/);
  assert.match(source, /application\/json/);
  assert.match(source, /await file\.text\(\)/);
});

test('importación JSON valida y sanea antes de restaurar', () => {
  assert.match(source, /ALLOWED_TYPES/);
  assert.match(source, /sanitizeElement/);
  assert.match(source, /sanitizeState/);
  assert.match(source, /file\.size > 5 \* 1024 \* 1024/);
  assert.match(source, /parsed\?\.kind !== 'mi-gran-dia-distribucion-lab-session'/);
  assert.match(source, /Number\(parsed\?\.version\) !== SESSION_VERSION/);
  assert.match(source, /restoreState\(clone\(active\.state\)\)/);
  assert.doesNotMatch(source, forbiddenPersistence);
});

test('PNG usa el canvas productivo 1448 x 1086 y limpia UI de edición', () => {
  assert.match(source, /const CANVAS_W = 1448/);
  assert.match(source, /const CANVAS_H = 1086/);
  assert.match(source, /canvas\.width = CANVAS_W/);
  assert.match(source, /canvas\.height = CANVAS_H/);
  assert.match(source, /canvas\.toBlob\(resolve, 'image\/png'/);
  assert.match(source, /\.rotate-ui,\.rotate-handle,\.rotate-stem,\.vertex-handle,\.tent-vertex/);
  assert.match(source, /querySelector\('#guideLayer'\)\?\.replaceChildren\(\)/);
  assert.match(source, /querySelector\('#drawLayer'\)\?\.replaceChildren\(\)/);
});

test('Vista final usa clon limpio del plano y no una segunda fuente de estado', () => {
  assert.match(source, /stage\.replaceChildren\(finalSvgClone\(\)\)/);
  assert.match(source, /openFinalView/);
  assert.match(source, /closeFinalView/);
  assert.match(source, /overridePresentationButton/);
  assert.doesNotMatch(source, /elements\s*=\s*\[\]/);
});

test('mobile incluye bottom sheets, FAB, pinch y rueda de zoom', () => {
  assert.match(source, /p2-mobile-fab/);
  assert.match(source, /p2-mobile-sheet/);
  assert.match(source, /openPanel\('\.tools-panel'\)/);
  assert.match(source, /openPanel\('\.properties-panel'\)/);
  assert.match(source, /touchPoints\.size === 2/);
  assert.match(source, /setZoom\(pinchStartZoom \* distance \/ pinchStartDistance\)/);
  assert.match(source, /passive: false/);
  assert.match(source, /addEventListener\('wheel'/);
  assert.match(source, /setZoom\(zoom \* factor\)/);
  assert.match(css, /@media\(max-width:780px\)/);
  assert.match(css, /\.tools-panel\.p2-sheet-open/);
  assert.match(css, /\.properties-panel\.p2-sheet-open/);
  assert.match(css, /touch-action:none/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});
