# Mi Gran Día — Design System MASTER

Este documento es la fuente visual principal del producto. Complementa `AGENTS.md`, `agent/skills/visual-system/SKILL.md` y las reglas responsive/data-safety.

## 1. Principio de diseño

Mi Gran Día debe sentirse elegante, cálido, premium y personal, sin perder claridad ni velocidad. La experiencia puede ser visualmente rica, pero nunca a costa de legibilidad, navegación, responsive, accesibilidad o rendimiento.

Antes de crear un componente nuevo: buscar, reutilizar, extender y solo entonces crear.

## 2. Modos de cambio visual

### NORMAL — por defecto
Corregir sin rediseñar. Mantener composición, identidad, jerarquía y comportamiento. Usar para bugs, responsive, estados, textos, links y pequeños ajustes.

### REFINE
Mejorar estética sin cambiar la identidad ni el flujo. Puede ajustar espaciado, jerarquía, proporciones, sombras, transiciones, tipografía e iconografía.

### REDESIGN
Permitido solo cuando el usuario lo pide explícitamente. Puede replantear composición, agrupación visual y jerarquía, pero debe preservar datos, funciones, navegación y responsive.

## 3. Personalidad visual

Palabras guía: elegante, romántico adulto, orgánico, editorial, cálido, íntimo, premium, sobrio.

Evitar: infantil, genérico SaaS, neón, degradados morado/rosa tipo IA, glassmorphism excesivo, sombras duras, animaciones llamativas sin propósito, exceso de pills, exceso de colores simultáneos.

## 4. Paleta maestra

La paleta parte de valores ya usados en el aplicativo.

- `--mgd-ink: #0b0b0b` — fondo oscuro principal.
- `--mgd-white: #ffffff` — texto/superficie clara.
- `--mgd-olive: #7f8962` — color de identidad principal para estados activos y acciones de producto.
- `--mgd-olive-light: #a3ad83` — acento, eyebrow, hover suave y estados secundarios.
- `--mgd-beige: #ddd3c2` — superficie cálida, hover claro y contraste editorial.
- `--mgd-rose: #b17782` — acento romántico secundario, especialmente invitaciones y momentos emocionales; no debe reemplazar al oliva como identidad global.
- `--mgd-text-dark: #2f302b` — texto sobre superficies claras.
- `--mgd-muted-dark: #74716d` — texto secundario sobre claro.
- `--mgd-line-light: #e5dfdc` — bordes claros.
- `--mgd-surface: #ffffff` — tarjetas de módulos en contexto claro.
- `--mgd-surface-soft: #faf9f8` — toolbar, filtros y superficies secundarias.

En fondos oscuros:
- texto primario blanco;
- texto secundario `rgba(255,255,255,.66)`;
- bordes `rgba(255,255,255,.14)`;
- superficies translúcidas entre `.035` y `.09` de blanco.

No introducir un nuevo color de marca sin justificarlo en este archivo.

## 5. Tipografía

### Producto / aplicación
Usar una sans-serif limpia y de sistema: `Inter, "Segoe UI", Arial, sans-serif`.

### Títulos editoriales o emocionales
Puede usarse una serif elegante como `Georgia, "Times New Roman", serif` cuando el módulo ya tenga lenguaje editorial o romántico.

### Invitaciones
Las invitaciones pueden usar tipografías decorativas propias porque son contenido creativo, no UI de producto. No trasladar esas tipografías a botones, formularios o navegación global.

Reglas:
- no usar más de dos familias tipográficas funcionales en una pantalla de producto;
- títulos deben envolver naturalmente; nunca depender de que una palabra quede en una línea concreta;
- textos esenciales no se cortan con `overflow:hidden`;
- inputs móviles usan al menos 16px para evitar zoom involuntario en iOS.

## 6. Jerarquía

Orden recomendado:
1. eyebrow o contexto pequeño;
2. título principal;
3. descripción breve;
4. contenido / tarjetas / datos;
5. acción principal;
6. acción secundaria.

No usar tamaño, peso, color y sombra todos a la vez para crear jerarquía. Preferir primero espaciado, tamaño y peso.

## 7. Espaciado

Escala base sugerida: 4, 8, 12, 16, 20, 24, 32, 40, 48.

- interior compacto: 8–12px;
- tarjetas: 14–20px;
- separación de grupos: 18–28px;
- secciones grandes: 32–48px.

No crear valores arbitrarios si uno de la escala resuelve el caso.

## 8. Radios y superficies

Familias:
- controles pequeños: 10–12px;
- tarjetas: 14–18px;
- paneles grandes: 18–24px;
- botones circulares: `999px` solo cuando realmente son pills/círculos.

Evitar que cada módulo invente un radio distinto.

## 9. Sombras

Sombras suaves, amplias y de baja opacidad.

- tarjeta clara: `0 12px 30px rgba(63,48,51,.07)`;
- elemento flotante oscuro: `0 10px 28px rgba(0,0,0,.18)`;
- panel lateral: `-20px 0 50px rgba(0,0,0,.22)`.

No usar sombras negras duras ni múltiples capas decorativas sin función.

## 10. Botones

### Principal
- fondo oliva `#7f8962` o color contextual aprobado;
- texto blanco;
- radio 10–12px o pill si el patrón existente lo requiere;
- hover/focus perceptible, no agresivo.

### Secundario
- fondo blanco o transparente;
- borde suave;
- texto oscuro;
- hover con beige o superficie cálida.

### Peligro
- rojo solo para acciones destructivas reales.

Todo botón debe tener:
- estado hover cuando aplique;
- focus visible;
- active/pressed;
- disabled cuando aplique;
- cursor pointer;
- área táctil cómoda, idealmente 44px de alto en móvil para acciones principales.

## 11. Navegación de módulos

- un solo módulo activo visualmente a la vez;
- estado activo global controlado por `data-quick-module` / `data-module`;
- módulos futuros deben heredar la misma lógica, no implementar su propio active;
- la barra debe permitir scroll horizontal en móvil sin bloquear scroll vertical del contenido;
- no mantener estados verdes de módulos anteriores.

## 12. Tarjetas

Una tarjeta debe representar una agrupación real de información o acción. No envolver cada texto en una tarjeta por decoración.

Patrón claro recomendado:
- fondo blanco;
- borde `#e5dfdc`;
- radio 14–18px;
- sombra baja;
- título de 11–16px según jerarquía;
- contenido secundario más tenue.

## 13. Formularios

- labels visibles cuando el campo no sea autoexplicativo;
- placeholders no sustituyen labels esenciales;
- errores junto al campo;
- focus visible;
- inputs de 16px en móvil;
- no truncar correos, nombres o valores importantes;
- no depender del color únicamente para indicar error/éxito.

## 14. Iconos

Preferir SVG consistente antes que emojis como iconos funcionales. Mantener un mismo peso visual de stroke por pantalla.

No mezclar cinco familias de iconos en un mismo módulo.

## 15. Animación y microinteracción

Las animaciones deben explicar una transición, confirmar una acción o dar continuidad espacial.

Tiempos orientativos:
- microinteracción: 120–200ms;
- panel/modal: 220–360ms;
- entradas decorativas: solo si aportan valor y no bloquean.

Respetar `prefers-reduced-motion`.

Evitar:
- loops decorativos intensos en UI funcional;
- animación que impida hacer clic;
- flashes de UI anterior;
- transiciones distintas para componentes equivalentes.

## 16. Responsive

Verificación mínima:
- 360px;
- 390–430px;
- 768px;
- 1024px;
- 1440px.

Reglas:
- contenido esencial debe reflow, no cortarse;
- chips/badges deben envolver o tener estrategia `+n`;
- tablas pueden usar scroll horizontal controlado;
- nunca bloquear scroll del módulo con `overflow:hidden` global sin causa;
- fixed/sticky no debe cubrir controles ni contenido;
- respetar safe areas de iOS;
- touch targets cómodos;
- no duplicar markup desktop/móvil si CSS puede resolverlo.

## 17. Estados

Todo componente interactivo relevante debe considerar: default, hover, focus, active, disabled, loading, empty, error, success.

El estado no puede depender solo del color. Usar texto, icono, forma o cambio de contenido cuando sea necesario.

## 18. Accesibilidad mínima

- contraste de texto normal objetivo 4.5:1;
- focus visible;
- botones y enlaces con nombre accesible;
- modales con semántica correcta;
- teclado utilizable;
- reduced motion;
- textos y badges resistentes a zoom y escalado;
- imágenes informativas con alt adecuado.

## 19. Anti-patrones de Mi Gran Día

No:
- rediseñar una pantalla por un bug puntual;
- crear otro componente encima del viejo para ocultarlo;
- usar `!important` como primera solución;
- agregar una paleta nueva por módulo sin razón;
- convertir toda la aplicación a una estética genérica de dashboard;
- usar degradados AI purple/pink;
- usar glassmorphism en todo;
- ocultar overflow para tapar problemas;
- crear botones futuros con lógica visual propia si ya existe el patrón global;
- sacrificar claridad por decoración romántica.

## 20. Flujo antes de entregar UI

1. Identificar modo NORMAL / REFINE / REDESIGN.
2. Revisar componente existente equivalente.
3. Reutilizar tokens y patrones de este MASTER.
4. Implementar la mínima solución completa.
5. Revisar hover/focus/active/loading/error.
6. Revisar 360, 390–430, 768, 1024 y 1440.
7. Comprobar scroll, navegación y overlays.
8. Revisar que no haya flashes, duplicaciones ni código anterior ejecutándose.
9. Registrar deuda en `agent/DEBT.md` si se acepta conscientemente una solución temporal.

## 21. Excepciones por módulo

Una excepción debe vivir en `design-system/modules/<modulo>.md` y explicar:
- qué cambia respecto a MASTER;
- por qué;
- si es temporal o permanente;
- qué elementos siguen heredando MASTER.

Si no existe archivo de módulo, aplica MASTER completo.
