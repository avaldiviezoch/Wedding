# Distribución — Saneamiento post-paridad

Estado: **EN CIERRE**  
Fecha: 2026-09-03  
Alcance: laboratorio `pruebas/distribucion/`.

Después de cerrar Fase 2 se ejecuta este bloque antes de modularizar y antes de agregar nuevas geometrías.

## 1. Tolerancias físicas

Las tolerancias heredadas de colisión estaban expresadas en píxeles (`3 px` y `5 px`). Eso hacía que su significado físico cambiara con `px/m`.

Se conserva el comportamiento visual de referencia a 32 px/m, pero se expresa como metros:

- SAT: `3 / 32 = 0.09375 m`;
- círculo ↔ círculo: `5 / 32 = 0.15625 m`;
- círculo ↔ polígono: `3 / 32 = 0.09375 m`.

En runtime se convierten a píxeles usando la escala activa. Así una misma distancia física conserva el mismo significado a 18, 32 o 50 px/m.

## 2. Capas ocultas

Regla de negocio fijada:

> **Ocultar una capa es una acción visual, no destructiva.**

Por tanto una mesa oculta:

- conserva `tableId`;
- conserva sus invitados/asientos;
- conserva su capacidad;
- no participa en colisiones visibles;
- no participa en la advertencia de proximidad visible.

Ocultar no equivale a eliminar ni a desactivar una mesa del modelo de datos.

## 3. Historial

Al restaurar estado mediante undo/redo, apertura de propuesta o importación:

- se eliminan IDs seleccionados que ya no existen;
- el seleccionado principal se recalcula;
- se limpian previews de medición;
- se cancela cualquier dibujo transitorio de toldo;
- se limpian guías temporales;
- se vuelven a aplicar límites geométricos del canvas.

La restauración no debe resucitar herramientas temporales ni referencias inválidas.

## 4. Límites del canvas

La restricción deja de evaluar únicamente el centro del elemento.

Se usa la huella completa:

- círculos/mesas: radio funcional;
- rectángulos: semiejes rotados;
- toldos: puntos `pointsM` con rotación.

El elemento puede tocar el borde, pero su geometría funcional no debe quedar fuera del canvas lógico `1448 × 1086`.

## 5. Mobile / touch

El pinch zoom conserva el punto visual bajo el centro de los dos dedos ajustando `scrollLeft` / `scrollTop` después del cambio de zoom.

Objetivo: evitar que el plano parezca saltar hacia una esquina durante un pinch.

Se mantienen Pointer Events, `touch-action:none`, cancelación de drag al entrar el segundo dedo, safe areas iOS y el FAB/sheets cerrados en P2.1.

## 6. Conflictos extremos

Los tests cubren escalas 18, 32 y 50 px/m, SAT con rectángulos rotados, equivalencia física entre escalas y límites de elementos rotados cerca del borde.

## Gate

Este bloque NO agrega mesas cuadradas, mesas rectangulares, capacidades 4–16, nuevas dimensiones físicas, integración real con App Lu ni persistencia.

Después de este saneamiento y CI verde, el siguiente paso es la **modularización controlada del motor**, conservando la mesa redonda actual como prueba de regresión.
