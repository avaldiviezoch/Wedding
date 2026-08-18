# Índice del repositorio

Este documento define dónde debe vivir cada tipo de archivo y cuál es su fuente de verdad.

## Raíz `/`

Debe contener únicamente:

- entradas públicas compatibles (`applu.html`, `index.html` cuando aplique);
- configuración global (`firebase.json`, `.firebaserc`);
- configuración GitHub (`.github/`);
- reglas globales (`AGENTS.md`);
- documentación principal (`README.md`);
- archivos cuyo alcance técnico deba ser raíz, por ejemplo un service worker con scope global.

No usar la raíz como carpeta de assets de invitaciones ni como lugar de trabajo temporal.

## `app_integral/` — Mi Gran Día / Applu

Fuente de verdad del producto principal.

### Entradas
- `applu.html` — shell principal.
- `appludesktop.html` — vista heredada de escritorio mientras termina la consolidación responsive.
- `applumovil.html` — vista heredada móvil mientras termina la consolidación responsive.

### CSS
- `css/core/` — variables, layout y componentes globales.
- `css/modules/` — estilos por módulo.
- `css/legacy/` — estilos heredados pendientes de migración.

### JavaScript
- `js/core/` — bootstrap, router, navegación, estado y utilidades.
- `js/services/` — Firebase, autenticación, Firestore, storage y persistencia.
- `js/modules/` — lógica de negocio por módulo.
- `js/legacy/` — implementación heredada en proceso de migración.

### Módulos funcionales
- dashboard
- checklist
- presupuesto
- proveedores
- invitados
- distribución
- cronograma
- invitaciones (gestión, no plantillas)
- música
- documentos
- configuración

### Regla
Toda nueva lógica de Mi Gran Día debe entrar aquí. No crear una segunda implementación en la raíz.

## `invitaciones/` — invitaciones oficiales

Cada invitación es autocontenida y debe leer sus recursos desde su propia carpeta.

- `invitacion_1/`
- `invitacion_2/`
- `invitacion_3/`
- `invitacion_4/`
- `invitacion_5/`

Cada carpeta puede contener:
- `index.html` como entrada pública;
- HTML base o de trabajo de esa invitación;
- imágenes;
- GIF/WebP;
- videos;
- audios;
- fuentes o assets exclusivos.

No volver a copiar esos recursos a la raíz.

## `design-system/`

Fuente visual de verdad de Mi Gran Día. `MASTER.md` define paleta, tipografía, espaciado, componentes, estados, responsive y anti-patrones.

## `agent/`

Documentación y reglas para mantenimiento asistido:
- skills;
- auditoría;
- data safety;
- responsive;
- desarrollo;
- revisión;
- deuda técnica.

## `docs/`

Documentación transversal del repositorio:
- `REPOSITORY_INDEX.md` — este mapa.
- `MAINTENANCE.md` — mantenimiento, limpieza y reglas de refactor.
- `QA_CHECKLIST.md` — validaciones mínimas antes de publicar.

## `.github/`

Workflows y automatizaciones del repositorio. Antes de borrar una entrada de la raíz, revisar si algún workflow la modifica o publica.

## Archivos `legacy`

`legacy` significa compatibilidad/migración, no fuente principal para funciones nuevas. Cuando se retire una pieza legacy:
1. verificar consumidores;
2. migrar referencias;
3. probar desktop y móvil;
4. comprobar persistencia;
5. retirar el archivo solo después.

## Política de duplicados

Un archivo solo puede eliminarse como duplicado cuando:
- existe copia canónica;
- la igualdad está confirmada por SHA o contenido;
- no existe una referencia activa que dependa de la ruta antigua, o se migra esa referencia primero.

Nunca borrar por parecido de nombre.
