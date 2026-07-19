## Why

Phase 7 shipped Gaps as a blind-spot triage list, but Accept / Ignore only flip `gaps.status`. That feedback never reaches the library or extraction loop: Ignore leaves noise in Collections, Accept does not protect or prioritize the phrase. Closing this loop turns Gaps into a preference signal collector—without LLM fine-tuning.

## What Changes

- **Ignore → dismiss**: Ignoring a pending gap SHALL dismiss the linked transcript expression (delete row + `expression_dismissals` with a dedicated reason), so it leaves Collections and is blocked on re-extract / global blocklist.
- **Accept → keep signal**: Accepting a pending gap SHALL keep `status = accepted`, bump `expressions.weight` (same cap rules as Feishu bump), and set `topic_locked = true` so re-extract does not wipe the phrase.
- **Gaps UX**: Keep one-tap Ignore (no reason sheet); copy may clarify Ignore removes from library. Accept remains non-writeback to Feishu.
- **No LLM fine-tune** in this change.

### In Scope

- Wire Ignore API/action to existing `dismissExpression` path
- Accept side effects: weight bump + `topic_locked`
- Spec/ADR/docs updates; unit tests for feedback side effects
- Gaps UI microcopy if needed at 430×932

### Out of Scope (defer)

- LLM fine-tuning or prompt auto-rewrite from Accept/Ignore corpora
- Writing accepted gaps into Feishu notes
- Changing Today's Review New selection to consume `weight` (note: weight is stored for later; optional follow-up)
- New dismiss-reason picker on Gaps (one-tap only)

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `gap-detection`: Redefine Accept / Ignore side effects (dismiss on Ignore; weight + lock on Accept).
- `expression-storage`: Allow Gaps Ignore to record dismissal with reason `gap_ignore`; document Accept weight bump + `topic_locked` for transcript rows.
- `global-dismiss-blocklist`: Gaps Ignore contributes to the user global blocklist via the same dismissal path as Collections delete.

## Impact

- `src/app/api/gaps/[id]/ignore/route.ts`, `accept/route.ts`
- `src/db/expressions.ts` / dismiss helpers; optional `bumpExpressionWeight`
- `src/types/dismiss-reason.ts` — add `gap_ignore`
- `src/components/gaps/GapsManager.tsx` — copy / optimistic UI after dismiss removes the card
- `docs/decisions.md`, `docs/next-task.md`, `docs/progress.md`
- Tests for ignore→dismiss and accept→weight/lock
