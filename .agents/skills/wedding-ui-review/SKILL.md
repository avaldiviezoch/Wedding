---
name: wedding-ui-review
description: Review an existing Mi Gran Día interface for hierarchy, consistency, responsive behavior, accessibility, interaction feedback, and visual regressions. Use before visual changes or when asked for UI/UX feedback; review first and do not redesign automatically.
---

# Wedding UI Review

This is the primary UI/UX reference for Wedding. The existing interface and `design-system/MASTER.md` are the source of truth.

## Mode gate

- NORMAL: diagnose and make local corrections without changing identity or layout language.
- REFINE: improve hierarchy, spacing, consistency and polish while preserving structure.
- REDESIGN: only when explicitly requested; still preserve architecture, data contracts and navigation.

## Review order

1. Inspect the actual view at approximately 360, 390–430, 768, 1024 and 1440 px.
2. Identify existing components and design tokens before suggesting new ones.
3. Review information hierarchy, typography, spacing rhythm, color/contrast, component consistency and content clarity.
4. Review keyboard access, focus visibility, labels, target size, reduced motion, semantic HTML and error/status communication.
5. Review navigation, forms, loading/empty/error states, overlays, scroll, and feedback.
6. Check performance risks: duplicated assets, layout thrashing, unnecessary libraries, observers/listeners and heavy effects.
7. Recommend the smallest coherent change and name what must remain unchanged.

Do not propose a new framework, wholesale component replacement, generic design system, or parallel UI. Findings should cite the current file/view and separate defects from optional polish.

Synthesized from UI/UX Pro Max commit `bc826e2267a36d98a2dcf5231e16c30ff546770f` (MIT) and Impeccable commit `f88b2837a7d7c3182e46307bbbb091a1ed547571` (Apache-2.0), adapted to Wedding.
