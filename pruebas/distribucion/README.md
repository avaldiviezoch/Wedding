# Laboratorio de Distribución

Entorno de pruebas aislado para reconstruir el módulo **Distribución** de Mi Gran Día sin afectar la aplicación real.

## Contratos y auditoría

Antes de modificar el motor o agregar nuevas formas de mesa, este laboratorio debe respetar:

- `docs/DISTRIBUTION_INTEGRATION_CONTRACTS.md` — **Fase 0**, identidades y responsabilidades de Confirmaciones/RSVP, Invitados, Mesas y Sillas y Distribución (`guestId`, `tableId`, `seatId`, `responseId`, `proposalId`).
- `docs/DISTRIBUTION_PHASE1_AUDIT.md` — **Fase 1**, inventario exhaustivo del Distribución productivo y matriz de paridad del laboratorio.

Regla principal: el laboratorio permanece aislado de la persistencia real, pero debe usar un modelo lógico compatible con la futura integración a Mi Gran Día.

## Alcance actual

El laboratorio contiene una primera reconstrucción del panel de Distribución como espacio de trabajo independiente:

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

**Importante:** la presencia de estas funciones no significa que exista todavía paridad con el producto. La auditoría de Fase 1 identifica diferencias críticas de canvas, renderer de mesa, órbita de sillas, colisiones, mobile, propuestas y otras reglas. La siguiente etapa debe corregir primero los ítems P0 de esa matriz.

## Aislamiento obligatorio

Este laboratorio no se importa desde `app_integral/` y no está conectado al runtime principal.

No contiene integración con Firebase, Firestore, IndexedDB ni mecanismos de persistencia de la aplicación. Todo el estado existe únicamente en memoria de la página y se reinicia al recargar.

## Archivos

- `index.html`: panel completo del laboratorio.
- `styles.css`: presentación propia del laboratorio basada en la estética estable de Distribución.
- `app.js`: render e interacción temporal en memoria.

## Regla de trabajo

La versión estable de Distribución en la aplicación principal no se modifica mientras se itera aquí. Primero se aprueba visual y funcionalmente cada etapa en este laboratorio. Después se diseña un pase mínimo y separado hacia el módulo real.
