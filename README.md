# Wedding / Mi Gran Día

Repositorio principal del proyecto **Mi Gran Día**, el planificador integral de bodas de Antonio & Lucero, junto con las invitaciones digitales oficiales.

## Fuentes de verdad

- `app_integral/` — producto principal **Mi Gran Día / Applu**.
- `invitaciones/` — cinco invitaciones digitales oficiales, cada una autosuficiente en su propia carpeta.
- `design-system/` — sistema visual y reglas de UI/UX.
- `agent/` — documentación técnica, skills y deuda técnica del agente de mantenimiento.
- `docs/` — índice, reglas de organización, despliegue, QA y mantenimiento del repositorio.

## Entradas públicas

- `applu.html` — entrada pública compatible de Mi Gran Día. Usa `<base href="app_integral/">` y carga el producto desde `app_integral/`.
- `invitaciones/invitacion_1/` ... `invitaciones/invitacion_5/` — entradas públicas de cada invitación mediante su `index.html`.

## Regla de organización

1. El código y assets de Mi Gran Día deben vivir en `app_integral/`.
2. Los recursos exclusivos de una invitación deben vivir dentro de su propia carpeta `invitaciones/invitacion_N/`.
3. No duplicar imágenes, videos, audios, HTML, CSS o JS en la raíz si ya existe una fuente canónica.
4. La raíz solo conserva entradas públicas, configuración global, documentación global y archivos que deban mantener alcance raíz.
5. Los archivos `legacy` se conservan solo por compatibilidad o migración; no son destino para desarrollo nuevo.

## Documentación

- `docs/REPOSITORY_INDEX.md` — mapa completo del repositorio.
- `docs/MAINTENANCE.md` — reglas para cambios, limpieza, refactor y respaldo.
- `docs/QA_CHECKLIST.md` — checklist mínimo antes de publicar.
- `app_integral/ARCHITECTURE.md` — arquitectura del producto principal.
- `design-system/MASTER.md` — fuente visual de verdad.
- `AGENTS.md` — reglas obligatorias para agentes y mantenimiento asistido.

## Estado de limpieza

En agosto de 2026 se consolidaron las invitaciones 1–5 dentro de `invitaciones/` y se eliminaron de la raíz copias exactas verificadas por SHA. La política desde ese punto es **una sola fuente de verdad por recurso**.
