# Estabilización técnica — fase 1

Rama de trabajo: `stabilization/phase-1-safety-net`  
Commit base: `41ca537210ea3f675cfec03f2fa5c996bc3c5daf`

Esta fase añade validaciones y documentación. No cambia código de producto, reglas Firestore, rutas públicas, contratos de datos ni experiencia visual.

## Matriz de GitHub Actions

| Workflow | Clasificación | Activación | Archivos que modifica | Commit / push | Escritura en `main` | Producción | Validez de rutas | Propuesta |
|---|---|---|---|---|---|---|---|---|
| `ajuste-nuestra-boda-invitacion-1.yml` | Temporal, aparentemente obsoleto | Cambio del propio workflow | `invitacion_1.html`; elimina el workflow | Sí / `push origin main` | Sí, fuerza checkout de `main` | Sí | Inválida: `invitacion_1.html` ya no vive en raíz | No reactivar; retirar en una intervención separada tras confirmar historial |
| `aplicar-cronograma-final-invitacion-2.yml` | Temporal, aparentemente obsoleto | Cambio del propio workflow | `invitacion_2.html`; elimina el workflow | Sí / `push origin main` | Sí, fuerza checkout de `main` | Sí | Inválida: `invitacion_2.html` ya no vive en raíz | No reactivar; retirar separadamente |
| `cache-bust-auth-guard.yml` | Necesario pero riesgoso | Cambios en `auth-guard.css` | `applu.html`, `app_integral/applu.html` | Sí / `git push` | Puede escribir en la rama que disparó el evento; normalmente `main` | Sí en `main` | Válidas | Sustituir posteriormente por versionado de build o PR automático |
| `cache-bust-invite-direct.yml` | Necesario pero riesgoso | Cambios del controlador de invitaciones, trigger o workflow | Dos entradas `applu.html` | Sí / `git push` | Sí cuando el evento nace en `main` | Sí | Válidas | Mantener por ahora; evitar concurrencia y migrar a build/PR |
| `cache-bust-master-theme.yml` | Necesario pero riesgoso | Cambios de navegación, Firebase, legacy o tema | Dos entradas `applu.html` | Sí / `git push` | Sí cuando el evento nace en `main` | Sí | Válidas | Prioridad alta: eliminar escritura directa mediante versionado de build |
| `fix-presentes-3-bank.yml` | Temporal, aparentemente obsoleto | Cambio de un trigger manual | `invitacion_3.html` | Sí / `git push` | Sí si se dispara desde `main` | Sí | Inválida: ruta raíz retirada | No reactivar; verificar que el cambio existe en la invitación canónica antes de retirar |
| `install-fast-accordion.yml` | Histórico / requiere investigación | Push a `main` que cambia acordeón o workflow | Dos entradas `applu.html` | Sí / `git push` | Sí, explícitamente | Sí | Válidas; la inserción ya parece instalada | Confirmar idempotencia y retirar si ya cumplió su función |
| `patch-regalos-invitacion-1.yml` | Temporal, aparentemente obsoleto | Cambio del propio workflow | `invitacion_1.html`; elimina el workflow | Sí / `push origin main` | Sí, fuerza checkout de `main` | Sí | Inválida: ruta raíz retirada | No reactivar; retirar separadamente tras comprobar contenido canónico |
| `sync-applu-runtime.yml` | Necesario pero riesgoso | Cambios bajo `app_integral/js/modules/invitados/**` | `applu.html` raíz | Sí / `git push` | Sí cuando se dispara en `main` | Sí | Válida, aunque solo actualiza una de dos entradas | Investigar divergencia con `app_integral/applu.html` y unificar estrategia de versionado |
| `repository-validation.yml` | Necesario y activo | Pull requests o ejecución manual | Ninguno | No / no | No | No despliega | Válidas | Mantener como barrera de solo lectura |

## Validación estática

`scripts/validate-repository.mjs` comprueba:

- sintaxis de todos los archivos JavaScript mediante el parser de Node;
- referencias locales directas desde HTML, CSS e imports JavaScript;
- IDs HTML duplicados fuera de bloques `script` y `style`;
- rutas literales inexistentes usadas por workflows.

Los problemas preexistentes viven en `qa/static-validation-baseline.json`. Permanecen visibles como `KNOWN`, pero no bloquean CI. Cualquier hallazgo no presente en esa línea base se considera regresión y devuelve un código de error.

La línea base solo debe actualizarse después de revisar manualmente cada diferencia:

```sh
npm run validate:update-baseline
```

## Pruebas Firestore

Las pruebas usan Firebase Emulator y el proyecto reservado `demo-mi-gran-dia`. No se conectan a Firebase real.

Escenarios cubiertos inicialmente:

- acceso no autenticado a datos privados;
- lectura de boda por owner, admin, editor, provider y viewer;
- actualización de boda limitada a owner;
- escritura de planner para owner/admin/editor y denegación para provider/viewer;
- lectura pública de configuración RSVP activa;
- denegación de configuración pausada;
- creación pública de RSVP válido;
- denegación de lectura pública de respuestas;
- lectura de respuestas por miembro activo;
- actualización pública ligada al `editToken`;
- aislamiento de documentos `users/{uid}`.

Pendiente para fases posteriores: matriz exhaustiva de invitaciones de colaboradores, bootstrap de owner en batch, cambios de rol admin/owner, RSVP musical independiente, límites de todos los campos y casos de documentos heredados.

## Uso local

```sh
pnpm install --frozen-lockfile
pnpm validate
pnpm test:firestore
```

## Límites deliberados

La validación es estática: no interpreta referencias construidas dinámicamente ni sustituye pruebas de navegador. No se modifican problemas detectados automáticamente; se documentan y se abordan en tareas separadas.

## Resultado local inicial

- Validación estática: correcta con 7 hallazgos conocidos y 0 regresiones nuevas.
- Sintaxis del script de validación: correcta.
- Sintaxis de la suite Firestore: correcta.
- Ejecución Firestore: no completada en el entorno local de preparación porque no dispone de Java para iniciar Firebase Emulator. Ejecutar `pnpm test:firestore` en CI o en un equipo con Java 21 o superior.
- No se intentó conectar a un proyecto Firebase real como alternativa.


## Tarea 2 — Retiro de workflows históricos

Fecha de retiro: 2026-08-20  
Rama: `stabilization/task-2-retire-historical-workflows`

Se retiraron los siguientes workflows temporales después de confirmar que apuntaban a rutas raíz inexistentes y que sus objetivos históricos ya estaban incorporados en las invitaciones canónicas:

- `ajuste-nuestra-boda-invitacion-1.yml`;
- `aplicar-cronograma-final-invitacion-2.yml`;
- `fix-presentes-3-bank.yml`;
- `patch-regalos-invitacion-1.yml`.

Los cuatro podían modificar invitaciones, crear commits y ejecutar `git push`; tres forzaban explícitamente el trabajo sobre `main`. Mantenerlos suponía riesgo de reactivar parches históricos contra rutas antiguas o de volver a publicar información de pago embebida en la automatización.

El retiro elimina únicamente los archivos de workflow. No se modificaron invitaciones, HTML, CSS, JavaScript productivo, datos bancarios, reglas Firestore ni contratos de datos. La lógica histórica no se migró, no se corrigieron rutas y ninguno de los workflows fue ejecutado manualmente ni reactivado durante esta tarea.

Deuda histórica pendiente: revisar separadamente si la información de pago conservada en el historial Git requiere una política adicional de minimización o rotación. Esta tarea no reescribe el historial ni modifica los datos productivos.


## Tarea intermedia — Gobernanza de workflows escritores

Fecha: 2026-08-20  
Rama: `stabilization/task-3-prerequisite-workflow-governance`

Clasificación y resultado:

- `install-fast-accordion.yml`: retirado. Era un instalador histórico y la referencia a `accordion-fast.js` ya existe en `applu.html` y `app_integral/applu.html`.
- `cache-bust-auth-guard.yml`: migrado a rama y Pull Request automático.
- `cache-bust-invite-direct.yml`: migrado a rama y Pull Request automático.
- `cache-bust-master-theme.yml`: migrado a rama y Pull Request automático.
- `sync-applu-runtime.yml`: migrado a rama y Pull Request automático.

Los cuatro workflows conservados ya no actualizan `main` directamente. Generan una rama `automation/*`, crean un Pull Request hacia `main` y dejan la integración pendiente de `Repository validation` y revisión. No realizan merge automático.

Se retiraron los triggers sobre los propios archivos YAML para evitar ejecuciones causadas por su migración. `app_integral/js/modules/invitaciones/index.js` quedó exclusivamente bajo el sincronizador de Invitaciones, eliminando la creación paralela de dos PR sobre las mismas referencias.

No se modificaron `applu.html`, `app_integral/applu.html`, invitaciones, código productivo, reglas Firestore ni datos. No se ejecutó la lógica de cache-busting o sincronización durante la migración.
