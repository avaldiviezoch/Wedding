# Contratos maestros — Confirmaciones, Invitados, Mesas y Sillas, Distribución

Estado: **FASE 0 — contrato de arquitectura**  
Fecha: 2026-09-02  
Alcance: documentación únicamente. **No autoriza cambios de persistencia, Firebase, Firestore, Rules, localStorage, IndexedDB ni migraciones de datos.**

## 1. Objetivo

Definir la frontera que debe respetar la reconstrucción de Distribución para poder trabajar primero en `pruebas/distribucion/` y, cuando el motor esté aprobado, integrarlo de vuelta en Mi Gran Día sin duplicar identidades ni perder relaciones entre Confirmaciones, Invitados, Mesas/Sillas y el plano.

Flujo funcional objetivo:

```text
CONFIRMACIONES / RSVP
        │
        │ vinculación administrativa explícita
        ▼
     INVITADOS
        │
        │ guestId + asignación
        ▼
   MESAS Y SILLAS
        │
        │ tableId / seatId / seatNumber
        ↕
   DISTRIBUCIÓN
        │
        └─ posición, rotación y plano por propuesta
```

Principio: **una persona, una mesa y una silla conservan una sola identidad lógica en todo el producto**.

---

## 2. Fuentes actuales revisadas

Este contrato se basa en los comportamientos actualmente observados y no reemplaza sus documentos especializados:

- `AGENTS.md` — seguridad y regla cero de no tocar persistencia desde tareas UI.
- `docs/ARCHITECTURE_GUESTS_RSVP_TABLES.md` — inventario y canonicidad actual.
- `docs/RSVP_CONTRACTS.md` — contrato público/administrativo RSVP.
- `app_integral/js/modules/invitados/index.js` — administración de Invitados y aplicación manual de RSVP.
- `app_integral/js/modules/invitados/tables-editor.js` — editor canónico actual de Mesas.
- `app_integral/js/modules/distribucion/index.js` — adaptador actual Invitados/Mesas ↔ Distribución.
- `app_integral/js/modules/distribucion/README.md` — frontera de presentación y datos.

Si existe contradicción, prevalecen `AGENTS.md`, los contratos de seguridad vigentes y los contratos RSVP normativos.

---

## 3. Regla de propiedad por módulo

### 3.1 Confirmaciones / RSVP

**Es dueño de:**

- la respuesta pública (`responseId`);
- `attendance` (`confirmed`, `declined`, `tentative` cuando corresponda);
- cantidad declarada y acompañantes escritos por quien responde;
- datos del formulario RSVP;
- metadatos propios de la respuesta y música asociada;
- clasificación administrativa de la respuesta y su vínculo `linkedGuestIds`.

**NO es dueño de:**

- `guestId` de una persona de la lista hasta que el administrador la vincula explícitamente;
- `tableId`;
- `seatId`;
- `seatNumber`;
- posición o geometría del plano.

**Regla obligatoria:** recibir o modificar un RSVP **no crea, elimina, reasigna ni desasigna automáticamente invitados o asientos**. La aplicación a Invitados requiere una acción administrativa explícita.

### 3.2 Invitados

**Es la fuente maestra de personas de la boda.**

Es dueño de:

- `guestId`;
- nombre y datos de la persona;
- estado de asistencia consolidado del invitado;
- lado, relación, restricciones, notas y metadatos propios;
- vínculo administrativo con una respuesta RSVP (`rsvpResponseId` y metadatos relacionados);
- la referencia de asignación actual `tableId`, `seatId`, `seatNumber`.

**NO debe:**

- duplicar una persona porque llegó una respuesta RSVP con el mismo nombre;
- decidir geometría, posición o rotación de una mesa;
- inventar una segunda identidad para mesas o sillas.

### 3.3 Mesas y Sillas

**Es la fuente maestra estructural de mesas y asientos.**

Es dueño de:

- `tableId`;
- nombre de mesa;
- tipo/forma estructural (`round`, `square`, `rectangular`);
- capacidad;
- colección ordenada de sillas;
- `seatId`;
- índice de silla;
- dimensiones físicas de la mesa cuando se formalicen en el nuevo motor.

El editor actual ya reconoce tipos `round`, `square`, `rectangular`, capacidades entre 4 y 16 y genera IDs estables de silla.

**NO debe:**

- controlar X/Y de una mesa en un plano;
- controlar rotación en una propuesta de Distribución salvo como dato sincronizado/derivado mientras dure la compatibilidad legacy;
- administrar respuestas RSVP.

### 3.4 Distribución

**Es dueño del layout físico de cada propuesta.**

Es dueño de:

- `proposalId`;
- referencia `tableId` del elemento colocado;
- X/Y de la colocación;
- rotación;
- orden visual/capa;
- elementos espaciales no-tabla (pista, barra, DJ, altar, toldos, etc.);
- mediciones del plano;
- configuración visual de la propuesta;
- riesgos espaciales derivados: colisión, proximidad, circulación.

**No crea una segunda mesa lógica.** Una mesa dibujada es una colocación de la mesa cuyo `tableId` pertenece al modelo de Mesas y Sillas.

La forma, capacidad y sillas mostradas por Distribución se obtienen de la mesa canónica; no deben existir dos versiones independientes de esos datos.

---

## 4. Identidades canónicas

### `weddingId`

Identifica la boda activa. Todas las entidades reales pertenecen a ese contexto.

### `guestId`

Identidad única y estable de una persona dentro de la boda.

Reglas:

- no cambia al confirmar RSVP;
- no cambia al mover de mesa;
- no cambia al cambiar de asiento;
- no cambia al cambiar de nombre;
- no se recrea para sincronizar Distribución.

### `tableId`

Identidad única y estable de una mesa.

Reglas:

- no cambia al mover la mesa;
- no cambia al rotarla;
- no cambia al cambiar de redonda a cuadrada/rectangular;
- no cambia al modificar capacidad o dimensiones;
- debe ser el mismo ID en Mesas y Sillas y Distribución.

### `seatId`

Identidad estable de una silla perteneciente a una mesa.

Reglas:

- cada silla conoce su índice;
- `seatNumber = index + 1` es la representación humana actual;
- una asignación de invitado apunta a `tableId + seatId + seatNumber`;
- cambiar geometría no debe cambiar innecesariamente los IDs de sillas existentes;
- al aumentar capacidad se agregan nuevos `seatId`;
- reducir capacidad nunca puede descartar silenciosamente una silla ocupada.

### `responseId`

Identidad de una respuesta RSVP. **No es un `guestId`.** Una respuesta puede vincularse administrativamente con uno o varios invitados existentes.

### `proposalId`

Identidad de un diseño de Distribución. Una misma mesa puede tener una colocación diferente según la propuesta sin crear otra `tableId`.

---

## 5. Modelo canónico objetivo

Este modelo es una especificación para el laboratorio y futuros adaptadores. No es una migración de los datos actuales.

### 5.1 Guest

```js
{
  id: 'guest_xxx',
  name: 'Carlos Pérez',
  status: 'pending',
  side: 'ambos',
  relation: '',
  restriction: 'Ninguna',
  notes: '',

  tableId: '',
  seatId: '',
  seatNumber: null,

  rsvpResponseId: '',
  rsvpResponseName: '',
  rsvpGroup: '',
  rsvpFamilyLabel: '',
  rsvpTags: []
}
```

### 5.2 Table

```js
{
  id: 'table_xxx',
  name: 'Mesa 4',
  type: 'round',
  capacity: 10,
  seats: [
    { id: 'seat_xxx', index: 0 },
    { id: 'seat_yyy', index: 1 }
  ],

  // Se formalizarán en la fase de geometría física.
  dimensions: {
    tabletopWidthM: null,
    tabletopHeightM: null,
    tabletopDiameterM: null
  }
}
```

### 5.3 DistributionProposal

```js
{
  id: 'proposal_xxx',
  name: 'Propuesta principal',
  placements: [
    {
      tableId: 'table_xxx',
      x: 720,
      y: 360,
      rotation: 0
    }
  ],
  elements: [],
  measurements: [],
  settings: {}
}
```

La zona de circulación y los polígonos/radios de riesgo deben ser **derivados por el motor geométrico**, no una segunda definición de la mesa.

### 5.4 RsvpLink

La respuesta RSVP permanece separada de Guest. El vínculo administrativo se representa conceptualmente así:

```js
{
  responseId: 'response_xxx',
  linkedGuestIds: ['guest_a', 'guest_b'],
  group: 'familia',
  side: 'ambos',
  familyLabel: 'Familia Pérez',
  reviewed: true
}
```

---

## 6. Reglas de negocio de integración

### RSVP → Invitados

1. Una respuesta nueva entra primero a la bandeja RSVP.
2. Coincidencias por nombre son sugerencias, nunca autorización para modificar invitados.
3. El administrador selecciona uno o varios `guestId` y pulsa **Aplicar a invitados**.
4. Se actualiza el estado RSVP/metadatos de esos invitados.
5. `tableId`, `seatId` y `seatNumber` se preservan.
6. Si un invitado pasa a `declined` estando sentado, **no se elimina ni se desasigna automáticamente**. Distribución/Mesas deben poder advertir el conflicto y dejar la decisión al usuario.

### Invitados ↔ Mesas y Sillas

1. Una persona solo puede ocupar una silla a la vez.
2. Asignar una silla libera su asignación anterior, pero nunca elimina el invitado.
3. Una silla no puede contener dos `guestId`.
4. `tableId`, `seatId` y `seatNumber` deben permanecer coherentes.
5. Eliminar una mesa devuelve sus personas a estado **sin mesa/sin silla**; no elimina personas.
6. Reducir capacidad por debajo del asiento ocupado más alto debe bloquearse o pedir resolución explícita; nunca truncarse silenciosamente.

### Mesas y Sillas ↔ Distribución

1. Crear una mesa canónica debe permitir crear su colocación en Distribución sin generar otro `tableId`.
2. Crear una mesa desde Distribución debe pasar por una operación de creación de mesa canónica y luego crear su colocación.
3. Renombrar o cambiar tipo/capacidad modifica la misma `tableId`.
4. Mover/rotar la mesa solo modifica su placement en la propuesta.
5. Cambiar forma conserva invitados y IDs siempre que la capacidad continúe admitiéndolos.
6. Eliminar del plano y eliminar la mesa son acciones distintas conceptualmente. La UI final debe expresar claramente cuál se ejecuta.

### Distribución → Riesgos

Riesgos son datos derivados, no persistencia maestra:

- superposición física/operativa;
- separación insuficiente;
- circulación;
- capacidad insuficiente;
- invitado `declined` aún asignado;
- asignaciones inconsistentes detectadas.

Una advertencia **no debe corregir datos automáticamente**.

---

## 7. Responsabilidad de las dimensiones

Para evitar repetir el error de mezclar tamaño físico y área de circulación:

- **tabletop** = dimensión física de la mesa;
- **chairs** = posiciones calculadas según forma/capacidad;
- **clearance** = envolvente operacional calculada;
- **risk margin** = regla de distancia adicional calculada.

El motor geométrico será el único responsable de derivar chairs/clearance/risk a partir de la especificación canónica de la mesa y la escala.

---

## 8. Contratos legacy que deben preservarse durante la transición

Mientras Mi Gran Día siga usando el sistema actual, el adaptador de integración debe respetar los consumidores existentes, entre ellos:

- `planificador_bodas_invitados_v1`;
- `planificador_bodas_datos_compartidos_v1`;
- `MIGRANDIA_RSVP_SYNC`;
- `migrandia:datachange`;
- `MIGRANDIA_DISTRIBUTION_CHANGED`;
- `sharedTableId` / `sharedTableType` donde todavía sean necesarios;
- propuestas del planner legacy.

Estos nombres son **frontera de compatibilidad**, no autorización para que el nuevo motor los use directamente. El nuevo motor deberá comunicarse mediante un adaptador.

---

## 9. Frontera del laboratorio

Hasta que se autorice explícitamente integración real, `pruebas/distribucion/` debe cumplir:

- estado solo en memoria;
- cero Firebase/Firestore;
- cero Rules;
- cero IndexedDB del App Lu;
- cero `localStorage`/`sessionStorage` del App Lu;
- cero escrituras a datos reales;
- ninguna importación desde la aplicación productiva que tenga efectos de persistencia.

El laboratorio sí debe usar los **mismos nombres y relaciones lógicas** (`guestId`, `tableId`, `seatId`, etc.) para evitar una reconstrucción posterior.

---

## 10. Adaptador futuro

Arquitectura objetivo:

```text
App Lu / estado existente
        │
        ▼
distribution-adapter
        │
        ├─ traduce mesas/invitados al modelo canónico
        ├─ traduce comandos seguros hacia App Lu
        └─ encapsula compatibilidad legacy
        │
        ▼
Distribution Engine
        │
        ├─ geometry
        ├─ collisions
        ├─ clearance
        ├─ seats
        ├─ validation
        └─ renderer/UI
```

El `Distribution Engine` no debe conocer claves de storage, Firestore, iframe, `postMessage` ni listeners globales de App Lu.

---

## 11. Matriz de comandos permitidos

| Acción | Módulo responsable | Efecto autorizado |
|---|---|---|
| Recibir RSVP | Confirmaciones | Crear/actualizar respuesta RSVP |
| Vincular RSVP | Confirmaciones/Invitados | Guardar `linkedGuestIds` |
| Aplicar RSVP | Invitados | Actualizar estado/metadatos del `guestId` |
| Crear invitado | Invitados | Crear `guestId` |
| Eliminar invitado | Invitados | Eliminar persona mediante flujo explícito |
| Crear mesa | Mesas y Sillas | Crear `tableId` y sus `seatId` |
| Cambiar capacidad | Mesas y Sillas | Ajustar sillas preservando ocupadas |
| Asignar persona | Mesas y Sillas | Actualizar `tableId/seatId/seatNumber` del invitado |
| Colocar mesa | Distribución | Crear placement para `tableId` |
| Mover/rotar | Distribución | Modificar placement de la propuesta |
| Detectar riesgo | Distribución | Generar advertencia derivada |
| Resolver riesgo | Usuario | Acción explícita; nunca automática |

---

## 12. Invariantes que deben convertirse en tests

Antes de integrar el nuevo motor, deben existir pruebas para estas invariantes:

1. `guestId` no cambia al aplicar RSVP.
2. aplicar RSVP no modifica `tableId`, `seatId` ni `seatNumber`.
3. un invitado solo ocupa una silla.
4. una silla solo contiene un invitado.
5. `tableId` no cambia al mover, rotar o cambiar forma.
6. cambiar forma no elimina invitados.
7. aumentar capacidad preserva IDs/asignaciones existentes.
8. reducir capacidad nunca elimina una asignación silenciosamente.
9. eliminar mesa no elimina invitados.
10. mover una mesa entre propuestas no duplica la mesa canónica.
11. riesgos/validaciones no escriben datos por sí mismos.
12. el motor de laboratorio no contiene APIs de persistencia reales.

---

## 13. Decisiones pendientes para fases posteriores

No se resuelven en Fase 0:

- dimensiones estándar definitivas por forma/capacidad;
- fórmula definitiva de clearance;
- si una mesa puede aparecer en varias propuestas simultáneamente;
- UX exacta de “quitar del plano” versus “eliminar mesa”;
- política visual para invitados `declined` que siguen asignados;
- eventual reemplazo de contratos legacy;
- estrategia final de persistencia del nuevo motor.

Estas decisiones deben resolverse primero en laboratorio y después mediante adaptador, sin migraciones implícitas.

---

## 14. Gate de salida de Fase 0

Fase 0 se considera cerrada cuando:

- este contrato es la referencia para el laboratorio;
- no existe ambigüedad sobre quién es dueño de `guestId`, `tableId`, `seatId`, `responseId` y `proposalId`;
- el laboratorio puede evolucionar sin usar persistencia real;
- cualquier desarrollo de Fase 1+ preserva estas invariantes o documenta explícitamente una propuesta de cambio antes de implementarla.
