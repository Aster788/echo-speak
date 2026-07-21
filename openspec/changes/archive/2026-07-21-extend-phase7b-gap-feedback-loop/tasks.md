## 1. Feedback history data access

- [x] 1.1 Add a query for accepted gaps joined to retained expressions (phrase, meaning, topic, weight, accepted/created time)
- [x] 1.2 Make dismissal reason counts and representative samples user-scoped; include `gap_ignore`
- [x] 1.3 Add tests for user scoping, invalid rows, empty history, and accepted-gap-only positive signals

## 2. Runtime preference context

- [x] 2.1 Add `ExtractionPreferenceContext` types and a builder that reads complete feedback history on each run
- [x] 2.2 Implement canonical deduplication and deterministic sample selection (same Topic, weight, recency, diversity)
- [x] 2.3 Enforce prompt caps of 12 accepted and 12 dismissed examples and format concise preference text
- [x] 2.4 Add unit tests for full-history aggregation, sample caps, ordering, Topic relevance, and query-failure fallback

## 3. Extraction and ranking integration

- [x] 3.1 Load current preference context in `extractExpressionsForTranscript` for both Extract and Re-extract
- [x] 3.2 Pass preference context through extractor options and inject `{{PREFERENCE_CONTEXT}}` into `extract-expressions.md`
- [x] 3.3 Pass candidate-Topic-aware preference examples into the over-target rank path and `select-expressions.md`
- [x] 3.4 Apply global/per-video canonical blocklist before ranking while preserving the final pre-persistence blocklist check
- [x] 3.5 Update rank instructions to allow fewer-than-target results when remaining candidates are weak or preference-misaligned
- [x] 3.6 Ensure feedback-query or preference-formatting failures fall back to current extraction behavior without failing the run

## 4. Diagnostics and verification

- [x] 4.1 Add per-run counters: total accepted/dismissed history, prompt samples, raw candidates, hard-blocked, selected, persisted
- [x] 4.2 Extend extractor, ranker, pipeline, and prompt tests for positive/negative examples and early hard filtering
- [x] 4.3 Run a controlled Re-extract comparison and record candidate/selected counts without overwriting protected Feishu content

## 5. Documentation close-out

- [x] 5.1 Add ADR for runtime full-history preference context, bounded samples, and precision-first ranking
- [x] 5.2 Update `docs/progress.md` and `docs/next-task.md` with Phase 7.1b status and validation evidence
