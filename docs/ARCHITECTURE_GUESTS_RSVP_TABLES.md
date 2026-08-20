# Mapa técnico: Invitados, RSVP y Mesas

Fecha del análisis: 2026-08-20  
Commit base: `4050c12275e0ea421b52e91409dcfcad2be85e6b`  
Alcance: inventario y diseño; no autoriza eliminación, consolidación ni cambios de comportamiento.

## Resumen ejecutivo

La entrada productiva de la aplicación es `applu.html` (y su copia `app_integral/applu.html`). Ambas cargan `runtime-loader.js`, que activa Invitados y enlaza Distribución. Invitados se ejecuta dentro de un `iframe` creado por `applu-script-01.js` desde HTML embebido en base64. RSVP tiene dos superficies activas: administración dentro de ese iframe y formulario público independiente. Mesas tiene una ruta activa mucho más pequeña que el número de archivos existentes.

- Ruta activa de Invitados: `applu.html` → `runtime-loader.js` → `invitados/index.js` + `ui-copy.js` + `tables-lazy-loader.js`.
- Ruta activa de Mesas: `tables-lazy-loader.js` → `tables-editor-entry.js` → `tables-editor.js` + `tables-stable-polish.js` + `tables-old-look.js`.
- Ruta activa de RSVP administrativo: `invitados/index.js` + `rsvp-service.js`; al abrir RSVP, el loader añade `rsvp-admin-music.js`, `rsvp-admin-music-builder-fix.js` y `rsvp-native-admin-patch.js`.
- Ruta pública: `rsvp.html` → `rsvp-public.js` + `rsvp-music.js`; las invitaciones integradas usan principalmente `rsvp-native-widget.js`.
- `rsvp-native-widget-v2.js` solo tiene consumidor demostrado en una página de prueba.
- Trece módulos de Mesas no tienen consumidor demostrado en la ruta productiva actual.
- La persistencia está distribuida entre Firestore, `localStorage`, `IndexedDB`, eventos y `postMessage`; no existe un único servicio para Mesas.

## 1. Inventario de archivos

Se inventariaron **57 archivos textuales**. Se excluyeron imágenes, vídeo, audio y fuentes porque no contienen control, estado ni contratos.

| Archivo | Tipo | Dominio | Bytes | Estado aparente |
|---|---|---:|---:|---|
| `app_integral/css/modules/distribucion.css` | CSS | Distribución | 22164 | Activo en el módulo embebido de Distribución |
| `app_integral/css/modules/invitados-rsvp-management.css` | CSS | RSVP admin | 8698 | Activo, inyectado por `invitados/index.js` |
| `app_integral/css/modules/invitados-rsvp.css` | CSS | RSVP admin | 8907 | Activo, inyectado por `invitados/index.js` |
| `app_integral/css/modules/invitados-tables-editor.css` | CSS | Mesas | 15513 | Activo, inyectado por `tables-editor.js` |
| `app_integral/css/modules/invitados-tables-legacy-skin.css` | CSS | Mesas | 7040 | Sin consumidor productivo demostrado |
| `app_integral/css/modules/invitados-tables-old-look.css` | CSS | Mesas | 8539 | Activo, estilo final de la ruta canónica |
| `app_integral/css/modules/invitados.css` | CSS | Invitados | 38 | Placeholder; sin referencia directa demostrada |
| `app_integral/css/modules/musica.css` | CSS | Música | 36 | Placeholder; fuera de RSVP activo |
| `app_integral/css/modules/rsvp-music.css` | CSS | RSVP público | 3945 | Activo en `rsvp.html` |
| `app_integral/css/modules/rsvp-public.css` | CSS | RSVP público | 6126 | Activo en `rsvp.html` |
| `app_integral/firebase/firestore.rules` | configuración | Persistencia | 12310 | Activo; contrato de seguridad, no modificado |
| `app_integral/invitacion_2_rsvp_prueba.html` | QA | RSVP | 7195 | Prueba manual; referencia faltante registrada en baseline |
| `app_integral/invitacion_prueba_rsvp.html` | QA | RSVP | 7223 | Prueba manual, sin consumidor productivo |
| `app_integral/js/legacy/applu-script-01.js` | legacy/loader | Todos | 10457146 | Activo y crítico; contiene módulos HTML embebidos |
| `app_integral/js/modules/distribucion/index.js` | adaptador | Distribución/Mesas | 18535 | Activo, importado al iniciar `runtime-loader.js` |
| `app_integral/js/modules/distribucion/README.md` | documentación | Distribución | 887 | Activo como referencia técnica |
| `app_integral/js/modules/invitados/index.js` | módulo | Invitados/RSVP admin | 57868 | **CANÓNICO** para administración |
| `app_integral/js/modules/invitados/rsvp-admin-music-builder-fix.js` | fix | RSVP música admin | 8273 | **PARCHE ACTIVO**, importado por runtime |
| `app_integral/js/modules/invitados/rsvp-admin-music.js` | complemento | RSVP música admin | 26802 | **ACTIVO COMPLEMENTARIO** |
| `app_integral/js/modules/invitados/rsvp-music.js` | widget | RSVP música pública | 12724 | **ACTIVO COMPLEMENTARIO** en `rsvp.html` |
| `app_integral/js/modules/invitados/rsvp-native-admin-patch.js` | patch | RSVP admin | 3900 | **PARCHE ACTIVO** |
| `app_integral/js/modules/invitados/rsvp-native-widget-v2.js` | widget v2 | RSVP público | 20935 | Solo QA demostrada; requiere investigación |
| `app_integral/js/modules/invitados/rsvp-native-widget.js` | widget | RSVP público/embebido | 23509 | **CANÓNICO** para integración nativa |
| `app_integral/js/modules/invitados/rsvp-public.js` | controlador | RSVP público | 16880 | **CANÓNICO** para página pública completa |
| `app_integral/js/modules/invitados/rsvp-service.js` | servicio | RSVP | 11716 | **CANÓNICO** para administración/configuración |
| `app_integral/js/modules/invitados/runtime-loader.js` | loader | Invitados/RSVP/Mesas | 4738 | Activo y canónico como entrada |
| `app_integral/js/modules/invitados/tables-accessibility.js` | complemento | Mesas | 5751 | Sin consumidor demostrado |
| `app_integral/js/modules/invitados/tables-canvas.js` | controlador | Mesas | 16644 | Sin consumidor demostrado |
| `app_integral/js/modules/invitados/tables-editor-entry.js` | loader | Mesas | 1091 | Activo, entrada canónica |
| `app_integral/js/modules/invitados/tables-editor.js` | módulo | Mesas | 37350 | **CANÓNICO** |
| `app_integral/js/modules/invitados/tables-geometry.js` | helper | Mesas | 5203 | Sin consumidor demostrado |
| `app_integral/js/modules/invitados/tables-interactions.js` | controlador | Mesas | 6582 | Sin consumidor demostrado |
| `app_integral/js/modules/invitados/tables-lazy-loader.js` | loader | Mesas | 5831 | Activo, carga el editor y ofrece rollback legacy |
| `app_integral/js/modules/invitados/tables-legacy-skin.js` | legacy | Mesas | 6211 | Sin consumidor demostrado |
| `app_integral/js/modules/invitados/tables-live-edit.js` | controlador | Mesas | 8716 | Sin consumidor demostrado |
| `app_integral/js/modules/invitados/tables-mobile-panel.js` | controlador/CSS | Mesas | 6521 | Sin consumidor demostrado |
| `app_integral/js/modules/invitados/tables-name-polish.js` | polish | Mesas | 3777 | Sin consumidor demostrado |
| `app_integral/js/modules/invitados/tables-old-look.js` | legacy/polish | Mesas | 4935 | **ACTIVO COMPLEMENTARIO** |
| `app_integral/js/modules/invitados/tables-order.js` | controlador | Mesas | 8731 | Sin consumidor demostrado |
| `app_integral/js/modules/invitados/tables-permissions.js` | controlador | Mesas | 4200 | Sin consumidor demostrado |
| `app_integral/js/modules/invitados/tables-polish.js` | polish | Mesas | 6256 | Sin consumidor demostrado |
| `app_integral/js/modules/invitados/tables-seat-detail.js` | controlador | Mesas | 7947 | Sin consumidor demostrado |
| `app_integral/js/modules/invitados/tables-stable-polish.js` | polish | Mesas | 6001 | **ACTIVO COMPLEMENTARIO** |
| `app_integral/js/modules/invitados/tables-touch-drag.js` | controlador | Mesas | 10423 | Sin consumidor demostrado |
| `app_integral/js/modules/invitados/ui-copy.js` | patch UI | Invitados/RSVP | 7207 | Activo, importado por runtime |
| `app_integral/js/modules/musica/index.js` | módulo | Música general | 81 | Placeholder, no es RSVP música |
| `app_integral/js/services/firebase-core.js` | servicio | Firebase/contexto | 42451 | Activo y canónico |
| `app_integral/js/services/firebase.js` | fachada | Firebase/contexto | 416 | Activo; reexporta `firebase-core.js` |
| `app_integral/panel_invitaciones.html` | controlador QA | Invitaciones | 10800 | Activo como panel independiente duplicado |
| `app_integral/rsvp.html` | HTML | RSVP público | 796 | Copia integrada activa potencial |
| `firebase.json` | configuración | Emulador | 246 | Activo en CI/local |
| `invitaciones/invitacion_5/prueba_rsvp_musica_directa.html` | QA | RSVP música | 9445 | Prueba manual del widget canónico |
| `invitaciones/invitacion_5/prueba_rsvp_musica.html` | QA | RSVP música | 3585 | Único consumidor demostrado de widget v2 |
| `panel_invitaciones.html` | controlador QA | Invitaciones | 10770 | Duplicado raíz activo potencial |
| `qa/distribucion-index.js` | QA snapshot | Distribución | 18535 | Copia QA del adaptador |
| `qa/runtime-loader.js` | QA loader | Invitados | 4749 | Activo solo desde `qa/applu.html` |
| `rsvp.html` | HTML | RSVP público | 827 | Página pública canónica publicada |

## 2. Matriz de consumidores

| Archivo o grupo | Consumidor(es) | Método de carga | Evaluación |
|---|---|---|---|
| `runtime-loader.js` | `applu.html`, `app_integral/applu.html` | `<script>` clásico | Activo |
| `distribucion/index.js` | `runtime-loader.js` | `import()` inmediato | Activo |
| `invitados/index.js` | `runtime-loader.js` | `import()` al abrir Invitados o detectar iframe | Activo |
| `ui-copy.js` | `runtime-loader.js` | `import()` paralelo | Activo, patch de presentación |
| `tables-lazy-loader.js` | `runtime-loader.js` | `import()` paralelo | Activo |
| `tables-editor-entry.js` | `tables-lazy-loader.js` | `import()` por click o precarga idle | Activo |
| `tables-editor.js` | `tables-editor-entry.js` | `await import()` | Activo/canónico |
| `tables-stable-polish.js` | `tables-editor-entry.js` | `Promise.all(import())` | Activo complementario |
| `tables-old-look.js` | `tables-editor-entry.js` | `Promise.all(import())`; inyecta CSS | Activo complementario |
| `rsvp-service.js` | `invitados/index.js` | import ESM estático | Activo/canónico admin |
| `rsvp-admin-music.js` | `runtime-loader.js` | `import()` al activar RSVP | Activo complementario |
| `rsvp-admin-music-builder-fix.js` | `runtime-loader.js` | `import()` al activar RSVP | Parche activo |
| `rsvp-native-admin-patch.js` | `runtime-loader.js` | `import()` al activar RSVP | Parche activo |
| `rsvp-public.js` | `rsvp.html`, `app_integral/rsvp.html` | `<script type="module">` | Activo/canónico página pública |
| `rsvp-music.js` | mismos HTML RSVP | `<script type="module">` | Activo complementario |
| `rsvp-native-widget.js` | `invitacion_5.html`, prueba directa, códigos generados por admin/servicio | `<script type="module">` remoto | Activo/canónico embebido |
| `rsvp-native-widget-v2.js` | `prueba_rsvp_musica.html` | script creado dinámicamente | Sin consumidor productivo demostrado |
| `tables-accessibility.js`, `tables-canvas.js`, `tables-geometry.js`, `tables-interactions.js`, `tables-legacy-skin.js`, `tables-live-edit.js`, `tables-mobile-panel.js`, `tables-name-polish.js`, `tables-order.js`, `tables-permissions.js`, `tables-polish.js`, `tables-seat-detail.js`, `tables-touch-drag.js` | Ningún import, HTML o loader encontrado | — | **Sin consumidor demostrado** |
| `invitados-tables-legacy-skin.css` | Solo lo referencia `tables-legacy-skin.js`, a su vez no consumido | inyección dinámica potencial | Sin consumidor demostrado |
| `applu-script-01.js` | ambos `applu.html` y QA | `<script>`; crea iframe con `srcdoc` | Activo y crítico |
| `qa/runtime-loader.js`, `qa/distribucion-index.js` | `qa/applu.html` | script/import QA | Solo QA |

La navegación activa los loaders por click en `[data-module="invitados"]`, por `hashchange` que contenga `invitados` y por detección del iframe. El iframe no carga un archivo HTML independiente: el legacy decodifica `MODULES.invitados.html` desde base64 y lo asigna a `srcdoc`.

## 3. Canonicidad

### RSVP

| Archivo | Clasificación | Motivo |
|---|---|---|
| `invitados/index.js` | CANÓNICO | Administra UI, bandeja, clasificación y aplicación a invitados |
| `rsvp-service.js` | CANÓNICO | Configuración privada/pública, token, listado y listener de respuestas |
| `rsvp-public.js` | CANÓNICO | Controlador de la página pública completa |
| `rsvp-native-widget.js` | CANÓNICO | URL emitida por el admin, servicio y parche; usado por invitación 5 |
| `rsvp-admin-music.js` | ACTIVO COMPLEMENTARIO | Añade pestaña, resumen y configuración musical |
| `rsvp-music.js` | ACTIVO COMPLEMENTARIO | Vista pública de música junto a `rsvp-public.js` |
| `rsvp-admin-music-builder-fix.js` | PARCHE ACTIVO | Sobrescribe/asegura carga y guardado del builder musical |
| `rsvp-native-admin-patch.js` | PARCHE ACTIVO | Reescribe código de integración hacia widget nativo |
| `rsvp-native-widget-v2.js` | SIN CONSUMIDOR PRODUCTIVO DEMOSTRADO | Solo aparece en una página de prueba |

### Mesas

| Archivo | Clasificación | Motivo |
|---|---|---|
| `tables-editor.js` | CANÓNICO | Único editor importado por la entrada activa |
| `tables-lazy-loader.js` | ACTIVO COMPLEMENTARIO | Controla carga, visibilidad y fallback |
| `tables-editor-entry.js` | ACTIVO COMPLEMENTARIO | Compone editor y estilos finales |
| `tables-stable-polish.js` | ACTIVO COMPLEMENTARIO | Importado explícitamente |
| `tables-old-look.js` | LEGACY TODAVÍA CONSUMIDO | Importado explícitamente y define el aspecto final |
| Resto de `tables-*.js` | SIN CONSUMIDOR DEMOSTRADO | No existe import, script, loader ni HTML que los cargue |

Esta clasificación describe la ejecución actual, no autoriza borrar archivos. Los módulos sin consumidor podrían conservar valor histórico o estar usados por enlaces externos no presentes en el repositorio.

## 4. Mapa de persistencia

### Caminos principales

```text
Admin Invitados/RSVP
  → invitados/index.js
    → rsvp-service.js → firebase.js → firebase-core.js
      → weddings/{weddingId}/rsvpConfig/main
      → publicRsvp/{token}
      → publicRsvp/{token}/responses/{responseId}
    → Firestore directo
      → weddings/{weddingId}/rsvpManagement/{token__responseId}
    → localStorage
      → planificador_bodas_invitados_v1
      → planificador_bodas_datos_compartidos_v1

RSVP público completo
  → rsvp-public.js → Firestore directo
    → publicRsvp/{token}
    → publicRsvp/{token}/responses/{sessionId}
  → localStorage → migrandia_rsvp_session_{token}

Widget RSVP/música embebido
  → rsvp-native-widget.js → Firestore directo
    → publicRsvp/{token}
    → publicRsvp/{token}/responses/{sessionId}
  → localStorage
    → migrandia_rsvp_session_{token}
    → migrandia_rsvp_attendance_{token}
    → migrandia_rsvp_music_{token}_{sessionId}

Música pública separada
  → rsvp-music.js → Firestore directo
    → publicRsvp/{token}/responses/{sessionId}.customData.mgdMusic
  → las mismas claves de sesión/música

Mesas/Invitados
  → tables-editor.js y adaptadores → localStorage
    → planificador_bodas_invitados_v1
    → planificador_bodas_datos_compartidos_v1
  → postMessage MIGRANDIA_RSVP_SYNC
  → evento migrandia:datachange

Distribución
  → distribucion/index.js
    → mismas claves de Invitados
    → migrandia_distribucion_invitados_link_v1
    → IndexedDB AntonioEventPlannerMemory/{proposals,meta}
    → fallback localStorage eventPlannerProposalMemoryV1
    → eventPlannerActiveProposalIdV1
```

### Contratos observados

- Respuesta RSVP: `version`, `name`, `attendance`, `quantity`, `companions`, `email`, `phone`, `menu`, `restriction`, `notes`, `customData`, `editToken`, `clientDate`, `source`, `submittedAt`, `updatedAt`.
- Música: JSON serializado en `customData.mgdMusic` con `songs[{title,artist}]`, `message`, versión y fecha cliente.
- Invitado local: identificador, nombre, estado, invitación enviada, lado/relación, restricción, mesa/asiento, foto, notas y metadatos RSVP.
- Mesa local: `id`, `name`, `type`, `capacity`, `seats`; Distribución añade equivalencias con elementos legacy.
- `weddingId` proviene de `getWeddingContext()` para administración. El acceso público se resuelve por `token`.
- `editToken` nace en el navegador, se conserva en `migrandia_rsvp_session_{token}` y acompaña todas las escrituras públicas posteriores.

### Escrituras directas fuera del servicio central

`rsvp-public.js`, `rsvp-native-widget.js`, `rsvp-native-widget-v2.js`, `rsvp-music.js`, `rsvp-admin-music.js`, `rsvp-admin-music-builder-fix.js` e `invitados/index.js` escriben o leen Firestore directamente. Por tanto `rsvp-service.js` no es una frontera completa. Mesas no usa Firestore directamente: su persistencia se reparte entre módulos que escriben las mismas claves locales.

## 5. Lifecycle

| Módulo | Montaje | Limpieza | Riesgo |
|---|---|---|---|
| `runtime-loader.js` | DOM ready, click, hashchange, observer del workspace | Sin `unmount`; promesas singleton y datasets evitan parte de la duplicación | Medio |
| `invitados/index.js` | detección de iframe, load, MutationObserver, eventos globales | Desuscribe snapshots al refrescar, pero no ofrece `unmount`; observer raíz permanente | Alto |
| `rsvp-admin-music.js` | import lazy; WeakMap por documento; observer dentro de shell | No desconecta observer ni listener Firestore al retirar iframe | Alto |
| `rsvp-admin-music-builder-fix.js` | DOM ready; observer workspace; listeners en iframe | Sin desconexión explícita; dataset reduce doble bind | Medio |
| `rsvp-native-admin-patch.js` | import lazy y escaneo de documentos | Sin `unmount`; patch idempotente por dataset | Medio |
| `rsvp-public.js` | ejecución ESM única en página | Página dedicada; lifecycle acotado | Bajo |
| `rsvp-music.js` | ejecución ESM y espera del DOM/configuración | Página dedicada; timers breves, sin listener persistente relevante | Bajo |
| `rsvp-native-widget.js` | MutationObserver global + evento `mgd:rsvp-attendance` | Sin desconexión; WeakSet evita reinstalar host salvo edición deliberada | Medio |
| `tables-lazy-loader.js` | DOM ready, click en iframe, idle preload, observer workspace | Sin desconexión; singleton de import y datasets | Medio |
| `tables-editor.js` | observa frames, load, eventos globales; delegación en raíz | No `unmount`; observers por documento y timers globales | Alto |
| `tables-stable-polish.js` | polling cada 120 ms hasta encontrar vista | Limpia intervalo al instalar; no deshace CSS/observer | Medio |
| `tables-old-look.js` | polling cada 80 ms, observers y load de frames | Limpia intervalo al éxito; observers permanecen | Medio |
| `distribucion/index.js` | import inmediato; observers, storage/message/visibility, polling 800 ms por iframe | Detiene timer si frame deja de estar conectado; listeners globales permanecen | Alto |
| Módulos de Mesas sin consumidor | Cada uno crea observers/listeners/timers si se importa | Muchos carecen de `unmount` | Alto si se reactivan en bloque |

Riesgo principal: navegar y recrear iframes puede dejar closures, observers y listeners ligados a documentos anteriores. Los marcadores `dataset`, `WeakMap` y promesas singleton reducen duplicación dentro del mismo documento, pero no sustituyen una API `mount/unmount`.

## 6. CSS y cascada efectiva

### RSVP administración

Orden aproximado dentro del iframe:

1. CSS embebido en el HTML legacy de Invitados.
2. `invitados-rsvp.css` (6 `!important`), inyectado por `index.js`.
3. `invitados-rsvp-management.css` (4 `!important`), inyectado después.
4. estilos inline creados por `rsvp-admin-music.js`.
5. ajustes DOM/inline de `ui-copy.js` y patches.

### RSVP público

1. `rsvp-public.css` (1 `!important`).
2. `rsvp-music.css` (18 `!important`) cargado después; prevalece en selectores coincidentes.
3. estilos inline generados por el widget nativo cuando está embebido en invitaciones.

### Mesas

Ruta activa aproximada:

1. estilos legacy incluidos en el HTML embebido de Invitados.
2. `invitados-tables-editor.css` (3 `!important`) inyectado por editor.
3. `invitados-tables-old-look.css` (141 `!important`) precargado por `tables-editor-entry.js`.
4. estilos inline de `tables-stable-polish.js` (89 `!important`).
5. `tables-old-look.js` vuelve a asegurar el link old-look e inyecta reglas adicionales (37 `!important`).

Hojas no activas pero superpuestas: `invitados-tables-legacy-skin.css` contiene 85 `!important`; `tables-name-polish.js`, `tables-polish.js`, `tables-mobile-panel.js`, `tables-canvas.js` y otros inyectan más reglas si se reactivan. No son simplemente complementarias: varias redefinen dimensiones, layout, nombres, asientos y controles, por lo que el orden temporal de carga puede cambiar la UI.

## 7. Dependencias con `applu-script-01.js`

Invitados/RSVP/Mesas todavía dependen del legacy para:

- La definición `MODULES.invitados` y su HTML/JS/CSS base codificado en base64.
- La creación, cache y navegación del iframe `unifiedWorkspace` mediante `srcdoc`.
- Los DOM esperados `guestList`, `tablesView`, tabs RSVP y estructura de Distribución.
- El envío inicial de `PLANIFICADOR_BODAS_UPDATE` y la retransmisión entre frames.
- La lectura/escritura de `planificador_bodas_datos_compartidos_v1`.
- El enrutamiento de `PLANIFICADOR_BODAS_OPEN_MODULE` hacia Invitados/Distribución.
- Exportación/importación global de `localStorage` e IndexedDB, incluida `planificador_bodas_media_v1` para fotografías.
- Eventos globales y guardado general activados por botones dentro de los iframes.

Duplicidades relevantes:

- Legacy y módulos modernos leen/escriben la misma clave compartida.
- Legacy reenvía mensajes de sincronización mientras `index.js`, `tables-editor.js` y Distribución también publican eventos/mensajes.
- El HTML base de Invitados vive dentro de un objeto base64 de 10 MB, mientras la lógica moderna lo parchea después de montarlo.
- El estado de Mesas existe simultáneamente en el modelo canónico local y en propuestas legacy de Distribución.

## 8. Matriz de riesgos

| Nivel | Archivos | Causa e impacto | Probabilidad | Verificación previa necesaria |
|---|---|---|---|---|
| Crítico | `rsvp-public.js`, widgets, reglas | Varias rutas escriben `publicRsvp/{token}/responses/{id}` con contratos parecidos pero no idénticos; una consolidación puede romper permisos, `editToken` o música | Media | Tests contractuales por cada superficie y emulador |
| Alto | `applu-script-01.js`, runtime, editor | UI canónica depende de HTML base64 y DOM legacy; cambios de IDs o orden rompen montaje silenciosamente | Alta | Fixture DOM real, prueba de navegación e iframe |
| Alto | `tables-editor.js`, Distribución | Dos representaciones y varios bridges escriben las mismas claves; posible pérdida/reasignación de asientos | Media/alta | Snapshot bidireccional y prueba de round-trip |
| Alto | loaders, observers, Firestore listeners | Falta `unmount`; recrear iframe puede duplicar callbacks, lecturas o escrituras | Alta | Test de abrir/cerrar/reabrir y conteo de listeners/timers |
| Alto | CSS old-look/stable/legacy | Centenares de `!important` y carga temporal; una eliminación cambia geometría y drag/drop | Alta | Capturas visuales y pruebas de hitboxes |
| Medio | `rsvp-admin-music-builder-fix.js` | Parche activo duplica responsabilidades de `rsvp-admin-music.js` | Alta | Comparar DOM y payload antes/después |
| Medio | `rsvp-native-widget-v2.js` | Variante completa sin consumidor productivo; riesgo de divergencia contractual | Media | Buscar telemetría/enlaces externos y ejecutar QA |
| Medio | módulos Mesas sin consumidor | Parecen muertos, pero podrían ser cargados externamente | Baja/media | Búsqueda en Pages, historial y tráfico antes de borrar |
| Medio | `rsvp.html` duplicado | Dos rutas físicas con contenido casi igual pueden divergir | Media | Comparación automática y smoke test de ambas URLs |
| Bajo | CSS placeholders | Archivos de 1 línea pueden confundir herramientas/propietarios | Baja | Confirmar ausencia de referencias antes de documentar retiro |

### Top 5

1. Contratos RSVP y `editToken` distribuidos entre múltiples escritores.
2. Dependencia estructural de Invitados/Mesas respecto al HTML base64 legacy.
3. Sincronización bidireccional Mesas ↔ Distribución con dos modelos persistentes.
4. Lifecycle sin `unmount` en módulos con observers, listeners y polling.
5. Cascada de Mesas dominada por `old-look`/`stable-polish` y `!important`.

## 9. Plan incremental, máximo cinco intervenciones

### 1. Tests contractuales de RSVP por superficie

- Objetivo: congelar el contrato actual de configuración, respuesta, edición y música.
- Archivos: nuevos tests/fixtures; lectura de `rsvp-service.js`, `rsvp-public.js`, widget y reglas.
- Precondición: emulador Java 21 ya estable.
- Tests: crear/editar respuesta con `editToken`, estados de asistencia, música, acceso admin.
- Riesgo: bajo; no cambia producción.
- Rollback: retirar únicamente los tests nuevos.
- Resultado: red de seguridad antes de consolidar escritores.

### 2. Instrumentar lifecycle en QA

- Objetivo: medir montajes, observers, listeners Firestore y timers al navegar repetidamente.
- Archivos: harness QA separado; sin instrumentación productiva permanente.
- Precondición: fixture que monte el iframe real.
- Tests: 10 ciclos Invitados → RSVP → Mesas → salir; afirmar un solo montaje activo.
- Riesgo: bajo.
- Rollback: retirar harness QA.
- Resultado: evidencia para diseñar `mount/unmount`.

### 3. Formalizar un adaptador único de persistencia local de Invitados/Mesas

- Objetivo: centralizar lectura, normalización y escritura de las dos claves locales sin cambiar esquema.
- Archivos: nuevo servicio y migración gradual de `tables-editor.js`/Distribución.
- Precondición: snapshots de round-trip y backup de fixtures.
- Tests: equivalencia byte/semántica y sincronización con Distribución.
- Riesgo: medio.
- Rollback: volver imports a funciones locales.
- Resultado: un escritor coordinado, mismo contrato.

### 4. Retirar parches RSVP mediante absorción controlada

- Objetivo: incorporar comportamiento de builder-fix y native-admin-patch en módulos canónicos.
- Archivos: `rsvp-admin-music.js`, `invitados/index.js`, patches y loader.
- Precondición: intervenciones 1 y 2.
- Tests: DOM admin, código embebido, escritura dual privada/pública.
- Riesgo: medio.
- Rollback: restaurar imports de patches.
- Resultado: menos observers y orden de carga más determinista.

### 5. Clasificar y retirar código de Mesas sin consumidores

- Objetivo: decidir archivo por archivo después de comprobar enlaces externos e historial.
- Archivos: trece módulos y `legacy-skin.css` sin consumidor demostrado.
- Precondición: telemetría/Pages, pruebas visuales y lifecycle.
- Tests: editor, móvil, drag/drop, accesibilidad, Distribución.
- Riesgo: medio.
- Rollback: restaurar archivos sin migración de datos.
- Resultado: superficie mantenible alineada con la ruta real.

## 10. Primera intervención recomendada

La primera modificación real debería ser **añadir tests contractuales de RSVP por superficie**.

Tiene impacto útil y alcance pequeño porque protege el punto de mayor riesgo —los múltiples escritores de Firestore— sin alterar producción. El rollback consiste solo en retirar tests. Puede verificarse con el emulador ya operativo en CI y permitirá decidir con seguridad si `rsvp-public.js`, `rsvp-native-widget.js` y `rsvp-music.js` pueden compartir una capa de escritura futura. No requiere reescribir UI, cambiar reglas ni migrar datos.

## Evidencia y límites

- El análisis combina imports estáticos/dinámicos, referencias HTML, nombres de archivo, eventos, claves y llamadas de persistencia en el commit base.
- “Sin consumidor demostrado” significa que no existe consumidor dentro de este repositorio y commit; no demuestra ausencia de enlaces externos históricos.
- No se ejecutaron ni propusieron eliminaciones.
- No se modificaron código productivo, contratos, reglas, CSS, dependencias o datos.

