# Distribución — FASE C · Mesa rectangular v1

Estado: **lista para validación por CI**.

## Objetivo
Introducir la tercera geometría de mesa sobre el motor modular sin mezclar todavía capacidades dinámicas.

## Contrato
- ID: `rectangular-v1-cap10`
- tipo lógico: `table`
- `tableShape`: `rectangular`
- geometría SAT: `shape: rect`
- capacidad: 10
- tablero físico: **2.40 × 0.75 m**
- clearance funcional: **4.00 × 2.35 m**
- distribución de sillas: **4 superior + 1 derecha + 4 inferior + 1 izquierda**

El clearance se mantiene independiente del tablero físico. Los 0.80 m adicionales por lado respecto a la envolvente del tablero representan el espacio funcional usado por esta primera versión controlada; la regla de proximidad adicional de 60 cm sigue perteneciendo al motor de riesgos y no se fusiona con el tablero.

## Identidad
Cambiar entre redonda, cuadrada y rectangular conserva:
- `id/tableId`
- posición X/Y
- rotación
- asientos y huéspedes
- etiqueta
- color

## Discriminación de forma
`shape:'rect'` se utiliza únicamente como geometría de colisión SAT. La forma de negocio se identifica por `tableShape` (`round`, `square`, `rectangular`). Esto evita confundir cuadradas y rectangulares.

## JSON
La capa Fase C preserva `tableShape` al sanear/importar el estado de sesión para que una rectangular siga siendo rectangular después del round-trip.

## Fuera de alcance
- capacidades 4–16
- redimensionamiento físico por capacidad
- integración App Lu
- Firebase/Firestore/storage real
- cambios en `app_integral/`

Siguiente gate: capacidades dinámicas 4–16, solo después de CI verde y estabilización de las tres formas.
