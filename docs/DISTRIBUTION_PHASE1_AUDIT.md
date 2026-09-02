# Fase 1 — Auditoría exhaustiva de Distribución

Estado: **FASE 1 — inventario y diagnóstico**  
Fecha: 2026-09-02  
Base: contrato maestro `docs/DISTRIBUTION_INTEGRATION_CONTRACTS.md`  
Alcance: diagnóstico y paridad. **No autoriza cambios de persistencia, Firebase, Firestore, Rules, localStorage, IndexedDB ni migraciones de datos.**

## 1. Objetivo

Auditar el módulo productivo de **Distribución** de Mi Gran Día y compararlo contra `pruebas/distribucion/` antes de continuar la reconstrucción.

La Fase 1 no busca rediseñar, corregir ni agregar funciones. Busca responder, para cada comportamiento:

1. qué hace hoy el Distribución real;
2. qué archivos lo implementan;
3. si el laboratorio lo replica;
4. si existe una diferencia intencional o accidental;
5. si el comportamiento productivo contiene un bug heredado;
6. qué debe copiarse exactamente antes de evolucionar las mesas.

## 2. Estados de auditoría

- **PARIDAD**: el laboratorio reproduce el comportamiento esencial del producto estable.
- **PARIDAD PARCIAL**: existe la función, pero faltan detalles, reglas o presentación.
- **DIFERENTE**: laboratorio y producto implementan comportamientos distintos.
- **FALTA**: la función productiva no existe todavía en el laboratorio.
- **BUG HEREDADO**: el producto actual contiene un defecto confirmado; no debe copiarse ciegamente.
- **MEJORA FUTURA**: comportamiento nuevo aprobado o deseable, pero no pertenece a la paridad del producto actual.

## 3. Fuentes revisadas

### Arquitectura y contratos

- `AGENTS.md`
- `docs/DISTRIBUTION_INTEGRATION_CONTRACTS.md`
- `docs/ARCHITECTURE_GUESTS_RSVP_TABLES.md`
- `docs/RSVP_CONTRACTS.md`
- `app_integral/js/modules/distribucion/README.md`

### Producto activo

- `app_integral/js/legacy/appludesktop-script-01.js`
- `app_integral/js/legacy/applumovil-script-01.js`
- `app_integral/js/legacy/applumovil-script-02.js`
- `app_integral/css/modules/distribucion.css`
- `app_integral/js/modules/distribucion/index.js`
- `app_integral/js/modules/distribucion/background-persistence.js`
- `app_integral/js/modules/invitados/runtime-loader.js`
- `app_integral/js/modules/invitados/tables-editor.js`

### Laboratorio

- `pruebas/distribucion/index.html`
- `pruebas/distribucion/styles.css`
- `pruebas/distribucion/app.js`
- `pruebas/distribucion/README.md`
- `tests/ui/distribution-lab-isolation.test.mjs`

---

# 4. Arquitectura real de Distribución

Distribución no es hoy un módulo único. Está compuesto por varias capas que deben distinguirse antes de reconstruirlo.

| Capa | Implementación actual | Responsabilidad |
|---|---|---|
| Motor visual/editor | `legacy/appludesktop-script-01.js` y `legacy/applumovil-script-01.js` | SVG, elementos, mesas, sillas, drag, colisiones, propuestas, mediciones, toldos, historial, exportación |
| Presentación Mi Gran Día | `css/modules/distribucion.css` | Reestiliza el DOM del motor sin reemplazar sus IDs |
| Mobile | `legacy/applumovil-script-02.js` | Sheets, FAB, navegación y acciones móviles |
| Mesas/Invitados ↔ Distribución | `modules/distribucion/index.js` | Adaptación y sincronización de mesas, asientos e invitados |
| Fondo por propuesta | `modules/distribucion/background-persistence.js` | Conserva/restaura la imagen de fondo y visibilidad por propuesta |
| Carga | `invitados/runtime-loader.js` | Activa el adaptador y la recuperación del fondo |

**Conclusión arquitectónica:** no se debe volver a montar un segundo renderer sobre el legacy mediante MutationObservers o overlays. El futuro motor debe sustituir gradualmente la responsabilidad del renderer, no duplicarla.

---

# 5. Canvas, escala y sistema de coordenadas

## Producto real

El planificador trabaja con un espacio lógico **1448 × 1086**.

- centro X: `724`;
- centro Y: `543`;
- escala por defecto: `32 px/m`;
- X/Y de los elementos son coordenadas SVG, no metros;
- ancho/alto de los elementos sí se expresan en metros y se convierten mediante la escala;
- copiar/pegar y límites de movimiento usan 1448/1086;
- exportación utiliza el mismo tamaño lógico;
- mobile tiene además un `mobileBaseWidth = 900` para presentar el SVG.

## Laboratorio

El laboratorio actual usa **1200 × 760** y centro aproximado **600 × 380**.

### Estado: `DIFERENTE — CRÍTICO`

Consecuencias:

- guías centrales no coinciden;
- auto layout no puede coincidir;
- posiciones copiadas del producto no son comparables;
- densidad visual y distancias aparentes cambian;
- límites de drag/copia no coinciden;
- las mediciones pueden ser matemáticamente válidas pero no tienen la misma superficie disponible.

### Gate de paridad

Antes de agregar nuevas formas de mesa, el laboratorio debe usar el mismo sistema lógico 1448 × 1086.

---

# 6. Inventario de elementos espaciales

El motor real define los siguientes elementos base:

| Tipo | Etiqueta base | Medida base | Forma |
|---|---|---:|---|
| `table` | Mesa 10 personas | 3.4 × 3.4 m | `table` |
| `dance` | Pista de baile | 5 × 5 m | rectángulo |
| `couple` | Mesa de novios | 3 × 1.2 m | rectángulo |
| `bar` | Barra | 4 × 1.2 m | rectángulo |
| `dj` | DJ / sonido | 3 × 2 m | rectángulo |
| `altar` | Altar | 4 × 2 m | rectángulo |
| `cake` | Mesa de torta | 1.8 × 1.8 m | círculo |
| `photo` | Photobooth | 3 × 2 m | rectángulo |
| `mirror` | Espejo | 1 × 0.2 m | rectángulo |
| `tent` | Toldo | polígono libre | polígono |

El laboratorio ya expone estos tipos esenciales.

### Estado: `PARIDAD PARCIAL`

Falta verificar caso por caso dimensiones, límites, rotación, render y propiedades exactas. La existencia del botón no significa paridad funcional.

---

# 7. Mesa circular productiva: tres geometrías distintas

Este es uno de los hallazgos más importantes de la auditoría.

La mesa redonda estable no es un único círculo. Maneja por lo menos tres zonas conceptuales:

1. **tablero físico**;
2. **área de circulación/ocupación**;
3. **órbitas de sillas y etiquetas**.

## 7.1 Tablero físico

En el renderer productivo:

```text
tableR = 0.915 m × escala
```

Por tanto el tablero físico visible tiene diámetro aproximado **1.83 m**.

Importante: en el motor estable este radio no crece cuando se modifica `widthM`.

## 7.2 Área de circulación

Para `shape === 'table'`:

```text
clearR = widthM × escala / 2
```

Con el valor base de 3.4 m:

```text
clearR = 1.70 m
```

Ese círculo discontinuo representa la envolvente funcional de la mesa.

## 7.3 Sillas

El producto calcula:

```text
chairRadius = max(7 px, tableRadius × 0.12)
chairOrbit  = tableRadius × 1.33
```

Y genera explícitamente **10** posiciones.

## 7.4 Etiquetas de invitados

Las etiquetas se ubican aproximadamente a:

```text
labelOrbit = tableRadius × 2.18
```

Características productivas:

- máximo visual aproximado de 18 caracteres con elipsis;
- número de asiento;
- tooltip con nombre completo;
- alineación izquierda/centro/derecha según cuadrante;
- contrarrotación para mantener legibilidad cuando la mesa rota.

## Laboratorio actual

El laboratorio conserva `radiusM = .915`, pero su `renderTable()` hace dos cambios no equivalentes:

```text
tableRadius = BASE_TABLE.radiusM × scale × sizeFactor
chairDistance = tableRadius × 1.58
```

Esto produce dos divergencias:

1. el tablero físico crece/reduce con `widthM`, a diferencia del renderer estable;
2. las sillas están más alejadas (`1.58`) que en el producto (`1.33`).

Las etiquetas sí usan el factor `2.18`.

### Estado: `DIFERENTE — CRÍTICO`

Esta diferencia explica por qué la estética de las sillas todavía no coincide exactamente con el Distribución original.

### Regla para la siguiente fase

La mesa circular productiva debe convertirse en el **baseline visual de referencia** antes de crear cuadrada o rectangular.

---

# 8. Capacidad: contrato moderno vs renderer legacy

Existe una divergencia arquitectónica ya presente en producción.

## Mesas y Sillas / adaptador moderno

`tables-editor.js` y `distribucion/index.js` ya manejan:

- `round`;
- `square`;
- `rectangular`;
- capacidades entre 4 y 16;
- sillas con IDs;
- `tableId`, `seatId`, `seatNumber`.

## Renderer estable

El legacy sigue teniendo múltiples contratos fijos de 10:

- `Mesa 10 personas`;
- `Array(10).fill(null)`;
- `slice(0,10)`;
- loops `i < 10` para sillas y etiquetas.

### Estado: `DIFERENCIA ARQUITECTÓNICA PRODUCTIVA`

No es todavía un bug del laboratorio: es la deuda central que el nuevo motor deberá resolver.

### Regla

No agregar capacidad 4–16 mediante un overlay. El futuro renderer debe consumir la capacidad canónica de la mesa y generar sillas/etiquetas dinámicamente.

---

# 9. Colisiones y superposición roja

## 9.1 Qué significa el rojo

La superposición no espera a que los tableros físicos se toquen.

Para una mesa, el motor de colisiones usa su **envolvente de 3.4 m** (`widthM`) como geometría funcional. Por eso dos tableros todavía pueden verse separados y, aun así, sus mesas aparecer en rojo.

La lectura correcta es:

> las áreas funcionales/circulación de esos mobiliarios se invaden.

No:

> los tableros físicos ya se tocaron.

## 9.2 Algoritmos productivos

El motor distingue:

- círculo ↔ círculo;
- polígono/rectángulo rotado ↔ polígono/rectángulo rotado;
- círculo ↔ polígono.

Rectángulo/polígono usa un esquema tipo **Separating Axis Theorem (SAT)** mediante ejes y proyecciones.

Tolerancias actuales:

- círculo/círculo: aproximadamente `-5 px`;
- SAT: aproximadamente `+3 px` en la condición de separación;
- círculo/polígono: tolerancia del orden de `3 px`.

### Deuda observada

Las tolerancias están expresadas en píxeles, no en metros. Por tanto su equivalencia física cambia con `px/m`.

### Estado: `BUG/DEUDA HEREDADA`

No corregir durante paridad; registrar para fase de saneamiento del motor.

## 9.3 Toldos

Los toldos se excluyen explícitamente del detector general de conflictos.

### Estado: `COMPORTAMIENTO PRODUCTIVO`

No debemos asumir que un toldo encima de mobiliario produce hoy un conflicto rojo.

## 9.4 Laboratorio

El laboratorio ya tiene círculo/círculo y círculo/polígono, pero para polígonos usa intersección de segmentos + punto dentro de polígono en lugar del SAT productivo.

### Estado: `DIFERENTE`

Puede producir resultados diferentes especialmente en bordes, rotaciones y tolerancias.

---

# 10. Regla adicional de cercanía entre mesas

Además de la superposición existe una segunda validación independiente.

El producto calcula únicamente entre mesas visibles:

```text
margen adicional = 0.60 m
```

La advertencia productiva es:

> Se detectaron N pares de mesas con menos de 60 cm libres entre sus áreas de circulación.

Para dos mesas base:

```text
radio de circulación = 1.70 m
mínimo recomendado entre centros = 1.70 + 1.70 + 0.60 = 4.00 m
```

Por eso existen tres estados conceptuales:

1. conflicto/superposición funcional → rojo;
2. sin conflicto rojo pero menos de 60 cm adicionales → advertencia;
3. separación suficiente → sin advertencia.

### Estado laboratorio: `PARIDAD CONCEPTUAL`

La regla de 0.60 m ya existe. Debe recalibrarse después de recuperar exactamente el canvas y la geometría productiva.

---

# 11. Gestor de validación/riesgos

El motor productivo comprueba:

1. elementos implicados en superposición;
2. invitados sin asignar;
3. capacidad total vs total de invitados;
4. pares de mesas con menos de 60 cm libres.

Observación importante:

- los conflictos usan **elementos visibles**;
- la capacidad se suma sobre `elements`, incluidos elementos/mesas ocultos;
- las asignaciones pueden seguir existiendo en una mesa oculta.

### Estado laboratorio: `PARIDAD PARCIAL`

Ya reproduce las cuatro reglas principales, incluida la misma semántica de capacidad sobre todos los elementos.

### Deuda a decidir después de paridad

Definir formalmente si ocultar una capa es solo una decisión visual o debe excluir esa mesa también de métricas de capacidad/ocupación.

---

# 12. Selección y manipulación

## Producto real

Incluye:

- selección simple;
- selección múltiple con Ctrl/Cmd + clic;
- movimiento de uno o varios elementos;
- preservación de offsets del grupo durante drag;
- rotación mediante handle;
- rotación por tecla `R`;
- Shift para pasos de rotación de 15° durante determinadas interacciones;
- mover por flechas;
- Shift + flechas para desplazamiento mayor;
- bloquear/desbloquear;
- traer al frente;
- enviar al fondo;
- alinear grupo;
- duplicar;
- eliminar;
- copiar/pegar con Ctrl/Cmd+C/V.

### Estado laboratorio: `PARIDAD PARCIAL`

La mayoría de las operaciones básicas ya existe, pero todavía no se ha demostrado equivalencia en:

- límites del canvas;
- agrupación durante drag;
- handles exactos;
- reglas de elementos bloqueados;
- offset exacto de duplicados/copias;
- orden de historial.

---

# 13. Bugs heredados confirmados en selección/bloqueo

## 13.1 Flechas verticales y elemento bloqueado

El legacy procesa:

```text
ArrowUp   → modifica Y
ArrowDown → modifica Y
DESPUÉS verifica isItemLocked(item)
```

Mientras izquierda/derecha se procesan después del check.

### Estado: `BUG HEREDADO CONFIRMADO`

Un elemento bloqueado no debería modificar ninguna coordenada.

### Acción futura

Corregir en la fase de saneamiento, no copiar el error al nuevo motor.

## 13.2 Selección múltiple y operaciones de eliminación

Existe lógica diferenciada entre eliminación por teclado, bloqueo y selección múltiple. Requiere prueba conductual específica antes de declarar paridad.

### Estado: `REQUIERE TEST CONDUCTUAL`

---

# 14. Guías inteligentes

## Producto real

El snap usa:

- centro X = 724;
- centro Y = 543;
- centros de otros elementos;
- umbral aproximado de 9 px.

## Bug productivo

El legacy construye una sola lista basada en:

```text
[724, ...otros item.x]
```

Y reutiliza esos valores para decidir también Y; solo el valor especial 724 se convierte en 543.

En otras palabras, para otros elementos puede comparar:

```text
Y actual ↔ X de otro elemento
```

### Estado: `BUG HEREDADO CONFIRMADO`

## Laboratorio

El laboratorio ya usa listas separadas:

```text
xCandidates → item.x
yCandidates → item.y
```

Conceptualmente está corregido.

### Estado laboratorio: `MEJORA CORRECTA, PERO SOBRE CANVAS DIFERENTE`

Al migrar al canvas 1448 × 1086, los centros deben pasar a 724/543.

---

# 15. Capas

Las capas se agrupan por tipo/categoría de elemento, no como una colección arbitraria de nodos SVG.

Operaciones:

- ocultar/mostrar una categoría;
- bloquear/desbloquear una categoría;
- mostrar todas;
- desbloquear todas;
- bloqueo individual adicional.

Los elementos ocultos se excluyen de:

- render visible;
- selección válida;
- detección de colisiones.

### Estado laboratorio: `PARIDAD PARCIAL`

La estructura existe. Falta QA detallado de selección, bloqueo y métricas al ocultar categorías.

---

# 16. Invitados y asientos

## Producto visible actual

Aunque el legacy conserva internamente herramientas históricas para crear/buscar/eliminar invitados, `distribucion.css` las oculta deliberadamente.

La arquitectura actual establece:

> la lista maestra de personas se administra en Invitados; Distribución solo consume personas para ubicarlas en mesas y sillas.

Permanece visible el editor de asientos de la mesa seleccionada.

## Laboratorio

Actualmente muestra un CRUD/lista general de invitados a la izquierda.

### Estado: `DIFERENTE — DEBE CORREGIRSE PARA PARIDAD`

Durante paridad:

- ocultar/eliminar de la superficie visual el CRUD maestro simulado;
- conservar datos mock en memoria para poder probar asignaciones;
- mantener visible únicamente la asignación de asientos donde corresponda.

## Contrato actual de asignación

Una persona debe aparecer en una sola silla. Al asignarla a otra posición se libera su asignación anterior.

### Estado laboratorio: `PARIDAD CONCEPTUAL`

---

# 17. Medición

El producto tiene un modo específico de medición:

- activar/desactivar;
- primer punto;
- segundo punto;
- cálculo en metros usando la escala;
- múltiples mediciones persistentes dentro del snapshot;
- capa SVG dedicada;
- limpiar mediciones.

### Estado laboratorio: `PARIDAD PARCIAL`

La función existe y admite múltiples mediciones, pero debe compararse estilo, interacción, formato, posición de etiquetas y comportamiento con zoom.

---

# 18. Toldos

El toldo productivo no es un rectángulo simple. Es un editor de polígonos.

Características observadas:

- mínimo 3 vértices;
- modo de dibujo;
- finalizar con Enter/doble clic según interacción;
- cancelar con Escape;
- puntos almacenados en metros/locales (`pointsM`);
- color de relleno;
- transparencia;
- color de contorno;
- vértices editables mediante handles;
- rotación;
- dimensiones derivadas del polígono;
- etiquetas/medidas de lados;
- exclusión de colisiones generales.

### Estado laboratorio: `PARIDAD PARCIAL / INCOMPLETA`

Existe dibujo de toldo y propiedades básicas, pero no se ha demostrado equivalencia completa del editor vectorial.

---

# 19. Historial, deshacer y rehacer

El producto mantiene hasta aproximadamente **80 snapshots** de historial.

El laboratorio actual limita el historial a **60**.

### Estado: `DIFERENTE`

Además debe verificarse qué acciones productivas crean snapshot inmediato vs diferido.

---

# 20. Auto distribución

El motor productivo incluye `autoLayout()` y crea una propuesta base posicionando elementos principales en coordenadas predeterminadas.

### Estado laboratorio: `FALTA / NO PARIDAD`

El botón y comportamiento completo del auto layout productivo deben inventariarse y reproducirse antes de nuevas mesas.

---

# 21. Propuestas / diseños

El motor productivo administra propuestas reales del planificador.

Incluye:

- propuesta activa;
- nueva propuesta;
- duplicar propuesta;
- renombrar;
- eliminar;
- abrir/cambiar propuesta;
- guardar;
- guardar como;
- miniaturas/preview;
- fecha de actualización;
- máximo de propuestas (`MAX_PROPOSALS`, actualmente 20);
- autosave y estado visual del guardado.

## Laboratorio

Tiene propuestas solo en memoria y una interfaz simplificada.

### Estado: `PARIDAD PARCIAL`

Durante laboratorio debe mantenerse **solo en memoria**, pero la UX y reglas funcionales pueden imitarse sin tocar persistencia real.

---

# 22. Persistencia y autosave productivos

El producto legacy conserva propuestas mediante IndexedDB y fallback/local memory; además existen mecanismos de backup y compatibilidad.

El laboratorio tiene prohibido conectarse a esas rutas.

### Estado laboratorio: `AISLAMIENTO CORRECTO`

`distribution-lab-isolation.test.mjs` bloquea referencias a:

- `localStorage`;
- `sessionStorage`;
- `indexedDB`;
- Firebase/Firestore y operaciones remotas.

### Regla

En Fases 1–6, la ausencia de persistencia real es una característica de seguridad, no una función faltante.

---

# 23. Fondo del salón

Producción tiene una capa adicional `background-persistence.js` que:

- identifica la propuesta activa;
- recuerda la imagen del plano por propuesta;
- restaura la imagen;
- recuerda/corrige la visibilidad;
- mantiene compatibilidad con propuestas antiguas.

### Estado laboratorio: `PARIDAD VISUAL PARCIAL`

Debe poder simular mostrar/ocultar/cambiar fondo en memoria. No debe copiar la persistencia real.

---

# 24. Importación, respaldo y exportación

El producto incluye:

- guardar;
- guardar como;
- exportar JSON;
- importar JSON;
- exportar SVG/imagen del planificador;
- limpieza del plano;
- vista/presentación.

La exportación elimina elementos de edición como handles y dibujo temporal antes de generar la salida.

### Estado laboratorio: `FALTA / PARIDAD PARCIAL`

No deben conectarse a storage real, pero sí deben existir las operaciones de sesión necesarias para probar el contrato visual y funcional del planner.

---

# 25. Vista de presentación

El producto puede entrar en una vista final/presentación sin herramientas de edición.

### Estado laboratorio: `PARIDAD PARCIAL`

Existe overlay de presentación. Falta comparación exacta de contenido, escala y limpieza de controles.

---

# 26. Mobile

El mobile productivo no es solo CSS responsive.

`applumovil-script-02.js` implementa una capa de interacción específica con:

- panel de Herramientas;
- panel de Detalles;
- panel de Acciones;
- backdrop;
- FAB principal;
- acciones flotantes;
- acceso a Medir;
- acceso a Presentación;
- acceso a Propuestas;
- comportamiento específico de apertura/cierre de panels;
- adaptación de acciones productivas al espacio móvil.

El motor móvil además presenta el SVG con una base de 900 px y zoom específico.

### Estado laboratorio: `FALTA — CRÍTICO PARA PARIDAD FINAL`

El responsive actual del laboratorio no equivale al modo mobile productivo.

---

# 27. Color general de elementos

El laboratorio permite modificar en vivo el color de cualquier elemento mediante `selColor`.

El Distribución estable no expone un selector genérico equivalente para todos los tipos; sí contiene configuración visual específica para toldos y colores base de los objetos.

### Estado: `MEJORA FUTURA APROBADA`

No debe eliminarse necesariamente, pero tampoco debe contabilizarse como paridad del producto actual.

Primero paridad. Después decidimos cómo integrar esta mejora al lenguaje visual final.

---

# 28. Integración Mesas / Invitados

`modules/distribucion/index.js` ya contiene un puente moderno que normaliza:

- mesas 4–16;
- `round`, `square`, `rectangular`;
- `tableId`/`sharedTableId`;
- `seatId`;
- `seatNumber`;
- invitados asignados;
- creación/reconciliación de mesas entre ambos mundos;
- sincronización mediante storage/eventos/postMessage;
- propuestas legacy.

El renderer legacy no está a la misma altura del contrato de datos.

### Estado: `FRONTERA A PRESERVAR, NO A COPIAR AL LABORATORIO`

El laboratorio debe usar mocks con el modelo canónico de Fase 0. La integración real se realizará mucho después mediante adaptador.

---

# 29. Matriz resumida de paridad

| Área | Producto | Laboratorio | Estado | Prioridad |
|---|---|---|---|---|
| Canvas 1448×1086 | Sí | 1200×760 | DIFERENTE | P0 |
| Escala px/m | Sí | Sí | PARIDAD PARCIAL | P0 |
| Mesa física Ø1.83 m | Sí | Sí, pero escala con width | DIFERENTE | P0 |
| Clearance 3.4 m base | Sí | Sí | PARIDAD PARCIAL | P0 |
| Sillas orbit 1.33× | Sí | 1.58× | DIFERENTE | P0 |
| Etiquetas orbit 2.18× | Sí | Sí | PARIDAD PARCIAL | P0 |
| 10 sillas legacy | Sí | Sí | PARIDAD | P0 |
| Superposición círculo | Sí | Sí | PARIDAD PARCIAL | P0 |
| SAT rectángulos rotados | Sí | No | DIFERENTE | P0 |
| Tolerancias exactas | Sí | Distintas/no verificadas | DIFERENTE | P1 |
| Rojo por conflicto | Sí | Sí | PARIDAD | P0 |
| Margen 60 cm | Sí | Sí | PARIDAD CONCEPTUAL | P0 |
| Gestor riesgos | Sí | Sí | PARIDAD PARCIAL | P0 |
| Drag | Sí | Sí | PARIDAD PARCIAL | P1 |
| Multiselección | Sí | Sí | PARIDAD PARCIAL | P1 |
| Rotación | Sí | Sí | PARIDAD PARCIAL | P1 |
| Bloqueo | Sí | Sí | PARIDAD PARCIAL | P1 |
| Bug flechas bloqueadas | Sí | No copiar | BUG HEREDADO | P1 |
| Guías inteligentes | Sí con bug | Sí corregidas | BUG/MEJORA | P1 |
| Frente/fondo | Sí | Sí | PARIDAD PARCIAL | P1 |
| Alinear | Sí | Sí | PARIDAD PARCIAL | P1 |
| Copiar/pegar | Sí | Sí | PARIDAD PARCIAL | P1 |
| Undo/redo 80 | Sí | 60 | DIFERENTE | P1 |
| Capas | Sí | Sí | PARIDAD PARCIAL | P1 |
| CRUD maestro invitados visible | No | Sí | DIFERENTE | P0 |
| Editor de asientos | Sí | Sí | PARIDAD PARCIAL | P0 |
| Medición | Sí | Sí | PARIDAD PARCIAL | P1 |
| Toldo poligonal completo | Sí | Parcial | PARIDAD PARCIAL | P1 |
| Auto layout | Sí | Incompleto/falta | FALTA | P1 |
| Propuestas completas | Sí | Simplificadas | PARIDAD PARCIAL | P1 |
| Autosave real | Sí | Prohibido | AISLAMIENTO INTENCIONAL | — |
| Fondo por propuesta | Sí | Simulación | PARIDAD VISUAL PARCIAL | P2 |
| JSON import/export | Sí | Incompleto/falta | FALTA | P2 |
| Export imagen | Sí | Incompleto/falta | FALTA | P2 |
| Presentación | Sí | Sí | PARIDAD PARCIAL | P2 |
| Mobile sheets/FAB | Sí | No | FALTA | P0 antes de integrar |
| Color general en vivo | No | Sí | MEJORA FUTURA | después de paridad |
| 4–16 / 3 formas en contrato moderno | Sí | Aún no renderer final | EVOLUCIÓN FUTURA | después de paridad |

---

# 30. Backlog de bugs/deudas confirmadas

## D-BUG-01 — Guías horizontales usan X de otros objetos

**Prioridad:** alta.  
**Estado:** confirmado.  
**No copiar al nuevo motor.**

## D-BUG-02 — ArrowUp/ArrowDown modifican Y antes de validar bloqueo

**Prioridad:** alta.  
**Estado:** confirmado.  
**No copiar al nuevo motor.**

## D-DEBT-03 — Tolerancias de colisión expresadas en píxeles

**Prioridad:** media.  
**Estado:** confirmado.  
**Decisión futura:** expresar tolerancias físicas en metros o justificar tolerancia visual independiente de escala.

## D-DEBT-04 — Renderer legacy fijo a 10 asientos vs contrato moderno 4–16

**Prioridad:** crítica para evolución.  
**Estado:** confirmado.

## D-DEBT-05 — Diferencia semántica entre ocultar capa y métricas globales

**Prioridad:** media.  
**Estado:** confirmado; decisión funcional pendiente.

## D-DEBT-06 — Persistencia distribuida entre legacy, adaptador y recuperación de fondo

**Prioridad:** alta para integración futura, fuera del laboratorio actual.  
**Estado:** conocido; no refactorizar durante paridad.

---

# 31. Orden de trabajo derivado de la auditoría

## Paridad P0 — antes de cualquier mejora de mesa

1. Canvas 1448 × 1086.
2. Centro 724/543 y límites reales.
3. Mesa circular productiva exacta:
   - tablero físico fijo 0.915 m de radio;
   - clearance base 1.70 m de radio;
   - sillas orbitando 1.33×;
   - etiquetas 2.18×;
   - contrarrotación y anclajes originales.
4. Algoritmos de colisión equivalentes al legacy.
5. Regla adicional de 60 cm.
6. Gestor de riesgos equivalente.
7. Ocultar CRUD maestro de invitados del laboratorio.
8. Mantener editor de asientos.

## Paridad P1 — editor completo

9. Drag y multiselección equivalentes.
10. Rotación y handles.
11. Bloqueos sin copiar bugs.
12. Frente/fondo/alineación.
13. Guías inteligentes corregidas.
14. Capas.
15. Historial 80.
16. Copiar/pegar/duplicar/eliminar.
17. Medición.
18. Toldo completo.
19. Auto layout.
20. Propuestas simuladas en memoria.

## Paridad P2 — superficies auxiliares

21. Fondo en memoria.
22. JSON de sesión.
23. Export visual.
24. Presentación final.
25. Mobile sheets/FAB/zoom.

## Después de la paridad

26. Corrección formal de bugs heredados restantes.
27. Separación engine / renderer / UI / adapters.
28. Recién después: cuadrada, rectangular, 4–16, dimensiones físicas y nuevas reglas.

---

# 32. Gate de salida de Fase 1

La Fase 1 queda completa cuando:

- existe este inventario versionado;
- cada función productiva relevante está clasificada;
- las diferencias del laboratorio están identificadas;
- los bugs heredados están separados de la paridad;
- la integración de datos está marcada como frontera y no como parte del renderer;
- no se ha tocado persistencia productiva.

La **Fase 2** deberá convertir este inventario en una paridad verificable del laboratorio, empezando exclusivamente por los ítems P0.
