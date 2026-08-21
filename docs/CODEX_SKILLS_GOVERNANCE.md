# Gobernanza de skills de Codex

## Decisión

Las skills de Mi Gran Día se versionan en `.agents/skills/`, la ubicación oficial de alcance repositorio reconocida por Codex. Son instrucciones de desarrollo: no forman parte del frontend, Firebase ni el runtime productivo. `AGENTS.md` y los contratos del repositorio siempre prevalecen.

## Inventario auditado

| Origen | Commit auditado | Licencia | Función | Compatibilidad | Riesgo / duplicidad | Decisión |
| --- | --- | --- | --- | --- | --- | --- |
| [Superpowers](https://github.com/obra/superpowers) | `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` (v6.3.0) | MIT | Planificación, debugging, tests, verificación y flujos de agentes | Codex, Claude Code, Cursor y otros | Instalación completa contiene hooks, scripts, worktrees y reglas ceremoniales; puede competir con autonomía y alcance Wedding | **INSTALAR PARCIALMENTE / ADAPTAR** en `wedding-engineering` |
| [Impeccable](https://github.com/pbakaus/impeccable) | `f88b2837a7d7c3182e46307bbbb091a1ed547571` | Apache-2.0 | Auditoría y acabado visual amplio, agentes y assets | Multi-harness; tooling Bun/JS | Repositorio grande, CLI y agentes duplicados; excesivo para revisión incremental | **ADAPTAR** criterios en `wedding-ui-review` |
| [Emil Kowalski Skills](https://github.com/emilkowalski/skills) | `e879241fab3cdb22e8d95587cdbf40b57a88d7da` | MIT | Motion, animación, prototipos y design engineering | Skills Markdown para agentes | Muchas skills se solapan; Expo/React y selección de librerías no aplican al stack actual | **INSTALAR PARCIALMENTE / ADAPTAR** `review-animations` en `wedding-motion-review` |
| [Taste Skill](https://github.com/leonxlnx/taste-skill) | `dfb6f9f9e93a39f673b1827c0889cc28326d1800` | MIT | Criterio visual y calidad percibida | Skill multiagente | Amplio y subjetivo; puede promover estética sobre usabilidad o identidad | **ADAPTAR** en `wedding-visual-polish` |
| [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | `bc826e2267a36d98a2dcf5231e16c30ff546770f` | MIT | Catálogo UI/UX, accesibilidad, responsive y patrones | Claude/Codex mediante assets/CLI | CLI, Python, catálogos y mirrors duplicados; posible criterio genérico | **ADAPTAR** como referencia principal en `wedding-ui-review` |
| [Huashu Design](https://github.com/alchaincyf/huashu-design) | `e735935ca0553a32de7ba4ba204fe3c79150b1b8` (v3.1) | MIT | Generación visual, decks, infografías, prototipos y exportación | Agentes con scripts Node/Playwright/ffmpeg | 200+ MB, assets y pipeline de generación; orientado a entregables, no mantenimiento UI incremental | **SOLO REFERENCIA** |
| [Ponytail](https://github.com/DietrichGebert/ponytail) | `2ed6c52c9d7e5e56942508591085fd45dea277d3` (v4.9.0) | MIT | Minimalismo/YAGNI persistente, hooks, plugins y MCP opcional | Muchos hosts, incluido Codex | Se declara activo en toda respuesta, privilegia menos código y prose; puede degradar UX o competir con reglas de datos/seguridad | **DESCARTAR** para instalación |
| engineering-figure-agent | descartado previamente | no reevaluada | Figuras de ingeniería | no aplica | Fuera de alcance; no apareció como dependencia | **DESCARTAR** |

## Duplicidades y jerarquía

UI/UX Pro Max, Impeccable, Taste, Huashu y Emil coinciden en jerarquía, tipografía, spacing, color, responsive, accesibilidad, componentes y motion. Para evitar cinco criterios sobre el mismo control:

1. `AGENTS.md`, arquitectura, contratos, CI, Spark y seguridad.
2. `wedding-governance`.
3. `wedding-engineering` para proceso técnico.
4. `wedding-ui-review` como única referencia UI/UX principal.
5. `wedding-visual-polish` solo para refinamiento.
6. `wedding-motion-review` como especialista explícito.

Contradicciones resueltas:

- Rediseño creativo vs. continuidad: gana continuidad; REDESIGN requiere petición explícita.
- Menos código vs. riqueza/seguridad: gana el cambio mínimo seguro, no el menor número de líneas.
- Valores visuales universales vs. sistema existente: gana `design-system/MASTER.md`.
- Automatización/hook vs. consentimiento: no se importan hooks, MCP, telemetría ni instaladores.
- Nuevas librerías vs. stack actual: no se incorporan dependencias.

## Instalación y actualización

No se ejecutó ningún instalador externo. Solo se incorporaron instrucciones Markdown/YAML adaptadas y revisadas.

Para actualizar:

1. Registrar el nuevo commit upstream.
2. Auditar licencia, diff, scripts, hooks, dependencias y cambios de alcance.
3. Comparar solo la skill fuente; no copiar el repositorio completo.
4. Adaptar manualmente conservando la jerarquía Wedding.
5. Validar con `quick_validate.py`, pruebas de comportamiento y CI.
6. Actualizar este documento y el commit de origen en la skill.

## Supply chain y publicación

La implementación no contiene ejecutables, binarios, `.env`, tokens, cachés, `node_modules`, repositorios Git anidados, dependencias ni scripts automáticos. `.agents/` es una carpeta oculta de tooling y GitHub Pages/Jekyll no la publica por defecto. Si el proyecto cambia a un workflow que sube la raíz como artifact sin filtrado, ese workflow deberá excluir explícitamente `.agents/`.

## Matriz de uso

| Trabajo | Skill |
| --- | --- |
| Cualquier trabajo en Wedding | `wedding-governance` |
| Plan, bug, CI, implementación o revisión técnica | `wedding-engineering` |
| Auditoría UI, responsive, accesibilidad o formularios | `wedding-ui-review` |
| Pulido visual solicitado | `wedding-visual-polish` después de UI review |
| Motion/microinteracciones | `wedding-motion-review` explícita |
