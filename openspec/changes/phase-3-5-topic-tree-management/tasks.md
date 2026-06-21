## 1. Schema updates

- [x] 1.1 Add migration: `expressions.topic_locked` (boolean, default false)
- [x] 1.2 Add migration: `topics.merged_into_id` (nullable FK → topics)
- [x] 1.3 Add migration: `expression_dismissals` (`video_id`, `phrase_key`, `dismissed_at`; unique on `video_id + phrase_key`)
- [x] 1.4 Update `docs/database.md` with new columns and dismissals table

## 2. Data layer

- [x] 2.1 Extend `src/db/topics.ts`: `createUserTopic`, `renameUserTopic`, `deleteUserTopic`, `mergeTopics`, `getTopicExpressionCount`
- [x] 2.2 Extend `src/db/expressions.ts`: `updateExpressionTopic`, `listExpressionsByTopicId`, `deleteExpression`
- [x] 2.3 Add `src/db/expression-dismissals.ts`: `recordDismissal`, `listDismissedPhraseKeysForVideo`
- [x] 2.4 Update `expression-pipeline.ts` to skip/delete only unlocked transcript-sourced rows on re-extract
- [x] 2.5 Filter merged extraction results against dismissed phrase keys before insert
- [x] 2.6 Add tests for merge, delete guards, locked-expression preservation, and dismissal on re-extract

## 3. Server actions / API

- [x] 3.1 Add Server Actions: `createTopic`, `renameTopic`, `deleteTopic`, `moveExpression`, `dismissExpression`, `mergeTopics`
- [x] 3.2 Validate permissions and business rules (system topic protection, empty delete, merge leaf-only)
- [x] 3.3 `dismissExpression`: delete row + upsert dismissal record (normalized phrase key)

## 4. Topic tree UI (`/topics`)

- [x] 4.1 Build collapsible topic tree with expression counts per node
- [x] 4.2 Topic detail panel: list expressions for selected topic
- [x] 4.3 Per-row delete button on each expression
- [x] 4.4 Mobile swipe-to-delete on expression rows
- [x] 4.5 Mac-style topic dock: fixed bottom bar with topic icons + trash on the right
- [x] 4.6 Long-press expression → drag to topic (move) or trash (dismiss); trash hover ~0.5s → 150–200ms fade-out
- [x] 4.7 Optional confetti/fireworks easter egg on dismiss (not every delete)
- [x] 4.8 Drag-and-drop expression → topic reassignment (with "Move to…" picker fallback)
- [x] 4.9 Merge flow: select source + target, confirmation with count, execute
- [x] 4.10 Rename / delete actions for user topics only
- [x] 4.11 Show lock indicator on user-moved expressions; allow unlock
- [x] 4.12 Mobile-first layout (`max-w-[430px]`, design system colors, 150–200ms opacity transitions)

## 5. Integration & docs

- [x] 5.1 Link to `/topics` from import success or nav stub
- [x] 5.2 Manual test: create child topic, drag expression, dismiss via swipe/button/trash, merge duplicates, re-extract preserves locked rows and skips dismissed phrases
- [x] 5.3 Update `docs/progress.md` and `docs/next-task.md` for Phase 3.5 completion / Phase 4 next
