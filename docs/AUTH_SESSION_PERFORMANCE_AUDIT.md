# Auditoría de rendimiento — autenticación y cambio de sesión

Fecha: 2026-08-18

## Alcance

Auditoría del camino crítico de `Mi Gran Día` para:

- inicio de sesión con Google;
- restauración de sesión Firebase;
- cambio de usuario;
- cambio de boda activa;
- respuesta del botón de menú durante autenticación/hidratación;
- sincronización Firestore y restauración local;
- cargas que compiten con el camino crítico.

## Hallazgos principales

### 1. El menú se bloqueaba explícitamente durante la hidratación

El flujo anterior ejecutaba `menuButton.disabled = true` dentro de `onAuthStateChanged` y solo volvía a habilitarlo después de completar `hydrateUser()`.

`hydrateUser()` no es una operación pequeña: resuelve el contexto de boda, consulta Firestore, descarga chunks, reconstruye JSON, restaura el backup local y, en determinados casos, escribe inmediatamente una copia nueva. Por ello la identidad ya estaba autenticada, pero la interfaz seguía comportándose como si no estuviera lista.

### 2. Identidad y datos estaban acoplados en una sola transición

Antes:

`Google/Firebase autenticado -> Firestore -> contexto boda -> backup -> restore local -> posible write -> unlock UI`

Después:

`Google/Firebase autenticado -> shell interactivo -> pintar UI -> sincronización/hidratación -> habilitar módulos de datos`

El usuario puede abrir/cerrar el menú inmediatamente mientras la información de la boda termina de sincronizarse.

### 3. Consultas seriales evitables

La validación de boda activa consultaba índice y membresía de forma secuencial. La búsqueda de bodas alternativas validaba membresías una por una.

Se cambiaron a operaciones paralelas con `Promise.all`, manteniendo las limpiezas y reparaciones no críticas fuera del camino principal.

### 4. Primer guardado bloqueaba el final del login

Cuando no existía backup o se migraba un backup legado, el código esperaba un `writeCloudBackup()` completo antes de considerar terminada la carga.

Ahora el primer guardado se programa después de que la sesión ya es utilizable.

### 5. El vídeo de portada competía por ancho de banda

`menu-fast.js` forzaba `video.preload = 'auto'` sobre un MP4 de aproximadamente 10 MB. En móvil esta descarga puede competir con Firebase, Firestore y los módulos JavaScript del login.

Ahora utiliza `preload = 'metadata'`, manteniendo reproducción automática cuando el navegador puede iniciarla, pero evitando tratar el vídeo completo como recurso crítico de arranque.

### 6. Carga legado muy pesada

`app_integral/js/legacy/applu-script-01.js` pesa aproximadamente 10.46 MB. Sigue siendo deuda técnica relevante y debe modularizarse progresivamente. No se eliminó en esta corrección porque contiene el bridge y lógica operativa existente; retirarlo sin una migración controlada tendría un riesgo alto de regresión.

## Cambios aplicados

- Eliminado el bloqueo explícito del menú durante la hidratación.
- El `AuthGuard` distingue sesión autenticada de datos hidratados (`hydrated`).
- La shell se vuelve interactiva antes de restaurar Firestore/localStorage.
- `requestAnimationFrame` garantiza al navegador oportunidad de pintar antes del trabajo pesado.
- `scheduler.postTask`/`setTimeout(0)` cede el hilo principal antes de restauraciones costosas.
- Se agregó token de hidratación para descartar trabajos de una sesión anterior cuando el usuario cambia rápidamente.
- Consultas de índice/membresía se paralelizan.
- Limpiezas de índices obsoletos y reparaciones de metadata pasan a segundo plano.
- Cambio de boda solapa el guardado actual con la lectura del contexto destino.
- Primer guardado de nube deja de estar en el camino crítico del login.
- Persistencia Firebase se inicializa sin bloquear la evaluación inicial del módulo.
- El vídeo de portada deja de precargarse completo como recurso crítico.

## Métricas incorporadas

El runtime registra hasta 30 muestras recientes en:

`window.WeddingPlannerAuthPerf`

Para obtener un resumen desde la consola:

```js
WeddingPlannerAuthPerfReport()
```

Métricas:

- `googlePopup`: tiempo del popup Google hasta resolución.
- `authToInteractive`: tiempo desde `onAuthStateChanged` hasta que la shell puede responder.
- `weddingContext`: resolución de boda activa y permisos.
- `cloudBackupRead`: lectura y reconstrucción de chunks Firestore.
- `cloudRestore`: restauración local del backup.
- `localClear`: limpieza local al cambiar de usuario.
- `hydration`: hidratación completa.
- `cloudBackupWrite`: guardado de la copia en nube.
- `switchWedding`: cambio completo de boda.
- `logout`: cierre de sesión.
- `menuToggle`: tiempo síncrono de apertura/cierre del menú.

## Comparación antes/después

### Antes

- Menú: podía quedar deshabilitado hasta finalizar toda la hidratación.
- Camino crítico: autenticación + consultas Firestore + restore + posible escritura.
- Validación de contexto: varias lecturas seriales.
- Cambio de usuario: limpieza local era esperada dentro del callback antes de terminar la transición.
- Vídeo: precarga completa con prioridad implícita alta.
- Medición: sin métricas de campo del flujo.

### Después

- Menú: interactivo durante la hidratación.
- Camino crítico percibido: autenticación + un paint de UI; la sincronización continúa con feedback visible.
- Validación de contexto: lecturas independientes en paralelo.
- Cambio de usuario: transición visual inmediata y trabajos antiguos cancelables mediante token.
- Vídeo: `metadata` en lugar de `auto`.
- Medición: reporte de avg/p95/último valor disponible en runtime.

## Objetivos de validación

En pruebas reales, usar como criterios iniciales:

- `menuToggle`: idealmente < 16 ms en ejecución local de UI.
- `authToInteractive`: idealmente < 150 ms desde que Firebase emite el usuario.
- ausencia de períodos donde el botón del menú quede `disabled` durante `auth-hydrating`;
- ninguna recarga manual necesaria tras cambiar de usuario;
- `hydration` puede tardar más que `authToInteractive`, pero no debe impedir abrir/cerrar el menú.

## Deuda técnica siguiente

La mejora estructural más importante pendiente es retirar progresivamente `js/legacy/applu-script-01.js` del camino principal y mover el `WeddingPlannerBridge` y los módulos operativos a archivos pequeños cargados por demanda. Ese trabajo debe realizarse por módulos y con pruebas de regresión, no como un reemplazo masivo.
