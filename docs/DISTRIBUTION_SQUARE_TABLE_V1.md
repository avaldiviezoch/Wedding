# Distribución · Fase B · Mesa cuadrada v1

## Objetivo
Introducir la primera geometría nueva sobre el motor modular sin mezclar todavía capacidades dinámicas ni mesa rectangular.

## Contrato
- ID de contrato: `square-v1-cap10`
- tipo lógico: `table`
- forma física: cuadrada
- capacidad: 10
- tablero físico: 1.80 × 1.80 m
- área funcional inicial: 3.40 × 3.40 m
- colisión: SAT mediante `shape: rect`
- sillas: 10, distribuidas en los cuatro lados
- nombres: siguen la silla, conservan tipografía/truncado y contrarrotación

## Identidad
Cambiar redonda ↔ cuadrada debe conservar:
- `tableId` / `id`
- posición X/Y
- rotación
- asientos e invitados válidos
- etiqueta
- color

No se crea una segunda mesa ni se reasignan invitados por cambiar la forma.

## Separación física
El tablero y el clearance siguen siendo conceptos diferentes. Cambiar el área funcional no modifica el tablero físico de 1.80 m.

## Compatibilidad
La mesa sigue siendo `type: table`, por lo que conserva capas, historial, propuestas, JSON, PNG, selección, bloqueo, copia/pegado, editor de asientos y validaciones existentes.

## Gate
Esta fase no habilita aún:
- mesa rectangular;
- capacidades 4–16;
- dimensiones editables por capacidad;
- integración real con Mesas y Sillas/App Lu.

La siguiente fase, una vez CI y QA estén verdes, es Fase C: mesa rectangular de capacidad fija 10.