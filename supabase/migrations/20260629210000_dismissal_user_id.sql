-- Pre-Phase 5 library cleanup: user-scoped dismissals for global blocklist.

alter table public.expression_dismissals
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists expression_dismissals_user_id_idx
  on public.expression_dismissals (user_id);

-- Backfill: single-user app; assign existing dismissals to the first auth user.
update public.expression_dismissals
set user_id = (select id from auth.users order by created_at limit 1)
where user_id is null;
