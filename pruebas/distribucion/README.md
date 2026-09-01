# Laboratorio de Distribución

Entorno de pruebas aislado para reconstruir el módulo **Distribución** de Mi Gran Día sin afectar la aplicación real.

## Alcance inicial

- Solo módulo Distribución.
- Baseline visual: mesa circular de 10 personas.
- Sillas distribuidas alrededor de la mesa.
- Etiquetas de nombres alrededor de los asientos.
- Arrastre de mesas dentro del plano.
- Escala visual configurable en píxeles por metro.
- Mostrar/ocultar nombres y área de circulación.
- Crear mesas circulares adicionales durante la sesión.

## Aislamiento obligatorio

Este laboratorio no se importa desde `app_integral/` y no está conectado al runtime de producción.

No contiene integración con Firebase, Firestore, IndexedDB ni mecanismos de persistencia de la aplicación. Todo el estado existe únicamente en memoria de la página y se reinicia al recargar.

## Archivos

- `index.html`: shell exclusivo del laboratorio.
- `styles.css`: estilos del módulo de prueba.
- `app.js`: render e interacción en memoria.

## Regla de trabajo

La versión estable de Distribución en la aplicación principal no se modifica mientras se itera aquí. Cuando una etapa visual y funcional sea aprobada, se diseñará un pase mínimo y separado hacia el módulo real.
