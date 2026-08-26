# Design System V2 - Mi Gran Dia

Estado: PRODUCTIVE FOUNDATION IMPLEMENTED — MODULE MIGRATION NOT STARTED
Fecha: 2026-08-21
Rama base: `design/task-8-redesign-vision`
Rama de validacion final: `design/task-8a-editorial-command-validation`

## Proposito

Design System V2 traduce `design-system/MASTER.md` a una propuesta ejecutable para el redisenio controlado de Mi Gran Dia. Este documento no cambia produccion; define lenguaje, tokens, componentes, estados, responsive, accesibilidad y motion para una implementacion futura.

Direccion aprobada: `Editorial Command`.

La foundation productiva aislada está en `app_integral/css/v2/mgd-v2.css`; solo actúa dentro de `body.mgd-v2`. Inventario, uso y límites: `docs/DESIGN_SYSTEM_V2_IMPLEMENTATION.md`.

## Lock de dirección de arte 9A

La definición visual se congela en `docs/EDITORIAL_COMMAND_ART_DIRECTION.md` (2026-08-26). Ese documento refina la firma visual, densidad, superficies, navegación, estados, motion, accesibilidad y estrategia CSS sin cambiar producto. La congelación no autoriza una implementación automática ni cambios de Firebase, Firestore, RSVP, Mesas, rutas, datos o deploy.

## Validacion final 8A

La direccion `Editorial Command` queda aprobada para una implementacion futura y separada. La aprobacion es visual, de sistema y de estrategia CSS; no autoriza cambios productivos automaticos.

Documento de validacion: `docs/UX_UI_EDITORIAL_COMMAND_VALIDATION.md`.

Prototipo aislado: `prototypes/task-8a-editorial-command/`.

Decisiones finales:

- Tipografia base: UI `Segoe UI`, `Arial`, `sans-serif`; editorial `Georgia`, `Times New Roman`, `serif`.
- Trial 1 (`Georgia + Segoe`) queda aprobado como base por estabilidad, calidez y disponibilidad sin dependencias.
- Trial 2 (`Cambria + Aptos`) queda como alternativa viable, no base inicial.
- Trial 3 (`Constantia + Trebuchet`) queda rechazado para base porque baja la densidad operativa.
- Color: ink, warm surface y olive sostienen producto; rose y gold quedan solo como acentos emocionales.
- Motion: microfeedback corto, reduced motion obligatorio y celebracion dosificada solo en hitos.
- CSS: namespace de redisenio, cascade layers, tokens centrales y cero `!important` nuevo salvo excepcion temporal documentada.
- Implementacion futura: por slices, empezando por foundation/shell/dashboard/componentes base, no por Mesas geometrica.

Gate final:

`EDITORIAL COMMAND APPROVED FOR IMPLEMENTATION: YES`

## Personalidad

Mi Gran Dia debe sentirse:

- elegante sin ser frio;
- romantico sin ser infantil;
- operativo sin ser SaaS generico;
- premium sin decoracion excesiva;
- humano, claro y confiable.

## Tokens base propuestos

### Color

| Token | Valor | Uso |
| --- | --- | --- |
| `--mgd-ink` | `#171713` | Texto principal, iconos fuertes |
| `--mgd-text` | `#34342e` | Texto de lectura |
| `--mgd-muted` | `#767169` | Texto secundario |
| `--mgd-line` | `#e5dfd8` | Bordes y separadores |
| `--mgd-surface` | `#fffdfa` | Superficie principal |
| `--mgd-soft` | `#f7f3ee` | Fondo suave |
| `--mgd-olive` | `#7f8962` | Accion primaria, progreso positivo |
| `--mgd-olive-dark` | `#596341` | Hover/active primario |
| `--mgd-rose` | `#b17782` | Acento emocional controlado |
| `--mgd-gold` | `#b99a5f` | Hitos, celebracion dosificada |
| `--mgd-danger` | `#9f3f3f` | Errores/destructivo |
| `--mgd-warning` | `#a66f2b` | Pendientes/atencion |
| `--mgd-info` | `#496f7c` | Informacion neutral |

Reglas:

- No usar una paleta de una sola familia cromatica.
- No dominar la UI con morado, azul oscuro, beige plano ni gradientes AI.
- Rose y gold son acentos, no fondos masivos.
- El contraste debe sostener lectura y foco.

### Tipografia

Base aprobada:

- UI/producto: Segoe UI, Arial, sans-serif.
- Editorial/identidad: Georgia, Times New Roman, serif.
- Decorativa: solo invitaciones o momentos muy acotados, nunca tablas o formularios.

Escala propuesta:

| Token | Tamanio | Uso |
| --- | ---: | --- |
| `--text-xs` | 12px | meta, badges |
| `--text-sm` | 14px | secundario, controles compactos |
| `--text-md` | 16px | cuerpo e inputs mobile-safe |
| `--text-lg` | 18px | titulos de seccion |
| `--text-xl` | 22px | page title compacto |
| `--text-2xl` | 28px | dashboard/title principal |
| `--text-display` | 36px | solo momentos editoriales |

Reglas:

- No escalar fuente con viewport width.
- Letter spacing 0 salvo microlabels uppercase muy controlados.
- Titulos grandes solo donde haya espacio real.

### Espaciado

Base: 4px.

| Token | Valor |
| --- | ---: |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |

Reglas:

- Dashboards y herramientas pueden ser densos, pero nunca apretados.
- No usar cards dentro de cards.
- Las secciones son bandas o layouts; las cards son items repetidos o modales.

### Radio y sombra

| Token | Valor | Uso |
| --- | ---: | --- |
| `--radius-control` | 10px | inputs, botones |
| `--radius-card` | 14px | cards repetidas |
| `--radius-panel` | 18px | paneles grandes |
| `--radius-modal` | 22px | dialogs |

Sombras:

- `--shadow-soft`: elevacion leve para panels/modals.
- `--shadow-focus`: anillo de foco visible, no solo glow decorativo.
- Evitar sombras duras o flotacion excesiva.

## Layout

### Shell desktop

- Sidebar persistente 248-280px.
- Header contextual de 64-76px.
- Workspace con ancho fluido y maximo controlado por modulo.
- Modulos densos usan grid 12 columnas o master/detail.

### Shell tablet

- Sidebar colapsable o rail.
- Workspace con panel contextual.
- Acciones primarias visibles en header o sticky local.

### Shell mobile

- Topbar compacta.
- Navegacion inferior o tabs horizontales para modulos principales.
- Una columna.
- Acciones primarias cercanas al contenido.
- Mesas por lista/asignacion, no canvas obligatorio.

Breakpoints de QA: 360, 390, 430, 768, 1024, 1440.

## Componentes base

### AppShell

Responsabilidad: navegacion, estado de sesion, boda activa, workspace y mensajes globales.

Estados:

- authenticated;
- unauthenticated;
- loading context;
- offline;
- permission limited.

### Navigation

- Un solo modelo mental: modulo activo + acciones locales.
- `data-module` y `data-quick-module` se conservan en implementacion futura por compatibilidad.
- Quick nav no debe competir como navegacion paralela.

### PageHeader

Incluye:

- titulo del modulo;
- descripcion breve si aporta claridad;
- estado de guardado/sync;
- accion primaria;
- acciones secundarias en menu.

### Button

Variantes:

- primary;
- secondary;
- ghost;
- danger;
- icon;
- segmented/tab.

Estados:

- default;
- hover;
- active;
- focus-visible;
- disabled;
- loading.

Reglas:

- 44px minimo tactil en mobile.
- Iconos deben tener texto accesible.
- No usar solo color para comunicar estado.

### Field

Incluye:

- label persistente;
- input/select/textarea;
- helper opcional;
- error asociado;
- contador cuando haya limite;
- estado disabled/read-only.

Reglas:

- Placeholder no sustituye label.
- `aria-describedby` para helper/error.
- Inputs minimo 16px en mobile.

### Card / Panel

- Card: item repetido, invitado, tarea, respuesta, mesa.
- Panel: contenedor de herramienta o seccion amplia.
- No anidar cards dentro de cards.
- Acciones alineadas y estables.

### Tabs / Segmented Control

Uso:

- cambiar vistas del mismo modulo;
- filtrar estados importantes;
- alternar direcciones en prototipos.

Reglas:

- Estado activo visible por forma/texto, no solo color.
- Teclado y foco visibles.

### Table / List

Para Invitados/RSVP:

- desktop: tabla/lista densa con filtros;
- mobile: lista con resumen por item y acciones expandidas;
- estados de seleccion, revision, aplicado y conflicto.

### Modal / Dialog

Contrato:

- `role="dialog"` y nombre accesible;
- foco inicial util;
- trap de foco;
- Escape;
- restore focus;
- fondo no interactivo (`inert` futuro);
- scroll interno si excede viewport;
- reduced motion.

### Toast / Inline Notice

- Toast para confirmacion breve.
- Inline notice para errores persistentes o permisos.
- Siempre accion de recuperacion cuando sea posible.

### Empty State

Debe decir:

- que falta;
- por que importa;
- siguiente accion.

No debe parecer placeholder roto.

## Modulos

### Dashboard

Componentes clave:

- status strip;
- today panel;
- metrics compactas;
- pending list;
- quick actions;
- timeline/hitos.

### Invitados / RSVP Admin

Componentes clave:

- filtros de estado;
- lista de invitados;
- bandeja RSVP;
- conflict badge;
- linked guest chips;
- sync status;
- review/apply actions.

### Mesas / Distribucion

Componentes clave:

- lista de invitados sin mesa;
- mesa card;
- capacity meter;
- conflict panel;
- mobile assignment sheet;
- guardado visible.

No se implementa sin tests de persistencia/round-trip.

### Invitaciones

Componentes clave:

- invitation list;
- preview shell;
- real link action;
- loading/error state;
- viewport checklist.

### Configuracion / Equipo

Componentes clave:

- member list;
- role selector;
- pending invitations;
- permission copy;
- error/success states.

## Accesibilidad

Checklist obligatorio:

- foco visible global;
- labels persistentes;
- nombres accesibles para icon buttons;
- `aria-live` para errores/guardado cuando aplique;
- orden de tabulacion natural;
- dialog contract completo;
- contraste AA para texto normal y controles esenciales;
- reduced motion;
- target tactil minimo 44px;
- no depender solo de color.

## Motion

Duraciones orientativas:

- feedback: 120-160ms;
- navegacion: 180-240ms;
- overlay: 220-280ms;
- celebracion ocasional: maximo 360ms.

Propiedades:

- preferir transform y opacity;
- evitar layout thrash;
- cancelar timers/observers al desmontar;
- reduced motion debe apagar desplazamientos largos y loops.

Limitaciones aprobadas:

- No usar celebraciones en errores, login, RSVP critico o Mesas.
- No usar transiciones largas en navegacion principal.
- No usar loops decorativos.

## Responsive

### 360 / 390 / 430

- Una columna.
- Nav compacta.
- Acciones primarias visibles.
- Formularios con labels y espacio para errores.
- Mesas por lista.

### 768

- Dos zonas posibles: lista + detalle.
- Sidebar colapsable.
- Mayor densidad sin perder tactilidad.

### 1024 / 1440

- Sidebar completo.
- Master/detail.
- Tablas/listas escaneables.
- Paneles secundarios persistentes.

## CSS Strategy futura

- Usar namespace/capa para redisenio (`body.mgd-redesign` o equivalente).
- Tokens en `css/core`.
- Componentes en `css/core` con responsabilidades claras.
- Estilos de modulo en `css/modules`.
- No sumar bloques grandes al HTML.
- No limpiar `!important` masivamente sin migrar pantalla por pantalla.
- Todo `!important` nuevo requiere justificacion temporal y remocion planificada.
- La validacion 8A demostro que la direccion puede prototiparse con 0 `!important`.

## Boundaries

No tocar sin autorizacion explicita:

- Firebase config;
- Firestore Rules;
- colecciones, IDs y shape de documentos;
- `ownerUid` y Anonymous Auth RSVP;
- rutas `rsvp.html`, `app_integral/rsvp.html` y publicas;
- storage keys;
- bridges de Mesas/Distribucion;
- geometria/asientos/drag/drop;
- deploy.

## Criterios para implementar V2 en una tarea futura

- PR separado de implementacion, no esta tarea.
- Scope limitado a shell/dashboard/componentes base.
- Validacion repo verde.
- Firestore tests verdes.
- Baseline visual comparativo.
- QA responsive en 360, 390, 430, 768, 1024, 1440.
- Sin cambios de datos/Firebase/rutas publicas.
- Sin migrar Mesas geometrica hasta tener tests de persistencia/round-trip.

## Elementos a conservar

- Atmosfera premium del shell.
- Copy humano del auth.
- Identidad romantica de invitacion publica.
- Separacion entre app autenticada y experiencias publicas.
- Estado de error seguro del RSVP sin token.
- Links reales de invitaciones como verdad de QA.
- Contratos RSVP y Firestore existentes.

## Prototipo asociado

El prototipo inicial de vision vive en `prototypes/task-8-redesign-vision/`.

La validacion final 8A vive en `prototypes/task-8a-editorial-command/`. Usa solo HTML, CSS y JS estaticos, sin Firebase, sin datos reales y sin rutas publicas productivas.
