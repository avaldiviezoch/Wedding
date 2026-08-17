# Skill: review

Úsala después de cambios funcionales o visuales. Por defecto no modifica código: primero informa.

## Revisar

- Código duplicado o nueva lógica que ya existía.
- CSS superpuesto, selectores redundantes y reglas que solo esconden una implementación vieja.
- Elementos DOM duplicados o IDs repetidos.
- Event listeners repetidos o registrados varias veces.
- Timers, observers o callbacks sin cleanup.
- Funciones reemplazadas que aún quedan activas.
- Código muerto o ramas que ya no pueden ejecutarse.
- Dependencias nuevas evitables.
- Regresiones de menú, scroll, modales, navegación y responsive.
- Cambios accidentales en persistencia, claves o contratos de datos.

## Clasificación

Reportar hallazgos como:
- CRÍTICO: riesgo de pérdida de datos, bloqueo o seguridad.
- ALTO: regresión funcional o duplicación activa.
- MEDIO: deuda técnica que puede generar bugs.
- BAJO: simplificación o limpieza opcional.

Para cada hallazgo indicar archivo, evidencia, impacto y corrección sugerida. No corregir automáticamente salvo instrucción explícita.
