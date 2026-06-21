# Next Task

Objective:

Build topic-based review flow (Phase 4).

Scope:

- Review expressions filtered by topic subtree
- Review cards using existing design system
- Persist review ratings for SRS prep (Phase 5)

Definition of Done:

- User can start a review session scoped to a topic (e.g. all `food` descendants)
- User can rate expressions (mastered / review_again / forgotten)

Do Not Build Yet:

- Full SRS scheduling engine (Phase 5)
- Feishu Sync (Phase 6)
- Gap Detection (Phase 7)
- Extraction depth modes (standard vs deep) — deferred; see `openspec/changes/phase-3-expression-extraction/design.md`

Reference:

- Topic subtree queries: `src/db/topics.ts`
- Expressions by topic: `src/db/expressions.ts`
- `/topics` curation UI: `src/app/topics/`
