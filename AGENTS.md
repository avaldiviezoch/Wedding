# AGENTS.md — Mi Gran Día

Estas instrucciones aplican a todo el repositorio. El producto principal es `app_integral/`.

## Objetivo

Mejorar Mi Gran Día sin romper funcionalidades, sin perder datos y sin acumular capas de código innecesarias. Se permite una experiencia visual rica; la simplificación nunca debe degradar UX, animaciones, accesibilidad, seguridad o persistencia.

## Prioridades

1. No perder datos de usuarios.
2. No romper funcionalidades existentes.
3. Reutilizar antes de crear.
4. Eliminar o retirar de forma segura la implementación reemplazada; no montar una interfaz nueva encima de la vieja.
5. Mantener una sola fuente de verdad para estado, navegación y datos.
6. Preservar identidad visual, responsive y microinteracciones.

## Antes de programar

- Identificar todos los archivos implicados: HTML, CSS, JS, listeners, estado y persistencia.
- Buscar una implementación existente antes de crear otra.
- Preferir extender código actual o usar APIs nativas antes de añadir dependencias.
- Revisar `app_integral/ARCHITECTURE.md` y respetar su estructura.
- Si el cambio toca Firebase/Firestore/auth/storage, identificar primero la ruta de lectura y escritura.

## Arquitectura obligatoria

- No agregar bloques grandes de CSS o JavaScript directamente en HTML.
- Código nuevo debe ir en `app_integral/css/core`, `app_integral/css/modules`, `app_integral/js/core`, `app_integral/js/services` o `app_integral/js/modules` según corresponda.
- `legacy` es temporal. No agregar nueva lógica a `legacy` salvo corrección mínima indispensable.
- `appludesktop.html` y `applumovil.html` son vistas heredadas mientras se consolida una interfaz responsive única; no duplicar una funcionalidad nueva en ambas salvo necesidad explícita.

## Regla anti-superposición

Nunca solucionar un problema agregando una segunda implementación sobre la anterior.

Cuando una UI, función, listener o flujo sea reemplazado:
1. localizar la implementación anterior;
2. determinar si aún tiene consumidores;
3. migrar consumidores si es necesario;
4. retirar el código obsoleto cuando sea seguro;
5. comprobar que no queden flashes visuales, dobles listeners, elementos duplicados ni estilos en conflicto.

## Datos y seguridad

- No cambiar nombres de colecciones, documentos, campos, IDs, claves de localStorage/sessionStorage ni contratos de datos sin instrucción explícita.
- No borrar datos ni introducir migraciones destructivas sin plan y respaldo.
- Mantener autenticación y reglas de acceso separadas de la UI.
- Nunca incrustar secretos nuevos en el cliente.

## Responsive

Todo cambio visual debe revisarse al menos en:
- móvil estrecho (~360 px),
- móvil común (~390–430 px),
- tablet,
- escritorio.

Evitar anchos fijos innecesarios, overlays que bloqueen scroll, `overflow:hidden` global sin justificación y controles fuera del viewport.

## Rendimiento

- Evitar listeners duplicados, timers huérfanos y observers sin cleanup.
- Evitar consultas repetidas cuando una lectura puede reutilizarse.
- No cargar librerías para algo que HTML/CSS/JS nativo ya resuelve bien.
- No duplicar assets pesados si el mismo recurso ya existe.

## Finalización de una tarea

Antes de dar por terminado un cambio:
- revisar consola y errores JS;
- comprobar navegación y menú;
- comprobar scroll y modales;
- comprobar desktop y móvil;
- comprobar persistencia si el módulo guarda datos;
- buscar código viejo, CSS superpuesto y listeners duplicados;
- resumir archivos modificados, riesgo y pruebas realizadas.

## Regla de prudencia

Si una refactorización amplia no es necesaria para cumplir la tarea, no hacerla. Preferir el cambio mínimo seguro, no el menor número de líneas a cualquier costo.
