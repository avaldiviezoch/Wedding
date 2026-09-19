import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const distribution = readFileSync(
  new URL('../../app_integral/js/modules/distribucion/index.js', import.meta.url),
  'utf8'
);

test('Distribución no borra asignaciones canónicas durante cambios visuales', () => {
  assert.doesNotMatch(distribution, /controlled\.has\(String\(g\.tableId\|\|''\)\).*g\.tableId=''[\s\S]*g\.seatNumber=null/);
  assert.match(distribution, /const importLegacySeats=Boolean\(initial&&!d\.guests\.some\(g=>String\(g\.tableId\|\|''\)\)\)/);
  assert.match(distribution, /if\(!importLegacySeats\)return/);
});

test('capacidad importada nunca deja fuera un asiento canónico ocupado', () => {
  assert.match(distribution, /const canonicalHigh=d\.guests/);
  assert.match(distribution, /Math\.max\(legacyHigh,canonicalHigh\)/);
});

test('cambios explícitos del editor de asientos siguen pudiendo actualizar la asignación', () => {
  assert.match(distribution, /function seatChange\(c,s\)/);
  assert.match(distribution, /save\(d,'distribucion-seat-change'\)/);
});
