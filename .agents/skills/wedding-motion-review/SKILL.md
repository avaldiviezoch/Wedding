---
name: wedding-motion-review
description: Review animation and microinteraction code in Wedding for purpose, timing, performance, interruption, reduced-motion support, and consistency. Use only for motion-focused review; do not modify product automatically.
---

# Wedding Motion Review

Review motion against the existing Wedding identity before recommending changes.

- Every animation needs a purpose: spatial continuity, state indication, explanation or feedback.
- Frequent actions should be instant or subtle; occasional and celebratory moments may carry more delight.
- Prefer interruptible transitions for rapidly repeated interactions.
- Prefer `transform` and `opacity`; flag layout-property animation when it creates measurable jank.
- Check origin and physical continuity for popovers, drawers, modals and pressed controls.
- Check `prefers-reduced-motion` and gate hover-only behavior for fine pointers.
- Evaluate on real mobile and desktop sizes when practical.
- Do not impose absolute timing or easing values when the existing product has a deliberate, accessible pattern. The project design system wins.

Return findings with file/line, impact, evidence and a minimal recommendation. Do not implement unless requested.

Adapted from Emil Kowalski Skills commit `e879241fab3cdb22e8d95587cdbf40b57a88d7da` (MIT), especially `review-animations`.
