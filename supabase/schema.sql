-- SEU LigaPro schema for Supabase (PostgreSQL)
-- Run in Supabase Dashboard -> SQL Editor.

create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  name varchar(60) not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  name varchar(60) not null,
  coach varchar(60) not null default '',
  city varchar(60) not null default '',
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, user_id)
);
create index teams_user_id_idx on teams(user_id);

create table players (
  id uuid primary key default gen_random_uuid(),
  name varchar(60) not null,
  position text not null default 'MID'
    check (position in ('GK','DEF','MID','FWD')),
  jersey_no int not null default 10
    check (jersey_no between 1 and 99),
  goals int not null default 0
    check (goals >= 0),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index players_team_id_idx on players(team_id);
create index players_user_id_idx on players(user_id);

create table matches (
  id uuid primary key default gen_random_uuid(),
  home_team varchar(60) not null,
  away_team varchar(60) not null,
  date timestamptz not null,
  venue varchar(100) not null,
  home_score int not null default 0
    check (home_score between 0 and 30),
  away_score int not null default 0
    check (away_score between 0 and 30),
  status text not null default 'scheduled'
    check (status in ('scheduled','live','finished')),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index matches_status_date_idx on matches(status, date);

create or replace function bump_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger users_bump before update on users
  for each row execute function bump_updated_at();
create trigger teams_bump before update on teams
  for each row execute function bump_updated_at();
create trigger players_bump before update on players
  for each row execute function bump_updated_at();
create trigger matches_bump before update on matches
  for each row execute function bump_updated_at();
