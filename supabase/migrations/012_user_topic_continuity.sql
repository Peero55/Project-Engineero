-- Knowledge continuity: domain-scoped topic identity + per-user codex progress
-- Safe explanation URLs use (domain.slug, topic.slug); composite uniqueness enforces that.

create unique index if not exists idx_topics_domain_id_slug on topics (domain_id, slug);

create table if not exists user_topic_continuity (
  user_id uuid not null references users(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  discovered_at timestamptz,
  explanation_last_viewed_at timestamptz,
  study_note_unlocked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create index if not exists idx_user_topic_continuity_user on user_topic_continuity (user_id);

comment on table user_topic_continuity is 'User codex state: discovery, explanation views, study-note unlock (mastery-gated)';
comment on column user_topic_continuity.discovered_at is 'First time learner encountered this topic via an answered question';
comment on column user_topic_continuity.explanation_last_viewed_at is 'Last time full topic study page was viewed';
comment on column user_topic_continuity.study_note_unlocked_at is 'When deep study note became available (mastery threshold)';

alter table user_topic_continuity enable row level security;

create policy "user_topic_continuity select own"
  on user_topic_continuity for select
  using (auth.uid() = user_id);

create policy "user_topic_continuity insert own"
  on user_topic_continuity for insert
  with check (auth.uid() = user_id);

create policy "user_topic_continuity update own"
  on user_topic_continuity for update
  using (auth.uid() = user_id);
