# Next Task

Objective:

**Phase 6 deploy & smoke** on branch `feat/phase-6-feishu-sync`.

Checklist:

1. Apply migration `20260703120000_phase6_feishu_sync.sql` to Supabase cloud
2. Save Feishu app credentials in Settings; open Home — confirm status line + silent sync (>6h stale)
3. Settings **Sync now** with real doc; verify expressions under correct YouTube video in Collections
4. Merge PR, tag `phase-6` on `main`

Reference:

- Plan: `openspec/changes/phase-6-feishu-sync/`
- ADR: `docs/decisions.md` (2026-07-03)
- Database: `docs/database.md` (`sync_logs`, `videos.creator`, `expressions.feishu_section`)
- CLI fixture: `FEISHU_SYNC_USER_ID=… npx tsx scripts/sync-feishu.ts --fixture tests/fixtures/feishu-learning-english-from-vlog.md`
