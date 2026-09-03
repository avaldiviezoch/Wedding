# Distribución — Fase F · Transición unificada de mesa v1

Estado: laboratorio, memory-only.

## Objetivo
Unificar cambio de forma y capacidad en una sola operación del engine: `tableTransition.transition(table, request)`.

## Alcance
La transición admite `round`, `square`, `rectangular` y capacidades 4, 6, 8, 10, 12, 14 y 16.

## Invariantes
- conserva `id/tableId`;
- conserva posición X/Y;
- conserva rotación;
- conserva etiqueta, color, bloqueo y capa;
- conserva asignaciones que continúan dentro del rango;
- expansión agrega asientos vacíos;
- reducción con invitados fuera del nuevo rango se bloquea antes de mutar la mesa;
- dimensiones físicas y clearance se reaplican desde `physicalDimensions`.

## Atomicidad de dominio
La operación primero ejecuta `plan()`. Si hay una reducción inválida, devuelve `occupied-seats` y la mesa queda sin cambios. Solo después de una planificación válida se aplican forma, capacidad, asientos y geometría física.

## UI
Los controles existentes de forma y capacidad quedan como wrappers de la misma operación `transitionTable`, evitando dos rutas de mutación distintas.

## Seguridad
Sin Firebase, Firestore, Storage, IndexedDB, localStorage, sessionStorage ni cambios en `app_integral/`.
