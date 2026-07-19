-- Phase 6: Feishu sync (sync_logs, videos.creator, expressions.feishu_section)

create table public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sync_type text not null check (sync_type in ('full', 'incremental')),
  status text not null check (status in ('success', 'failed')),
  synced_at timestamptz not null default now(),
  details jsonb
);

create index sync_logs_user_id_synced_at_idx on public.sync_logs (user_id, synced_at desc);

alter table public.sync_logs enable row level security;

create policy "Users can read own sync_logs"
  on public.sync_logs for select to authenticated
  using (auth.uid() = user_id);

create policy "Service role full access sync_logs"
  on public.sync_logs for all to service_role
  using (true) with check (true);

grant all on table public.sync_logs to service_role;
grant select on table public.sync_logs to authenticated;

alter table public.user_settings
  add column if not exists last_feishu_sync_at timestamptz;

alter table public.videos
  add column if not exists creator text;

alter table public.videos drop constraint if exists videos_source_check;
alter table public.videos
  add constraint videos_source_check
  check (source in ('youtube', 'manual', 'feishu'));

alter table public.expressions
  add column if not exists feishu_section text;

alter table public.expressions alter column topic_id drop not null;

alter table public.expressions drop constraint if exists expressions_topic_required_for_transcript;
alter table public.expressions
  add constraint expressions_topic_required_for_transcript
  check (source_type = 'feishu' or topic_id is not null);
