-- Content ingestion: study material uploads, staging review, question concept grouping

create table question_concept_groups (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (topic_id, slug)
);

create index idx_question_concept_groups_topic on question_concept_groups(topic_id);

alter table questions
  add column if not exists concept_group_id uuid references question_concept_groups(id) on delete set null;

create index if not exists idx_questions_concept_group on questions(concept_group_id)
  where concept_group_id is not null;

alter table questions
  drop constraint if exists questions_source_type_check;

alter table questions
  add constraint questions_source_type_check
  check (source_type in ('purchased_material', 'generated', 'api', 'ingested'));

create type content_staging_status as enum ('pending', 'approved', 'rejected');

create type content_staging_kind as enum ('topic', 'question');

create table content_ingests (
  id uuid primary key default gen_random_uuid(),
  certification_id uuid not null references certifications(id) on delete cascade,
  title text not null,
  source_kind text not null check (source_kind in ('pdf', 'text')),
  original_filename text,
  extracted_text text not null,
  parser_version text not null default 'v1',
  plain_text_fallback boolean not null default false,
  fallback_domain_slug text,
  fallback_domain_name text,
  fallback_topic_slug text,
  fallback_topic_name text,
  created_at timestamptz not null default now()
);

create index idx_content_ingests_cert on content_ingests(certification_id);
create index idx_content_ingests_created on content_ingests(created_at desc);

create table content_staging_items (
  id uuid primary key default gen_random_uuid(),
  ingest_id uuid not null references content_ingests(id) on delete cascade,
  kind content_staging_kind not null,
  parent_staging_id uuid references content_staging_items(id) on delete set null,
  review_status content_staging_status not null default 'pending',
  domain_slug text not null,
  domain_name text,
  topic_slug text not null,
  topic_name text,
  topic_summary text,
  concept_key text,
  variant_index int not null default 0,
  difficulty_tier int not null default 2
    check (difficulty_tier between 1 and 4),
  question_type text not null default 'multiple_choice'
    check (question_type in ('multiple_choice', 'multi_select', 'scenario')),
  prompt text,
  short_explanation text,
  long_explanation text,
  reference_link text,
  answer_options jsonb,
  sort_order int not null default 0,
  reviewer_note text,
  promoted_domain_id uuid references domains(id) on delete set null,
  promoted_topic_id uuid references topics(id) on delete set null,
  promoted_question_id uuid references questions(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index idx_content_staging_ingest on content_staging_items(ingest_id);
create index idx_content_staging_status on content_staging_items(review_status);
create index idx_content_staging_kind on content_staging_items(kind);

comment on table content_ingests is 'Uploaded study material (extracted text) before promotion to curriculum';
comment on table content_staging_items is 'Draft topics/questions from ingestion; approved rows promote to domains/topics/questions';
comment on table question_concept_groups is 'Groups multiple question variants for the same concept within a topic';
