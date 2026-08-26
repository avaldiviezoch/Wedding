# Editorial Command — Art Direction Lock

Estado: `VISUAL LANGUAGE FROZEN — NOT YET PRODUCTIVE`
Fecha: 2026-08-26
Rama: `design/task-9a-art-direction`
Base: `main` en `1781966ecd06da60aadc40a1e2e52653e07df3ae` (Tarea 8B integrada)

## 1. Mandato

Mi Gran Día debe sentirse como una libreta editorial privada que además permite tomar decisiones con precisión. La pareja no abre un dashboard genérico: abre un lugar sereno para saber qué importa hoy, resolverlo y seguir adelante.

La dirección se llama **Editorial Command**: calidez contenida + orden operativo. No es una landing, un template de boda ni un SaaS frío.

## 2. Límites confirmados

Este lock no implementa producto. El prototipo usa datos ficticios y no se conecta a Firebase, Firestore, Auth, RSVP, storage ni rutas reales.

No se autorizan cambios a Firebase config, Firestore Rules, `ownerUid`, Anonymous Auth, contratos RSVP, colecciones, IDs, geometría de Mesas, `tableId`, `seatIndex`, drag/drop, storage keys, rutas públicas, roles, datos reales ni deploy. La futura implementación conserva `#unifiedWorkspace`, `data-module`, `data-quick-module` y los puentes existentes mientras migra por slices.

## 3. Firma visual

1. **Titular editorial, cuerpo operativo:** serif solo para intención, fechas e hitos; sans para listas, formularios y decisiones.
2. **Riel de tinta:** navegación y contextos fuertes sobre ink; el workspace permanece claro y respirable.
3. **Reglas antes que cajas:** separadores, bandas y ritmo vertical comunican agrupación; una card existe solo para un objeto repetido o un diálogo.
4. **Oliva como verbo:** una única acción primaria por contexto; no es decoración ni color de todos los estados.
5. **Estado escrito, no solo coloreado:** “Guardado hace un minuto”, “12 por revisar”, “2 sin mesa”.
6. **Celebración puntual:** rose y gold aparecen en hitos o gestos humanos, nunca como fondo dominante.

## 4. Principios de diseño (máximo siete)

1. Una decisión visible por pantalla.
2. Densidad tranquila: información escaneable, nunca comprimida.
3. Mobile es una secuencia; desktop, una composición de trabajo.
4. Los estados son contenido del producto, no mensajes técnicos.
5. El contraste, el foco y el texto preceden al adorno.
6. La emoción acompaña al progreso; no interrumpe tareas críticas.
7. Toda futura capa visual convive con legacy sin cambiar contratos.

## 5. Tres caminos tipográficos evaluados

| Trial | UI | Editorial | Decisión |
| --- | --- | --- | --- |
| A | `Segoe UI, Arial, sans-serif` | `Georgia, Times New Roman, serif` | **Elegido.** Disponible, legible y cálido sin dependencia. |
| B | `Aptos, Segoe UI, sans-serif` | `Cambria, Georgia, serif` | Viable, pero menos consistente entre entornos. |
| C | `Trebuchet MS, Segoe UI, sans-serif` | `Constantia, Cambria, serif` | Rechazado: demasiada personalidad para vistas densas. |

Escala elegida: 12 meta, 14 secundario, 16 cuerpo/inputs, 18 sección, 24 título de módulo, 32–40 display editorial. Los microlabels pueden usar mayúsculas con tracking moderado; el resto no. Inputs: mínimo 16px en móvil.

## 6. Tokens bloqueados

| Grupo | Token | Valor | Regla |
| --- | --- | --- | --- |
| Fondo | `--ec-canvas` | `#F4F0E9` | Fondo cálido, nunca beige masivo sin contraste. |
| Superficie | `--ec-paper` | `#FFFCF8` | Lectura y trabajo. |
| Ink | `--ec-ink` | `#1E211C` | Texto fuerte y riel lateral. |
| Texto | `--ec-text` / `--ec-muted` | `#35372F` / `#6F7068` | Texto y metadatos. |
| Línea | `--ec-line` | `#D9D4CA` | Separación, no decoración. |
| Acción | `--ec-olive` / dark | `#667250` / `#4D573B` | CTA, foco contextual, progreso positivo. |
| Emoción | `--ec-rose` / `--ec-gold` | `#A96570` / `#A8864E` | Hitos y detalles acotados. |
| Estados | danger/warn/info | `#96484A` / `#99672B` / `#416A72` | Siempre con icono/copy. |

Espaciado: `4, 8, 12, 16, 24, 32, 48, 64`. Radios: 8 control, 12 item, 16 panel, 20 diálogo. Elevación: borde primero; sombra suave solo para modal, sheet o control flotante. Gradientes, glass, orbs y bokeh: prohibidos.

## 7. Densidad, superficie y navegación

| Contexto | Densidad | Patrón |
| --- | --- | --- |
| Inicio | Baja/media | Banda editorial + datos compactos + bandeja de atención. |
| Invitados / RSVP | Media/alta | Filas con reglas; tabla en desktop, resumen expandible en mobile. |
| Mesas | Media | Mobile: lista y asignación explícita. Tablet/desktop: lista + tablero, sin alterar geometría. |
| Formularios | Baja | Una columna, labels persistentes, helper y error junto al campo. |
| Modal / sheet | Media | Una decisión, foco claro, footer estable. |

Mobile (360, 390, 430): topbar de 56px, navegación horizontal visible y scrollable, una columna, CTA cerca del contenido. Tablet (768): rail o contexto compacto. Desktop (1024, 1440): sidebar de 248px, cabecera contextual y workspace de dos zonas cuando aporta lectura. Nunca se duplica la navegación para la misma acción.

## 8. Gramática de módulos

### Home

Abre con una frase editorial corta, fecha/hito y una acción concreta. Después: una línea de salud, métricas sin bento, bandeja de atención y accesos frecuentes. La prioridad es orientación, no espectáculo.

### Invitados / RSVP

Una fila expresa persona, grupo, estado escrito, contexto y siguiente acción. Los filtros se leen como opciones, no como una colección de pills. En mobile cada fila revela su detalle sin convertirla en una tabla horizontal comprimida.

### Mesas

El lenguaje visual separa “sin asignar”, capacidad y conflicto con copy directo. Mobile evita depender de canvas o drag; tablet/desktop puede mostrar composición visual sin alterar sus IDs, seats, bridges o persistencia.

### Invitaciones

La lista y el estado de revisión son la herramienta; el preview es apoyo y debe tener loading/error y enlace real separado. La estética romántica vive dentro de la invitación pública, no invade la UI operativa.

### Forms, estados y overlays

Campos con label, helper opcional y error asociado. Estados obligatorios: loading, empty, saving, saved, error, offline, permission limited y pending. Modal: `role="dialog"`, nombre accesible, foco inicial, trap, Escape, restauración de foco y fondo inerte en implementación futura. Sheet móvil entra desde abajo; modal desktop centra la decisión.

## 9. Accesibilidad y movimiento

- Objetivos táctiles: 44px mínimo.
- Contraste AA para texto y controles esenciales; el color no es el único indicador.
- `:focus-visible` de 3px en olive oscuro sobre paper/ink.
- Navegación por teclado, labels persistentes y `aria-live` para guardado/error.
- Feedback: 120–160ms; navegación: 180–240ms; overlay: 220–280ms; hito: hasta 360ms.
- Solo `transform` y `opacity`; sin loops, confetti frecuente ni motion en RSVP/Mesas crítico.
- `prefers-reduced-motion`: sin desplazamiento; cambio instantáneo o fade mínimo.

## 10. Matriz de coherencia

| Superficie | Jerarquía | Acción primaria | Estado | Anti-patrón evitado |
| --- | --- | --- | --- | --- |
| Home | Titular + decisión de hoy | Resolver ahora | Guardado visible | Hero de marketing |
| Invitados | Filtros + filas | Añadir/revisar | RSVP escrito | Tabla móvil comprimida |
| RSVP | Bandeja + conflicto | Revisar respuesta | Pendiente/aplicado | Color como único significado |
| Mesas | Personas antes que canvas | Asignar | Capacidad/conflicto | Drag obligatorio en mobile |
| Invitaciones | Lista + QA | Abrir enlace | Preview listo/error | Iframe como única verdad |
| Configuración | Rol + miembro | Invitar | Enviado/limitado | Copy técnico de permisos |

## 11. Do / Don't

**Do:** usar aire, reglas, tipografía y copy específico; elegir una CTA; conservar la calidez; mostrar la consecuencia de una acción.

**Don't:** anidar cards, usar pills como sistema de estado, crear fondos con degradado, sumar iconos de familias distintas, convertir una herramienta en landing, esconder overflow, ni compensar deuda legacy con `!important`.

## 12. Estrategia CSS futura y factibilidad

Una implementación posterior debe entrar bajo un namespace temporal, por ejemplo `body.mgd-editorial-command`, y capas `reset`, `tokens`, `shell`, `components`, `modules`, `responsive`, `motion`. Tokens centrales primero; shell y componentes base después; migración por módulo sin limpieza masiva de legacy. No se agrega `!important` salvo excepción temporal documentada.

Factibilidad: **sí**, como implementación incremental visual. Riesgo bajo para foundation/shell/dashboard; medio-alto para Invitados/RSVP por contratos; alto para Mesas si se toca geometría. Por eso 9A no implementa ninguno de esos cambios.

## 13. Evidencia y siguiente frontera

El prototipo aislado vive en `prototypes/task-9a-art-direction/`. Debe verificarse en 360, 390, 430, 768, 1024 y 1440 sin overflow, con controles de 44px, foco, modal/sheet y reduced motion. Su contenido es mock y no es un candidato a deploy.

La próxima tarea, si se aprueba, empieza por foundation/shell/dashboard en un PR separado. No inicia 9B desde esta rama.

`EDITORIAL COMMAND VISUAL LANGUAGE: FROZEN`
