# Laboratorio de Distribución

Entorno de pruebas aislado para reconstruir el módulo **Distribución** de Mi Gran Día sin afectar la aplicación real.

## Contratos y auditoría

Antes de modificar el motor o agregar nuevas formas de mesa, este laboratorio debe respetar:

- `docs/DISTRIBUTION_INTEGRATION_CONTRACTS.md` — **Fase 0**, identidades y responsabilidades de Confirmaciones/RSVP, Invitados, Mesas y Sillas y Distribución (`guestId`, `tableId`, `seatId`, `responseId`, `proposalId`).
- `docs/DISTRIBUTION_PHASE1_AUDIT.md` — **Fase 1**, inventario exhaustivo del Distribución productivo y matriz de paridad del laboratorio.

Regla principal: el laboratorio permanece aislado de la persistencia real, pero debe usar un modelo lógico compatible con la futura integración a Mi Gran Día.

## Fase 2 — Paridad P0 + P1 en construcción

La Fase 2 usa una vista comparativa separada para no destruir el baseline mientras validamos el motor:

- `index.html` — baseline anterior, conservado como referencia.
- `phase2.html` — vista activa de Fase 2.
- `phase2-host.js` — carga secuencialmente P0, P1 de interacciones y P1 de editor.
- `phase2-p0.js` — canvas 1448×1086, centro 724/543, mesa circular legacy, sillas, etiquetas, SAT y gestor de riesgos.
- `phase2-p0.css` — oculta el CRUD maestro de Invitados y mantiene asignación rápida/editor de asientos.
- `phase2-p1.js` — drag, multiselección, rotación y bloqueo.
- `phase2-p1-editor.js` — frente/fondo, alineación, capas, historial 80, duplicar, copiar/pegar y eliminar.

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
- bloqueo respetado antes de cualquier movimiento por puntero o teclado.

### P1 — bloque 2 implementado

- traer selección al frente y enviarla al fondo;
- alineación horizontal conservando la regla actual del producto: igualar Y con el elemento principal;
- objetos bloqueados protegidos también en alineación, orden y eliminación;
- capas por categoría con mostrar/ocultar y bloquear/desbloquear;
- ocultar una capa retira de la selección sus objetos;
- mostrar todas las capas y desbloquear todo;
- historial ampliado al límite productivo de 80 estados;
- duplicar el objeto principal con desplazamiento de 35 px;
- Ctrl/Cmd+C y Ctrl/Cmd+V para una o varias selecciones;
- pegado con desplazamiento progresivo de 28 px;
- IDs nuevos en duplicados/copias;
- las mesas duplicadas o pegadas nacen sin invitados asignados;
- eliminar selección conserva cualquier objeto bloqueado seleccionado.

**Bugs heredados que no se copian:** las flechas no modifican Y antes de comprobar el bloqueo; las guías mantienen X con X / Y con Y; las acciones múltiples no eliminan ni modifican silenciosamente objetos bloqueados.

## Pendiente de Fase 2

P1 aún debe completar medición de paridad, toldo poligonal completo, auto distribución, fondo y propuestas exclusivamente en memoria. P2 cubrirá exportación/presentación final y la experiencia mobile con sheets, FAB y zoom táctil.

No se agregan todavía mesas cuadradas, rectangulares, capacidades 4–16 ni integración real con App Lu.

## Aislamiento obligatorio

Este laboratorio no se importa desde `app_integral/` y no está conectado al runtime principal. No contiene integración con servicios de datos de la aplicación ni mecanismos de persistencia del producto. Todo el estado existe únicamente en memoria de la página y se reinicia al recargar.

## Regla de trabajo

La versión estable de Distribución en la aplicación principal no se modifica mientras se itera aquí. Primero se aprueba visual y funcionalmente cada etapa en este laboratorio. Después se diseña un pase mínimo y separado hacia el módulo real.
