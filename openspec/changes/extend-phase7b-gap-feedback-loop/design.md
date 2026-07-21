## Context

Phase 7.1a established durable feedback:

- Accept: `gaps.status = accepted`, linked expression retained, weight bumped, `topic_locked = true`.
- Ignore: expression deleted and recorded in `expression_dismissals` with `reason = gap_ignore`.

The extraction path already reads dismissal reason counts and recent dismissals into `extract-expressions.md`, and it applies global/per-video canonical blocklists before persistence. Accepted expressions are not read at extraction time. The optional over-target rank pass (`select-expressions.md`) is not preference-aware.

The agreed product goal is precision-first: future Extract/Re-extract runs may return fewer expressions if that reduces manual Accept/Ignore/Delete work. Preferences apply globally, while examples from the candidate's current Topic receive priority.

## Goals / Non-Goals

**Goals:**

- Use the learner's complete feedback history on every Extract/Re-extract.
- Dynamically derive a bounded, explainable preference context per run.
- Teach both extraction and ranking what the learner tends to Accept and Ignore.
- Keep Ignore as a deterministic hard blocklist.
- Prefer fewer, higher-confidence candidates over filling a target count.
- Expose counters that make the feedback effect testable.

**Non-Goals:**

- Fine-tuning model parameters.
- Persisting or caching a generated preference summary in v1.
- Adding a separate LLM classifier call for every extraction.
- Writing to Feishu or changing Gaps UI semantics.
- Automatically changing the source prompt files from feedback.

## Architecture

```text
gaps(status=accepted) ── join expressions ──┐
                                           ├─ buildExtractionPreferenceContext()
expression_dismissals ─────────────────────┘
                    │
                    ├─ aggregate all-history patterns
                    ├─ select topic-aware positive examples (≤12)
                    ├─ select recent/diverse negative examples (≤12)
                    └─ canonical hard-block keys
                                │
          ┌─────────────────────┴─────────────────────┐
          ▼                                           ▼
 extract-expressions prompt                   select-expressions prompt
          │                                           │
          └──────── candidates → hard filter → rank ──┘
                                      │
                                      ▼
                                persisted rows
```

## Decisions

### D1. Full history is the source; prompt examples are bounded

Every run queries the learner's full Accept and dismissal history. Aggregate counts and patterns can reflect all rows, but raw examples are capped:

- accepted examples: up to 12;
- dismissed examples: up to 12.

Selection order:

1. examples matching the current extraction Topic set;
2. higher accepted expression `weight`;
3. newer feedback;
4. diversity by canonical key and Topic.

If no Topic can be inferred before extraction, select globally by weight/recency/diversity. The current runtime topic tree is available, but the transcript has no assigned Topic; therefore "same Topic first" primarily applies in the ranking pass where candidate `topic_slug` values exist.

**Why:** All feedback remains influential without unbounded prompt growth.

### D2. Runtime context, no summary table

Add a pure domain structure such as:

```ts
type ExtractionPreferenceContext = {
  acceptedExamples: PreferenceExample[];
  dismissedExamples: PreferenceExample[];
  dismissalReasonCounts: Partial<Record<DismissReason, number>>;
  hardBlockedKeys: Set<string>;
  totalAccepted: number;
  totalDismissed: number;
};
```

`buildExtractionPreferenceContext(userId, client)` queries accepted gaps and dismissals, then selects samples deterministically. It does not ask an LLM to summarize and does not persist generated text.

**Why:** Feedback changes take effect on the next run, with no stale cache or migration.

### D3. User scope is mandatory

Accepted and dismissed feedback queries SHALL use the authenticated `userId` where ownership data exists. Accepted gaps currently lack `user_id`; ownership is inferred through the single-user/service-role data model in v1. The API/pipeline SHALL pass authenticated user context, and the implementation SHALL avoid making the existing dismissal-hint query less safe.

If accepted feedback cannot be safely attributed in a multi-user environment, the builder returns no positive examples rather than mixing users. A future schema migration can add explicit ownership to gaps/expressions.

### D4. Prompt preference is guidance, not enforcement

Add `{{PREFERENCE_CONTEXT}}` to both prompts.

The section includes:

- concise aggregate statements (for example, frequent dismiss reasons);
- accepted examples labeled as preferred style;
- dismissed examples labeled as patterns to avoid;
- explicit instruction to generalize style/structure, not copy phrases blindly.

Accepted examples influence reusable form, difficulty, and expression type. They do not force exact accepted phrases into unrelated transcripts.

### D5. Ignore remains deterministic defense in depth

Canonical dismissed keys are applied:

1. before the rank pass, so blocked candidates do not consume the target budget;
2. again before persistence in the pipeline.

The existing final blocklist filter remains even if earlier filtering is introduced.

**Why:** Prompt instructions are probabilistic; Ignore promises deterministic suppression.

### D6. Precision-first ranking may return fewer than target

The rank prompt changes from "return fewer only if candidates are weak" to explicitly allow fewer candidates when they do not match quality and learner preference.

When over target:

- exact blocked keys are removed first;
- candidate Topic is used to select relevant accepted examples;
- the existing rank call chooses up to the target, not exactly the target.

When under target, no new classifier call is added. Main extraction prompt preference and deterministic filters still apply.

**Trade-off:** Some useful phrases may be missed, which the user explicitly accepts in exchange for lower triage cost.

### D7. Diagnostics are returned internally, not a new UI

Track per run:

- total accepted/dismissed history counts;
- positive/negative prompt sample counts;
- raw candidate count;
- hard-blocked candidate count;
- ranked/selected count;
- persisted count.

These can be included in service results/logging and tests. No analytics dashboard is required.

## Error Handling

- Feedback query failure SHALL NOT fail transcript extraction; extraction continues with empty preference context and existing quality rules.
- Invalid/missing feedback rows are skipped.
- Prompt placeholder replacement always supplies an empty string when no context exists.
- Rank-call failure follows existing fallback behavior and still applies deterministic blocklist filtering.

## Testing

- Unit tests for full-history aggregation, sample caps, canonical deduplication, ordering, and empty history.
- Prompt tests verify positive/negative context appears in both prompts.
- Extractor/ranker tests verify hard-blocked candidates are removed before target selection and fewer-than-target output is accepted.
- Pipeline tests verify Extract and Re-extract read current feedback each run.
- Regression tests preserve existing topic classification, quality filters, and final blocklist behavior.

## Risks / Trade-offs

- **[Prompt grows or feedback dominates transcript evidence]** → Fixed sample caps and concise formatting.
- **[Accepted examples overfit unrelated videos]** → Global guidance with Topic-aware ranking; instruct model to generalize, not copy.
- **[Single-user ownership assumptions leak in multi-user use]** → Require user-scoped dismissals; fail closed for positive samples when ownership is ambiguous; document future ownership migration.
- **[Precision drops extraction volume too far]** → Counters plus existing depth settings; adjust sample caps/prompt rules from evidence.
- **[LLM ignores negative examples]** → Canonical hard filter remains authoritative.

## Migration Plan

1. Add query helpers and preference-context builder (no schema migration).
2. Wire context through pipeline, extractor, and ranker.
3. Update prompts and diagnostics.
4. Run unit/integration tests and compare one controlled Re-extract before/after.
5. Rollback by removing prompt context and early filtering; 7.1a feedback data remains valid.

## Open Questions

None blocking. Defaults for v1 are 12 accepted + 12 dismissed prompt examples, precision-first output, and no additional LLM call.
