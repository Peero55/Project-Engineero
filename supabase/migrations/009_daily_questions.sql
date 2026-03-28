-- Phase 3: Daily question delivery (study-only; not combat)

create table daily_question_config (
  id uuid primary key default gen_random_uuid(),
  certification_id uuid references certifications(id) on delete cascade,
  questions_per_day int not null default 5 check (questions_per_day > 0),
  delivery_timezone text not null default 'UTC',
  is_active boolean not null default true
);

-- At most one global row (certification_id is null) and one row per certification
create unique index daily_question_config_cert_unique
  on daily_question_config (certification_id)
  where certification_id is not null;

create unique index daily_question_config_one_global
  on daily_question_config ((1))
  where certification_id is null;

create table daily_question_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  delivery_date date not null,
  delivered_at timestamptz not null default now(),
  answered_at timestamptz,
  platform text not null check (platform in ('slack', 'discord', 'teams')),
  platform_message_ts text,
  unique (user_id, question_id, delivery_date)
);

create index idx_daily_deliveries_user_date on daily_question_deliveries (user_id, delivery_date);
create index idx_daily_deliveries_user_question_delivered on daily_question_deliveries (user_id, question_id, delivered_at);

alter table daily_question_config enable row level security;
alter table daily_question_deliveries enable row level security;

-- Backend uses service role for writes; RLS enabled for future direct client access

-- Only when Network+ cert exists (seeded in 007); avoids FK failure on DBs that skipped or reordered seeds
insert into daily_question_config (certification_id, questions_per_day, delivery_timezone, is_active)
select '11111111-1111-4111-8111-111111111101'::uuid, 5, 'UTC', true
where exists (select 1 from certifications where id = '11111111-1111-4111-8111-111111111101'::uuid)
  and not exists (
    select 1 from daily_question_config where certification_id = '11111111-1111-4111-8111-111111111101'::uuid
  );

insert into daily_question_config (certification_id, questions_per_day, delivery_timezone, is_active)
select null::uuid, 5, 'UTC', true
where not exists (
  select 1 from daily_question_config where certification_id is null
);
