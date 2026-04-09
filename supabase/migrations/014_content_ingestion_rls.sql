-- RLS for content ingestion tables (013): service-role only
-- No permissive policies = anon/authenticated cannot access.
-- Service role bypasses RLS, which is the intended access path for admin APIs.

alter table content_ingests enable row level security;
alter table content_staging_items enable row level security;
alter table question_concept_groups enable row level security;
