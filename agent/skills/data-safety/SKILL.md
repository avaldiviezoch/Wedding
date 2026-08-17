# Skill: data-safety

Úsala siempre que una tarea toque Firebase, Firestore, autenticación, storage, localStorage o sessionStorage.

## Antes de cambiar

- Identificar todas las lecturas y escrituras afectadas.
- Documentar colecciones, documentos, campos, claves e IDs usados.
- Comprobar qué módulos consumen esos datos.
- Distinguir datos locales, remotos y derivados.

## Reglas

- No renombrar campos, colecciones, IDs o claves sin instrucción explícita y plan de migración.
- No borrar ni sobrescribir datos para simplificar una UI.
- No introducir una segunda fuente de verdad para el mismo dato.
- No cambiar autenticación o permisos como efecto secundario de una refactorización visual.
- Mantener compatibilidad con datos ya guardados siempre que sea posible.
- No exponer secretos nuevos en cliente.

## Validación

Comprobar carga inicial, edición, guardado, recarga, cierre/inicio de sesión y comportamiento cuando faltan datos. Si existe riesgo de pérdida o incompatibilidad, detener la modificación y reportarlo antes de escribir.
