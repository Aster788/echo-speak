-- Faster topic counts (group by) + optional IPA for Feishu table lemmas

create or replace function public.expression_counts_by_topic()
returns table (topic_id uuid, expression_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select e.topic_id, count(*)::bigint as expression_count
  from public.expressions e
  where e.topic_id is not null
  group by e.topic_id;
$$;

grant execute on function public.expression_counts_by_topic() to anon, authenticated, service_role;

alter table public.expressions
  add column if not exists phonetic text;
