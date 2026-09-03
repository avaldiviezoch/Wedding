# Fase 2 — Cierre de paridad de Distribución

Estado: **CERRADA**  
Fecha: 2026-09-03  
Alcance: laboratorio `pruebas/distribucion/` únicamente.

## Resultado

Con P0 + P1 + P2 + P2.1, el laboratorio reproduce la experiencia funcional principal del Distribución estable sin utilizar su persistencia real.

El cierre incluye:

- canvas lógico 1448 × 1086;
- mesa redonda estable, sillas, nombres y contrarrotación;
- tablero físico separado del área funcional;
- SAT, superposición y regla adicional de 60 cm;
- gestor de riesgos;
- drag, multiselección, rotación, bloqueo y teclado;
- orden, alineación, capas, historial 80, duplicado, copia/pegado y eliminación segura;
- mediciones y toldos poligonales;
- auto distribución, fondo y propuestas en memoria;
- export/import JSON manual;
- PNG 1448 × 1086 limpio;
- Vista final / Presentación;
- bottom sheets móviles;
- FAB móvil con reposicionamiento sobre el sheet;
- menú del FAB adaptativo arriba/abajo según espacio;
- Escape para cerrar la UI móvil;
- pinch zoom y safe areas iOS.

## Aislamiento

P2.1 no autoriza ni incorpora:

- Firebase;
- Firestore;
- Rules;
- IndexedDB real;
- localStorage real;
- sessionStorage real;
- storage real;
- datos reales de invitados o mesas;
- cambios en `app_integral/`.

El laboratorio continúa siendo **memory-only**. Los archivos JSON son exportaciones/importaciones manuales del usuario y no persistencia automática.

## Bugs heredados que no se copiaron

Se mantienen las correcciones deliberadas ya aprobadas:

- guías X ↔ X y Y ↔ Y;
- objetos bloqueados no se mueven por flechas;
- multiselección protege siempre elementos bloqueados;
- un handle de vértice no arrastra todo el toldo.

Las tolerancias legacy expresadas en píxeles y las reglas de negocio de capas ocultas permanecen registradas para la siguiente etapa de saneamiento.

## Gate superado

Se puede afirmar:

> **EL LABORATORIO REPRODUCE EL DISTRIBUCIÓN ACTUAL SIN SU PERSISTENCIA REAL.**

Esto cierra Fase 2, pero **NO autoriza todavía nuevas geometrías**.

## Orden obligatorio posterior

1. corregir bugs heredados pendientes, un cambio por vez y con test;
2. modularizar motor, renderer, UI, state y adapters;
3. validar nuevamente la mesa redonda exacta;
4. mesa cuadrada;
5. mesa rectangular;
6. capacidades dinámicas 4–16;
7. dimensiones físicas;
8. cambios de tipo conservando `tableId`;
9. adaptador con App Lu;
10. Mesas y Sillas;
11. Invitados;
12. RSVP;
13. integración en sombra;
14. QA completo;
15. feature flag y despliegue controlado.

## Regla permanente

Primero reproducimos. Después corregimos. Después mejoramos. Después integramos.
