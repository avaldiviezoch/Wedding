# Sistema de agentes — Mi Gran Día

Este directorio complementa `AGENTS.md` con guías especializadas para tareas recurrentes.

## Skills

- `development`: implementar cambios con alcance controlado.
- `review`: revisar cambios recientes sin modificar código.
- `audit`: auditar el repositorio completo y priorizar deuda/riesgos.
- `responsive`: revisar comportamiento móvil, tablet y escritorio.
- `data-safety`: proteger autenticación, Firestore y almacenamiento local.
- `visual-system`: mantener identidad visual, consistencia de componentes y niveles NORMAL / REFINE / REDESIGN.
- `design`: compatibilidad con la guía visual anterior; para trabajo nuevo preferir `visual-system`.
- `debt`: registrar deuda técnica deliberada y soluciones temporales en `agent/DEBT.md`.

## Uso recomendado

1. Leer `AGENTS.md`.
2. Elegir la skill adecuada a la tarea.
3. Para cambios visuales asumir `visual-system` en modo NORMAL salvo que el usuario pida REFINE o REDESIGN.
4. Implementar o revisar.
5. Ejecutar `review` al finalizar cambios funcionales.
6. Si queda una solución temporal o riesgo conocido, registrarlo con `debt` en `agent/DEBT.md`.
7. Ejecutar `audit` periódicamente o antes de una refactorización grande.

Las skills no sustituyen pruebas reales. Si una tarea toca datos, combinar siempre la skill correspondiente con `data-safety`.
