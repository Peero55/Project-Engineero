-- Indexes for common query patterns
create index if not exists idx_profiles_user_id on profiles(user_id);
create index if not exists idx_questions_certification on questions(certification_id);
create index if not exists idx_questions_domain on questions(domain_id);
create index if not exists idx_questions_topic on questions(topic_id);
create index if not exists idx_questions_active on questions(is_active) where is_active = true;
create index if not exists idx_answer_options_question on answer_options(question_id);
create index if not exists idx_hunt_progress_user on hunt_progress(user_id);
create index if not exists idx_hunt_progress_hunt on hunt_progress(hunt_id);
create index if not exists idx_battle_sessions_user on battle_sessions(user_id);
create index if not exists idx_battle_sessions_status on battle_sessions(status);
create index if not exists idx_battle_turns_session on battle_turns(battle_session_id);
create index if not exists idx_user_question_history_user on user_question_history(user_id);
create index if not exists idx_user_question_history_question on user_question_history(question_id);
create index if not exists idx_users_slack on users(slack_user_id) where slack_user_id is not null;

-- Enable RLS on all user-data tables
alter table users enable row level security;
alter table profiles enable row level security;
alter table hunt_progress enable row level security;
alter table battle_sessions enable row level security;
alter table battle_turns enable row level security;
alter table user_question_history enable row level security;

-- RLS: Users can read their own record
create policy "Users can read own" on users
  for select using (auth.uid() = id);

-- RLS: Profiles - users can read/update own
create policy "Profiles read own" on profiles
  for select using (auth.uid() = user_id);
create policy "Profiles update own" on profiles
  for update using (auth.uid() = user_id);

-- RLS: Hunt progress - users can CRUD own
create policy "Hunt progress read own" on hunt_progress
  for select using (auth.uid() = user_id);
create policy "Hunt progress insert own" on hunt_progress
  for insert with check (auth.uid() = user_id);
create policy "Hunt progress update own" on hunt_progress
  for update using (auth.uid() = user_id);

-- RLS: Battle sessions - users can read/insert own
create policy "Battle sessions read own" on battle_sessions
  for select using (auth.uid() = user_id);
create policy "Battle sessions insert own" on battle_sessions
  for insert with check (auth.uid() = user_id);
create policy "Battle sessions update own" on battle_sessions
  for update using (auth.uid() = user_id);

-- RLS: Battle turns - via session ownership (service role used for inserts)
create policy "Battle turns read own" on battle_turns
  for select using (
    exists (
      select 1 from battle_sessions bs
      where bs.id = battle_session_id and bs.user_id = auth.uid()
    )
  );

-- RLS: User question history - users can read own
create policy "User question history read own" on user_question_history
  for select using (auth.uid() = user_id);
create policy "User question history insert own" on user_question_history
  for insert with check (auth.uid() = user_id);
create policy "User question history update own" on user_question_history
  for update using (auth.uid() = user_id);

-- Read-only tables: certifications, domains, topics, questions, answer_options, hunts
-- Service role / backend uses direct access; anon key gets read-only for public content
alter table certifications enable row level security;
alter table domains enable row level security;
alter table topics enable row level security;
alter table questions enable row level security;
alter table answer_options enable row level security;
alter table hunts enable row level security;

create policy "Certifications public read" on certifications for select using (true);
create policy "Domains public read" on domains for select using (true);
create policy "Topics public read" on topics for select using (true);
create policy "Questions active read" on questions for select using (is_active = true);
create policy "Answer options read" on answer_options for select using (true);
create policy "Hunts public read" on hunts for select using (true);
