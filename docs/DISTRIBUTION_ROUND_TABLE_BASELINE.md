# Distribución — Baseline contractual de mesa redonda

Estado: **FASE A** posterior a modularización.

Este documento congela el comportamiento y la apariencia de la mesa redonda vigente antes de introducir nuevas geometrías.

## Contrato `round-current-v1`

- forma: redonda;
- capacidad: 10;
- radio físico del tablero: 0.915 m;
- diámetro físico del tablero: 1.83 m;
- radio del área funcional/circulación: 1.70 m;
- diámetro del área funcional/circulación: 3.40 m;
- órbita de sillas: `tabletopRadius × 1.33`;
- órbita de nombres: `tabletopRadius × 2.18`;
- primer asiento: arriba (`-90°`);
- reparto: 10 posiciones uniformes;
- rojo de conflicto: `#c84242`;
- color de selección: `#d59b3c`;
- nombres contrarrotados y legibles;
- máximo visual de nombre: 18 caracteres con elipsis.

## Separación de conceptos

El tablero físico, las sillas y el área funcional siguen siendo conceptos independientes. Cambiar `clearance` no modifica el radio físico del tablero.

## Gate

Mientras este baseline esté vigente:

1. cualquier cambio accidental de medidas, órbitas, capacidad, ángulo inicial o colores contractuales debe romper CI;
2. `tableId`, posición y rotación no deben depender de la geometría visual;
3. la siguiente fase puede introducir una mesa cuadrada sin alterar este contrato;
4. todavía no se habilitan capacidades 4–16 ni dimensiones dinámicas en el producto.

La implementación contractual vive en `pruebas/distribucion/engine/round-table-contract.js` y `engine/tables.js` delega en ella.