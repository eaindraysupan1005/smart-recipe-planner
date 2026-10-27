-- What2Cook — Supabase schema.
-- Paste into Supabase → SQL Editor → Run. Safe to run more than once.
--
-- The Express backend is the only client and connects with the service-role
-- (secret) key, which bypasses Row Level Security. RLS is switched on with no
-- policies, so the public anon key can read and write nothing.

-- Timestamps are timestamptz: exact moments, shown in UTC by the Supabase
-- Table Editor. The app converts them to local time. To read them in Bangkok
-- time in SQL: select scanned_at at time zone 'Asia/Bangkok' from pantry_items;

create table if not exists users (
  id          uuid primary key,
  email       text not null,
  name        text not null,
  created_at  timestamptz not null
);
create unique index if not exists users_email_lower_key on users (lower(email));

-- Dummy auth: an opaque session token only, never a password (PDPA).
create table if not exists sessions (
  token       text primary key,
  user_id     uuid not null references users (id) on delete cascade,
  created_at  timestamptz not null
);
create index if not exists sessions_user_id_idx on sessions (user_id);

create table if not exists diet_profiles (
  user_id      uuid primary key references users (id) on delete cascade,
  vegetarian   boolean not null default false,
  gluten_free  boolean not null default false,
  low_carb     boolean not null default false,
  allergies    jsonb not null default '[]',
  updated_at   timestamptz not null
);

create table if not exists pantry_items (
  id          uuid primary key,
  user_id     uuid not null references users (id) on delete cascade,
  name        text not null,
  qty         numeric(12, 2) not null,
  unit        text not null default '',
  scanned_at  timestamptz not null,
  source      text not null check (source in ('scan', 'manual')),
  raw         text
);
create index if not exists pantry_items_user_id_idx on pantry_items (user_id);

create table if not exists recipes (
  id               uuid primary key,
  user_id          uuid not null references users (id) on delete cascade,
  name             text not null,
  minutes          integer not null default 0,
  tags             jsonb not null default '[]',
  ingredients      jsonb not null default '[]',
  staples          jsonb not null default '[]',
  steps            jsonb not null default '[]',
  excluded         jsonb not null default '[]',
  why              text,
  warnings         jsonb,
  servings         integer,
  missing          jsonb,
  status           text not null check (status in ('generated', 'saved')),
  picked_item_ids  jsonb not null default '[]',
  generation       jsonb not null,
  saved_at         timestamptz,
  last_cooked_at   timestamptz
);
create index if not exists recipes_user_id_idx on recipes (user_id);

-- ETA §26/28 — reproducible AI-output record. Kept apart from the (deletable)
-- suggestion, so recipe_id is deliberately not a foreign key.
create table if not exists ai_records (
  id          uuid primary key,
  user_id     uuid not null references users (id) on delete cascade,
  recipe_id   uuid not null,
  text        text not null,
  generation  jsonb not null
);
create index if not exists ai_records_user_id_idx on ai_records (user_id);

create table if not exists grocery_items (
  id           uuid primary key,
  user_id      uuid not null references users (id) on delete cascade,
  name         text not null,
  qty          numeric(12, 2) not null,
  unit         text not null default '',
  checked      boolean not null default false,
  from_recipe  text,
  added_at     timestamptz not null
);
create index if not exists grocery_items_user_id_idx on grocery_items (user_id);

-- ETA §9/26/28 — acceptance / consent / withdrawal evidence. Survives account
-- deletion, so user_id is deliberately not a foreign key.
create table if not exists acceptance_records (
  id       uuid primary key,
  user_id  uuid not null,
  kind     text not null,
  action   text not null check (action in ('granted', 'withdrawn')),
  version  text not null,
  detail   text,
  at       timestamptz not null
);
create index if not exists acceptance_records_user_id_idx on acceptance_records (user_id);

-- CCA §26 — access/traffic log (account id, IP, timestamp), kept ≥ 90 days and
-- retained after content is deleted, so user_id is deliberately not a foreign key.
create table if not exists access_logs (
  id       uuid primary key,
  user_id  uuid not null,
  ip       text not null,
  at       timestamptz not null,
  method   text not null,
  path     text not null,
  status   integer not null
);
create index if not exists access_logs_user_id_idx on access_logs (user_id);
create index if not exists access_logs_at_idx on access_logs (at);

alter table users              enable row level security;
alter table sessions           enable row level security;
alter table diet_profiles      enable row level security;
alter table pantry_items       enable row level security;
alter table recipes            enable row level security;
alter table ai_records         enable row level security;
alter table grocery_items      enable row level security;
alter table acceptance_records enable row level security;
alter table access_logs        enable row level security;
