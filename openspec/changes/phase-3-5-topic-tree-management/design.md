## Context

Phase 3 introduces `topics` (hierarchical) and `expressions.topic_id`. AI assigns initial leaf topics; seed data provides broad + fine categories. The learner wants **both coarse and fine dimensions** for review (e.g. all `food` vs only `drinks`).

Phase 3.5 is the **curation layer** between extraction (Phase 3) and topic-based review (Phase 4). Feishu sync (Phase 6) will add rough external categories; merge/normalize built here prepares for that integration.

## Goals / Non-Goals

**Goals:**

- Mobile-first topic tree UI (`max-width: 430px`, design system colors/fonts)
- User can add child topics under any node
- User can drag an expression to a different topic
- User can dismiss unwanted expressions (delete + dismissal record)
- User can merge topic A → B (all expressions reassigned, A removed or soft-redirected)
- User-assigned topics survive re-extraction (`topic_locked`)
- User-dismissed phrases are not re-inserted on re-extract
- Expression counts visible per topic node
- Mac-style topic dock with trash drop target

**Non-Goals:**

- LLM-suggested auto-merge
- Multi-tag expressions
- Feishu import mapping UI
- Review session flow (Phase 4)
- Reparenting entire subtrees via drag (v1: merge + create child instead)
- Extraction depth toggle (standard vs deep) — deferred post–Phase 3.5

## Decisions

### 1. Page: `/topics` topic tree manager

**Decision:** Single page showing collapsible tree. Tap topic → list expressions. Long-press or drag handle → move expression to another topic or to trash on the dock.

**Rationale:** Matches "language notebook" feel; one place to curate before review.

### 2. Topic CRUD rules

**Decision:**

| Action | Rule |
|--------|------|
| Create | Any user can add child under any topic; `is_system = false` |
| Rename | User topics only; system topics show name but no rename in v1 |
| Delete | User topics only, and only when empty (no expressions, no children) |
| System seeds | Cannot delete; can add children under them |

**Rationale:** Protects seed structure while allowing fine-grained extension (`food` → new child `meal-prep`).

### 3. Drag-and-drop expression reassignment

**Decision:** Drag expression onto target topic node → `PATCH` updates `expressions.topic_id` and sets `topic_locked = true`.

**Rationale:** Manual move implies user intent; lock prevents AI re-extract from undoing curation.

**UX:** Opacity transition 150–200ms per design system; no bounce animations.

### 4. Dismiss expression (delete + dismissal record)

**Decision:** `dismissExpression(expressionId)`:
1. Load expression (`video_id`, `phrase`)
2. Insert into `expression_dismissals` with normalized phrase key (same normalization as merge: lowercase, collapsed whitespace)
3. Hard-delete the `expressions` row

**Re-extract behavior:** After chunk merge, filter out any phrase whose normalized key exists in `expression_dismissals` for that `video_id`. Do not re-insert dismissed phrases even if the LLM returns them again.

**Rationale:** User curation is authoritative for "I don't want this phrase." Hard delete keeps the library clean; dismissal table prevents whack-a-mole on re-extract.

**Unique constraint:** `(video_id, phrase_key)` on dismissals.

### 5. Delete UX (basic + dock)

**Decision:** Three equivalent paths to dismiss:

| Path | Interaction |
|------|-------------|
| Delete button | Per expression row; confirm optional for v1 (immediate dismiss) |
| Swipe delete | Mobile: swipe row left → delete affordance |
| Drag to trash | Long-press expression → drag to trash icon on dock; hover ~0.5s → dismiss |

All paths call the same `dismissExpression` server action.

**Fallback:** When drag is unavailable (accessibility, desktop without pointer), delete button and swipe remain sufficient.

### 6. Mac-style topic dock

**Decision:** Fixed bottom dock on `/topics`:
- Icons for root/leaf topics (or horizontally scrollable topic chips)
- Trash icon anchored on the right
- Long-press expression card → drag ghost follows finger/cursor
- Drop on topic icon → `moveExpression`
- Drop on trash → `dismissExpression`

**Trash animation:**
1. Hover over trash ≥ 500ms while dragging
2. Expression ghost fades out over 150–200ms (design system)
3. Row removed from list
4. Optional easter egg: small confetti/fireworks burst (first dismiss of session or every N dismissals — not on every delete)

**Rationale:** Same DnD system for "move" and "delete"; dock metaphor is familiar and fun without dominating the quiet aesthetic.

### 7. Merge / normalize

**Decision:** `mergeTopic(sourceId, targetId)`:
1. Reassign all expressions from `sourceId` → `targetId`; set `topic_locked = true` on moved rows
2. If `source` has children → **reject** merge in v1 (user must move children first or merge leaves only)
3. Set `source.merged_into_id = targetId` then delete `source` (or soft-delete if FK issues)

**Rationale:** Keeps merge predictable; subtree merge is complex—defer.

**UI:** Select two topics → "Merge into…" → confirm with expression count preview.

### 8. `topic_locked` on expressions

**Decision:** Add `topic_locked boolean default false` on `expressions`. Pipeline on re-extract:
- Delete only unlocked transcript-sourced expressions for video, OR
- Skip updating locked rows; delete+insert only unlocked

**Simpler v1:** On re-extract, delete unlocked transcript-sourced rows only; insert new batch; locked rows preserved.

### 9. `merged_into_id` on topics

**Decision:** Optional FK on `topics` for audit trail after merge. Deleted source topic leaves no orphan expressions.

### 10. API surface

**Decision:** Server Actions (preferred, match import page pattern):

- `createTopic(parentId, name)`
- `renameTopic(topicId, name)`
- `deleteTopic(topicId)`
- `moveExpression(expressionId, topicId)`
- `dismissExpression(expressionId)`
- `mergeTopics(sourceId, targetId)`

**Rationale:** Consistent with Phase 2; secrets stay server-side.

## Risks / Trade-offs

- **[Risk] Merge accidentally combines unrelated topics** → Mitigation: confirmation dialog with counts.
- **[Risk] Delete topic with hidden expressions** → Mitigation: block delete if count > 0.
- **[Risk] Drag on mobile is fiddly** → Mitigation: fallback "Move to…" picker menu + swipe delete + row delete button.
- **[Risk] Locked expressions accumulate stale content** → Mitigation: show lock indicator; allow user unlock.
- **[Risk] Dismissal blocks legitimate re-extract** → Mitigation: v1 no "undismiss" UI; user can delete dismissal row in Studio if needed; optional undismiss in future.
- **[Risk] Dock + fireworks feel too playful** → Mitigation: default quiet fade; celebration is optional easter egg only.

## Migration Plan

1. Add `topic_locked` to `expressions`, `merged_into_id` to `topics`, `expression_dismissals` table.
2. Deploy UI + server actions (including dock + dismiss).
3. Update expression-pipeline to respect locks and dismissed phrase keys.

## Open Questions

- Allow reparenting user-created topic (move `meal-prep` from `food` to `daily`)? **Default:** v1 no; use merge + recreate.
- Unlock expression topic? **Default:** yes, toggle in expression detail overflow menu.
- Undismiss phrase in UI? **Default:** v1 no; Studio escape hatch only.
