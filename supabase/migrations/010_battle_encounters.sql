-- Encounter-based battles: separate rows per encounter (question | puzzle_step).
-- Pause has no max duration; last_activity_at tracks server-side battle activity.

-- Puzzles: layout_kind drives future UI; payload is evaluated in core (no business logic in Slack).
create table if not exists puzzles (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  slug text not null,
  layout_kind text not null check (layout_kind in ('ordering', 'matching', 'sequence')),
  title text not null,
  payload jsonb not null default '{}',
  difficulty_tier int not null check (difficulty_tier between 1 and 4),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (topic_id, slug)
);

create index if not exists idx_puzzles_topic on puzzles(topic_id);
create index if not exists idx_puzzles_active on puzzles(is_active) where is_active = true;

alter table battle_sessions
  drop constraint if exists battle_sessions_status_check;

alter table battle_sessions
  add constraint battle_sessions_status_check
  check (status in ('active', 'won', 'lost', 'retreated', 'paused'));

alter table battle_sessions
  add column if not exists last_activity_at timestamptz not null default now();

alter table battle_sessions
  add column if not exists paused_at timestamptz;

comment on column battle_sessions.last_activity_at is 'Updated on battle actions (answer, pause, resume)';
comment on column battle_sessions.paused_at is 'When set, battle is paused; no time limit on pause duration';
comment on column battle_sessions.max_questions is 'Max encounter resolutions allowed this battle (variable count per battle instance)';

create table if not exists battle_encounters (
  id uuid primary key default gen_random_uuid(),
  battle_session_id uuid not null references battle_sessions(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  sequence_index int not null,
  encounter_type text not null check (encounter_type in ('question', 'puzzle_step')),
  question_id uuid references questions(id) on delete set null,
  puzzle_id uuid references puzzles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'failed')),
  chain_id uuid,
  chain_position int,
  chain_length int,
  result_payload jsonb,
  damage_dealt int,
  damage_taken int,
  was_correct boolean,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  constraint battle_encounters_question_xor_puzzle check (
    (encounter_type = 'question' and question_id is not null and puzzle_id is null)
    or (encounter_type = 'puzzle_step' and puzzle_id is not null and question_id is null)
  )
);

create unique index if not exists idx_battle_encounters_session_sequence
  on battle_encounters(battle_session_id, sequence_index);

create unique index if not exists idx_battle_encounters_one_active
  on battle_encounters(battle_session_id)
  where status = 'active';

create index if not exists idx_battle_encounters_session on battle_encounters(battle_session_id);
create index if not exists idx_battle_encounters_user on battle_encounters(user_id);

alter table battle_turns
  add column if not exists battle_encounter_id uuid references battle_encounters(id) on delete set null;

create index if not exists idx_battle_turns_encounter on battle_turns(battle_encounter_id);

-- Puzzle turns may not reference a question row
alter table battle_turns alter column question_id drop not null;

-- Sample puzzle (OSI ordering) for dev / QA (only when seed topic from 007 exists)
insert into puzzles (topic_id, slug, layout_kind, title, payload, difficulty_tier)
select
  '33333333-3333-4333-8333-333333333301'::uuid,
  'osi-layer-order',
  'ordering',
  'Order OSI layers (1–7)',
  jsonb_build_object(
    'solution', jsonb_build_array('1', '2', '3', '4', '5', '6', '7'),
    'labels', jsonb_build_object(
      '1', 'Physical',
      '2', 'Data Link',
      '3', 'Network',
      '4', 'Transport',
      '5', 'Session',
      '6', 'Presentation',
      '7', 'Application'
    )
  ),
  2
where exists (select 1 from topics where id = '33333333-3333-4333-8333-333333333301'::uuid)
on conflict (topic_id, slug) do nothing;

alter table puzzles enable row level security;
create policy "Puzzles active read" on puzzles for select using (is_active = true);

alter table battle_encounters enable row level security;
create policy "Battle encounters read own" on battle_encounters
  for select using (auth.uid() = user_id);
create policy "Battle encounters insert own" on battle_encounters
  for insert with check (auth.uid() = user_id);
create policy "Battle encounters update own" on battle_encounters
  for update using (auth.uid() = user_id);
