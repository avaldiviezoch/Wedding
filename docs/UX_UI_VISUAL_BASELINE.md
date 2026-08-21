# Tarea 7A - Baseline visual e interactivo de Mi Gran Dia

Estado: REDESIGN - VISUAL BASELINE / NO IMPLEMENTATION

Fecha: 2026-08-21

Rama: `design/task-7a-visual-baseline`

Base: `main` en `b83a565e66047a9a7e6e551e1888902917fda7a9`

Relacion con Tarea 7: este baseline usa `docs/UX_UI_AUDIT.md` de `design/task-7-ux-ui-audit` como mapa de hipotesis. No modifica ese documento, no mergea la Tarea 7 y no inicia Tarea 8.

## Declaracion de alcance

Esta tarea es de observacion, evidencia y preparacion. No implementa rediseño.

No se modifican:

- HTML de producto.
- CSS de producto.
- JavaScript de producto.
- Firebase config.
- Firestore Rules.
- Contratos RSVP.
- Storage keys.
- Rutas publicas.
- Assets.
- Deploy.

Cambios esperados: documentacion y evidencia segura. Las capturas usadas para analisis se generaron localmente y no se versionan para evitar ruido de repositorio y riesgo de datos visuales sensibles.

## Skills aplicadas

- `wedding-governance`: limites de seguridad, preservacion de rutas, datos, contratos y comportamiento existente.
- `wedding-ui-review`: revision visual, responsive, accesibilidad, foco, estados, formularios y navegacion.
- `wedding-visual-polish`: lectura de calidad visual, jerarquia, ruido, coherencia y elementos a conservar.
- `wedding-motion-review`: revision de movimiento, interrupcion, performance y `prefers-reduced-motion`.
- `wedding-engineering`: trazado de rutas reales, verificacion proporcional y separacion entre hipotesis y evidencia observada.

## Metodologia

Se ejecuto una inspeccion con navegador headless sobre GitHub Pages en contexto limpio, sin credenciales y sin escribir datos. La revision priorizo superficies publicas o estados seguros de entrada.

Viewports revisados:

- 360 x 780
- 390 x 844
- 430 x 932
- 768 x 1024
- 1024 x 768
- 1440 x 900

Tambien se ejecuto una pasada representativa con `prefers-reduced-motion: reduce`.

Superficies inspeccionadas:

- Shell raiz: `https://avaldiviezoch.github.io/Wedding/applu.html`
- Shell integral: `https://avaldiviezoch.github.io/Wedding/app_integral/applu.html`
- RSVP publico sin token: `https://avaldiviezoch.github.io/Wedding/rsvp.html`
- Panel de invitaciones: `https://avaldiviezoch.github.io/Wedding/panel_invitaciones.html`
- Invitacion publica: `https://avaldiviezoch.github.io/Wedding/invitacion.html`

Superficies declaradas por alcance pero no recorridas con datos reales:

- Dashboard/Home autenticado.
- Invitados/RSVP admin autenticado.
- Distribucion/Mesas autenticado.
- Configuracion/Equipo autenticado.

Motivo: requieren sesion y/o datos controlados. No se usaron credenciales reales ni se escribio en Firebase. Su baseline queda como pendiente de prueba con entorno controlado.

## Matriz de superficies

| Superficie | Estado observado | Cobertura 7A | Resultado |
| --- | --- | --- | --- |
| Shell `applu.html` | Carga fondo cinematico y boton de menu en sesion limpia | 360, 390, 430, 768, 1024, 1440 | Sin overflow horizontal; requiere interaccion para auth |
| Shell `app_integral/applu.html` | Mismo comportamiento que raiz; auth aparece al abrir menu | 360, 390, 430, 768, 1024, 1440 | Estado inicial visualmente limpio, pero silencioso |
| Auth | Dialog de inicio de sesion visible al abrir menu | 390 interactivo | Foco inicial correcto en boton menu; varios controles visibles sin texto accesible completo |
| RSVP publico sin token | Estado de error: "No pudimos abrir este RSVP" | 360, 390, 430, 768, 1024, 1440 | Error seguro y sin overflow |
| Panel invitaciones | Panel de trabajo con botones, preview y contenido embebido | 360, 390, 430, 768, 1024, 1440 | Carga contenido, pero reporta multiples fallos de recursos/red |
| Invitacion publica | Intro 2D/ilustrada con sobre, texto y CTA | 360, 390, 430, 768, 1024, 1440 | Carga limpia, sin errores de consola/red observados |
| Dashboard/Home autenticado | No accesible sin sesion controlada | Pendiente | Debe verificarse antes de Tarea 8 |
| Invitados/RSVP admin | No accesible sin sesion controlada | Pendiente | Debe verificarse con dataset de prueba |
| Distribucion/Mesas | No accesible sin sesion controlada | Pendiente | Debe verificarse con invitados/mesas de prueba |
| Configuracion/Equipo | No accesible sin sesion controlada | Pendiente | Debe verificarse con roles/invitaciones de prueba |

## Evidencia tecnica resumida

### Shell raiz e integral

- Titulo: `Planificador de bodas`.
- Tiempo de carga DOM observado: aproximadamente 640 ms a 1.56 s segun viewport/ruta.
- Overflow horizontal: no observado en los seis viewports.
- Requests fallidos: 1 por pasada en contexto limpio.
- Consola: sin errores/warnings relevantes en las pasadas automaticas.
- Texto visible inicial: vacio hasta interaccion.
- Controles visibles iniciales: `Abrir menu` y controles sin texto visible asociados al overlay/shell.

Lectura UX: el estado inicial se siente atmosferico y premium, pero tambien mudo. Si la intencion es que el usuario abra menu para autenticarse, hace falta validar que esa accion sea obvia y accesible en todos los dispositivos.

### Auth interactivo

Al abrir menu en 390 px aparece el panel:

- Titulo: `Tu boda, siempre contigo`.
- Copy: `Inicia sesion para abrir el planificador y guardar tus cambios en la nube.`
- Acciones: `Continuar con Google`, `Ingresar`, `Crear cuenta`, `Cancelar`.
- Inputs: correo electronico y contrasena con placeholders.
- Primer `Tab`: cae en `Abrir menu`.
- Observacion accesible: se detectan elementos interactivos visibles sin texto/aria completo antes o alrededor del dialog.

Lectura UX: la pieza visual es fuerte y coherente con la marca. El riesgo esta en labels persistentes, foco dentro de dialog, controles sin nombre accesible y cierre/restauracion de foco.

### RSVP publico sin token

- Titulo: `Confirmar asistencia · Mi Gran Dia`.
- Mensaje visible: `No pudimos abrir este RSVP` y `El enlace de confirmacion no es valido.`
- Sin overflow horizontal.
- Sin requests fallidos.
- Consola: 1 mensaje por pasada.

Lectura UX: el estado de error es sobrio y seguro. Antes de rediseño conviene verificar el RSVP valido con token de prueba para revisar formulario real, errores, guardado, auth anonima y feedback.

### Panel de invitaciones

- Titulo: `Panel de invitaciones | Antonio & Lucero`.
- Contenido visible: `Antonio & Lucero · Invitaciones`, `Panel de trabajo integrado a App LU`, `5 modelos consolidados`, `Invitacion 5 principal`.
- Acciones visibles: `Volver a App LU`, `5 en paralelo`, `2 columnas`, `Silenciar`, `Recargar todas`.
- Overflow horizontal: no observado.
- Requests fallidos: entre 37 y 47 segun viewport.
- Responses 4xx: entre 3 y 7 segun viewport.
- Consola: entre 3 y 7 mensajes segun viewport.

Lectura UX: es una herramienta util para QA/comparacion, pero su baseline confirma que el preview compite con la experiencia de producto y depende de muchos recursos embebidos. Debe tratarse como superficie tecnica de revision, no como experiencia final del invitado.

### Invitacion publica

- Titulo: `Antonio & Lucero`.
- Texto visible inicial: `TIENES UNA INVITACION`, `muy especial`, `Antonio y Lucero`, `ABRIR INVITACION`, `TOCA EL SOBRE PARA ABRIR`.
- Acciones en DOM: `COMO LLEGAR`, `VER MAPA`, `CONFIRMAR POR WHATSAPP`.
- Sin overflow horizontal observado.
- Sin requests fallidos.
- Sin errores de consola observados.
- Con `prefers-reduced-motion: reduce`, la pagina sigue cargando.

Lectura UX: es la superficie mas estable de la muestra publica. La intro actual es 2D/ilustrada y funciona como identidad romantica. Si luego se trabaja una intro 3D realista, debe hacerse como experimento aislado y no mezclarse aun con esta invitacion.

## Hallazgos validados contra Tarea 7

| ID Tarea 7 | Validacion 7A | Estado |
| --- | --- | --- |
| UX-001 Home no opera como centro | No validado con sesion; shell inicial no muestra home en contexto limpio | Pendiente con entorno autenticado |
| UX-002 Navegacion duplicada | Menu/auth observados; navegacion autenticada pendiente | Parcial |
| UX-003 Modulos prometidos/incompletos | No validado en sesion; sigue siendo riesgo arquitectonico documentado | Pendiente |
| UX-004 Preview de invitaciones compite | Panel observado; multiples fallos de recursos y preview embebido | Validado |
| UX-005 RSVP/Invitados critico | RSVP sin token observado; admin pendiente | Parcial |
| UX-006 Mesas complejo | No accesible sin datos/sesion; riesgo sigue abierto | Pendiente |
| UX-007 Configuracion/equipo sensible | No accesible sin sesion | Pendiente |
| UI-001 CSS con overrides | No recontado en 7A; se conserva como hallazgo estatico de Tarea 7 | Heredado |
| UI-002 Variantes de acciones | Auth, panel e invitacion muestran vocabularios distintos | Validado parcial |
| UI-003 Identidad no uniforme | Invitacion, panel y auth tienen calidades visuales diferentes | Validado parcial |
| RESP-001 Responsive por parches | No hubo overflow en publicas; falta autenticado | Parcial |
| RESP-002 Mesas mayor riesgo responsive | Pendiente con datos reales | Pendiente |
| RESP-003 Preview no reemplaza pruebas reales | Panel observado confirma dependencia iframe/recursos | Validado |
| A11Y-001 Foco visible insuficiente | Primer Tab observado; nombres accesibles incompletos en controles | Validado parcial |
| A11Y-002 Auth usa placeholders | Observado en dialog | Validado |
| A11Y-003 Modales/drawers requieren contrato foco | Dialog observado; focus trap/restauracion no completamente verificados | Parcial |
| A11Y-004 Reduced motion global | Paginas cargan con reduce; falta verificacion completa de animaciones | Parcial |
| FORM-001 Formularios desde JS/iframes | Auth observado; RSVP valido/admin pendiente | Parcial |
| FORM-002 Cambios no guardados | No validado sin sesion | Pendiente |
| DATA-001 Entidades compartidas | No validado visualmente sin datos | Pendiente |
| DATA-002 Errores humanos | RSVP sin token usa copy humano y claro | Validado parcial |
| MOTION-001 Movimiento distribuido | Invitacion y panel requieren prueba manual de animacion; no se observo bloqueo | Parcial |
| MOTION-002 Lenguaje de movimiento | Pendiente de rediseño, no implementable en 7A | Pendiente |
| TECHVIS-001 Legacy en ruta activa | No modificado; riesgo heredado de Tarea 7 | Heredado |
| TECHVIS-002 Lifecycle modulos | No validado interactivamente | Pendiente |
| COMP-001 Falta UI kit ejecutable | Evidente por vocabularios distintos entre superficies | Validado parcial |
| PERF-001 Iframes/previews afectan percepcion | Panel con multiples recursos fallidos lo refuerza | Validado |

## Nuevos hallazgos 7A

### 7A-VIS-001 [P1] Estado inicial del shell en sesion limpia es visualmente atractivo pero poco comunicativo

Evidencia: en `applu.html` y `app_integral/applu.html`, el primer render muestra fondo cinematico oscuro y boton de menu. El texto visible del body queda vacio hasta interaccion.

Impacto: una persona nueva puede no entender que debe abrir el menu para iniciar sesion. El producto puede sentirse elegante, pero demasiado cerrado.

Recomendacion para rediseño: mantener la atmosfera premium, pero agregar orientacion minima y accion primaria clara sin convertirlo en landing generica.

### 7A-A11Y-001 [P1] Hay controles visibles sin nombre accesible claro alrededor del auth/shell

Evidencia: la sonda detecto varios controles visibles con dimensiones reales pero sin texto/aria antes o junto al dialog.

Impacto: lectores de pantalla y navegacion por teclado pueden encontrar controles mudos.

Recomendacion: auditar botones icon-only, campos y affordances generados por legacy/auth; exigir `aria-label` o texto accesible.

### 7A-NET-001 [P1] El panel de invitaciones carga con multiples fallos de recursos en GitHub Pages

Evidencia: entre 37 y 47 requests fallidos y entre 3 y 7 respuestas 4xx segun viewport.

Impacto: el panel puede verse correcto a primera vista, pero su confiabilidad como herramienta de QA visual esta comprometida.

Recomendacion: antes de usarlo como base para decisiones de rediseño, limpiar rutas/recursos o separar preview tecnica de experiencia final.

### 7A-ERR-001 [P2] El RSVP sin token tiene buen copy, pero falta baseline de RSVP valido

Evidencia: sin token muestra `No pudimos abrir este RSVP` y no rompe layout.

Impacto: el estado de error esta cubierto, pero no se sabe aun si formulario real, guardado, validacion, teclado y movimiento cumplen.

Recomendacion: crear URL/dataset de prueba no productivo para verificar RSVP valido antes de tocar UI publica.

### 7A-MOTION-001 [P2] Reduced motion fue smoke-tested, no auditado en flujo completo

Evidencia: las paginas cargaron con `prefers-reduced-motion: reduce`, pero no se ejecuto interaccion completa de abrir invitacion, previews, modales y cambios de modulo.

Impacto: no hay bloqueo, pero tampoco garantia de cumplimiento.

Recomendacion: Tarea de rediseño debe incluir checklist de movimiento con interacciones reales y capturas comparativas.

## Problemas UX observados

- El shell inicial no comunica siguiente paso salvo el boton de menu.
- La autenticacion aparece solo tras interaccion; no queda claro si es un portal, landing o app bloqueada.
- El panel de invitaciones mezcla herramienta interna, preview y controles tecnicos en una sola pantalla.
- RSVP sin token es claro, pero no ofrece accion alternativa; esto puede estar bien por seguridad, pero debe decidirse conscientemente.
- El producto autenticado no puede validarse sin entorno de prueba; esto es un riesgo para iniciar rediseño sin baseline real.

## Problemas UI observados

- Diferencia marcada entre lenguaje visual del shell/auth, panel de invitaciones e invitacion publica.
- Panel de invitaciones es funcional, pero visualmente mas tecnico que premium.
- Auth tiene buena direccion visual, aunque necesita revisar contraste/foco/labels.
- Invitacion publica tiene composicion romantica consistente; no debe perderse su sensibilidad visual en el rediseño.
- Los controles icon-only o sin texto visible necesitan normalizacion accesible.

## Responsive

Resultado observado en superficies publicas/seguras:

- No se detecto overflow horizontal en 360, 390, 430, 768, 1024 ni 1440.
- La invitacion publica mantiene composicion en mobile.
- El panel de invitaciones mantiene ancho, pero su densidad de controles y preview requiere prueba manual en tablet/desktop.
- Auth en 390 tiene jerarquia legible, aunque debe verificarse altura, teclado virtual y errores.
- Las superficies autenticadas siguen pendientes.

## Accesibilidad

Validado:

- El boton `Abrir menu` tiene nombre accesible.
- El primer Tab en shell limpio llega a `Abrir menu`.
- El RSVP sin token tiene texto visible claro.

Pendiente o riesgo:

- Labels persistentes en auth.
- Nombres accesibles de controles sin texto.
- Focus trap en dialog.
- Escape/cierre/restauracion de foco.
- Inert del contenido de fondo.
- Orden de tabulacion dentro del dialog.
- Estados de error asociados por `aria-describedby`.
- Iframes con titulo y alternativa clara.

## Motion

Validado:

- Las superficies smoke-tested cargan con `prefers-reduced-motion: reduce`.
- No se observaron bloqueos por movimiento en carga inicial.

Pendiente:

- Apertura/cierre de auth.
- Apertura real de invitacion.
- Cambios de preview en panel de invitaciones.
- Navegacion entre modulos autenticados.
- Asignacion o reordenamiento en Mesas.
- Feedback de guardado/error.

Criterio para preservar: movimiento debe explicar cambio de estado o espacio; no debe ser decoracion ni cubrir latencia.

## Rendimiento percibido y red

- Shell: carga DOM rapida; estado visual se percibe inmediato.
- RSVP sin token: carga rapida y estable.
- Invitacion publica: carga limpia y sin errores observados.
- Panel de invitaciones: carga DOM rapida, pero con muchos recursos fallidos; esto degrada confianza y puede afectar previews.

## Elementos a conservar

- Atmosfera premium/cinematica del shell, siempre que se le agregue orientacion funcional.
- Tono humano del auth: `Tu boda, siempre contigo` esta alineado con marca.
- Jerarquia romantica de la invitacion publica.
- Paleta calida y editorial definida por el design system.
- CTA claro de abrir invitacion.
- Estado de error simple y seguro del RSVP sin token.
- Panel de invitaciones como herramienta interna de comparacion, no como interfaz final.
- Separacion entre rutas publicas y app autenticada.
- Contratos RSVP y Firestore existentes.
- No usar estetica generica de SaaS/IA para reemplazar la identidad actual.

## Recomendaciones por modulo

### Shell / Auth

- Convertir el primer render en un acceso claro a la app sin perder atmosfera.
- Revisar foco, dialog, labels, `aria-label`, Escape y restauracion de foco.
- Unificar boton menu, auth y estados globales como primera pieza del rediseño.

### Dashboard/Home

- Requiere baseline con sesion controlada antes de rediseñar.
- Debe convertirse en centro operativo, no landing.
- Debe resumir tareas, invitados/RSVP, presupuesto, hitos y accesos frecuentes.

### Invitaciones

- Separar preview tecnico de experiencia final.
- Resolver fallos de recursos antes de usar el panel como evidencia visual definitiva.
- Mantener prueba por links reales y viewports reales.

### Invitados / RSVP Admin

- Crear baseline con dataset de prueba.
- Revisar bandeja de respuestas, aplicar/sincronizar, filtros, errores y estados de guardado.
- No tocar contratos `ownerUid` ni auth anonima en una tarea visual.

### RSVP publico

- Mantener el estado de error seguro.
- Probar RSVP valido con token de prueba antes de cambios visuales.
- Revisar labels, confirmacion, errores, musica y feedback de guardado.

### Distribucion / Mesas

- No iniciar rediseño sin prueba real en 360/390/430/768/1024/1440.
- Validar interacciones tactiles y alternativas sin drag.
- Priorizar guardado visible, conflictos y estados de asignacion.

### Configuracion / Equipo

- Probar con roles/invitaciones de prueba.
- Revisar copy de permisos, errores de email, invitaciones pendientes y estados de envio.
- Mantener restricciones de seguridad y no tocar reglas.

## Recomendaciones para Tarea 8

Antes de implementar Tarea 8:

1. Usar este baseline y `docs/UX_UI_AUDIT.md` como entrada conjunta.
2. Crear entorno/dataset controlado para app autenticada.
3. Repetir baseline en Dashboard, Invitados/RSVP admin, Mesas y Configuracion.
4. Definir alcance de rediseño: shell + dashboard + componentes base primero.
5. No tocar Firestore Rules, contratos RSVP, storage keys, deploy ni rutas publicas sin instruccion explicita.
6. No iniciar por color/polish aislado; empezar por estructura, estados y componentes.
7. Mantener invitacion publica actual como referencia de sensibilidad visual.
8. Tratar la intro 3D del sobre como prototipo aislado, no como parte automatica de Tarea 8.

## Criterios de aceptacion para cerrar 7A

- Rama creada desde `main`: `design/task-7a-visual-baseline`.
- Documentacion docs-only.
- `docs/UX_UI_AUDIT.md` no modificado.
- No merge.
- No inicio de Tarea 8.
- No cambios de producto.
- Viewports 360, 390, 430, 768, 1024 y 1440 revisados en superficies seguras.
- Superficies autenticadas marcadas como pendientes con motivo.
- Elementos a conservar documentados.
- Riesgos de UX/UI/responsive/accesibilidad/motion documentados.
- PR draft creado para revision.
- Validacion de repositorio ejecutada por CI del PR.
