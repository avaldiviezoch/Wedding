# Distribución — auditoría de estabilidad de mesas

## Objetivo
Cerrar como un solo sistema las regresiones visibles de mesas antes de continuar el roadmap.

## Contratos bloqueantes
- Formas: redonda, cuadrada y rectangular deben cambiar en el renderer real.
- Capacidades: 4, 6, 8, 10, 12, 14 y 16 deben producir exactamente esa cantidad de sillas.
- Reducir capacidad nunca elimina en silencio un invitado; las opciones incompatibles se bloquean y se explican.
- Rotación por handle, campo y teclado usa `item.rotation` como única fuente.
- Sillas acompañan la rotación física de la mesa.
- Nombres de invitados permanecen horizontales y hacia arriba.
- Números de silla permanecen horizontales y hacia arriba.
- Etiqueta y meta de capacidad de la mesa permanecen horizontales y hacia arriba.
- El renderer final conserva el handle de rotación.

## Causa de las regresiones
Se habían acumulado varias capas con responsabilidades superpuestas: `phase2-capacity.js`, `phase2-inspector.js` y un parche posterior `phase2-visual-contract-fix.js` intervenían render y/o selectores. Esto permitía que una corrección posterior pisara otra.

## Arquitectura estabilizada
- `phase2-capacity.js`: único renderer final de mesas; formas, sillas, etiquetas, texto upright y handle.
- `phase2-inspector.js`: único dueño de los controles definitivos de forma y capacidad; delega al `tableTransition` del engine.
- `phase2-validation.js`: evaluación final, sin volver a envolver el renderer.
- `phase2-visual-contract-fix.js`: retirado.

## Aislamiento
La estabilización permanece dentro de `pruebas/distribucion/` y tests/documentación. No incorpora persistencia real ni toca `app_integral/`, Firebase, Firestore, Storage, IndexedDB, localStorage o sessionStorage de App Lu.
