# Distribución

El módulo se divide intencionalmente en dos capas:

- `index.js`: vínculo de datos entre Distribución e Invitados (mesas, sillas, capacidad y asignaciones). No contiene presentación visual.
- `../../../css/modules/distribucion.css`: interfaz propia del módulo, alineada con el sistema visual de Mi Gran Día.

## Regla de mantenimiento

La presentación no debe volver a construirse mediante un adaptador visual que reordene el DOM con `MutationObserver`, recargas o una segunda cabecera superpuesta. Los IDs del motor (`planner`, `itemsLayer`, `selectionForm`, `seatEditor`, `proposalModal` y controles relacionados) se conservan para no romper el editor.

La lista maestra de personas se administra en **Invitados**. Distribución consume esa información para ubicar invitados en mesas y sillas; no debe mantener un segundo CRUD visual de invitados.
