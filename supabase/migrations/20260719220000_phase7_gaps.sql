-- Phase 7: knowledge gaps (transcript extract vs Feishu notes)

create table public.gaps (
  id uuid primary key default gen_random_uuid(),
  expression_id uuid not null references public.expressions (id) on delete cascade,
  reason text not null,
  status text not null check (status in ('pending', 'accepted', 'ignored')),
  created_at timestamptz not null default now(),
  unique (expression_id)
);

create index gaps_status_created_at_idx
  on public.gaps (status, created_at desc);

alter table public.gaps enable row level security;

create policy "Authenticated users can select gaps"
  on public.gaps for select to authenticated using (true);

create policy "Authenticated users can insert gaps"
  on public.gaps for insert to authenticated with check (true);

create policy "Authenticated users can update gaps"
  on public.gaps for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete gaps"
  on public.gaps for delete to authenticated using (true);

grant all on table public.gaps to service_role;
grant select, insert, update, delete on table public.gaps to authenticated;
