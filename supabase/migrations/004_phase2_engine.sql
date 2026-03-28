-- Phase 2 Core Engine: user_stats, battle tracking columns
-- Maps spec (user_stats, enemy_hp, battle state) onto existing schema

create table if not exists user_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  correct_count int not null default 0,
  incorrect_count int not null default 0,
  total_response_ms bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, topic_id)
);

create index if not exists idx_user_stats_user on user_stats(user_id);
create index if not exists idx_user_stats_topic on user_stats(topic_id);

alter table battle_sessions
  add column if not exists enemy_hp_start int default 100,
  add column if not exists enemy_hp_current int default 100,
  add column if not exists player_hp_current int default 100;

comment on column user_stats.total_response_ms is 'Sum of response times in ms for avg_time computation';

alter table user_stats enable row level security;
create policy "User stats read own" on user_stats for select using (auth.uid() = user_id);
create policy "User stats insert own" on user_stats for insert with check (auth.uid() = user_id);
create policy "User stats update own" on user_stats for update using (auth.uid() = user_id);
