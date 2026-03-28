-- Store Slack workspace installations for OAuth flow
create table slack_installations (
  id uuid primary key default gen_random_uuid(),
  team_id text not null,
  team_name text,
  enterprise_id text,
  bot_user_id text,
  bot_token text not null,
  installed_by text not null,
  installed_at timestamptz not null default now(),
  unique(team_id)
);

create index idx_slack_installations_team on slack_installations(team_id);
