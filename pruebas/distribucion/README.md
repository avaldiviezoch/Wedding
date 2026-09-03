# Laboratorio de Distribución

Entorno de pruebas aislado para reconstruir el módulo **Distribución** de Mi Gran Día sin afectar la aplicación real.

## Contratos y auditoría

Antes de modificar el motor o agregar nuevas formas de mesa, este laboratorio debe respetar:

- `docs/DISTRIBUTION_INTEGRATION_CONTRACTS.md` — **Fase 0**, identidades y responsabilidades de Confirmaciones/RSVP, Invitados, Mesas y Sillas y Distribución (`guestId`, `tableId`, `seatId`, `responseId`, `proposalId`).
- `docs/DISTRIBUTION_PHASE1_AUDIT.md` — **Fase 1**, inventario exhaustivo del Distribución productivo y matriz de paridad del laboratorio.

Regla principal: el laboratorio permanece aislado de la persistencia real, pero debe usar un modelo lógico compatible con la futura integración a Mi Gran Día.

## Fase 2 — Paridad P0 + primer bloque P1

La Fase 2 usa una vista comparativa separada para no destruir el baseline mientras validamos el motor:

- `index.html` — baseline anterior, conservado como referencia.
- `phase2.html` — vista activa de Fase 2.
- `phase2-host.js` — carga P0 y, cuando P0 termina, carga P1.
- `phase2-p0.js` — canvas 1448×1086, centro 724/543, mesa circular legacy, sillas, etiquetas, SAT y gestor de riesgos.
- `phase2-p0.css` — oculta el CRUD maestro de Invitados y mantiene asignación rápida/editor de asientos.
- `phase2-p1.js` — primer bloque P1: drag, multiselección, rotación y bloqueo.

### P0 implementado

1. canvas lógico 1448 × 1086;
2. centro 724 / 543;
3. tablero físico circular fijo de radio 0.915 m;
4. área funcional/circulación independiente del tablero;
5. 10 sillas en órbita 1.33×;
6. etiquetas en órbita 2.18× con contrarrotación;
7. colisiones rectangulares mediante SAT;
8. rojo por invasión de áreas funcionales;
9. advertencia adicional de 60 cm entre áreas de circulación;
10. gestor de riesgos;
11. lista maestra de personas oculta;
12. editor de asientos y asignación rápida conservados.

### P1 — bloque 1 implementado

- drag sobre el canvas productivo 1448×1086;
- Ctrl/Cmd + clic para multiselección;
- movimiento conjunto de los elementos seleccionados;
- guías inteligentes P0 durante el drag;
- handle de rotación;
- Shift durante rotación para ajustar a pasos de 15°;
- tecla `R` para rotar 15°;
- flechas para mover 1 px y Shift+flechas para 10 px;
- bloqueo respetado antes de cualquier movimiento por puntero o teclado;
- objetos bloqueados pueden seleccionarse, pero no moverse ni rotarse.

**Bugs heredados que no se copian:** las flechas no pueden modificar Y antes de comprobar el bloqueo y las guías mantienen X con X / Y con Y.

## Pendiente de Fase 2

P1 aún debe completar frente/fondo/alineación, capas, historial 80, copiar/pegar/duplicar/eliminar, medición, toldo completo, auto layout y propuestas en memoria. P2 cubrirá superficies auxiliares y mobile.

No se agregan todavía mesas cuadradas, rectangulares, capacidades 4–16 ni integración real con App Lu.

## Aislamiento obligatorio

Este laboratorio no se importa desde `app_integral/` y no está conectado al runtime principal. No contiene integración con Firebase, Firestore, IndexedDB ni mecanismos de persistencia de la aplicación. Todo el estado existe únicamente en memoria de la página y se reinicia al recargar.

## Regla de trabajo

La versión estable de Distribución en la aplicación principal no se modifica mientras se itera aquí. Primero se aprueba visual y funcionalmente cada etapa en este laboratorio. Después se diseña un pase mínimo y separado hacia el módulo real.
