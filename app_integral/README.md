# App Integral de Bodas — Mi Gran Día

`app_integral/` es la **fuente de verdad del producto Mi Gran Día / Applu**.

La raíz del repositorio puede conservar entradas públicas de compatibilidad, pero el código funcional, estilos, servicios y módulos del producto deben vivir aquí.

## Entradas

- `applu.html` — shell principal actual.
- `appludesktop.html` — vista heredada de escritorio mientras se consolida una interfaz responsive única.
- `applumovil.html` — vista heredada móvil mientras se consolida una interfaz responsive única.
- `legacy_snapshots/` — copias históricas resguardadas de antiguas entradas de raíz; no son fuente de desarrollo.

## CSS

- `css/legacy/` — CSS existente pendiente de migración.
- `css/core/` — variables, layout y componentes globales.
- `css/modules/` — estilos separados por módulo funcional.

## JavaScript

- `js/legacy/` — JavaScript heredado todavía no migrado.
- `js/core/` — arranque, router, estado, eventos y utilidades DOM.
- `js/services/` — Firebase, autenticación, Firestore, almacenamiento y persistencia.
- `js/modules/` — lógica de negocio separada por dominio.

## Módulos

- dashboard
- checklist
- presupuesto
- proveedores
- invitados
- distribución
- cronograma
- invitaciones (gestión; las plantillas viven en `/invitaciones`)
- música
- documentos
- configuración

## Reglas obligatorias

1. No crear una segunda implementación de Mi Gran Día en la raíz.
2. No agregar bloques grandes de CSS o JS directamente en HTML.
3. Código nuevo debe ubicarse en `core`, `services` o el módulo correspondiente.
4. `legacy` y `legacy_snapshots` se mantienen solo para compatibilidad/migración; no son destino de desarrollo nuevo.
5. No cambiar contratos de datos, IDs persistentes, colecciones Firestore ni claves de almacenamiento sin plan y respaldo.
6. Invitados, mesas y distribución deben conservar una única fuente de datos y sus vínculos.
7. Todo cambio visual debe respetar `../design-system/MASTER.md`.

## Compatibilidad de URLs antiguas

Las antiguas rutas raíz `appludesktop.html` y `applumovil.html` deben actuar únicamente como redirecciones hacia las versiones de `app_integral/`. Las versiones históricas previas a esa consolidación están archivadas en `legacy_snapshots/`.

## Documentación relacionada

- `ARCHITECTURE.md` — arquitectura detallada.
- `../docs/REPOSITORY_INDEX.md` — mapa global del repositorio.
- `../docs/MAINTENANCE.md` — reglas de mantenimiento y limpieza.
- `../docs/QA_CHECKLIST.md` — QA mínimo antes de publicar.
- `../AGENTS.md` — reglas globales para mantenimiento asistido.
