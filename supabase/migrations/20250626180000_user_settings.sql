-- Per-user API settings (authenticated users only; server-only secrets stay in env).

create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  llm_api_key text,
  llm_base_url text,
  llm_model text,
  supabase_url text,
  supabase_anon_key text,
  feishu_app_id text,
  feishu_app_secret text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Users can select own settings"
  on public.user_settings for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant all on table public.user_settings to service_role;
grant select, insert, update, delete on table public.user_settings to authenticated;
