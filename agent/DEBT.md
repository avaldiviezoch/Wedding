# Deuda técnica — Mi Gran Día

Este archivo registra soluciones temporales, código heredado y riesgos conocidos que no deben olvidarse. No reemplaza issues ni pruebas.

## MGD-DEBT-001 — Invitación 5 con iframe anidado

- **Área:** Invitaciones / preview móvil
- **Estado:** mitigado
- **Prioridad:** media
- **Qué existe hoy:** la Invitación 5 usa `index.html` → `invitacion_5.html` → `iframe` hacia `invitacion_5_base.html`, y el panel de Invitaciones vuelve a mostrar la invitación dentro de otro iframe de vista previa.
- **Por qué se aceptó:** permitió conservar la personalización actual de la Invitación 5 sin reescribir de inmediato el documento base ni arriesgar regresiones visuales.
- **Riesgo:** scroll táctil anidado, complejidad de responsive, medición de altura, mantenimiento y posibilidad de parches sucesivos alrededor del iframe.
- **Solución recomendada:** convertir la Invitación 5 en un documento final autosuficiente o reducir la cadena a una sola capa de iframe, retirando el wrapper intermedio cuando la personalización esté consolidada.
- **Condición para resolverlo:** verificar que la Invitación 5 conserve imágenes, tipografía, dress code, itinerario, RSVP, música, preguntas, animaciones y comportamiento móvil sin depender del wrapper actual.
- **Archivos relacionados:** `invitaciones/invitacion_5/index.html`, `invitaciones/invitacion_5/invitacion_5.html`, `invitaciones/invitacion_5/invitacion_5_base.html`, `app_integral/js/modules/invitaciones/index.js`.

## MGD-DEBT-002 — Lógica heredada concentrada en applu-script-01.js

- **Área:** Arquitectura general
- **Estado:** abierto
- **Prioridad:** media
- **Qué existe hoy:** una parte importante de la lógica histórica sigue concentrada en `app_integral/js/legacy/applu-script-01.js`.
- **Por qué se aceptó:** migrar todo de una vez aumentaría mucho el riesgo de regresiones en módulos ya funcionales.
- **Riesgo:** dificultad para localizar responsabilidades, duplicación al crear módulos nuevos y posibilidad de mantener listeners o estados antiguos en paralelo.
- **Solución recomendada:** migración incremental por módulo hacia `js/core`, `js/services` y `js/modules`, retirando cada bloque antiguo solo después de identificar sus consumidores.
- **Condición para resolverlo:** que la funcionalidad activa esté distribuida en módulos claros y el archivo legacy deje de ser necesario para los flujos principales.
- **Archivos relacionados:** `app_integral/js/legacy/applu-script-01.js`, `app_integral/ARCHITECTURE.md`.

## MGD-DEBT-003 — Navegación rápida todavía convive con lógica heredada

- **Área:** Navegación global
- **Estado:** mitigado
- **Prioridad:** media
- **Qué existe hoy:** el estado activo de la barra superior ya se sincroniza de forma genérica por `data-quick-module`, pero la navegación global todavía convive con listeners y renderizado heredado del aplicativo.
- **Por qué se aceptó:** la corrección inmediata debía impedir estados activos pegados sin reescribir toda la navegación.
- **Riesgo:** futuros módulos podrían agregar una segunda lógica de navegación si no respetan el contrato `data-module` / `data-quick-module`.
- **Solución recomendada:** mover la sincronización de navegación a un controlador global único en `js/core` y hacer que todos los módulos consuman esa misma fuente de verdad.
- **Condición para resolverlo:** que ningún módulo individual gestione directamente el estado visual global de la barra superior.
- **Archivos relacionados:** `app_integral/js/modules/invitaciones/index.js`, `app_integral/js/core/router.js`, `app_integral/js/core/menu-fast.js`.

## MGD-DEBT-004 — Respuestas RSVP legacy sin propietario autenticado

- **Área:** RSVP / seguridad y autenticación.
- **Estado:** mitigado.
- **Prioridad:** alta.
- **Qué existe hoy:** las respuestas nuevas usan un `ownerUid` inmutable asociado a Firebase Anonymous Auth. Las respuestas históricas carecen de esa identidad y conservan un `editToken` que debe considerarse secreto legacy potencialmente expuesto. `rsvp-native-widget-v2.js`, sin consumidor productivo demostrado, conserva todavía el payload antiguo.
- **Por qué se aceptó:** asignar propiedad automáticamente o aceptar una primera reclamación por `editToken` permitiría apropiaciones. No se autorizó migración, rotación ni eliminación masiva de datos.
- **Riesgo:** los invitados históricos ya no pueden editar públicamente su respuesta y deben solicitar cambios al organizador; activar v2 como superficie productiva produciría escrituras rechazadas por las Rules nuevas.
- **Solución recomendada:** diseñar una migración con verificación externa del invitado, retirar definitivamente `editToken` y eliminar o migrar v2 después de confirmar todos sus consumidores.
- **Condición para resolverlo:** migración autorizada y verificada de respuestas históricas, nueva identidad entregada a sus titulares y ausencia demostrada de consumidores productivos del contrato antiguo.
- **Archivos relacionados:** `app_integral/firebase/firestore.rules`, `app_integral/js/modules/invitados/rsvp-owner-client.js`, `app_integral/js/modules/invitados/rsvp-native-widget-v2.js`, `docs/RSVP_CONTRACTS.md`.

