# Sistema de agentes — Mi Gran Día

Este directorio complementa `AGENTS.md` con guías especializadas para tareas recurrentes.

## Skills

- `development`: implementar cambios con alcance controlado.
- `review`: revisar cambios recientes sin modificar código.
- `audit`: auditar el repositorio completo y priorizar deuda/riesgos.
- `responsive`: revisar comportamiento móvil, tablet y escritorio.
- `data-safety`: proteger autenticación, Firestore y almacenamiento local.
- `design`: preservar identidad visual y calidad de interacción.

## Uso recomendado

1. Leer `AGENTS.md`.
2. Elegir la skill adecuada a la tarea.
3. Implementar o revisar.
4. Ejecutar `review` al finalizar cambios funcionales.
5. Ejecutar `audit` periódicamente o antes de una refactorización grande.

Las skills no sustituyen pruebas reales. Si una tarea toca datos, combinar siempre la skill correspondiente con `data-safety`.
