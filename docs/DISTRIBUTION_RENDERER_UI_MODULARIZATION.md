# Distribución — Modularización Renderer + UI

Fecha: 2026-09-03
Alcance: laboratorio `pruebas/distribucion/`.

## Objetivo

Separar responsabilidades visuales y de interfaz sin cambiar el comportamiento de la Fase 2 cerrada ni iniciar nuevas geometrías.

## Renderer

- `renderer/tables.js`: contrato de render de mesas.
- `renderer/chairs.js`: distribución angular reutilizable de sillas.
- `renderer/labels.js`: truncado y anclaje de nombres.
- `renderer/tents.js`: contrato de render de toldos.

La estética oficial sigue siendo la del Distribución estable. Esta etapa no rediseña sillas, nombres, tooltips, tipografías ni selección.

## UI

- `ui/planner.js`: selección y render principal.
- `ui/inspector.js`: propiedades y asientos.
- `ui/layers.js`: panel de capas.
- `ui/risks.js`: validaciones y gestor de riesgos.
- `ui/proposals.js`: listado/apertura/cierre de propuestas.
- `ui/mobile.js`: cierre de paneles, FAB y dirección del menú.

## Bridge de compatibilidad

`phase2-renderer-ui-bridge.js` se carga después del engine modular y del saneamiento.

El bridge conserva los nombres de funciones que todavía espera el runtime legacy, pero esas llamadas pasan por contratos explícitos de `renderer/` y `ui/`.

Esto permite continuar la extracción interna en pasos pequeños sin cambiar el DOM ni reescribir todo el módulo en un solo refactor.

## Reglas

- mismo DOM visible;
- mismos cálculos;
- mismas interacciones;
- cero persistencia real;
- no Firebase/Firestore;
- no `app_integral/`;
- no mesas cuadradas/rectangulares todavía;
- no capacidades 4–16 todavía.

## Gate

Con engine + renderer + UI desacoplados mediante contratos y CI verde, la siguiente etapa es la evolución controlada del motor de mesas, empezando por congelar nuevamente la mesa redonda actual como regresión antes de incorporar la mesa cuadrada.
