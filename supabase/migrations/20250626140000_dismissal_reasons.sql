-- Pre-Phase 5 P1: dismissal reasons for extract quality feedback

alter table public.expression_dismissals
  add column reason text,
  add column topic_id uuid references public.topics (id) on delete set null,
  add column phrase text;

alter table public.expression_dismissals
  add constraint expression_dismissals_reason_check
  check (
    reason is null
    or reason in (
      'single_word',
      'fragment',
      'duplicate',
      'obscure',
      'already_know',
      'off_topic',
      'other'
    )
  );

create index expression_dismissals_reason_idx
  on public.expression_dismissals (reason)
  where reason is not null;
