# Auditoría de rendimiento — autenticación y cambio de sesión

Fecha: 2026-08-18

## Alcance

Auditoría del camino crítico de `Mi Gran Día` para inicio de sesión con Google, restauración de sesión Firebase, cambio de usuario, cambio de boda activa, respuesta del botón de menú durante autenticación/hidratación, sincronización Firestore y restauración local.

## Hallazgos principales

1. El menú se bloqueaba explícitamente durante la hidratación mediante `menuButton.disabled = true` y solo se liberaba después de `hydrateUser()`.
2. Identidad y restauración de datos estaban acopladas: la interfaz esperaba Firestore, lectura de chunks, restauración local y en ciertos casos una escritura nueva antes de terminar la transición.
3. Había lecturas seriales evitables para índice/membresía de bodas.
4. El primer `writeCloudBackup()` podía entrar al camino crítico del login.
5. `menu-fast.js` forzaba `video.preload = 'auto'` sobre un MP4 de aproximadamente 10 MB, compitiendo por ancho de banda en móvil.
6. `app_integral/js/legacy/applu-script-01.js` pesa aproximadamente 10.46 MB y sigue siendo deuda técnica relevante.

## Solución aplicada

- La sesión autenticada vuelve interactiva la shell inmediatamente y mantiene solo los módulos dependientes de datos en estado de hidratación.
- El menú ya no depende del final de `hydrateUser()`.
- Se cede al navegador un frame antes de iniciar trabajo pesado.
- Se agrega token de hidratación para descartar trabajos de una sesión anterior durante cambios rápidos de usuario.
- Se paralelizan lecturas independientes con `Promise.all`.
- Limpiezas/reparaciones no críticas pasan a segundo plano.
- El primer guardado de nube deja de bloquear el final del login.
- Cambio de boda solapa guardado actual y lectura del destino.
- El vídeo usa `preload = 'metadata'`.

## Métricas incorporadas

Desde la consola del navegador:

```js
WeddingPlannerAuthPerfReport()
```

Métricas disponibles: `googlePopup`, `authToInteractive`, `weddingContext`, `cloudBackupRead`, `cloudRestore`, `localClear`, `hydration`, `cloudBackupWrite`, `switchWedding`, `logout` y `menuToggle`.

## Antes / después

### Antes

- Menú potencialmente deshabilitado durante toda la hidratación.
- Camino crítico: autenticación + Firestore + restore + posible escritura.
- Varias consultas seriales.
- Sin métricas del flujo.

### Después

- Menú interactivo mientras la sincronización continúa.
- Camino crítico percibido: autenticación + paint de UI.
- Consultas independientes en paralelo.
- Trabajos antiguos cancelables al cambiar de usuario.
- Instrumentación de avg/p95/última muestra.

## Objetivos de validación

- `menuToggle` idealmente < 16 ms.
- `authToInteractive` idealmente < 150 ms desde que Firebase emite el usuario.
- Ninguna recarga manual necesaria tras cambiar de usuario.
- `hydration` puede tardar más que `authToInteractive`, pero no debe impedir abrir/cerrar el menú.

## Deuda técnica siguiente

La siguiente mejora estructural es retirar progresivamente `js/legacy/applu-script-01.js` del camino principal y mover `WeddingPlannerBridge` y módulos operativos a archivos pequeños cargados por demanda. Debe hacerse por módulos y con pruebas de regresión.
