# Skill: visual-system

Úsala para cualquier cambio visual, de composición, UI, interacción, microinteracción o consistencia entre módulos.

## Objetivo

Mantener una identidad visual coherente en Mi Gran Día sin volver la interfaz genérica. La simplificación debe reducir duplicación técnica, no personalidad visual.

## Regla principal

Mismo propósito visual = mismo patrón visual.

Antes de crear un botón, tarjeta, modal, input, badge, toolbar, navegación, estado activo, loader o mensaje, buscar primero si ya existe un equivalente reutilizable en el producto.

## Modos de intervención

### NORMAL
Usar por defecto. Corregir o ajustar sin rediseñar la pantalla.

- conservar estructura y lenguaje visual actuales;
- cambiar solo lo necesario;
- no crear una segunda versión visual del mismo componente;
- no reinterpretar una corrección como un rediseño.

### REFINE
Usar cuando se pida mejorar estética, claridad o pulido sin cambiar la identidad.

- mejorar jerarquía, espaciado, proporciones, tipografía y estados;
- reutilizar componentes existentes;
- reducir inconsistencias entre módulos;
- mantener la arquitectura y comportamiento conocidos.

### REDESIGN
Usar solo cuando el usuario pida explícitamente replantear una pantalla o flujo.

- se puede cambiar composición y estructura visual;
- definir qué implementación anterior será retirada;
- no superponer el rediseño encima de la UI antigua;
- preservar datos, contratos y funcionalidad salvo instrucción explícita.

Si el usuario no indica modo, asumir NORMAL.

## Consistencia obligatoria

Revisar y reutilizar patrones existentes para:

- botones primarios y secundarios;
- tarjetas y paneles;
- bordes, radios y sombras;
- títulos, subtítulos y texto auxiliar;
- inputs, selects y textareas;
- modales, drawers y overlays;
- navegación superior y estados activos;
- loaders, estados vacíos, éxito, advertencia y error;
- iconografía;
- spacing y densidad;
- hover, focus, active y disabled;
- animaciones y transiciones.

## Jerarquía visual

Toda pantalla debe tener una lectura clara:

1. contexto o título;
2. información principal;
3. contenido o controles;
4. acción principal;
5. acciones secundarias.

Evitar competir por atención con múltiples colores, sombras, animaciones o CTAs equivalentes.

## Animaciones

- Deben comunicar transición, estado o relación entre elementos.
- No deben bloquear navegación, scroll ni interacción.
- Evitar animaciones decorativas repetidas en controles funcionales.
- Respetar `prefers-reduced-motion` cuando sea razonable.
- Evitar flashes de interfaces antiguas durante carga o reemplazo.

## Responsive visual

Todo cambio visual debe funcionar en móvil estrecho (~360 px), móvil común (~390–430 px), tablet y escritorio.

En móvil priorizar:

- legibilidad;
- áreas táctiles suficientes;
- scroll natural;
- jerarquía vertical;
- ausencia de controles cortados;
- evitar nested scroll salvo que sea realmente necesario.

## Regla anti-duplicación visual

Nunca resolver una inconsistencia creando otra variante casi idéntica.

Si ya existen dos o más variantes del mismo patrón, preferir converger hacia una sola implementación reusable cuando el alcance lo permita.

## Antes de entregar

Comprobar:

- que la pantalla siga perteneciendo visualmente a Mi Gran Día;
- que no aparecieron variantes innecesarias;
- que el cambio no rompió responsive;
- que un módulo no se sienta como otra aplicación;
- que no haya flashes, saltos de layout, overlays persistentes o estados activos pegados;
- que la simplificación no haya eliminado personalidad, información o microinteracciones útiles.
