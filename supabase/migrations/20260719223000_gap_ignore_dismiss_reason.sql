-- Phase 7.1a: allow Gaps Ignore dismissals with reason gap_ignore

alter table public.expression_dismissals
  drop constraint if exists expression_dismissals_reason_check;

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
      'other',
      'gap_ignore'
    )
  );
