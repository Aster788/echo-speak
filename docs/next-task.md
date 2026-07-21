# Next Task

Objective:

**Measure Phase 7.1b impact in production use.**

Checklist:

1. After new imports and Re-extracts, compare Gaps pending count and Collections dismiss rate against pre-7.1b baseline
2. Review per-run preference diagnostics (`raw`, `hard-blocked`, `selected`, `persisted`) on a few real videos
3. Tune the 12+12 sample cap or ranking thresholds only if evidence shows under/over-correction

Reference:

- Shipped 7.1b: PR #24; archive `openspec/changes/archive/2026-07-21-extend-phase7b-gap-feedback-loop/`
- Shipped 7.1a: PR #23; archive `openspec/changes/archive/2026-07-19-extend-phase7-gap-feedback-loop/`
- Controlled fixture: `raw=7`, `hard-blocked=1`, `selected=6`; no Feishu content writes
- ADR: `docs/decisions.md` (2026-07-19 Phase 7.1b)
