# Design System V2 — Implementación productiva

Estado: foundation implementada; migración de módulos no iniciada.

## Estructura y aislamiento

`app_integral/css/v2/mgd-v2.css` usa capas `mgd.tokens`, `mgd.base`, `mgd.components` y `mgd.utilities`. Todos los selectores están bajo `body.mgd-v2`; cargar el archivo sin esa clase no modifica legacy. No hay fuentes externas, dependencias ni `!important`.

## Inventario

Tokens semánticos de color, tipografía Georgia/Segoe UI, spacing, radios, elevación, z-index, focus y motion. Componentes: Button/IconButton, FormField/Input/Select/Textarea/Checkbox, Badge/Status, Alert, Toast, Surface/Panel/Card, Tabs, EmptyState, Skeleton, Spinner/Progress, Modal y Sheet. La galería mock está en `prototypes/design-system-v2/`.

## Uso futuro

1. Añadir `mgd-v2` solo a la boundary del módulo aprobado.
2. Reemplazar presentación gradualmente, preservando DOM y comportamiento requerido.
3. No alterar contratos, IDs, persistencia, rutas ni auth.
4. Validar tests, teclado, foco, 360/390/430/768/1024/1440 y reduced motion.
5. Migrar por PR separado; 9B no migra módulos.

## Accesibilidad y motion

Focus `:focus-visible` contrastado, controles de 44px, labels persistentes, errores asociados y `aria` en markup de ejemplo. Motion usa transform/opacity y tokens 140/200/280ms; `prefers-reduced-motion` reduce transiciones y animaciones. La galería incluye un Sheet estático visible para revisar backdrop tonal, header, cierre, cuerpo, footer, safe-area, radio, elevación, altura máxima y overflow.

Modal y Sheet de 9B son foundations visuales/estructurales. El runtime de overlays reutilizará e integrará el contrato existente durante 9C: Escape, focus trap, restore focus, `inert` y `aria` cuando aplique. Se prueba al migrar overlays reales; no es lógica faltante dentro del alcance de 9B y aquí no se crea un sistema JS global.

## Límites conocidos

No se ha cargado V2 en shell ni módulos, no existe runtime de toast/modal, y no se cambió ninguna lógica. La siguiente tarea puede adoptar las clases en una superficie explícitamente aprobada.
