# Distribución — Fase G · Inspector definitivo de mesa v1

Estado: laboratorio, memory-only.

## Objetivo
Concentrar la edición de la mesa seleccionada en un único inspector visual sin duplicar lógica de dominio.

## Controles de mesa
- forma: redonda, cuadrada o rectangular;
- capacidad: 4, 6, 8, 10, 12, 14 o 16;
- nombre/etiqueta;
- color;
- rotación;
- bloqueo/desbloqueo;
- resumen de asientos asignados y libres.

El editor detallado de asientos permanece inmediatamente debajo del inspector.

## Transiciones
Forma y capacidad delegan exclusivamente a `MiGranDiaDistributionCapacityV1.transitionTable`, que a su vez usa `engine/table-transition.js`. El inspector no escribe directamente `tableShape`, `capacity` ni geometría física.

## Compatibilidad
Los inputs existentes de nombre, color, rotación y bloqueo se reutilizan y solo se reubican en el DOM, conservando sus listeners existentes. Los controles legacy de forma/capacidad quedan ocultos para evitar dos superficies de edición.

## Actualización
El inspector se refresca desde el ciclo `render()` existente. No utiliza `MutationObserver`.

## Seguridad
Sin Firebase, Firestore, Storage, IndexedDB, localStorage, sessionStorage ni cambios en `app_integral/`.
