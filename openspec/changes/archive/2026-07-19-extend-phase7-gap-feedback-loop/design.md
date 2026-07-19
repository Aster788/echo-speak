## Context

Phase 7 persists blind spots in `gaps` and lets users Accept / Ignore. Today those actions only mutate `gaps.status`. Collections Delete already runs `dismissExpression` (delete + `expression_dismissals` + global blocklist). Re-extract deletes unlocked transcript rows. `expressions.weight` is bumped on Feishu re-sync but is not yet consumed by Today's Review New selection.

Product direction (agreed): Gaps is a **preference signal collector**. v1 closes the loop with existing primitives—no LLM fine-tune.

## Goals / Non-Goals

**Goals:**

- Ignore removes noise from the library and blocks future extract (same path as Collections dismiss)
- Accept marks a transcript phrase as keep-worthy (weight + survive re-extract via `topic_locked`)
- One-tap triage on Gaps at 430×932
- Feishu remains keep-list source of truth (no write-back)

**Non-Goals:**

- Fine-tuning or auto-editing extract prompts from Accept/Ignore history
- Feishu write-back of accepted phrases
- Rewiring Today's Review to use `weight` in this change (store signal only; follow-up)
- Reason picker on Gaps Ignore

## Decisions

### D1. Ignore = dismiss (hard link)

On Ignore for gap `G` linked to expression `E`:

1. Call existing `dismissExpression(E.id, { reason: "gap_ignore", userId })`
2. Expression row deleted → `gaps` row CASCADE-deleted
3. Dismissal recorded → per-video + global blocklist skip on extract

**Rationale:** Matches user mental model (“I don’t care about this extract noise”) and reuses battle-tested dismiss path. Sticky `ignored` status alone left junk in Collections.

**Alternatives considered:**

- Soft Ignore only (`status = ignored`) — status quo; no library effect. Rejected.
- Soft Ignore + optional “also delete” — extra UI friction for 200+ pending gaps. Rejected for v1.

### D2. New dismiss reason `gap_ignore`

Add `gap_ignore` to `DISMISS_REASONS` with label suitable for Collections reason stats (e.g. “Gaps 忽略”). Gaps Ignore uses this reason with **no picker**.

**Rationale:** Distinguishes Gaps triage from Collections deletes in dismissal-hint / depth stats without forcing a sheet.

### D3. Accept = weight bump + topic_locked

On Accept for gap `G` → expression `E`:

1. `gaps.status = accepted` (keep row for history / analytics)
2. `E.weight = min(E.weight + 0.5, 3.0)` (align with Feishu bump)
3. `E.topic_locked = true` so re-extract does not delete the row

**Rationale:** Weight stores a numeric preference signal; lock protects accepted extracts across Deep re-extract. No Feishu row invented (Feishu stays SoT for notes).

**Alternatives considered:**

- Accept only sets status — no extract/library effect. Rejected.
- Accept enqueues into review / sets due — overlaps SRS; defer.
- Accept copies into feishu source_type — pollutes Feishu SoT. Rejected.

### D4. CASCADE after Ignore is intentional

`gaps.expression_id ON DELETE CASCADE` means Ignore removes the gap row. Refresh will not recreate pending while the phrase stays dismissed. If user later wants the phrase back, that is a Collections / dismiss undo problem (out of scope); they can re-import only if dismissal is cleared—no undo in v1.

### D5. API shape

- `POST /api/gaps/[id]/ignore` — resolve gap → expression_id → dismiss → return ok (gap gone)
- `POST /api/gaps/[id]/accept` — set accepted + bump weight + lock → return updated gap
- Client removes card from list on either success (Ignore: gone; Accept: leave pending list)

### D6. Copy

Gaps header / empty state may note: Ignore removes the phrase from Collections. Keep density; no new dashboard chrome.

## Risks / Trade-offs

- **[Accidental Ignore deletes library row]** → Mitigation: clear microcopy; future Undo optional; same severity as Collections delete.
- **[CASCADE loses accept/ignore history for ignored]** → Mitigation: dismissal row retains phrase_key + `gap_ignore` reason for analytics.
- **[weight unused in review today]** → Mitigation: still persist bump; document follow-up to feed New selection.
- **[topic_locked on Accept may lock odd topic assignments]** → Mitigation: Accept does not change `topic_id`; lock only freezes topic against re-extract wipe / sync remap rules that respect lock.

## Migration Plan

1. Migration: extend `expression_dismissals_reason_check` to allow `gap_ignore` (drop/recreate check constraint).
2. Deploy app: Ignore → dismiss; Accept → weight + lock.
3. Verify: Ignore → expression gone + dismissal row; Accept → weight up + topic_locked; re-extract skips dismissed / keeps locked.
4. Rollback: revert API handlers to status-only; dismissals already written remain (safe).

## Open Questions

1. Should Accept also bump weight again if user somehow re-accepts? → N/A: accepted gaps leave the pending list; no re-accept path in v1.
2. Wire `weight` into Today's Review in a fast follow-up? → Recommend yes as Phase 7.1b / separate small change after this lands.
