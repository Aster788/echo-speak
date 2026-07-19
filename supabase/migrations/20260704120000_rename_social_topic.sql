-- Rename system topic Social → Interpersonal Communication.
-- Handles legacy slug `social` and slug already renamed to `interpersonal-communication`.

update public.topics
set
  name = 'Interpersonal Communication',
  slug = 'interpersonal-communication'
where slug in ('social', 'interpersonal-communication')
  and is_system = true
  and name in ('Social', 'Interpersonal Communication');
