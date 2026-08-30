# Tarea 9C — Editorial Command Shell y Dashboard

Estado: implementación productiva visual en revisión.

## Alcance aplicado

- `body.mgd-v2` activa la foundation V2 únicamente para el shell y Home de `app_integral/applu.html`.
- La navegación conserva los hashes y contratos `data-module` existentes; el controlador nuevo delega en los enlaces actuales.
- Home usa solo la fecha de boda ya existente en `planificador_bodas_fecha_v1` y accesos a módulos reales. No calcula ni presenta métricas, prioridades o datos inventados.
- Los módulos siguen montándose en iframes dentro de `#unifiedWorkspace`; sus interiores (incluidos Invitados y Mesas) no reciben la cascada del shell.

## Límite de runtime

El drawer móvil del shell usa un controlador UI aislado: estado ARIA, Escape y restauración de foco. La autenticación, sus overlays y su hardening existente no se modifican. No se añadió un sistema global de overlays.

## QA local

- Home: 360, 390, 430, 768, 1024 y 1440 sin overflow horizontal ni objetivos visibles menores de 44px.
- Drawer móvil: apertura/cierre, Escape y foco restaurado al disparador.
- Consola local: sin errores ni advertencias.
- Movimiento: transición limitada a `transform`/`opacity`; `prefers-reduced-motion` la desactiva.

## Fuera de alcance

No se modifican Firebase, Firestore, Rules, Auth, RSVP, Mesas, datos, rutas públicas, dependencias ni deploy.
