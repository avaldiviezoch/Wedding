# Mantenimiento del repositorio

## Objetivo

Mantener **Mi Gran Día** y las invitaciones con una sola fuente de verdad, sin regresiones, sin pérdida de datos y sin acumular parches.

## Antes de modificar

1. Identificar la fuente canónica del archivo.
2. Revisar referencias HTML/CSS/JS y workflows.
3. Si toca datos, revisar autenticación, Firestore/Firebase y almacenamiento local.
4. Si toca UI, revisar `design-system/MASTER.md`.
5. Si toca arquitectura, revisar `app_integral/ARCHITECTURE.md`.

## Limpieza segura

No borrar por nombre. Para eliminar un archivo duplicado:
- confirmar copia canónica;
- comparar SHA o contenido;
- verificar que ninguna ruta pública, workflow o script dependa de la copia;
- migrar referencias si existe dependencia;
- recién después eliminar.

## Mi Gran Día

- `app_integral/` es la fuente de verdad.
- La raíz puede tener una entrada pública compatible, pero no una segunda implementación completa.
- Nueva lógica: `js/core`, `js/services`, `js/modules`.
- Nuevos estilos: `css/core`, `css/modules`.
- No agregar desarrollo nuevo a `legacy` salvo corrección mínima indispensable.

## Invitaciones

- Cada invitación debe ser autocontenida.
- Sus imágenes, audios y videos deben resolverse desde `invitaciones/invitacion_N/`.
- No usar assets duplicados de la raíz.
- El `index.html` de cada invitación es su entrada pública y puede actuar como capa de compatibilidad móvil.
- La entrada audiovisual no debe mostrar controles nativos, icono Play ni pantalla vacía antes de la interacción.

## Refactor

Cuando se reemplaza una implementación:
1. localizar la anterior;
2. identificar consumidores;
3. migrar consumidores;
4. retirar la anterior si ya no tiene uso;
5. comprobar que no queden dobles listeners, estilos superpuestos, flash de UI vieja o doble estado.

## Datos

Nunca cambiar sin plan explícito:
- nombres de colecciones;
- campos Firestore;
- IDs persistentes;
- claves localStorage/sessionStorage;
- contratos entre invitados, mesas y distribución.

Toda migración destructiva requiere respaldo y plan de reversión.

## Git / commits

Preferir commits pequeños y descriptivos. Para limpiezas amplias:
- hacer primero auditoría;
- conservar historial en Git;
- evitar mezclar limpieza con rediseños funcionales.

## Documentación obligatoria

Actualizar documentación cuando cambie:
- estructura de carpetas;
- entrada pública;
- fuente de verdad;
- workflow;
- integración Firebase;
- contrato entre módulos;
- comportamiento móvil relevante.

## Regla de cierre

Una tarea no se considera terminada hasta revisar:
- consola JS;
- navegación;
- scroll;
- responsive;
- persistencia;
- rutas de assets;
- referencias rotas;
- duplicados creados durante el cambio.
