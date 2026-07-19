-- Avoid transferring every expression row just to render video counts.

create or replace function public.expression_counts_by_video()
returns table (video_id uuid, expression_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select e.video_id, count(*)::bigint as expression_count
  from public.expressions e
  group by e.video_id;
$$;

grant execute on function public.expression_counts_by_video()
  to anon, authenticated, service_role;
