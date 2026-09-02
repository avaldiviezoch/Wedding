# Laboratorio de Distribución

Entorno de pruebas aislado para reconstruir el módulo **Distribución** de Mi Gran Día sin afectar la aplicación real.

## Alcance actual

El laboratorio replica el panel completo de Distribución como espacio de trabajo independiente:

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

## Aislamiento obligatorio

Este laboratorio no se importa desde `app_integral/` y no está conectado al runtime principal.

No contiene integración con Firebase, Firestore, IndexedDB ni mecanismos de persistencia de la aplicación. Todo el estado existe únicamente en memoria de la página y se reinicia al recargar.

## Archivos

- `index.html`: panel completo del laboratorio.
- `styles.css`: presentación propia del laboratorio basada en la estética estable de Distribución.
- `app.js`: render e interacción temporal en memoria.

## Regla de trabajo

La versión estable de Distribución en la aplicación principal no se modifica mientras se itera aquí. Primero se aprueba visual y funcionalmente cada etapa en este laboratorio. Después se diseña un pase mínimo y separado hacia el módulo real.
