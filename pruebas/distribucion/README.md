# Laboratorio de Distribución

Entorno de pruebas aislado para reconstruir el módulo **Distribución** de Mi Gran Día sin afectar la aplicación real.

## Contratos y auditoría

Antes de modificar el motor o agregar nuevas formas de mesa, este laboratorio debe respetar:

- `docs/DISTRIBUTION_INTEGRATION_CONTRACTS.md` — **Fase 0**, identidades y responsabilidades de Confirmaciones/RSVP, Invitados, Mesas y Sillas y Distribución (`guestId`, `tableId`, `seatId`, `responseId`, `proposalId`).
- `docs/DISTRIBUTION_PHASE1_AUDIT.md` — **Fase 1**, inventario exhaustivo del Distribución productivo y matriz de paridad del laboratorio.

Regla principal: el laboratorio permanece aislado de la persistencia real, pero debe usar un modelo lógico compatible con la futura integración a Mi Gran Día.

## Fase 2 — Paridad P0 + P1 + P2 — CERRADA

La Fase 2 usa una vista comparativa separada para no destruir el baseline mientras validamos el motor:

- `index.html` — baseline anterior, conservado como referencia.
- `phase2.html` — vista activa y cerrada de Fase 2.
- `phase2-host.js` — carga secuencialmente P0, los tres bloques P1, P2 y el cierre P2.1.
- `phase2-p0.js` — canvas 1448×1086, centro 724/543, mesa circular legacy, sillas, etiquetas, SAT y gestor de riesgos.
- `phase2-p0.css` — oculta el CRUD maestro de Invitados y mantiene asignación rápida/editor de asientos.
- `phase2-p1.js` — drag, multiselección, rotación y bloqueo.
- `phase2-p1-editor.js` — frente/fondo, alineación, capas, historial 80, duplicar, copiar/pegar y eliminar.
- `phase2-p1-spatial.js` — medición, toldos, auto distribución, fondo y propuestas exclusivamente en memoria.
- `phase2-p1-spatial.css` — handles de vértices, dibujo del toldo y presentación de propuestas.
- `phase2-p2.js` — sesión JSON, PNG, Vista final y gestos/mobile.
- `phase2-p2.css` — controles P2, Vista final, bottom sheets, FAB y safe areas móviles.
- `phase2-p2-close.js` / `phase2-p2-close.css` — cierre de paridad móvil: FAB acompaña sheets, apertura arriba/abajo, Escape, resize y orientación.

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

### P1 — bloque 1 implementado

- drag sobre el canvas productivo 1448×1086;
- Ctrl/Cmd + clic para multiselección;
- movimiento conjunto de los elementos seleccionados;
- guías inteligentes P0 durante el drag;
- handle de rotación;
- Shift durante rotación para ajustar a pasos de 15°;
- tecla `R` para rotar 15°;
- flechas para mover 1 px y Shift+flechas para 10 px;
- bloqueo respetado antes de cualquier movimiento por puntero o teclado.

### P1 — bloque 2 implementado

- traer selección al frente y enviarla al fondo;
- alineación horizontal conservando la regla actual del producto: igualar Y con el elemento principal;
- objetos bloqueados protegidos también en alineación, orden y eliminación;
- capas por categoría con mostrar/ocultar y bloquear/desbloquear;
- ocultar una capa retira de la selección sus objetos;
- mostrar todas las capas y desbloquear todo;
- historial ampliado al límite productivo de 80 estados;
- duplicar el objeto principal con desplazamiento de 35 px;
- Ctrl/Cmd+C y Ctrl/Cmd+V para una o varias selecciones;
- pegado con desplazamiento progresivo de 28 px;
- IDs nuevos en duplicados/copias;
- las mesas duplicadas o pegadas nacen sin invitados asignados;
- eliminar selección conserva cualquier objeto bloqueado seleccionado.

### P1 — bloque 3 implementado

- mediciones múltiples entre dos puntos con preview vivo;
- distancia expresada en metros y etiqueta orientada para mantenerse legible;
- limpiar todas las medidas;
- toldo como polígono libre con mínimo tres vértices;
- cierre al volver a pulsar cerca del primer vértice (18 px), doble clic o Enter;
- Escape cancela el dibujo;
- vértices del toldo almacenados en metros locales (`pointsM`);
- edición individual de vértices;
- medidas de cada lado del toldo;
- movimiento, rotación, ancho/alto, color y transparencia del toldo;
- auto distribución con las coordenadas de partida del Distribución estable: pista, altar, DJ, barra y mesa de novios;
- mostrar/ocultar fondo conservado dentro de cada propuesta de la sesión;
- propuestas exclusivamente en memoria: abrir, crear, duplicar, renombrar y eliminar;
- máximo productivo de 20 propuestas;
- cada cambio espacial recalcula el gestor de riesgos P0; P1.3 no sustituye sus reglas.

### P2 implementado

- exportar la sesión completa a JSON manual: propuestas, propuesta activa, elementos, invitados, medidas y opciones de vista;
- importar JSON únicamente después de validar tipo, versión, tamaño y estructura;
- máximo 20 propuestas también durante importación;
- ningún JSON se guarda automáticamente: la descarga/subida es una acción explícita del usuario;
- exportación PNG del plano en 1448 × 1086;
- el PNG retira handles, guías, dibujo temporal y estados de selección;
- Vista final usa un clon limpio del plano actual y no una segunda fuente de estado;
- en móvil Herramientas y Propiedades funcionan como bottom sheets;
- FAB móvil para abrir acciones principales;
- safe area inferior para iOS;
- pinch zoom de dos dedos sobre el canvas;
- acciones móviles para Propuestas, Vista final, PNG y JSON.

### P2.1 — cierre de paridad

- el FAB se reposiciona por encima del sheet abierto, igual que el comportamiento legacy;
- el menú del FAB decide automáticamente apertura hacia arriba o hacia abajo según el espacio disponible;
- `Escape` cierra Vista final o la UI móvil abierta;
- resize y cambio de orientación recalculan la posición del FAB;
- se agregan pruebas ejecutables del saneamiento/round-trip del estado JSON y del cálculo de posición/dirección del FAB;
- se mantiene el aislamiento absoluto respecto a persistencia y datos reales.

**Bugs heredados que no se copian:** las flechas no modifican Y antes de comprobar el bloqueo; las guías mantienen X con X / Y con Y; las acciones múltiples no eliminan ni modifican silenciosamente objetos bloqueados; un handle de vértice del toldo no activa por error el drag de todo el elemento.

## Estado de cierre

Con P0 + P1 + P2 + P2.1, el laboratorio reproduce la experiencia funcional principal del Distribución actual **sin su persistencia real**. La Fase 2 queda cerrada como baseline para las siguientes etapas.

Esto **no autoriza todavía** mesas cuadradas, rectangulares, capacidades 4–16, nuevas dimensiones físicas ni integración real con App Lu.

## Siguiente etapa aprobada

El orden obligatorio después del cierre de Fase 2 es:

1. corregir bugs/deudas heredadas uno por uno, cada uno con test aislado;
2. convertir tolerancias heredadas en píxeles a reglas físicas en metros donde corresponda;
3. revisar reglas de capas ocultas, edge cases de historial, límites, responsive y conflictos;
4. modularizar el motor (`engine/`, `renderer/`, `ui/`, `state/`, `adapters/`) sin cambiar comportamiento;
5. recién después evolucionar mesas en este orden: redonda exacta → cuadrada → rectangular → capacidades 4–16 → dimensiones → cambios de tipo;
6. después crear el adaptador y continuar con Mesas/Sillas, Invitados, RSVP, integración en sombra y QA.

No se debe saltar directamente de Fase 2 a nuevas geometrías.

## Aislamiento obligatorio

Este laboratorio no se importa desde `app_integral/` y no está conectado al runtime principal. No contiene integración con servicios de datos de la aplicación ni mecanismos de persistencia del producto. Todo el estado existe únicamente en memoria de la página y se reinicia al recargar, salvo archivos JSON que el usuario descargue e importe manualmente.

## Regla de trabajo

La versión estable de Distribución en la aplicación principal no se modifica mientras se itera aquí. Primero se aprueba visual y funcionalmente cada etapa en este laboratorio. Después se diseña un pase mínimo y separado hacia el módulo real.
