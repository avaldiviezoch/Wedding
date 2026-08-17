# Skill: responsive

Úsala para cambios de layout, navegación, paneles, modales o componentes visuales.

## Comprobar

- 360 px, 390–430 px, tablet y escritorio.
- Scroll vertical y horizontal.
- Menú hamburguesa y cierres de paneles.
- Modales, overlays y elementos `fixed`/`sticky`.
- Contenedores con `height`, `max-height` u `overflow` que puedan bloquear contenido.
- Texto, botones e inputs sin recortes.
- Imágenes y videos con proporciones correctas.
- Touch targets utilizables en móvil.

## Reglas

- Evitar duplicar una versión móvil y otra desktop salvo arquitectura heredada inevitable.
- Preferir una implementación responsive compartida.
- No usar `overflow:hidden` global para ocultar un problema de layout.
- No resolver recortes ampliando arbitrariamente alturas fijas.
- Si se cambia navegación o scroll, verificar todos los módulos, no solo el visible.

## Resultado

Indicar qué breakpoints se verificaron, qué problemas se detectaron y si el comportamiento heredado desktop/móvil sigue activo.
