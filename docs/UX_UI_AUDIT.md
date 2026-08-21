# Tarea 7 - Auditoría UX/UI integral de Mi Gran Día

Estado: REDESIGN - AUDIT ONLY

Fecha de auditoría: 2026-08-21

Rama: `design/task-7-ux-ui-audit`

Base auditada: `main` en `b83a565e66047a9a7e6e551e1888902917fda7a9`

Alcance: auditoría integral de UX/UI, arquitectura visual, responsive, accesibilidad, formularios, navegación, estados, movimiento, consistencia visual y deuda técnica visible. No incluye cambios de implementación.

## Resumen ejecutivo

Mi Gran Día ya tiene una base de producto valiosa: identidad visual definida en `design-system/MASTER.md`, shell principal en `app_integral/applu.html`, módulos reales para Invitaciones, Invitados/RSVP, Distribución/Mesas y Configuración, y reglas documentadas para Firestore/RSVP. La experiencia actual, sin embargo, está en una etapa híbrida: conviven módulos modernos, módulos placeholder, capas legacy, iframes, CSS correctivo con mucho `!important` y flujos críticos distribuidos entre varias fuentes.

La recomendación principal es no hacer un retoque visual aislado. La siguiente etapa debe ser un rediseño guiado por sistema: primero estabilizar shell, navegación, estados globales y componentes base; después migrar las vistas críticas por módulo. Si se empieza solo por colores o tarjetas, la deuda de navegación, responsive, accesibilidad y estados va a reaparecer.

Prioridad para Tarea 8: reconstruir la experiencia base del usuario autenticado con una pantalla de inicio real, navegación consistente, estados globales y componentes compartidos. Esto debe preservar contratos Firebase, rutas públicas, storage keys y reglas RSVP existentes.

## Skills aplicadas

- `wedding-governance`: límites de seguridad, preservación de datos, rutas, contratos y no despliegue.
- `wedding-ui-review`: revisión UX/UI, responsive, accesibilidad, formularios, estados y consistencia.
- `wedding-visual-polish`: criterio de jerarquía visual, composición, tono premium y reducción de ruido.
- `wedding-engineering`: lectura de arquitectura, trazado de rutas productivas y validación proporcional.
- `wedding-motion-review`: revisión de animaciones, timers, continuidad, performance y `prefers-reduced-motion`.

## Fuentes revisadas

- `AGENTS.md`
- `README.md`
- `app_integral/ARCHITECTURE.md`
- `design-system/MASTER.md`
- `docs/ARCHITECTURE_GUESTS_RSVP_TABLES.md`
- `docs/RSVP_CONTRACTS.md`
- `app_integral/applu.html`
- `app_integral/css/core/*.css`
- `app_integral/css/modules/*.css`
- `app_integral/js/core/*.js`
- `app_integral/js/modules/**/*.js`
- `app_integral/js/services/*.js`
- `app_integral/js/legacy/*`
- `app_integral/rsvp.html`
- `rsvp.html`
- `firebase.json`
- `scripts/validate-repository.mjs`
- `tests/firestore/*`

## Inventario UX/UI

### Entradas principales

| Superficie | Estado | Observación |
| --- | --- | --- |
| `applu.html` raíz | Activa como entrada pública | Entry point de compatibilidad hacia `app_integral`. |
| `app_integral/applu.html` | Shell principal | Carga CSS legacy/core, navegación, auth, workspace y runtime de módulos. |
| `app_integral/rsvp.html` / `rsvp.html` | RSVP público | Ruta sensible por contratos Firestore y auth anónima. |
| `panel_invitaciones.html` / `app_integral/panel_invitaciones.html` | Panel de invitaciones | Superficie de preview con iframe. |
| `appludesktop.html` / `applumovil.html` | Legacy | Compatibilidad, no base de rediseño. |

### Módulos declarados

Según `app_integral/ARCHITECTURE.md`, la app organiza 11 módulos de negocio:

- Dashboard
- Checklist
- Presupuesto
- Proveedores
- Invitados
- Distribución
- Cronograma
- Invitaciones
- Música
- Documentos
- Configuración

### Módulos con implementación productiva clara

- Shell/autenticación/navegación: `app_integral/applu.html`, `app_integral/js/core/*`, `app_integral/js/services/firebase.js`.
- Invitaciones: `app_integral/js/modules/invitaciones/index.js`.
- Invitados/RSVP admin: `app_integral/js/modules/invitados/index.js`.
- Distribución/Mesas: `app_integral/js/modules/distribucion/index.js` y editor de mesas documentado en `docs/ARCHITECTURE_GUESTS_RSVP_TABLES.md`.
- Configuración/equipo: `app_integral/js/modules/configuracion/invite-direct.js` y `weddings-legacy.js`.
- RSVP público: `app_integral/js/modules/invitados/rsvp-public.js`, `rsvp-native-widget.js`, `rsvp-music.js`.

### Módulos placeholder o incompletos

Los siguientes módulos existen como archivos mínimos que solo exportan `moduleId`:

- `app_integral/js/modules/dashboard/index.js`
- `app_integral/js/modules/checklist/index.js`
- `app_integral/js/modules/presupuesto/index.js`
- `app_integral/js/modules/proveedores/index.js`
- `app_integral/js/modules/cronograma/index.js`
- `app_integral/js/modules/documentos/index.js`
- `app_integral/js/modules/musica/index.js`

Impacto UX: la navegación promete más producto del que algunas rutas pueden sostener. Esto reduce confianza y hace que el usuario perciba la app como inconsistente, aunque las áreas reales tengan valor.

## Hallazgos por severidad

Total de hallazgos: 24

| Severidad | Cantidad | Criterio |
| --- | ---: | --- |
| P0 | 0 | No se detectó bloqueo crítico desde auditoría estática. |
| P1 | 14 | Riesgo alto de experiencia, consistencia, accesibilidad o mantenibilidad visible. |
| P2 | 8 | Problemas importantes que pueden resolverse después de estabilizar shell y componentes. |
| P3 | 2 | Ajustes de polish o decisiones de sistema. |

## Hallazgos detallados

### UX-001 [P1] La home no funciona todavía como centro de operación

Evidencia: `app_integral/applu.html` define drawer, navegación rápida y workspace, pero `app_integral/js/modules/dashboard/index.js` es placeholder. La home depende más de navegación y capas legacy que de una vista de resumen productiva.

Impacto: el usuario entra a una herramienta de planificación, pero no recibe una lectura inmediata de qué está pasando, qué falta y qué requiere atención.

Recomendación: Tarea 8 debe empezar por una home/dashboard real con próximos hitos, tareas vencidas, presupuesto resumido, invitados pendientes, accesos frecuentes y estado de invitación/RSVP.

### UX-002 [P1] Navegación duplicada y jerarquía ambigua

Evidencia: `app_integral/applu.html` contiene navegación por grupos (`data-module`) y navegación rápida (`data-quick-module`) entre las líneas 124-183. También existe botón home y workspace integrado.

Impacto: dos patrones para la misma acción aumentan carga cognitiva. En mobile puede sentirse como una app que salta entre menús en vez de mantener orientación.

Recomendación: definir un único modelo: barra principal persistente, contexto de módulo y acciones locales. Mantener equivalencia desktop/mobile.

### UX-003 [P1] La app promete módulos que aún no tienen pantalla

Evidencia: varios `index.js` de módulos son comentarios más `export const moduleId`.

Impacto: la percepción de calidad baja aunque el sistema tenga piezas reales. También complica QA, porque una ruta puede pasar técnicamente pero fallar como producto.

Recomendación: ocultar, agrupar como Próximamente o implementar estados vacíos reales con propósito, sin romper rutas existentes.

### UX-004 [P2] Invitaciones es útil, pero su preview compite con el producto

Evidencia: `app_integral/js/modules/invitaciones/index.js` renderiza un selector, una pantalla tipo teléfono e iframe con simulación de tamaños. Hay `MutationObserver`, resize patching y varios `setTimeout`.

Impacto: el módulo da control, pero el iframe introduce carga, scroll interno, estados de espera y posibles diferencias contra viewport real.

Recomendación: mantener Abrir aparte como acción primaria de QA real; usar preview embebido como apoyo, no como única validación visual.

### UX-005 [P1] RSVP/Invitados concentra lógica crítica sin una experiencia administrativa suficientemente clara

Evidencia: `app_integral/js/modules/invitados/index.js` maneja respuestas RSVP, `rsvpManagement`, sincronización con invitados y estados locales. `docs/RSVP_CONTRACTS.md` confirma que `ownerUid` y auth anónima son contratos sensibles.

Impacto: hay riesgo de que acciones como aplicar respuesta, editar, sincronizar o entender pendientes no sean obvias para usuarios no técnicos.

Recomendación: diseñar un panel RSVP admin con bandeja de respuestas, estado por invitado, conflictos, última sincronización, filtros y acciones reversibles.

### UX-006 [P1] Mesas/Distribución depende de una composición técnica compleja

Evidencia: `docs/ARCHITECTURE_GUESTS_RSVP_TABLES.md` documenta ruta activa con `tables-lazy-loader.js`, `tables-editor-entry.js`, `tables-editor.js`, `tables-stable-polish.js` y `tables-old-look.js`; también advierte módulos sin consumidor demostrado y falta de unmount.

Impacto: el usuario puede sentir fragilidad en una de las pantallas más táctiles de la app, especialmente en mobile.

Recomendación: rediseñar Mesas como flujo propio: lista de invitados, lienzo de mesas, acciones de asignación, conflictos y guardado visible.

### UX-007 [P2] Configuración/equipo requiere mejor modelo mental

Evidencia: `app_integral/js/modules/configuracion/invite-direct.js` importa `weddings-legacy.js` y maneja estados de invitación por email/rol.

Impacto: invitar colaboradores es una acción sensible. Debe comunicar rol, permisos, errores y estado de envío con mucha claridad.

Recomendación: cards de miembros, selector de rol, validación previa, feedback persistente y copy no técnico.

### UI-001 [P1] La cascada CSS está dominada por correcciones con `!important`

Evidencia de conteo estático:

| Archivo | `!important` |
| --- | ---: |
| `app_integral/css/core/home-responsive.css` | 171 |
| `app_integral/css/modules/module-topbar-premium.css` | 146 |
| `app_integral/css/modules/invitados-tables-old-look.css` | 141 |
| `app_integral/css/core/module-context-bar.css` | 108 |
| `app_integral/css/modules/auth-premium.css` | 107 |
| `app_integral/css/modules/invitados-tables-legacy-skin.css` | 85 |
| `app_integral/css/modules/checklist-refine.css` | 66 |
| `app_integral/css/core/master-frame-theme.css` | 56 |
| `app_integral/css/core/master-theme.css` | 54 |

Impacto: cada mejora visual tendrá riesgo de regresión por especificidad. El sistema visual existe en docs, pero no está todavía consolidado como capa técnica.

Recomendación: Tarea 8 debe crear una capa base de tokens/componentes y reducir dependencia de overrides solo en las pantallas migradas.

### UI-002 [P2] Hay demasiadas variantes visuales para acciones similares

Evidencia: conviven `module-link`, `unified-module-link`, `module-quick-tab`, botones de auth, botones de invitaciones, acciones iframe, controles legacy y botones generados por módulos.

Impacto: el usuario no aprende un patrón estable de acción primaria/secundaria/destructiva.

Recomendación: definir botones y tabs de sistema: primary, secondary, ghost, danger, icon, tab y segmented control.

### UI-003 [P2] La identidad premium está documentada, pero no aplicada de forma uniforme

Evidencia: `design-system/MASTER.md` define tono elegante, cálido y personal. La implementación mezcla legacy, paneles densos, preview técnico e imports parciales.

Impacto: el producto puede verse más como ensamblaje de módulos que como una sola experiencia premium.

Recomendación: usar el design system como contrato de UI: paleta, tipografía, radios, spacing, sombras, estados y densidad por tipo de superficie.

### UI-004 [P3] El polish visual debe reducir ruido, no sumar decoración

Evidencia: el sistema ya advierte evitar gradientes genéricos, glass excesivo y estética AI genérica.

Impacto: el mayor riesgo no es falta de ornamento, sino falta de foco.

Recomendación: jerarquía sobria: menos contenedores, más alineación, buen contraste y superficies con propósito.

### RESP-001 [P1] Responsive parece resuelto por parches, no por arquitectura

Evidencia: `home-responsive.css` tiene 171 `!important`, 6 media queries y cubre muchas responsabilidades; `module-context-bar.css` también usa muchos overrides.

Impacto: los viewports requeridos por governance (360, 390-430, 768, 1024, 1440) pueden divergir entre módulos.

Recomendación: diseñar layouts base por breakpoint antes de estilizar módulos: shell mobile, tablet y desktop.

### RESP-002 [P1] Mesas es el mayor riesgo responsive

Evidencia: la arquitectura de Mesas combina editor, polish, skin legacy y old-look; las interacciones de asignación suelen ser drag/touch/table heavy.

Impacto: en mobile puede romperse el flujo principal de distribución de invitados.

Recomendación: usar patrón mobile alternativo: asignación por lista, filtros y acciones explícitas; dejar canvas amplio para tablet/desktop.

### RESP-003 [P2] El preview de invitaciones simula dispositivos, pero no reemplaza pruebas reales

Evidencia: `invitaciones/index.js` permite 360/390/430 con iframe y teléfono visual.

Impacto: útil para comparar, pero puede ocultar problemas de viewport real, safe area, scroll y autoplay.

Recomendación: mantener simulador como herramienta y añadir checklist de QA por link real.

### A11Y-001 [P1] Foco visible insuficiente en archivos críticos

Evidencia estática: varios CSS de alto impacto tienen 0 ocurrencias de `focus`, incluyendo `home-responsive.css`, `module-context-bar.css`, `module-topbar-premium.css`, `invitados-tables-old-look.css` e `invitados-tables-legacy-skin.css`.

Impacto: navegación con teclado y accesibilidad real pueden quedar incompletas.

Recomendación: definir `:focus-visible` global y estados por componentes interactivos.

### A11Y-002 [P2] Formulario de auth usa placeholders como etiquetas visibles

Evidencia: `app_integral/applu.html` línea 171 contiene inputs `authEmail` y `authPassword` con placeholder.

Impacto: los placeholders desaparecen al escribir y no sustituyen una etiqueta persistente clara.

Recomendación: usar labels visibles o patrón floating label accesible, con `aria-describedby` para errores.

### A11Y-003 [P1] Modales/drawers necesitan contrato de foco e inert

Evidencia: `app_integral/applu.html` define overlay de auth con `role="dialog"` y un drawer/menu; no hay evidencia estática suficiente de focus trap, restore focus e inert global.

Impacto: usuarios de teclado o lector de pantalla pueden navegar contenido detrás del modal.

Recomendación: crear helper único para overlays: abrir, cerrar, escape, foco inicial, foco atrapado, restauración e inert.

### A11Y-004 [P2] `prefers-reduced-motion` no aparece como patrón global suficiente

Evidencia: hay animaciones/transiciones en CSS y múltiples timers en JS; no se observa contrato global consistente de movimiento reducido en los archivos críticos medidos.

Impacto: usuarios con sensibilidad al movimiento pueden recibir transiciones no deseadas.

Recomendación: capa global `@media (prefers-reduced-motion: reduce)` y utilidades para animaciones de módulos.

### FORM-001 [P1] Formularios importantes se renderizan o controlan desde JS/iframes

Evidencia: HTML estático de `app_integral/rsvp.html` no contiene formularios; RSVP se compone por JS. Invitaciones usa iframe. Configuración usa JS para estados de invitación.

Impacto: validación, errores, labels, estados de guardado y accesibilidad se vuelven inconsistentes si cada módulo los resuelve solo.

Recomendación: crear patrones compartidos de field, error, helper, empty, loading, dirty state y success.

### FORM-002 [P2] Falta un patrón visible de cambios no guardados

Evidencia: Mesas y RSVP manejan persistencia/sincronización en varias capas; no hay contrato UI global para cambios pendientes.

Impacto: el usuario puede no saber si una acción quedó guardada, aplicada o pendiente.

Recomendación: estado global por módulo: `guardado`, `guardando`, `error`, `sin conexión`, `cambios pendientes`.

### DATA-001 [P1] Invitados, RSVP y Mesas comparten datos pero no una experiencia unificada

Evidencia: `docs/ARCHITECTURE_GUESTS_RSVP_TABLES.md` y `docs/RSVP_CONTRACTS.md` documentan contratos distintos: invitados locales/canónicos, RSVP público, RSVP admin, mesas y Firestore.

Impacto: el usuario final piensa en personas, confirmaciones y mesas; la app puede exponer fragmentos técnicos de esa separación.

Recomendación: rediseñar alrededor de entidades visibles: Invitado, Grupo, Respuesta, Mesa, Estado.

### DATA-002 [P2] Errores y estados de sincronización deben ser más humanos

Evidencia: servicios y módulos manejan auth, Firestore, localStorage, postMessage y emulador/reglas. Esto exige copy claro.

Impacto: mensajes técnicos pueden generar desconfianza en acciones críticas.

Recomendación: guía de microcopy para errores recuperables, permisos, conexión, datos vacíos y acciones irreversibles.

### MOTION-001 [P2] Movimiento distribuido entre CSS, observers y timers

Evidencia: conteo JS detecta múltiples `addEventListener`, `MutationObserver`, `setTimeout` e `innerHTML` en módulos principales; `invitaciones/index.js` usa timers para resize/reveal.

Impacto: animaciones y transiciones pueden sentirse no deterministas o causar jank.

Recomendación: animar solo transform/opacity, usar eventos claros de entrada/salida y cancelar timers al desmontar.

### MOTION-002 [P3] Falta lenguaje de movimiento por intención

Evidencia: el design system pide motion con propósito, pero la implementación mezcla patching, overlays, iframe reveal y legacy transitions.

Impacto: el movimiento puede sentirse técnico en vez de explicar cambio espacial.

Recomendación: definir 4 intenciones: navegación, feedback, overlay y reordenamiento.

### TECHVIS-001 [P1] Legacy sigue en la ruta activa

Evidencia: `app_integral/applu.html` carga `css/legacy/applu-style-01.css` y `js/legacy/applu-script-01.js`.

Impacto: el rediseño puede quedar atrapado entre estilos nuevos y comportamiento heredado.

Recomendación: aislar la compatibilidad legacy y migrar módulo por módulo, sin superponer más capas.

### TECHVIS-002 [P1] Falta contrato de lifecycle para módulos

Evidencia: hay observadores, listeners, intervals, timers e iframes en módulos. La arquitectura de Mesas ya documenta falta de unmount.

Impacto: navegación repetida puede acumular listeners, estados o parches visuales.

Recomendación: estándar de módulo: `mount`, `unmount`, cleanup de listeners/timers/observers, estado inicial y errores.

### COMP-001 [P1] No hay una biblioteca de componentes de producto suficientemente ejecutable

Evidencia: `design-system/MASTER.md` es sólido como fuente conceptual, pero la app todavía mezcla CSS core, módulos, legacy y variantes locales.

Impacto: cada mejora se implementa desde cero y se multiplica la inconsistencia.

Recomendación: crear componentes mínimos antes de rediseñar módulos: AppShell, Sidebar/Nav, Topbar, PageHeader, Section, Card, Button, Tabs, Field, EmptyState, Toast, Modal, Table/List.

### PERF-001 [P2] Iframes y previews pueden afectar performance percibida

Evidencia: el módulo Invitaciones carga previews publicadas dentro de iframe y aplica lógica de resize/reveal.

Impacto: pantallas de administración pueden sentirse lentas o pesadas en móviles.

Recomendación: skeletons ligeros, carga diferida, botón claro de abrir en nueva pestaña y límites de preview.

## Auditoría por módulo

### Shell / Navegación / Auth

Fortalezas: estructura de app real con drawer, navegación de módulos, quick nav, workspace y overlay; separación `app_integral` documentada; intención de navegación contextual.

Riesgos: carga legacy en ruta principal, navegación duplicada, auth con labels débiles, dialog/drawer sin contrato visible de accesibilidad completo.

Recomendación Tarea 8: convertir shell en el primer entregable del rediseño, mantener rutas y módulos, consolidar navegación y definir estados globales de carga/error/offline/guardado/vacío.

### Dashboard / Home

Fortalezas: el módulo está declarado y el producto necesita esa superficie.

Riesgos: implementación actual placeholder; la home no resume progreso ni urgencias.

Recomendación Tarea 8: diseñar dashboard operativo, no landing: tareas, invitados, presupuesto, próximos hitos y accesos frecuentes.

### Invitaciones

Fortalezas: módulo más cercano a una experiencia completa; tiene selector, preview, acciones, simulación mobile y link externo.

Riesgos: iframe-heavy; timers/observers para sostener preview; puede mezclar QA técnico con decisión de diseño.

Recomendación: mantenerlo como módulo productivo, pero ordenar acciones y estados de carga/error.

### Invitados / RSVP Admin

Fortalezas: conecta con contratos reales y administra respuestas/sincronización.

Riesgos: mucha lógica crítica en una sola superficie; contratos sensibles (`ownerUid`, auth anónima, management docs) necesitan UX más explícita.

Recomendación: bandeja RSVP + lista de invitados + acciones claras de aplicar/ignorar/revisar.

### RSVP Público

Fortalezas: contrato documentado y protegido; auth anónima y `ownerUid` ya están definidos.

Riesgos: no cambiar contratos en rediseño; hay widget canónico y widget v2 no productivo.

Recomendación: Tarea 8 no debe tocar reglas ni contratos; solo puede proponer UI si está explícitamente dentro del alcance.

### Distribución / Mesas

Fortalezas: ruta activa y documentación técnica seria; módulo de alto valor para el usuario.

Riesgos: mayor deuda visual/responsive/lifecycle; muchas capas CSS/JS para una interacción compleja.

Recomendación: no maquillar. Rediseñar interacción por viewport.

### Configuración / Equipo

Fortalezas: existe flujo para invitar por email/rol y está conectado a servicios reales.

Riesgos: UX sensible con permisos y errores; dependencia legacy.

Recomendación: convertir en pantalla clara de equipo, permisos, invitaciones pendientes y estado.

## Auditoría responsive

Viewports objetivo según governance: 360, 390-430, 768, 1024, 1440.

Hallazgos:

- La app intenta cubrir responsive con `home-responsive.css`, pero ese archivo muestra mucha especificidad correctiva.
- Las superficies iframe y Mesas necesitan pruebas reales, no solo revisión estática.
- Mobile debe priorizar acciones secuenciales, listas y bottom/context nav; desktop puede mostrar paneles simultáneos.

Recomendación:

- 360/390: una columna, navegación compacta, acciones primarias visibles.
- 430: mobile amplio con mejor densidad.
- 768: tablet con panel contextual.
- 1024/1440: shell completo con navegación lateral y workspace amplio.

## Auditoría de accesibilidad

Riesgos principales:

- Foco visible no aparece como patrón transversal en CSS críticos.
- Inputs de auth usan placeholders como guía principal.
- Dialog/drawer necesita foco atrapado, escape, restore focus e inert.
- Iframes requieren títulos, estados y alternativa de abrir aparte.
- Movimiento reducido necesita contrato global.

Recomendaciones:

- Añadir checklist a cada módulo: labels, `aria-describedby`, foco visible, orden de tabulación, roles, errores, contraste y reduced motion.
- No aceptar nuevas pantallas sin estados keyboard-first.

## Auditoría visual

El sistema visual de `design-system/MASTER.md` es coherente: elegante, cálido, premium, personal y no genérico. El problema no es la dirección visual, sino la traducción a producto.

Riesgos: overrides visuales acumulados, demasiados contenedores y variantes locales, mezcla de legado y refinamientos.

Recomendación: construir un UI kit ejecutable dentro de `app_integral/css/core` y módulos nuevos; reducir tokens duplicados y limpiar por pantalla migrada.

## Auditoría de movimiento

Hallazgos:

- Hay timers, observers, iframe reveal y transiciones repartidas.
- El movimiento no parece tener todavía una taxonomía común.
- La prioridad debe ser estabilidad antes que sofisticación.

Recomendación:

- `fast`: 120-160ms para feedback.
- `base`: 180-240ms para navegación.
- `slow`: 280-360ms solo para overlays o cambios espaciales.
- Respetar `prefers-reduced-motion`.
- Cancelar timers/observers al desmontar módulos.

## Auditoría técnica visible

La deuda técnica que más se ve en UX/UI:

- Ruta principal todavía carga legacy.
- Módulos placeholder expuestos.
- CSS con alta especificidad.
- Iframes para preview.
- Lifecycle no uniforme.
- Estados globales fragmentados.

Esto no significa que la app esté mal encaminada. Significa que ya cruzó el punto donde conviene ordenar sistema antes de sumar pantallas.

## Recomendación para Tarea 8

Tipo recomendado: REDESIGN CONTROLADO.

Objetivo propuesto:

Rediseñar y estabilizar la experiencia base autenticada de Mi Gran Día sin cambiar contratos de datos, rutas públicas, reglas Firestore ni comportamiento RSVP. El entregable debe incluir shell, home/dashboard real, navegación unificada, componentes base, estados globales y una primera migración visual mínima de módulos productivos.

Alcance sugerido:

1. App shell y navegación: unificar drawer/quick nav/context bar, definir navegación mobile/tablet/desktop y mantener `data-module` y rutas actuales.
2. Dashboard operativo: próximos hitos, tareas pendientes, invitados/RSVP resumido, presupuesto resumido y accesos frecuentes.
3. Componentes base: Button, IconButton, Tabs, Field, Select, Toast, Modal, EmptyState, Card, Table/List, con estados focus/reduced-motion incluidos.
4. Estados globales: cargando, vacío, error, guardando, guardado, sin conexión o pendiente.
5. Hardening de lifecycle: contrato `mount/unmount` y cleanup de listeners, timers y observers.

Fuera de alcance recomendado para Tarea 8:

- Cambiar Firestore Rules.
- Cambiar contratos RSVP.
- Cambiar storage keys.
- Cambiar deploy/Firebase hosting.
- Reescribir Mesas completo.
- Reescribir invitaciones públicas.

## Criterios de aceptación sugeridos para Tarea 8

- La ruta principal sigue funcionando desde `app_integral/applu.html`.
- No hay regresiones en `npm run validate`.
- Firestore tests siguen pasando.
- Los módulos placeholder no se presentan como pantallas rotas.
- Viewports 360, 390, 430, 768, 1024 y 1440 tienen layout definido.
- Foco visible existe en controles principales.
- `prefers-reduced-motion` está cubierto.
- No se agregan dependencias de pago ni billing.
- No se despliega sin instrucción explícita.

## Estado de validación

Validaciones previstas para esta auditoría:

- `npm run validate`
- `npm run test:firestore` si el entorno local tiene Node/npm/Firebase/Java disponibles.
- Estado de checks remotos del commit final de la rama.

Nota local: el snapshot usado para auditoría excluyó archivos grandes y binarios; por eso una ejecución local de `npm run validate` sobre ese snapshot puede reportar referencias faltantes que no corresponden al árbol remoto completo. La verificación de regresión de esta rama debe hacerse sobre el PR/commit remoto completo.

## Declaración de no cambios de producto

Esta auditoría no modifica:

- HTML de producto.
- CSS de producto.
- JS de producto.
- Firestore Rules.
- Firebase config.
- Rutas públicas.
- Contratos RSVP.
- Storage keys.
- Assets.
- Deploy.

Único cambio esperado en rama: `docs/UX_UI_AUDIT.md`.
