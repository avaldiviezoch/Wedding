# Skill: audit

Úsala para revisar el proyecto completo antes de una refactorización importante o de forma periódica. No modificar código durante la auditoría.

## Áreas

1. Arquitectura: código fuera de la estructura definida, mezcla entre `legacy` y módulos nuevos, múltiples fuentes de verdad.
2. Duplicación: funciones, componentes, estilos, listeners, consultas y assets repetidos.
3. Código obsoleto: implementaciones antiguas que siguen cargando, parches superpuestos, archivos sin consumidores.
4. Datos: escrituras destructivas, claves inconsistentes, persistencia duplicada, riesgo de sobrescritura.
5. Responsive: overlays, scroll bloqueado, anchos fijos, controles fuera del viewport.
6. Rendimiento: recursos pesados, cargas repetidas, listeners/timers acumulativos y consultas redundantes.
7. Seguridad: secretos, validaciones solo del cliente, reglas de acceso débiles o datos sensibles expuestos.

## Salida

Crear un informe priorizado con gravedad, archivo o módulo, evidencia, impacto, propuesta, esfuerzo estimado y riesgo de aplicar el cambio. Separar limpieza segura de refactorizaciones que necesitan pruebas o migración.
