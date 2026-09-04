# Distribución · reestructura limpia

Esta carpeta es el nuevo laboratorio aislado para reconstruir Distribución antes de integrarlo a App Mi Lu.

## Reglas
1. No usar Firebase, Firestore, localStorage, IndexedDB ni persistencia real.
2. No importar ningún archivo de `pruebas/distribucion/`.
3. El engine es la única capa que modifica el estado de dominio.
4. El renderer solo dibuja.
5. El editor traduce eventos de UI a comandos del engine.
6. El adapter es la única frontera futura con App Mi Lu.
7. Cambiar capacidad no modifica tamaño físico.
8. Zoom no modifica geometría.
9. Los IDs de mesas e invitados deben poder provenir directamente de Mi Lu.

## Archivos
- `index.html`: laboratorio aislado.
- `distribucion.css`: presentación.
- `distribucion-engine.js`: estado, mesas, sillas, geometría y reglas.
- `distribucion-renderer.js`: SVG/DOM, sin mutaciones de dominio.
- `distribucion-editor.js`: interacción, selección, zoom e inspector.
- `distribucion-export.js`: JSON/PNG/propuestas.
- `distribucion-adapter.js`: contrato memory-only hoy; Mi Lu mañana.

## Contrato de mesa
```js
{
  id: "table-1",
  type: "table",
  shape: "round",
  tabletop: { widthM: 1.50, heightM: 1.50 },
  capacity: 10,
  seatLayout: "default",
  seats: [null, ...],
  x: 724,
  y: 543,
  rotation: 0,
  locked: false
}
```

La capacidad y el tamaño físico son propiedades independientes.


## Regla principal de seguridad

**EL STORAGE NO SE TOCA.**

Esta regla tiene prioridad sobre cualquier reestructura, corrección, prueba o integración.

Queda prohibido desde este laboratorio:
- Firebase.
- Firestore.
- Firebase Rules.
- localStorage real de App Mi Lu.
- sessionStorage real.
- IndexedDB real.
- Storage real.
- persistencia real de invitados, mesas, asignaciones o distribución.
- migraciones, limpiezas, rehidrataciones destructivas o reseteos.
- cambios en backups, logout o sincronización real.

La reestructura trabaja únicamente en memoria hasta que exista una autorización explícita y una fase de integración controlada mediante adapter.

**Ningún cambio visual, de mesas, sillas, geometría, zoom o editor puede escribir en el storage real.**
