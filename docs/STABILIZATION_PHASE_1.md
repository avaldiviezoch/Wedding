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

