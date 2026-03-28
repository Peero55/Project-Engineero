-- Phase 1 — draft PostgreSQL schema (MVP-oriented, not wired to this starter yet).
-- Aligns with: server-side answers, hunts, battles, mastery, Network+ content.
-- Revise when integrating with Supabase or another host.

-- Identity
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id uuid primary key references users(id) on delete cascade,
  level int not null default 1,
  xp int not null default 0,
  current_hp int not null default 100,
  max_hp int not null default 100,
  updated_at timestamptz not null default now()
);

-- Content (Network+ first)
create table if not exists certifications (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null
);

create table if not exists domains (
  id uuid primary key default gen_random_uuid(),
  certification_id uuid not null references certifications(id) on delete cascade,
  slug text not null,
  name text not null,
  unique (certification_id, slug)
);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references domains(id) on delete cascade,
  slug text not null,
  name text not null,
  unique (domain_id, slug)
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  certification_id uuid not null references certifications(id),
  domain_id uuid not null references domains(id),
  topic_id uuid not null references topics(id),
  difficulty_tier int not null check (difficulty_tier between 1 and 5),
  prompt text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists answer_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  label text not null,
  option_text text not null,
  is_correct boolean not null default false,
  unique (question_id, label)
);

-- Hunts & battles
create table if not exists hunts (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references domains(id),
  slug text unique not null,
  name text not null,
  hunt_type text not null,
  required_progress int not null default 100
);

create table if not exists hunt_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  hunt_id uuid not null references hunts(id) on delete cascade,
  progress_points int not null default 0,
  status text not null default 'available',
  unique (user_id, hunt_id)
);

create table if not exists battle_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  hunt_id uuid references hunts(id),
  battle_type text not null,
  status text not null default 'active',
  max_questions int not null,
  player_hp_start int not null,
  created_at timestamptz not null default now()
);

-- Daily deliveries (Slack) — placeholder
create table if not exists daily_question_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  question_id uuid not null references questions(id),
  delivery_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_daily_deliveries_user_date on daily_question_deliveries(user_id, delivery_date);
