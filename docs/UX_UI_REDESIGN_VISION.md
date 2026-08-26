# Tarea 8 - Nueva vision UX/UI de Mi Gran Dia

Estado: REDESIGN - DESIGN EXPLORATION / DESIGN SYSTEM / PROTOTYPE
Fecha: 2026-08-21
Rama: `design/task-8-redesign-vision`
Base: `main` despues de Tarea 7B (`9b39a333f4f88bddb9f420cda04a142922ede2b6`)

## Alcance

Esta tarea abre la fase de vision y prototipo controlado. No migra modulos productivos, no cambia HTML/CSS/JS de produccion, no toca Firebase, no cambia Firestore Rules, no modifica contratos RSVP, no cambia datos, no cambia rutas publicas, no agrega dependencias y no despliega.

Entregables:

- vision UX/UI para rediseño controlado;
- comparacion de tres direcciones visuales;
- sistema de diseno V2 propuesto;
- prototipo aislado con datos mock en `prototypes/task-8-redesign-vision/`;
- recomendacion para una futura implementacion incremental.

## Fuentes revisadas

- `AGENTS.md`
- `.agents/skills/wedding-governance/SKILL.md`
- `.agents/skills/wedding-ui-review/SKILL.md`
- `.agents/skills/wedding-visual-polish/SKILL.md`
- `.agents/skills/wedding-motion-review/SKILL.md`
- `.agents/skills/wedding-engineering/SKILL.md`
- `design-system/MASTER.md`
- `docs/UX_UI_AUDIT.md`
- `docs/UX_UI_VISUAL_BASELINE.md`
- `docs/UX_UI_PRE_REDESIGN_GATE.md`
- `docs/UX_UI_PRE_REDESIGN_HARDENING.md`
- `app_integral/ARCHITECTURE.md`
- `docs/ARCHITECTURE_GUESTS_RSVP_TABLES.md`
- `docs/RSVP_CONTRACTS.md`
- `docs/ROOT_COMPATIBILITY.md`

## Skills aplicadas

- `wedding-governance`: frontera de seguridad, datos, Firebase, rutas publicas, RSVP y deploy.
- `wedding-ui-review`: jerarquia, responsive, accesibilidad, estados y navegacion.
- `wedding-visual-polish`: calidad visual, tono premium, reduccion de ruido y anti generico.
- `wedding-motion-review`: movimiento por intencion, interrupcion y reduced motion.
- `wedding-engineering`: lectura de contratos, riesgos y transicion incremental.

## Diagnostico consolidado

Mi Gran Dia ya tiene una identidad romantica y premium valiosa, pero la experiencia autenticada esta partida entre shell, legacy, iframes, modulos productivos y modulos placeholder. La oportunidad de Tarea 8 no es cambiar colores: es darle a la pareja una cabina clara de operacion, con lenguaje visual calido, componentes repetibles y estados confiables.

Los P1 estructurales que siguen abiertos despues de 7B son:

- Home/dashboard no opera todavia como centro de decision.
- Navegacion duplicada entre drawer, quick nav, contexto y legacy.
- Modulos placeholder visibles o prometidos sin pantalla real.
- RSVP/Invitados concentra flujos sensibles y necesita una experiencia administrativa mas clara.
- Mesas/Distribucion tiene alto riesgo responsive, lifecycle y persistencia local.
- Cascada CSS dominada por overrides y `!important`.
- Responsive resuelto por parches en vez de layouts base.
- Lifecycle incompleto para modulos con listeners, observers, timers e iframes.
- Legacy sigue en la ruta activa.
- Falta una biblioteca ejecutable de componentes de producto.

## Principios de rediseño

1. App primero, no landing: el primer viewport autenticado debe resolver orientacion y accion.
2. Calidez operativa: romantico y humano, pero apto para trabajo repetido.
3. Una decision visible por pantalla: menos paneles compitiendo, mas jerarquia.
4. Datos sensibles intactos: UI puede cambiar; contratos no.
5. Mobile no es desktop comprimido: Mesas e Invitados necesitan flujos por lista y acciones explicitas.
6. Estados como producto: loading, empty, saving, saved, error, offline y pending deben ser componentes reales.
7. Movimiento explica cambios: navegacion, overlays, feedback y reordenamiento; nunca decoracion gratuita.
8. Redisenar por frontera: shell y dashboard primero; RSVP/Mesas solo con dataset controlado.

## Direccion A - Editorial Elegante

Idea: una app sobria, calida y editorial. Prioriza amplitud, tipografia serena, superficies blancas/calidas, acentos oliva y rose, y una sensacion de agenda privada de boda.

Fortalezas:

- Mejor continuidad con `design-system/MASTER.md`.
- Conserva la sensibilidad romantica de la invitacion publica.
- Reduce el riesgo de verse como SaaS generico.
- Buena para dashboard, invitaciones y configuracion.

Riesgos:

- Puede quedar demasiado suave para tareas densas si no se controla la jerarquia.
- Mesas y RSVP admin necesitan densidad operativa adicional.

Uso recomendado: base visual principal de producto.

## Direccion B - Calm Command Center

Idea: un centro de mando calmo para planificacion. Usa mayor densidad, columnas estables, listas escaneables, estados fuertes y una barra lateral mas funcional.

Fortalezas:

- Excelente para Dashboard, Invitados, RSVP admin y Mesas.
- Hace visible progreso, pendientes y riesgos.
- Reduce ambiguedad de navegacion.

Riesgos:

- Puede sentirse demasiado administrativo si pierde calidez.
- Requiere buen microcopy para no volverse tecnico.

Uso recomendado: estructura de informacion y comportamiento para flujos criticos.

## Direccion C - Celebration OS

Idea: una capa mas expresiva y celebratoria, con momentos de emocion controlados, fondos editoriales suaves, hitos visibles y feedback mas memorable.

Fortalezas:

- Refuerza el caracter de boda, celebracion y acompanamiento.
- Puede hacer mas agradable el avance de checklist, invitaciones e hitos.

Riesgos:

- Alto riesgo de caer en decoracion o estetica AI generica si se exagera.
- Menos adecuada para Mesas, RSVP admin y tareas repetitivas.

Uso recomendado: micro-momentos y estados de celebracion, no como estructura completa.

## Comparacion

| Criterio | A Editorial Elegante | B Calm Command Center | C Celebration OS |
| --- | --- | --- | --- |
| Identidad premium | Alta | Media/alta | Alta si se dosifica |
| Operacion diaria | Media | Alta | Media |
| Riesgo de SaaS generico | Bajo | Medio | Medio |
| Riesgo decorativo | Bajo | Bajo | Alto |
| Dashboard | Alto | Alto | Medio |
| Invitados/RSVP admin | Medio | Alto | Medio |
| Mesas | Medio | Alto | Bajo/medio |
| Invitaciones | Alto | Medio | Alto |
| Implementacion incremental | Alta | Alta | Media |

## Recomendacion

Adoptar un hibrido: A como lenguaje visual base, B como arquitectura funcional y C solo para momentos emocionales acotados.

Nombre de direccion recomendada: `Editorial Command`.

Traduccion practica:

- Shell y Dashboard: A + B.
- Invitados/RSVP admin: B con tono A.
- Mesas: B con controles tactiles y estados claros.
- Invitaciones: A con herramientas tecnicas mas discretas.
- Celebraciones: C solo para hitos, guardado exitoso o progreso completado.

## Propuesta de experiencia

### Primer render autenticado

Debe mostrar:

- nombre de la boda activa;
- estado de planificacion;
- proximo hito;
- pendientes criticos;
- accesos a Invitados, RSVP, Mesas e Invitaciones;
- estado de sincronizacion o guardado.

No debe parecer landing ni portada decorativa.

### Navegacion desktop

- Sidebar persistente con grupos claros: Plan, Invitados, Celebracion, Gestion.
- Header contextual por modulo con titulo, estado y accion primaria.
- Workspace de una o dos columnas segun densidad.
- Quick actions solo como accesos frecuentes, no como segunda navegacion paralela.

### Navegacion mobile

- Topbar compacta con boda activa y estado.
- Navegacion inferior o tabs compactos para modulos principales.
- Acciones locales dentro de cada pantalla.
- Mesas por lista/asignacion, no canvas obligatorio.

### Dashboard/Home

- Panel de hoy: siguiente decision y accion primaria.
- Salud de la boda: invitados, RSVP, presupuesto, checklist y mesas.
- Bandeja de pendientes: respuestas por revisar, invitados sin mesa, pagos o tareas.
- Accesos frecuentes: Invitados, RSVP, Mesas, Invitaciones.
- Estados: empty, error, offline, saving/saved.

### Invitados/RSVP admin

- Vista por entidades visibles: Invitado, Grupo, Respuesta, Estado.
- Bandeja RSVP con filtros y conflictos.
- Acciones reversibles: aplicar, revisar, ignorar, vincular.
- Guardado y ultima sincronizacion visibles.
- No tocar `ownerUid`, Anonymous Auth, rutas ni Rules.

### Mesas/Distribucion

- Desktop/tablet: tablero con lista lateral y lienzo.
- Mobile: asignacion por lista, filtros, chips de mesa y confirmaciones explicitas.
- Estados de conflicto: sobrecapacidad, invitado sin mesa, duplicado.
- No tocar geometria, IDs, storage keys ni bridges hasta tener tests controlados.

### Invitaciones

- Mantener links reales como verdad de QA.
- Preview embebido como apoyo, con estado de carga/error y boton abrir aparte.
- No convertir el panel tecnico en experiencia final del invitado.
- El experimento de sobre 3D debe seguir aislado hasta aprobarlo.

### Auth/Shell publico

- Conservar atmosfera premium.
- Agregar orientacion minima y accion clara sin hacerlo landing generica.
- Mantener labels, focus trap, Escape y restore focus de 7B.
- Futuro: helper comun de overlays con inert.

## Estados necesarios

- `loading`: skeleton discreto, no spinner dominante.
- `empty`: explica que falta y ofrece siguiente accion.
- `saving`: bloquea solo la accion relevante, no toda la pantalla.
- `saved`: confirmacion breve con timestamp humano.
- `error`: mensaje humano, accion de recuperar, detalle tecnico colapsado si hace falta.
- `offline`: banner sobrio con que se conserva localmente si aplica.
- `permission denied`: explica rol/permisos sin sugerir cambio de Rules.
- `pending`: muestra datos por revisar antes de aplicar.

## Accesibilidad y responsive

Requisitos no negociables para cualquier implementacion futura:

- foco visible en todos los controles;
- labels persistentes;
- `aria-describedby` para errores y helpers;
- dialogs con foco inicial, trap, Escape, restore focus e inert;
- objetivos tactiles minimos de 44px;
- no depender solo de color;
- `prefers-reduced-motion` global;
- validacion en 360, 390, 430, 768, 1024 y 1440;
- sin overflow horizontal escondido artificialmente.

## Motion

Taxonomia propuesta:

- Navegacion: transiciones discretas de contexto, transform/opacity.
- Feedback: microrespuesta inmediata en botones, guardado y errores.
- Overlay: entrada/salida espacial con foco claro.
- Reordenamiento: solo donde explique movimiento de elementos.

Reduced motion: cambios instantaneos o fade minimo, sin desplazamientos largos ni loops.

## Anti-AI / Anti generico

Evitar:

- gradientes morados/azules dominantes;
- glassmorphism excesivo;
- tarjetas flotantes sin funcion;
- iconografia generica de startup;
- copy tecnico o grandilocuente;
- decoracion que no responda a una decision de usuario;
- un dashboard que parezca landing comercial.

Buscar:

- tonos oliva, ink, blanco calido, rose y acentos sobrios;
- tipografia editorial solo para momentos de identidad, no para tablas;
- textura sutil y real cuando aporte calidez;
- microcopy humano y especifico;
- densidad tranquila, escaneable y estable.

## Plan de migracion recomendado

1. Validar el prototipo aislado y elegir direccion `Editorial Command` o ajustar.
2. Crear en una tarea posterior una rama de implementacion limitada a shell/dashboard/componentes base.
3. Introducir namespace o capa de rediseño sin romper legacy (`body.mgd-redesign` o equivalente).
4. Implementar componentes base y estados sin tocar datos.
5. Migrar Dashboard/Home real.
6. Revisar Invitados/RSVP admin con dataset controlado.
7. Revisar Mesas con pruebas tactiles y round-trip de persistencia.
8. Recién despues evaluar RSVP publico o invitaciones publicas, con alcance explicito.

## Riesgos

- El rediseño puede quedarse en estetica si no se estabiliza navegacion y estados.
- Mesas puede romperse si se cambia layout sin entender geometria/bridges.
- RSVP puede romper seguridad si se toca contrato visual y datos a la vez.
- La cascada CSS puede crecer si no se usa una frontera clara.
- Sin dataset controlado, la app autenticada no se puede validar completamente.

## Decision requerida antes de implementar producto

Aprobar una direccion visual/estructural para Tarea 9 o equivalente:

- Recomendado: `Editorial Command`.
- Alternativa: A pura si se prioriza sensibilidad visual.
- Alternativa: B pura si se prioriza operacion densa.
- No recomendado: C como base completa.

## Declaracion de no cambios productivos

Esta tarea no modifica:

- `app_integral/applu.html`;
- CSS productivo;
- JS productivo;
- Firebase config;
- Firestore Rules;
- contratos RSVP;
- rutas publicas;
- storage keys;
- datos reales;
- assets productivos;
- deploy.
