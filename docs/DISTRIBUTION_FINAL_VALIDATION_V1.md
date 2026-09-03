# Distribución — Fase H · Validación final v1

Estado: laboratorio, memory-only.

## Objetivo
Unificar en `engine.validation.evaluate()` las comprobaciones críticas del plano sin persistencia real.

## Evalúa
- superposición visible;
- proximidad adicional de 60 cm entre mesas visibles;
- capacidad total vs invitados;
- invitados sin asignar;
- asignaciones fuera del rango de capacidad;
- invitados desconocidos en asientos;
- invitados duplicados;
- elementos visibles fuera del canvas 1448×1086;
- elementos ocultos y bloqueados como estado informativo.

## Política de capas ocultas
Ocultar sigue siendo visual-only: conserva capacidad y asignaciones, pero excluye el elemento de conflictos/proximidad visibles.

## Seguridad
Sin Firebase, Firestore, Storage, IndexedDB, localStorage, sessionStorage ni cambios en `app_integral/`.