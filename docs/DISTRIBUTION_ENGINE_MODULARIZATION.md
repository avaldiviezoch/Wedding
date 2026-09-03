# Distribución — Modularización controlada del motor

Fecha: 2026-09-03

## Objetivo
Separar responsabilidades del laboratorio sin cambiar comportamiento visual, geometría, contratos ni persistencia.

## Módulos extraídos

`pruebas/distribucion/engine/`

- `geometry.js`: conversiones m↔px, rotaciones, huellas y límites 1448×1086.
- `collisions.js`: SAT, círculo↔círculo y círculo↔polígono con tolerancias físicas.
- `clearance.js`: margen de 60 cm y política de capas ocultas.
- `tables.js`: contrato congelado de la mesa redonda actual.
- `seats.js`: asientos y protección de ocupantes.
- `measurements.js`: normalización y distancias.
- `validation.js`: capacidad y no asignados.

`state/memory-store.js`

- store exclusivamente en memoria.

`adapters/mock-app-lu.js`

- adaptador de laboratorio sin storage ni Firebase.

## Integración

`phase2-host.js` carga los módulos antes de `phase2-sanitize.js`.

`phase2-sanitize.js` ya no implementa su propia matemática de SAT, tolerancias ni límites: delega en `engine/geometry.js`, `engine/collisions.js` y `engine/clearance.js`.

## Contratos congelados

- canvas: 1448 × 1086;
- mesa redonda: radio físico 0.915 m;
- clearance estándar: 3.40 m;
- sillas: órbita 1.33×;
- nombres: órbita 2.18×;
- capacidad actual: 10;
- margen de proximidad: 0.60 m;
- tolerancias físicas equivalentes al legacy a 32 px/m.

## Regla arquitectónica

- `geometry` no conoce Firebase ni HTML.
- `collisions` no conoce DOM.
- `validation` no dibuja.
- `renderer` seguirá siendo responsable de SVG.
- `adapter` será el único punto futuro que podrá conocer App Lu.

## Gate

Esta fase NO agrega cuadradas, rectangulares, capacidades 4–16 ni dimensiones nuevas.

Cuando CI quede verde, el siguiente bloque será separar `renderer/` y `ui/` manteniendo la mesa redonda como prueba de regresión. Solo después se inicia la evolución de geometrías.