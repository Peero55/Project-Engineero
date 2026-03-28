-- RLS for slack_installations: service-role only (contains bot tokens)
-- No permissive policies = anon/authenticated cannot access. Service role bypasses RLS.
alter table slack_installations enable row level security;
