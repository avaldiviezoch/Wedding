import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const host = readFileSync(new URL('../../pruebas/distribucion/phase2-host.js', import.meta.url), 'utf8');
const source = readFileSync(new URL('../../pruebas/distribucion/phase2-p1-spatial.js', import.meta.url), 'utf8');
const preview = readFileSync(new URL('../../pruebas/distribucion/phase2-p1-proposal-preview.js', import.meta.url), 'utf8');
const interaction = readFileSync(new URL('../../pruebas/distribucion/phase2-p1.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../pruebas/distribucion/phase2-p1-spatial.css', import.meta.url), 'utf8');
const p0 = readFileSync(new URL('../../pruebas/distribucion/phase2-p0.js', import.meta.url), 'utf8');
const baseline = readFileSync(new URL('../../pruebas/distribucion/app.js', import.meta.url), 'utf8');

const forbiddenPersistence = /\b(?:localStorage|sessionStorage|indexedDB|firebase|firestore|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\b/i;

test('P1 espacial carga después del editor y permanece aislado', () => {
  assert.match(host, /script\.onload\s*=\s*\(\)\s*=>\s*loadP1Spatial\(doc\)/);
  assert.match(host, /phase2-p1-spatial\.js\?v=20260902-p1c-1/);
  assert.match(host, /phase2-p1-spatial\.css\?v=20260902-p1c-1/);
  assert.match(host, /script\.onload\s*=\s*\(\)\s*=>\s*loadP1ProposalPreview\(doc\)/);
  assert.match(host, /phase2-p1-proposal-preview\.js\?v=20260902-p1c-1/);
  assert.doesNotMatch(`${host}\n${source}\n${preview}`, forbiddenPersistence);
  assert.doesNotThrow(() => new Function(source), 'phase2-p1-spatial.js debe tener sintaxis JavaScript válida');
  assert.doesNotThrow(() => new Function(preview), 'phase2-p1-proposal-preview.js debe tener sintaxis JavaScript válida');
});

test('medición P1 conserva múltiples medidas y etiquetas en metros', () => {
  assert.match(source, /measurements\.push\(\{/);
  assert.match(source, /x1: measureDraft\.start\.x/);
  assert.match(source, /y1: measureDraft\.start\.y/);
  assert.match(source, /x2: point\.x/);
  assert.match(source, /y2: point\.y/);
  assert.match(source, /measureLabelMarkup/);
  assert.match(source, /distancePx \/ scale/);
  assert.match(source, /if \(angle > 90 \|\| angle < -90\) angle \+= 180/);
});

test('toldo replica polígono libre con puntos en metros y edición de vértices', () => {
  assert.match(source, /const TENT_CLOSE_THRESHOLD = 18/);
  assert.match(source, /tentDraft\.length < 3/);
  assert.match(source, /El toldo necesita como mínimo tres vértices/);
  assert.match(source, /const pointsM = closedPoints\.map/);
  assert.match(source, /x: \(point\.x - centroid\.x\) \/ scale/);
  assert.match(source, /class: 'vertex-handle tent-vertex'/);
  assert.match(source, /data-vertex-index/);
  assert.match(source, /item\.pointsM\[spatialDrag\.vertexIndex\]/);
  assert.match(source, /refreshTentDimensions\(item\)/);
  assert.match(source, /edgeLabel\(point, next/);
  assert.match(source, /fillColor/);
  assert.match(source, /transparency/);
  assert.match(css, /\.vertex-handle\.tent-vertex/);
});

test('P1 general reserva vértices del toldo y no mueve elementos mientras se mide o dibuja', () => {
  assert.match(interaction, /closest\?\.\('\.tent-vertex'\)/);
  assert.match(interaction, /if \(isEditing\(\) \|\| measureMode \|\| drawingTent\) return/);
  assert.match(interaction, /tentVertexReservedForSpatialEditor: true/);
});

test('auto distribución replica las coordenadas del Distribución estable', () => {
  for (const literal of [
    "['dance', 735, 520]",
    "['altar', 620, 265]",
    "['dj', 780, 370]",
    "['bar', 1025, 295]",
    "['couple', 820, 775]"
  ]) assert.ok(source.includes(literal), `falta ${literal}`);
  assert.match(source, /elements = AUTO_LAYOUT\.map/);
  assert.match(source, /button\.id = 'btnAutoLayoutP1'/);
});

test('propuestas P1 son solo de sesión y tienen límite productivo de 20', () => {
  assert.match(source, /const MAX_PROPOSALS = 20/);
  assert.match(source, /createProposalP1/);
  assert.match(source, /duplicate = false/);
  assert.match(source, /renameProposalP1/);
  assert.match(source, /deleteProposalP1/);
  assert.match(source, /switchProposalP1/);
  assert.match(source, /proposals\.length >= MAX_PROPOSALS/);
  assert.match(source, /saveCurrentProposalSnapshot = function phase2P1SaveCurrentProposalSnapshot/);
  assert.match(source, /const state = duplicate && active \? clone\(active\.state\) : blankState\(\)/);
});

test('propuestas incluyen vista previa SVG y fecha de actualización sin persistir', () => {
  assert.match(preview, /planner\.cloneNode\(true\)/);
  assert.match(preview, /querySelectorAll\('\.rotate-ui,\.vertex-handle'\)/);
  assert.match(preview, /data:image\/svg\+xml/);
  assert.match(preview, /proposal\.thumbnail = buildProposalPreview\(\)/);
  assert.match(preview, /proposal\.updatedAt = new Date\(\)\.toISOString\(\)/);
  assert.match(preview, /proposal-preview-p1/);
  assert.match(css, /\.proposal-preview-p1/);
  assert.doesNotMatch(preview, forbiddenPersistence);
});

test('fondo se conserva dentro del snapshot de propuesta sin persistencia externa', () => {
  assert.match(source, /bgVisible = !bgVisible/);
  assert.match(source, /commitMutation\(\)/);
  assert.doesNotMatch(source, forbiddenPersistence);
});

test('P1 espacial conserva el gestor de riesgos P0 en vez de reemplazarlo', () => {
  assert.doesNotMatch(source, /validationMessages\s*=/);
  assert.doesNotMatch(source, /conflictIds\s*=/);
  assert.match(baseline, /Hay \$\{conflicts\.size\} elemento\(s\) involucrados en superposición/);
  assert.match(p0, /const originalValidationMessages = validationMessages/);
  assert.match(p0, /originalValidationMessages\(conflicts\)/);
  assert.match(p0, /menos de 60 cm libres entre sus áreas de circulación/);
  assert.match(p0, /renderValidation = function phase2RenderValidation/);
  assert.match(source, /commitMutation\(\)/);
});
