# Skill: debt

Úsala para registrar deuda técnica deliberada, soluciones temporales y riesgos conocidos que todavía no conviene resolver.

## Objetivo

Evitar que una solución temporal se vuelva permanente por olvido. Esta skill no obliga a refactorizar de inmediato: documenta qué quedó pendiente, por qué se aceptó y cómo debería resolverse más adelante.

## Qué registrar

Registrar deuda cuando exista alguno de estos casos:

- código heredado que sigue activo;
- wrappers, iframes o capas intermedias temporales;
- duplicación aceptada por compatibilidad;
- CSS o JS antiguo que todavía no puede retirarse;
- listeners, observers o rutas de navegación que conviene unificar después;
- solución provisional por riesgo de datos;
- dependencia temporal;
- workaround de responsive;
- componente visual pendiente de consolidación;
- estructura de datos que necesita migración futura.

## Formato obligatorio

Cada entrada debe contener:

- **ID**: `MGD-DEBT-###`;
- **Área**;
- **Estado**: abierto, mitigado o resuelto;
- **Prioridad**: baja, media, alta o crítica;
- **Qué existe hoy**;
- **Por qué se aceptó**;
- **Riesgo**;
- **Solución recomendada**;
- **Condición para resolverlo**;
- **Archivos relacionados**.

## Reglas

- No registrar como deuda algo que pueda corregirse de forma segura dentro de la tarea actual sin ampliar el alcance.
- No usar `debt` como excusa para dejar bugs críticos, pérdida de datos, vulnerabilidades o regresiones graves.
- Si una deuda se resuelve, actualizar su estado en vez de borrar su historial.
- Si aparece una solución temporal nueva, registrarla en `agent/DEBT.md` antes de cerrar la tarea.
- Antes de una refactorización grande, revisar `agent/DEBT.md`.

## Priorización

Orden recomendado:

1. riesgo de pérdida o corrupción de datos;
2. seguridad y autenticación;
3. navegación o estados globales duplicados;
4. bugs responsive recurrentes;
5. deuda que obliga a parchear repetidamente;
6. rendimiento;
7. limpieza y estética interna sin impacto visible.

## Cierre de deuda

Una entrada solo pasa a `resuelto` cuando:

- la implementación temporal fue retirada;
- no quedan consumidores ocultos;
- se verificó desktop y móvil si aplica;
- no se rompieron datos ni contratos;
- no se dejó una segunda implementación en paralelo.
