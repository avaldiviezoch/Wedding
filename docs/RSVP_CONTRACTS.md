# Contratos RSVP observados

Estado: la primera parte describe el baseline observado al iniciar la Tarea 5A. La sección «Estado objetivo de la Tarea 5B» documenta la mitigación implementada posteriormente; no autoriza migraciones ni cambios de datos.

## Estado objetivo de la Tarea 5B

La actualización de una respuesta pública existente deja de depender de una comparación imposible de demostrar en Rules. Las Rules solo conservan la creación pública; toda actualización pública pasa por la callable `updatePublicRsvpResponse`, que lee el secreto almacenado en un entorno privilegiado y lo compara con el `editToken` presentado antes de escribir.

La callable admite dos operaciones idempotentes:

- `rsvp`: recibe `token`, `responseId`, `editToken` y los campos RSVP permitidos; conserva `submittedAt`, el secreto almacenado, claves personalizadas preexistentes y `customData.mgdMusic`;
- `music`: recibe los mismos identificadores y un payload musical; actualiza únicamente `customData.mgdMusic` sin sustituir el resto del RSVP.

Errores públicos: `invalid-argument` para forma inválida, `not-found` para configuración inactiva o respuesta inexistente y `permission-denied` para un secreto incorrecto. Los logs registran código y clase del error, pero no tokens ni payloads. Las callables aceptan CORS para los widgets embebibles, tienen `maxInstances: 10` y no desactivan las validaciones de aplicación mediante una política global.

### Lectura administrativa sanitizada

La callable `listSanitizedRsvpResponses` exige Firebase Auth y obtiene la membresía desde Firestore, sin confiar en roles enviados por el cliente. La política queda así:

| Rol | Lectura directa completa | Lectura sanitizada | Escritura administrativa |
|---|---:|---:|---:|
| owner / admin / editor | sí | no necesaria | sí |
| provider / viewer | no | sí, sin `editToken` | no |
| usuario ajeno o anónimo | no | no | no |

La lectura sanitizada pagina hasta 100 respuestas por llamada y elimina `editToken` en el servidor. El panel usa sondeo cada 15 segundos para provider/viewer; los roles editables conservan el listener Firestore en tiempo real.

### Compatibilidad y despliegue seguro

La creación pública directa se conserva para no romper sesiones nuevas. Si el backend aún no existe, el cliente solo usa esa vía como compatibilidad para crear una respuesta inexistente; nunca usa el fallback para actualizar una respuesta existente. El orden de despliegue obligatorio es:

1. desplegar las Functions y verificar ambas callables;
2. publicar los clientes que llaman al backend y comprobar creación/edición/música;
3. desplegar las Rules que cierran updates y lecturas directas;
4. verificar owner/admin/editor, provider/viewer y un usuario ajeno;
5. observar errores antes de retirar cualquier compatibilidad.

No debe invertirse el orden: cerrar Rules antes de publicar backend y clientes impediría actualizaciones legítimas de clientes antiguos. El rollback seguro consiste en restaurar primero las Rules anteriores solo si fuera imprescindible mantener servicio, revertir después los clientes y finalmente la Function; esa reapertura recuperaría temporalmente el riesgo del baseline y debe quedar limitada al incidente.

### Riesgo residual aceptado

No se rotan ni migran secretos históricos. Un provider/viewer que hubiese leído previamente un `editToken` podría conservarlo y usar la callable como poseedor del secreto. La mitigación impide nuevas exposiciones y exige presentar el token, pero no invalida secretos ya divulgados. Se registra como `MGD-DEBT-004`; resolverlo requiere una migración/rotación explícita fuera de esta tarea.

## Alcance y método

Se revisaron `rsvp-public.js`, `rsvp-native-widget.js`, `rsvp-native-widget-v2.js`, `rsvp-service.js`, `rsvp-music.js`, `rsvp-admin-music.js`, `rsvp-admin-music-builder-fix.js`, `invitados/index.js` y `app_integral/firebase/firestore.rules`.

Los módulos dependen de DOM, Firebase servido por CDN y estado de navegador. No se refactorizó producción para exponer constructores puros. Los tests usan fixtures estáticos derivados literalmente de las formas observadas y pruebas reales contra Firebase Emulator para permisos y validaciones de Rules.

## Matriz de superficies

| Superficie | Operación | Destino | Payload observado | Identidad / token | Validación |
|---|---|---|---|---|---|
| `rsvp-service.js` | leer/crear/actualizar configuración privada | `weddings/{weddingId}/rsvpConfig/main` | configuración completa normalizada | `weddingId` de `getWeddingContext()`; token existente o aleatorio | UI/servicio limita longitudes; Rules exige miembro para leer y rol owner/admin/editor para escribir |
| `rsvp-service.js` | publicar configuración | `publicRsvp/{token}` | subconjunto público, `weddingId`, estado y campos del formulario | token de configuración | Rules: escritura de owner/admin/editor; lectura anónima solo si `active == true` |
| `rsvp-public.js` | leer configuración | `publicRsvp/{token}` | configuración pública | query string `token` | comprueba existencia/estado mediante lectura; la Rule oculta documentos pausados al público |
| `rsvp-public.js` | crear/actualizar respuesta | `publicRsvp/{token}/responses/{session.id}` | RSVP completo | sesión local por token; genera `id` y `editToken` | HTML required, límites UI y Rules `validRsvpSubmission` |
| `rsvp-native-widget.js` | crear/actualizar respuesta | mismo destino | RSVP completo; añade `customData.mgdMusic` si existe localmente | token de atributos `data-mgd-*`; sesión local compartida | UI y Rules RSVP |
| `rsvp-native-widget-v2.js` | crear/actualizar respuesta | mismo destino | forma RSVP equivalente; añade música local | token de atributos y sesión local compartida | UI y Rules RSVP; no hay consumidor productivo demostrado en Tarea 5 |
| `rsvp-music.js` / música nativa | crear documento mínimo o actualizar RSVP | mismo documento de respuesta | `source: music-widget` y `customData.mgdMusic` serializado | mismo token, `responseId/session.id` y `editToken` | UI exige al menos una canción; Rules acepta forma music-only o documento RSVP completo resultante |
| `rsvp-admin-music.js` | leer respuestas y extraer música | colección `responses` | interpreta `customData.mgdMusic` | token de configuración administrativa | membresía activa para lectura |
| `rsvp-admin-music-builder-fix.js` | compatibilidad de constructor/presentación administrativa | respuestas existentes | normaliza/lee música observada | contexto del panel | depende de acceso administrativo; no cambia el contrato público canónico |
| `invitados/index.js` | leer, revisar y borrar respuestas | colección `responses` | respuesta pública existente | token activo de configuración | miembro lee; owner/admin/editor pueden borrar |
| `invitados/index.js` | crear/actualizar metadatos de revisión | `weddings/{weddingId}/rsvpManagement/{token__responseId}` | clasificación administrativa | `weddingId` del contexto; ID compuesto | Rules solo distinguen membresía/rol, no validan forma del ID ni payload |

## Configuración RSVP

### Documento privado

Ruta: `weddings/{weddingId}/rsvpConfig/main`.

La forma normalizada observada contiene:

- `version`, `weddingId`, `weddingName`, `token`, `active`;
- `formTitle`, `welcomeText`, `maxGuests`, `allowTentative`;
- `attendanceControlStyle`, `quantityControlStyle`, `allowEditResponse`;
- `confirmedMessage`, `declinedMessage`;
- `fields`, `menuOptions`, `customFields`, `updatedAt`.

`weddingId` procede prioritariamente de `getWeddingContext().id`. El servicio rechaza contexto ausente o legacy. `saveRsvpConfig` requiere roles `owner`, `admin` o `editor`.

### Documento público

Ruta: `publicRsvp/{token}`.

Repite el subconjunto necesario para renderizar el formulario y conserva `weddingId`. No contiene el token como campo: el token es el ID del documento. Un documento activo es legible anónimamente; uno pausado solo es legible por miembros activos de la boda.

Al regenerar el enlace, el documento anterior recibe `active: false` y `replacedAt`; el nuevo token se publica activo.

## Respuesta pública

Ruta: `publicRsvp/{token}/responses/{responseId}`.

### Payload RSVP aceptado por Rules

Las Rules exigen exactamente estas claves:

`version`, `name`, `attendance`, `quantity`, `companions`, `menu`, `email`, `phone`, `restriction`, `notes`, `customData`, `editToken`, `clientDate`, `source`, `submittedAt`, `updatedAt`.

Condiciones principales:

- `version == 1` y `source == public-rsvp`;
- nombre no vacío, máximo 120;
- asistencia `confirmed`, `declined` o `tentative`;
- cantidad entera entre 0 y `maxGuests`;
- `declined` usa cantidad 0; los demás estados usan al menos 1;
- acompañantes es lista y no supera `maxGuests`;
- los textos tienen límites específicos;
- `customData` es mapa con máximo 15 claves;
- `editToken` es string de 30 a 180 caracteres;
- `clientDate` es string de hasta 60 caracteres.

Todos los campos de la forma son obligatorios estructuralmente, aunque varios aceptan string vacío. La UI controla campos configurables como requeridos; Rules no conoce el detalle de `fields.required` publicado.

### Creación y actualización

La creación anónima solo funciona si la configuración existe y está activa. Las respuestas nunca son legibles anónimamente.

Una actualización pública evalúa el documento completo resultante, debe conservar el `editToken` almacenado y debe continuar siendo una forma RSVP o music-only válida. Un miembro con rol owner/admin/editor puede actualizar administrativamente sin `editToken`.

## Contrato `editToken`

Las superficies públicas guardan una sesión local con `{ id, editToken }` bajo una clave derivada del token RSVP. `id` se usa como `responseId`; `editToken` concatena identificadores aleatorios y elimina guiones.

El contrato de seguridad observado es:

1. cualquier cliente puede crear una respuesta con un `editToken` válido en longitud;
2. el token se guarda dentro del documento;
3. para una actualización anónima, el nuevo documento debe conservar exactamente el token anterior;
4. un token diferente no permite editar;
5. las Rules no exigen que el request incluya explícitamente el token: comparan el valor del documento resultante con el almacenado;
6. los roles administrativos editables constituyen la excepción autenticada.

La suite demuestra que un `updateDoc` parcial que omite `editToken` conserva automáticamente el campo existente en `request.resource.data`. Por ello la comparación pasa sin que el cliente haya presentado el secreto. Este comportamiento también alcanza a provider/viewer y, si se conoce la ruta, al flujo público. Es una divergencia riesgosa del objetivo aparente de posesión de `editToken`.

## Gestión administrativa

Ruta: `weddings/{weddingId}/rsvpManagement/{token__responseId}`.

Payload observado en `invitados/index.js`:

- `version`, `token`, `responseId`, `weddingId`;
- `side`, `group`, `tags`, `linkedGuestIds`;
- `reviewed`, `updatedAt`.

El código construye el ID concatenando token, dos guiones bajos y responseId. Las Rules no validan esa forma ni comprueban que los campos coincidan con el ID. Por tanto, `token__responseId` es hoy un contrato de aplicación, no un contrato impuesto por Firestore.

Todos los miembros activos leen. Solo owner/admin/editor crean, actualizan o eliminan. Usuarios ajenos no tienen acceso.

## Música

La música se almacena como JSON serializado en `customData.mgdMusic`, normalmente con:

- `version`;
- `songs[]`, cuyos elementos usan `title` y `artist`;
- `message`;
- `guestName`;
- `updatedAtClient`.

Si aún no existe RSVP, la música puede crear una forma mínima con las claves `version`, `source`, `customData`, `editToken`, `clientDate`, `submittedAt`, `updatedAt`. `source` debe ser `music-widget` y `customData` solo puede contener `mgdMusic`.

Si ya existe RSVP, la música actualiza `customData.mgdMusic`. El documento resultante debe conservar el mismo `editToken` y seguir cumpliendo la forma RSVP completa.

## Compatibilidad entre superficies

| Diferencia | Clasificación | Observación |
|---|---|---|
| `rsvp-public.js`, widget nativo y v2 usan el mismo conjunto superior de campos RSVP | `COMPATIBLE` | version, campos personales, asistencia, customData, tokens y timestamps coinciden |
| Los widgets pueden incorporar música de almacenamiento local en `customData`; la página pública completa no lo hace | `DIVERGENCIA RIESGOSA` | un envío posterior desde `rsvp-public.js` usa `customData` construido solo con campos del formulario; con merge a nivel de campo puede sustituir el mapa y perder `mgdMusic` existente |
| Música puede llegar antes del RSVP mediante un documento mínimo | `COMPATIBLE CON VARIACIÓN` | explícitamente permitido por Rules y filtrado en la bandeja hasta tener RSVP |
| `rsvp-native-widget-v2.js` reproduce el contrato del widget principal pero carece de consumidor productivo demostrado | `REQUIERE INVESTIGACIÓN` | conservar hasta confirmar consumidores y comportamiento en navegador |
| `token__responseId` no está validado por Rules | `DIVERGENCIA CONTROLADA` | la aplicación mantiene el formato; un escritor administrativo autorizado podría usar IDs arbitrarios |
| `fields.required` se valida en UI, no dinámicamente en Rules | `COMPATIBLE CON VARIACIÓN` | Rules exige la forma y tipos, pero strings opcionales pueden estar vacíos |
| Provider/viewer pueden hacer un update parcial de respuesta sin presentar `editToken` | `DIVERGENCIA RIESGOSA` | el documento resultante conserva el token y satisface la comparación; los roles no editables terminan pasando por la rama pública |

## Divergencia riesgosa: posible sustitución de música

Superficies afectadas: `rsvp-public.js` frente a `rsvp-native-widget.js`, `rsvp-native-widget-v2.js` y los módulos de música.

Secuencia potencial:

1. música escribe `customData.mgdMusic` en una respuesta;
2. la misma sesión envía o actualiza RSVP desde `rsvp-public.js`;
3. `rsvp-public.js` construye un mapa `customData` solo con campos del formulario;
4. `setDoc(..., { merge: true })` fusiona el campo superior, no garantiza una fusión profunda de todas las claves del mapa;
5. `mgdMusic` puede quedar sustituido si no está incluido en el nuevo mapa.

Riesgo: pérdida silenciosa del payload musical de esa respuesta. No se corrigió en esta tarea. Antes de consolidar debe reproducirse en emulador o prueba de integración específica y decidirse un único comportamiento de merge.

## Divergencia riesgosa: actualización sin presentar `editToken`

Superficies afectadas: todas las escrituras a `publicRsvp/{token}/responses/{responseId}` y todos los clientes que conozcan esa ruta.

La Rule de update compara `request.resource.data.editToken` con `resource.data.editToken`. En un `updateDoc` parcial que no incluye ese campo, Firestore construye `request.resource.data` conservando el valor anterior. La igualdad es verdadera aunque el cliente no conozca ni presente el token.

La suite confirmó el comportamiento con roles provider y viewer. El mismo camino público no exige autenticación, por lo que el riesgo potencial depende de que un tercero pueda conocer o adivinar token y responseId.

Riesgo: cambio no autorizado de payload, permisos más amplios de lo que sugieren los roles y debilitamiento del contrato `editToken`. No se modificaron Rules. Requiere revisión de seguridad y una corrección posterior con diseño explícito y pruebas de compatibilidad.

## Cobertura añadida

La suite amplía la cobertura sobre:

- rechazo de campos ausentes y tipos inválidos;
- persistencia e inmutabilidad pública de `editToken`;
- comportamiento observado de updates parciales que omiten `editToken`;
- actualización pública con token correcto o incorrecto;
- bloqueo de nuevas respuestas cuando el formulario está pausado;
- lectura de configuración pausada por miembros;
- permisos de owner/admin/editor/provider/viewer y usuarios ajenos;
- creación music-only, transición música→RSVP y token incorrecto;
- acceso y escritura de `rsvpManagement`;
- forma observada del ID `token__responseId` y ausencia de validación del ID en Rules;
- compatibilidad estructural de fixtures de las superficies públicas.

## Limitaciones de los tests

- No se ejecuta un navegador completo ni se importan módulos CDN/DOM.
- Los fixtures de payload son representativos y deben mantenerse sincronizados manualmente con producción.
- No se prueba el comportamiento real de `localStorage`; solo se documenta su papel.
- No se prueba todavía la semántica exacta de merge profundo de `customData.mgdMusic` como escenario extremo a extremo de cada superficie.
- No se validan UI, mensajes, accesibilidad o presentación.
- Las Rules permiten cualquier forma interna para `rsvpManagement`; la forma del payload solo queda documentada por fixture.

## Protección requerida para futuros refactors

1. Mantener rutas, IDs y nombres de campos hasta disponer de migración explícita.
2. Conservar `editToken` en toda actualización anónima.
3. No exponer respuestas a usuarios anónimos ni ajenos.
4. Mantener el bloqueo público cuando `active` no sea verdadero.
5. Preservar la transición music-only hacia RSVP completo sin perder `mgdMusic`.
6. Mantener roles administrativos y de solo lectura observados.
7. Validar consumidores reales antes de retirar v1/v2 o parches.
8. Añadir una prueba de integración de merge de música antes de centralizar escritores.

## Primera recomendación de consolidación futura

Antes de centralizar escritores, definir y probar una operación única de actualización parcial que preserve `customData.mgdMusic` y el `editToken`. Debe introducirse en una tarea posterior con prueba de regresión, compatibilidad hacia atrás y rollback claro; este documento no autoriza implementarla.
