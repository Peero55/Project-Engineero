create table users (
  id uuid primary key default gen_random_uuid(),
  slack_user_id text unique,
  email text,
  created_at timestamptz not null default now()
);

create table profiles (
  user_id uuid primary key references users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  level int not null default 1,
  xp int not null default 0,
  current_hp int not null default 100,
  max_hp int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table certifications (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null
);

create table domains (
  id uuid primary key default gen_random_uuid(),
  certification_id uuid not null references certifications(id) on delete cascade,
  slug text not null,
  name text not null,
  sort_order int not null default 0
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references domains(id) on delete cascade,
  slug text not null,
  name text not null,
  summary text,
  sort_order int not null default 0
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  certification_id uuid not null references certifications(id),
  domain_id uuid not null references domains(id),
  topic_id uuid not null references topics(id),
  source_type text not null check (source_type in ('purchased_material','generated','api')),
  question_type text not null check (question_type in ('multiple_choice','multi_select','scenario','guided_lab')),
  difficulty_tier int not null check (difficulty_tier between 1 and 4),
  prompt text not null,
  short_explanation text not null,
  long_explanation text not null,
  reference_link text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table answer_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  label text not null,
  option_text text not null,
  is_correct boolean not null default false,
  sort_order int not null default 0
);

create table hunts (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references domains(id),
  slug text unique not null,
  name text not null,
  description text,
  hunt_type text not null check (hunt_type in ('concept_hunt','mini_boss','legendary')),
  required_progress int not null default 100
);

create table hunt_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  hunt_id uuid not null references hunts(id) on delete cascade,
  progress_points int not null default 0,
  status text not null default 'available' check (status in ('available','active','completed','failed')),
  updated_at timestamptz not null default now(),
  unique(user_id, hunt_id)
);

create table battle_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  hunt_id uuid references hunts(id) on delete set null,
  enemy_topic_id uuid references topics(id),
  battle_type text not null check (battle_type in ('daily','normal','mini_boss','legendary')),
  status text not null default 'active' check (status in ('active','won','lost','retreated')),
  max_questions int not null,
  questions_answered int not null default 0,
  player_hp_start int not null,
  player_hp_end int,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table battle_turns (
  id uuid primary key default gen_random_uuid(),
  battle_session_id uuid not null references battle_sessions(id) on delete cascade,
  question_id uuid not null references questions(id),
  chosen_attack text not null check (chosen_attack in ('light','medium','heavy','ultimate')),
  was_correct boolean not null,
  damage_dealt int not null default 0,
  damage_taken int not null default 0,
  response_ms int,
  created_at timestamptz not null default now()
);

create table user_question_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  times_seen int not null default 1,
  times_correct int not null default 0,
  last_seen_at timestamptz not null default now(),
  unique(user_id, question_id)
);