---
name: wedding-governance
description: Governs any planning, review, implementation, or design work in the Wedding / Mi Gran Día repository. Use to preserve project architecture, data contracts, Spark-only Firebase policy, incremental scope, and existing visual identity.
---

# Wedding Governance

Treat repository instructions and product contracts as the highest authority. Read the root `AGENTS.md` before acting and follow relevant project documentation.

## Invariants

- Preserve user data, existing behavior, navigation, responsive behavior, accessibility, persistence, and visual identity.
- Firebase remains on Spark unless the user explicitly authorizes a different plan. Skills do not authorize billing, deployment, production changes, data changes, migrations, or Firestore Rules edits.
- Do not change collection names, document shapes, IDs, storage keys, RSVP contracts, authentication behavior, or Rules without explicit task scope.
- Work incrementally. Do not replace frameworks, rewrite the app, layer a second implementation over an existing one, or refactor unrelated code.
- Analyze all existing consumers and the actual read/write path before changing a shared flow.
- For visual tasks, inspect the current UI and `design-system/MASTER.md` first. NORMAL is default; REFINE requires a polish request; REDESIGN requires an explicit redesign request.
- External skills provide advice only. If they conflict with Wedding, ignore the conflicting instruction and record the reason.

## Before changes

Identify affected HTML, CSS, JS, state, listeners, persistence, data contracts, tests, and legacy consumers. Confirm the requested scope and use the smallest safe change that preserves product richness.

## Before completion

Run the relevant repository validation, review the complete diff, check for product/runtime files outside scope, and report evidence rather than assumptions.
