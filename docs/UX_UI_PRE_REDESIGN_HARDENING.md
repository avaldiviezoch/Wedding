# Tarea 7B - Hardening previo al rediseño

Estado: REDESIGN - PRE-REDESIGN HARDENING
Fecha: 2026-08-21
Rama: `stabilization/task-7b-pre-redesign-hardening`
Base: `main` en `0638261be0045d62b303cdbbbcad7bac7c56495b`

## Alcance

7B estabiliza y documenta fronteras antes de Tarea 8. No inicia rediseño, no cambia Firebase config, Firestore Rules, RSVP contracts, `ownerUid`, Anonymous Auth, rutas publicas, storage keys, datos reales ni deploy.

Cambios ejecutados:

- labels semanticos para inputs de auth;
- helper aislado para Escape, ciclo de Tab y restauracion de foco en auth;
- test estatico de regresion de auth;
- documento de contratos, boundaries, deuda aceptada y gate.

## Fuentes y skills

Fuentes revisadas: `AGENTS.md`, skills `wedding-governance`, `wedding-engineering`, `wedding-ui-review`, `wedding-motion-review`, `wedding-visual-polish`, `docs/UX_UI_AUDIT.md`, `docs/UX_UI_VISUAL_BASELINE.md`, `docs/UX_UI_PRE_REDESIGN_GATE.md`, `design-system/MASTER.md`, `app_integral/ARCHITECTURE.md`, `docs/ARCHITECTURE_GUESTS_RSVP_TABLES.md`, `docs/RSVP_CONTRACTS.md`, `docs/ROOT_COMPATIBILITY.md`, `firebase.json`, `scripts/validate-repository.mjs`, `app_integral/applu.html`, `app_integral/js/core/auth-dialog-hardening.js`, `app_integral/js/services/firebase-core.js`, `menu-fast.js`, `module-context-bar.js`, Invitaciones, Invitados/RSVP, Distribucion/Mesas y paneles publicos.

Uso de skills:

- `wedding-governance`: alcance, no deploy, no Firebase sensible.
- `wedding-engineering`: cambios minimos y verificables.
- `wedding-ui-review`: foco, labels, estados y responsive.
- `wedding-motion-review`: timers, observers, reduced motion.
- `wedding-visual-polish`: identificar deuda visual sin rediseñar.

## Matriz consolidada A/B/C/D/E

| Hallazgo | Prioridad | Tipo 7B | Decision |
| --- | --- | --- | --- |
| Home no opera como centro | P1 | C | Resolver en Tarea 8 como dashboard operativo. |
| Navegacion duplicada | P1 | B | Contrato actual documentado antes de rediseñar. |
| Modulos placeholder | P1 | B/C | Politica de placeholders para Tarea 8. |
| Preview de invitaciones compite con link real | P2 | D | Mantener como deuda; migrar Invitaciones despues. |
| RSVP/Invitados critico | P1 | B | Boundary obligatorio; no tocar datos. |
| Mesas/Distribucion complejo | P1 | B | Boundary obligatorio; no tocar geometria/persistencia. |
| Configuracion/equipo sensible | P2 | D | Requiere sesion/dataset controlado. |
| Cascada CSS con `!important` | P1 | B | Estrategia CSS definida; no limpieza masiva. |
| Identidad UI inconsistente | P2 | C | Resolver en Design System Tarea 8. |
| Responsive por parches | P1 | B | Contract por breakpoints. |
| Foco visible e overlays | P1 | A/B | Auth corregido; helper global pendiente Tarea 8. |
| Auth usa placeholder como label | P2 | A | Corregido con labels y `aria-describedby`. |
| Reduced motion parcial | P2 | B/C | Contract definido; no capa global en 7B. |
| Formularios y double submit | P1/P2 | B | State contract; auth conserva guards existentes. |
| Legacy activo | P1 | B | Boundary legacy/modern definido. |
| Falta lifecycle `mount/unmount` | P1 | B | Contract definido por modulo. |
| Recursos visuales legacy 404 | P1 | B/D | Documentado; no inventar assets. |

## Problemas corregidos

### AUTH-A11Y-001 - Inputs de auth dependian de placeholder

Corregido en `app_integral/applu.html` y `auth-premium.css`: `authEmail` y `authPassword` tienen `<label>` semantico visualmente oculto y `aria-describedby="authStatus"`. No se cambio el layout visual.

### AUTH-A11Y-002 - Dialog de auth sin contrato minimo de teclado

Corregido con `app_integral/js/core/auth-dialog-hardening.js`, helper aislado para no tocar `firebase-core.js`: recuerda foco, Escape dispara cancelar, Tab/Shift+Tab ciclan dentro de `auth-card` y al cerrar restaura foco al disparador/fallback.

Limite aceptado: `inert` global queda pendiente para Tarea 8.

## Problemas pendientes

| Superficie | Estado | Motivo |
| --- | --- | --- |
| Dashboard/Home autenticado | Pendiente | Requiere sesion autenticada controlada. |
| Invitados/RSVP admin | Pendiente | No escribir datos reales ni saltar auth. |
| Distribucion/Mesas | Pendiente | No mover mesas reales ni tocar geometria. |
| Configuracion/Equipo | Pendiente | No cambiar roles/invitaciones reales. |
| Recursos legacy 404 | Deuda aceptada | Assets no verificables en entorno local. |
| `inert` global | Contract | Requiere helper comun de overlays. |
| Lifecycle completo | Contract | Requiere migracion gradual por modulo. |

## Nuevos hallazgos 7B

- `7B-NET-001 [P1]`: `applu.html` raiz puede resolver mal referencias relativas `css/*` y `js/*` si se trata como documento directo fuera de `app_integral`. Coincide con `docs/ROOT_COMPATIBILITY.md`. No se corrige en 7B porque toca rutas publicas.
- `7B-NET-002 [P1]`: Invitaciones legacy 1/3/4/5 tienen recursos visuales/media 404 (`SOBRE_PROBAR.MP4`, `ENTRADA.gif`, `PAREJA.gif`, `COPAS.gif`, `PLATOS.gif`, `sake_binks.mp3`, `video_entrada.mp4`, `video_de_saludo_*.mp4`, fondos 4, etc.). No hay assets alternativos verificados.
- `7B-ENV-001 [P2]`: snapshots sparse/locales incompletos producen falsos positivos en `validate-repository`; CI remoto sobre arbol completo es la fuente autoritativa.

## Current Navigation Contract

- `applu.html` declara drawer, links `[data-module]`, quick nav `[data-quick-module]`, home buttons y `#unifiedWorkspace`.
- `menu-fast.js` controla drawer/backdrop/auth gate/hash.
- `module-context-bar.js` controla quick nav, boda activa, cuenta y popover.
- `runtime-loader.js` activa Invitados/RSVP/Mesas.
- `invitaciones/index.js` renderiza Invitaciones dentro del workspace.
- `applu-script-01.js` legacy aun participa con iframes/HTML base.

No romper en Tarea 8: `#unifiedWorkspace`, hash de modulos, `data-module`, `data-quick-module`, auth gate, `migrandia:wedding-context`, `migrandia:auth`, `migrandia:datachange`, compatibilidad Invitados/Distribucion/Invitaciones.

## Mount / Unmount / Cleanup Contract

Cada modulo migrado debe tener semanticamente: `mount(root, context)`, `unmount()`, `refresh(context)` y limpieza de listeners, timers, intervals, observers, iframes/audio/video propios. No registrar listeners globales sin guard idempotente. Todo observer debe desconectarse si observa DOM efimero.

## Listeners, Observers y Timers

| Area | Riesgo | Decision |
| --- | --- | --- |
| `firebase-core.js` auth/storage/message/datachange/visibility | Medio | No tocado en 7B. |
| `auth-dialog-hardening.js` keydown + MutationObserver | Bajo | Helper acotado a auth. |
| `menu-fast.js` drawer/Escape/pageshow/video | Medio | Mantener; idempotente por dataset. |
| `module-context-bar.js` quick nav/popover/hash | Medio | Mantener contrato. |
| Invitaciones iframe/load/hash | Medio | Deuda para migracion Invitaciones. |
| Distribucion/Mesas polling/observers | Alto | Boundary; requiere sesion/dataset. |
| RSVP admin/publico | Alto | Boundary; no modificar sin pruebas controladas. |

## Focus Contract

Obligatorio para Tarea 8: disparador con nombre accesible, guardar foco al abrir, foco inicial util, Escape, Tab trap en modal, restaurar foco al cerrar, fondo no interactivo, errores asociados a `aria-live`/`aria-describedby`.

Implementado en 7B solo para Auth: labels, `aria-describedby`, Escape, trap y restore focus basico.

## Reduced Motion Contract

Motion decorativo debe apagarse con `prefers-reduced-motion: reduce`; motion funcional puede quedar instantaneo; loaders no deben depender de loops intensos; drawer/modal/overlay sin animacion en reduce; scroll auto en reduce. No se agrega capa global en 7B para evitar conflicto legacy.

## State Contract

Estados minimos: `loading`, `empty`, `saving`, `saved`, `error`, `offline`, `permission denied`, `pending`, `syncing`. Acciones async deben usar disabled/aria-busy o guard equivalente. No depender solo de color.

## Responsive Contract

Breakpoints: 360, 390, 430, 768, 1024, 1440. Reglas: sin `overflow:hidden` global para esconder problemas; drawer con safe areas; modal con scroll interno; tablas con scroll horizontal controlado; iframe con enlace real; sticky/fixed sin tapar controles; drag/touch con alternativa.

## Tables Safety Boundary

No tocar sin autorizacion: IDs/DOM legacy, geometria mesas/asientos, drag/drop/touch, `tableId`, `seatIndex`, `guest.id`, `seats`, storage `planificador_bodas_invitados_v1`, `planificador_bodas_datos_compartidos_v1`, bridges `MIGRANDIA_RSVP_SYNC`, `migrandia:datachange`, `MIGRANDIA_DISTRIBUTION_CHANGED`, sincronizacion con Distribucion.

## RSVP Safety Boundary

Puede rediseñarse visualmente: layout, labels, errores, botones y feedback. No tocar: `ownerUid`, Anonymous Auth, rutas `publicRsvp/{token}`, respuestas privadas, `rsvp-owner-client.js`, `customData.mgdMusic`, `weddingId`, token active/paused, roles, `rsvpManagement/{token__responseId}`, `rsvp.html` y `app_integral/rsvp.html`.

## Firebase Boundary

Sin cambios en Firebase config, Firestore Rules, Auth contract, collections, IDs, Storage, Functions o billing. Si un problema visual nace de permisos, documentar y no cambiar Rules sin autorizacion.

## Legacy / Modern UI Boundary

Legacy activo: `applu-script-01.js`, `applu-style-01.css`, iframes y DOM antiguo usado por Invitados/Mesas/Distribucion. Modern activo: `js/core/*`, `firebase-core.js`, `invitaciones/index.js`, `runtime-loader.js`, `distribucion/index.js`. Tarea 8 debe migrar por frontera clara, no eliminar legacy en bloque.

## CSS Strategy

Clasificacion: `auth-guard.css` foundation; `master-theme.css` foundation/patch; `module-context-bar.css` foundation/patch; `home-responsive.css` patch; `auth-premium.css` active module; `invitaciones.css` active module; `invitados-*.css` active/high risk; `module-topbar-premium.css` patch/polish; `legacy/*` legacy.

Recomendacion Tarea 8: namespace `body.mgd-redesign`, cascade layers, tokens desde `design-system/MASTER.md`, componentes en `css/core`, migracion por pantalla, `!important` solo para aislar legacy temporal.

## Placeholder Policy

Dashboard debe volverse centro operativo. Checklist/Presupuesto/Proveedores/Cronograma/Documentos deben ocultarse o tener empty state util hasta implementacion. Invitados, Distribucion/Mesas, Invitaciones y Configuracion son activos y requieren boundaries.

## Console / Network Baseline

Sonda HTTP reviso panel e invitaciones publicas. Se verificaron 139 referencias. Falsos positivos: templates JS (`${url}`, `${q}${n}${q}`). Reales: recursos visuales/media legacy 404. No se detecto recurso critico de datos/RSVP/Firebase roto y corregible con seguridad en 7B.

## Deuda Aceptada

- Recursos visuales legacy 404 sin asset verificable.
- Compatibilidad raiz de `applu.html`.
- Lifecycle completo Mesas/RSVP.
- CSS con `!important`.
- Placeholders.
- `inert` global.

## Gate Final

P0 final: 0.
P1 nuevo de seguridad/datos corregible sin autorizacion: 0.
Auth semantico/foco: corregido localmente.
Navegacion, lifecycle, focus, motion, state, responsive, legacy, RSVP, Tables y Firebase: documentados como contracts/boundaries.

Validacion local confiable:

- `node --check app_integral/js/core/auth-dialog-hardening.js`: success.
- `node --test tests/ui/auth-accessibility.test.mjs`: success.

Validacion local `scripts/validate-repository.mjs`: no autoritativa en sparse/snapshot incompleto; produjo falsos positivos por assets no presentes. CI remoto debe confirmar sobre arbol completo.

READY FOR TASK 8: YES, condicionado a que el PR 7B mantenga CI verde en GitHub y no introduzca regresiones nuevas.
