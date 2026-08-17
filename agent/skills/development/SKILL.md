# Skill: development

Úsala para implementar una funcionalidad o corrección.

## Flujo

1. Definir exactamente qué comportamiento debe cambiar y qué debe permanecer intacto.
2. Buscar implementación existente, dependencias y consumidores.
3. Elegir la ubicación correcta según `app_integral/ARCHITECTURE.md`.
4. Reutilizar antes de crear.
5. Implementar el cambio mínimo seguro.
6. Si reemplaza código previo, retirarlo de forma segura en vez de superponerlo.
7. Verificar navegación, estado, persistencia y responsive.
8. Ejecutar una revisión final con la skill `review`.

## Prohibido

- Duplicar módulos para evitar entender el existente.
- Crear una segunda UI encima de otra para ocultar errores.
- Añadir lógica grande inline en HTML.
- Cambiar contratos de datos por conveniencia visual.
- Añadir dependencias sin comprobar primero APIs nativas y dependencias ya instaladas.

## Entrega

Informar: archivos tocados, comportamiento cambiado, comportamiento preservado, riesgos y pruebas realizadas.
