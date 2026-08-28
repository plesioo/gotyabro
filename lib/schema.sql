-- GotYaBro schema. Idempotent: safe to run repeatedly.

create table if not exists gyms (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists communities (
  id         uuid primary key default gen_random_uuid(),
  gym_id     uuid not null unique references gyms(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists members (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  first_name   text not null,
  last_name    text not null,
  email        text,
  phone        text,
  status       text not null default 'ACTIVE' check (status in ('ACTIVE', 'REMOVED')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  removed_at   timestamptz
);

create index if not exists members_community_idx on members (community_id);

create table if not exists roles (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  name         text not null,
  color        text not null default 'gray',
  created_at   timestamptz not null default now(),
  unique (community_id, name)
);

create table if not exists member_roles (
  member_id   uuid not null references members(id) on delete cascade,
  role_id     uuid not null references roles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (member_id, role_id)
);

create table if not exists activities (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  type         text not null,
  message      text not null,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists activities_feed_idx on activities (community_id, created_at desc);
