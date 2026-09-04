# Laboratorio de Distribución

Entorno de pruebas aislado para reconstruir el módulo **Distribución** de Mi Gran Día sin afectar la aplicación real.

## Contratos y auditoría

Antes de modificar el motor o agregar nuevas formas de mesa, este laboratorio debe respetar:

- `docs/DISTRIBUTION_INTEGRATION_CONTRACTS.md` — **Fase 0**, identidades y responsabilidades de Confirmaciones/RSVP, Invitados, Mesas y Sillas y Distribución (`guestId`, `tableId`, `seatId`, `responseId`, `proposalId`).
- `docs/DISTRIBUTION_PHASE1_AUDIT.md` — **Fase 1**, inventario exhaustivo del Distribución productivo y matriz de paridad del laboratorio.
- `docs/DISTRIBUTION_PHASE2_CLOSURE.md` — cierre formal de **Fase 2** y orden obligatorio posterior.

Regla principal: el laboratorio permanece aislado de la persistencia real, pero debe usar un modelo lógico compatible con la futura integración a Mi Gran Día.

## Fase 2 — Paridad P0 + P1 + P2 + P2.1 — CERRADA

La Fase 2 usa una vista comparativa separada para conservar el baseline mientras validamos el motor:

- `index.html` — baseline anterior, conservado como referencia.
- `phase2.html` — vista cerrada de Fase 2.
- `phase2-host.js` — carga secuencialmente P0, los tres bloques P1, P2 y el cierre P2.1.
- `phase2-p0.js` — canvas 1448×1086, centro 724/543, mesa circular legacy, sillas, etiquetas, SAT y gestor de riesgos.
- `phase2-p0.css` — oculta el CRUD maestro de Invitados y mantiene asignación rápida/editor de asientos.
- `phase2-p1.js` — drag, multiselección, rotación y bloqueo.
- `phase2-p1-editor.js` — frente/fondo, alineación, capas, historial 80, duplicar, copiar/pegar y eliminar.
- `phase2-p1-spatial.js` — medición, toldos, auto distribución, fondo y propuestas exclusivamente en memoria.
- `phase2-p1-spatial.css` — handles de vértices, dibujo del toldo y presentación de propuestas.
- `phase2-p2.js` — sesión JSON, PNG, Vista final y gestos/mobile.
- `phase2-p2.css` — controles P2, Vista final, bottom sheets, FAB y safe areas móviles.
- `phase2-p2-close.js` / `phase2-p2-close.css` — cierre P2.1: FAB dinámico sobre sheets, dirección adaptativa del menú y Escape.

### P0 implementado

1. canvas lógico 1448 × 1086;
2. centro 724 / 543;
3. tablero físico circular fijo de radio 0.915 m;
4. área funcional/circulación independiente del tablero;
5. 10 sillas en órbita 1.33×;
6. etiquetas en órbita 2.18× con contrarrotación;
7. colisiones rectangulares mediante SAT;
8. rojo por invasión de áreas funcionales;
9. advertencia adicional de 60 cm entre áreas de circulación;
10. gestor de riesgos;
11. lista maestra de personas oculta;
12. editor de asientos y asignación rápida conservados.

### P1 implementado

- drag sobre el canvas productivo 1448×1086;
- Ctrl/Cmd + clic para multiselección;
- movimiento conjunto;
- guías inteligentes;
- rotación por handle, Shift 15° y tecla `R`;
- flechas 1 px y Shift+flechas 10 px;
- bloqueo respetado antes de mover o rotar;
- frente/fondo y alineación;
- capas mostrar/ocultar y bloquear/desbloquear;
- historial productivo de 80 estados;
- duplicar 35 px;
- Ctrl/Cmd+C/V con pegado progresivo de 28 px;
- IDs nuevos y mesas copiadas sin invitados;
- eliminación segura;
- mediciones múltiples;
- toldos poligonales con `pointsM`, vértices, medidas de lados, rotación, resize, color y transparencia;
- auto distribución legacy;
- fondo por propuesta en memoria;
- propuestas abrir/crear/duplicar/renombrar/eliminar, máximo 20.

### P2 implementado

- exportar sesión completa a JSON manual;
- importar JSON validando tipo, versión, tamaño y estructura;
- máximo 20 propuestas también al importar;
- exportación PNG 1448 × 1086 sin handles, guías, dibujo temporal ni selección;
- Vista final basada en clon limpio del mismo plano;
- bottom sheets móviles;
- FAB móvil;
- safe areas iOS;
- pinch zoom táctil;
- acciones móviles para Propuestas, Vista final, PNG y JSON.

### P2.1 — cierre implementado

- FAB reposicionado dinámicamente por encima del sheet abierto;
- menú del FAB abre hacia arriba o abajo según espacio disponible;
- `Escape` cierra sheets/FAB/backdrop;
- comportamiento cubierto por pruebas ejecutables;
- aislamiento de persistencia preservado.

**Bugs heredados que no se copian:** las flechas no modifican Y antes de comprobar el bloqueo; las guías mantienen X con X / Y con Y; las acciones múltiples no eliminan ni modifican silenciosamente objetos bloqueados; un handle de vértice del toldo no activa por error el drag de todo el elemento.

## Estado de cierre

Con P0 + P1 + P2 + P2.1 se supera el gate definido para esta etapa:

> **EL LABORATORIO REPRODUCE EL DISTRIBUCIÓN ACTUAL SIN SU PERSISTENCIA REAL.**

Esto cierra Fase 2, pero **NO autoriza todavía nuevas geometrías** ni integración con App Lu.

## Siguiente etapa obligatoria

El orden aprobado después de Fase 2 es:

1. corregir bugs/deudas heredadas uno por uno y con test;
2. corregir tolerancias px → metros donde corresponda;
3. revisar reglas de capas ocultas, historial, límites, responsive y conflictos;
4. modularizar `engine/`, `renderer/`, `ui/`, `state/` y `adapters/` sin cambiar comportamiento;
5. validar nuevamente la mesa redonda exacta;
6. recién después: cuadrada → rectangular → capacidades 4–16 → dimensiones → cambios de tipo;
7. después: adaptador → Mesas/Sillas → Invitados → RSVP → integración en sombra → QA → feature flag.

No se debe saltar directamente de Fase 2 a cuadradas o rectangulares.

## Aislamiento obligatorio

Este laboratorio no se importa desde `app_integral/` y no está conectado al runtime principal. No contiene integración con servicios de datos de la aplicación ni mecanismos de persistencia del producto. Todo el estado existe únicamente en memoria de la página y se reinicia al recargar, salvo archivos JSON que el usuario descargue e importe manualmente.

## Regla de trabajo

La versión estable de Distribución en la aplicación principal no se modifica mientras se itera aquí. Primero reproducimos. Después corregimos. Después mejoramos. Después integramos.
