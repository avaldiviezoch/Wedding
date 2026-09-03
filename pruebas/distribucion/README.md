# Laboratorio de Distribución

Entorno de pruebas aislado para reconstruir el módulo **Distribución** de Mi Gran Día sin afectar la aplicación real.

## Contratos y auditoría

Antes de modificar el motor o agregar nuevas formas de mesa, este laboratorio debe respetar:

- `docs/DISTRIBUTION_INTEGRATION_CONTRACTS.md` — **Fase 0**, identidades y responsabilidades de Confirmaciones/RSVP, Invitados, Mesas y Sillas y Distribución (`guestId`, `tableId`, `seatId`, `responseId`, `proposalId`).
- `docs/DISTRIBUTION_PHASE1_AUDIT.md` — **Fase 1**, inventario exhaustivo del Distribución productivo y matriz de paridad del laboratorio.

Regla principal: el laboratorio permanece aislado de la persistencia real, pero debe usar un modelo lógico compatible con la futura integración a Mi Gran Día.

## Fase 2 — Paridad P0

La Fase 2 empieza con una vista comparativa separada para no destruir el baseline mientras validamos el motor base:

- `index.html` — baseline del laboratorio anterior, se conserva como referencia visual y funcional.
- `phase2.html` — vista **Fase 2 P0**, carga el baseline y aplica únicamente la paridad crítica aprobada por la auditoría.
- `phase2-host.js` — instala la capa P0 únicamente dentro de `phase2.html`.
- `phase2-p0.js` — canvas 1448×1086, centro 724/543, mesa circular legacy, sillas, etiquetas, SAT y gestor de riesgos.
- `phase2-p0.css` — oculta el CRUD maestro de Invitados y mantiene la asignación rápida/editor de asientos.

### Gate P0

Antes de sustituir el baseline, `phase2.html` debe demostrar:

1. canvas lógico 1448 × 1086;
2. centro 724 / 543;
3. tablero físico circular fijo de radio 0.915 m;
4. área funcional/circulación independiente del tablero;
5. 10 sillas en órbita 1.33×;
6. etiquetas en órbita 2.18× con contrarrotación;
7. colisiones rectangulares equivalentes mediante SAT;
8. rojo por invasión de áreas funcionales;
9. advertencia adicional de 60 cm entre áreas de circulación de mesas;
10. gestor de riesgos equivalente;
11. lista maestra de personas no visible dentro de Distribución;
12. editor de asientos y asignación rápida conservados.

No se agregan todavía mesas cuadradas, rectangulares, capacidades 4–16 ni integración real.

## Alcance del baseline

El baseline contiene una primera reconstrucción del panel de Distribución como espacio de trabajo independiente:

- cabecera del módulo y acciones superiores;
- panel izquierdo de Herramientas;
- plano central del salón;
- panel derecho de Propiedades;
- capas del plano;
- zoom y medición visual;
- deshacer/rehacer dentro de la sesión;
- vista de presentación;
- mesa circular baseline de 10 personas;
- sillas distribuidas alrededor de la mesa;
- etiquetas de nombres alrededor de cada asiento;
- edición de nombre, posición, tamaño, rotación y color;
- editor de los 10 asientos;
- herramientas para mesa, pista de baile, mesa de novios, barra, DJ, altar, mesa de torta, photobooth y espejo;
- rejilla, circulación, etiquetas y nombres configurables.

**Importante:** la presencia de estas funciones no significa que exista todavía paridad total con el producto. La auditoría de Fase 1 sigue siendo la referencia para P1 y P2.

## Aislamiento obligatorio

Este laboratorio no se importa desde `app_integral/` y no está conectado al runtime principal.

No contiene integración con Firebase, Firestore, IndexedDB ni mecanismos de persistencia de la aplicación. Todo el estado existe únicamente en memoria de la página y se reinicia al recargar.

## Regla de trabajo

La versión estable de Distribución en la aplicación principal no se modifica mientras se itera aquí. Primero se aprueba visual y funcionalmente cada etapa en este laboratorio. Después se diseña un pase mínimo y separado hacia el módulo real.
