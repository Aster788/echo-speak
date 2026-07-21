## Why

Phase 7.1a stores explicit learner preference signals, but transcript extraction only uses Ignore as an exact/global blocklist; accepted expressions do not teach the extractor what the learner values. Phase 7.1b closes that loop so future Extract/Re-extract runs produce fewer, higher-confidence expressions and reduce manual triage in Gaps and Collections.

## What Changes

- Build a runtime **personal extraction preference context** from the full feedback history:
  - positive history: `gaps.status = accepted` joined to the retained expression;
  - negative history: `expression_dismissals`, including `gap_ignore` and Collections dismiss reasons.
- Summarize aggregate preference patterns from all history, while selecting a bounded set of representative examples for each extraction:
  - prefer same Topic first;
  - then recent, higher-weight, diverse examples;
  - cap prompt examples (default: up to 12 accepted and 12 ignored/dismissed).
- Inject positive and negative preference guidance into the main extraction prompt and over-target selection/ranking prompt.
- Keep Ignore as a deterministic canonical hard blocklist before persistence; move the check earlier where practical so blocked candidates do not consume the final extraction budget.
- Make final ranking precision-oriented: accepted-like candidates are favored and low-confidence candidates may be dropped instead of filling the configured cap.
- Record extraction feedback metrics (candidate count, hard-blocked count, selected count, feedback sample counts) for tests and diagnostics.

### In Scope

- Extract and Re-extract both read the latest full feedback history.
- Global preferences apply across videos, with same-Topic examples weighted first.
- Dynamic context per run; no persisted generated summary in v1.
- Prompt preference examples plus deterministic blocklist and feedback-aware ranking.
- Existing LLM extraction/ranking calls only; no separate always-on classifier call.

### Out of Scope

- Model fine-tuning.
- Persisting a generated preference summary or adding a preference cache/table.
- Feishu write-back.
- Changing Gaps Accept/Ignore UI semantics.
- Automatic modification of prompt files by an LLM.
- Proving long-term quality from one run; this change adds measurable counters and tests, while real precision improvement is evaluated over subsequent imports.

## Capabilities

### New Capabilities

- `extraction-preference-context`: Build a bounded, topic-aware runtime preference context from the learner's complete Accept/Ignore and dismissal history.

### Modified Capabilities

- `expression-extraction`: Use preference context in extraction and ranking, prioritize precision over filling the cap, and retain deterministic blocklist enforcement.
- `global-dismiss-blocklist`: Provide user-scoped negative examples and hard-blocked canonical keys to extraction before final selection.
- `gap-detection`: Expose accepted gap expressions as positive extraction examples without changing Gap detection itself.

## Impact

- `src/db/gaps.ts`, `src/db/expression-dismissals.ts` — feedback-history queries.
- New preference-context service/lib under `src/services/` or `src/lib/`.
- `src/services/expression-pipeline.ts`, `src/services/expression-extractor.ts`, expression ranker/filter path.
- `prompts/extract-expressions.md`, `prompts/select-expressions.md`.
- Extraction result/diagnostic types and related tests.
- `docs/decisions.md`, `docs/progress.md`, `docs/next-task.md`.
- No database migration required for v1.
