---
name: wedding-engineering
description: Plan, diagnose, implement, and verify non-trivial engineering work in Wedding. Use for bugs, CI failures, multi-step changes, reviews, or technical stabilization; do not use to broaden product scope.
---

# Wedding Engineering

Apply disciplined engineering inside the boundaries established by `AGENTS.md` and `wedding-governance`.

## Diagnose before fixing

1. Read the complete error and reproduce it when possible.
2. Trace the real data/control flow and recent changes.
3. Compare the failing path with a working path in this repository.
4. State one falsifiable root-cause hypothesis.
5. Test the hypothesis with the smallest diagnostic action.
6. Fix the confirmed cause only. Do not bundle cleanup or refactors.

After three failed hypotheses, stop changing code and reassess architecture with the user. This does not authorize an architectural rewrite.

## Plan proportional to risk

For multi-step work, map affected files, contracts, consumers, validation and rollback before editing. Keep tasks independently verifiable. Plans must respect existing patterns and avoid mandatory ceremony for simple or read-only work.

## Implement incrementally

Prefer existing utilities and native platform features. Preserve compatibility. Add a regression test when it protects non-trivial behavior; do not create text-presence or ceremonial tests that fail to exercise behavior.

## Verify before claims

Identify the command or observation that proves each completion claim. Run fresh checks, read exit codes and failure counts, review the full diff, and distinguish local evidence from CI or production evidence.

Adapted from Superpowers `systematic-debugging`, `writing-plans`, and `verification-before-completion`, commit `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` (MIT).
