-- Run this: Supabase project → SQL Editor.
-- Creates all tables, indexes, RLS policies, and enables realtime.

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  name        text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Auto-create profile on new user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Trips ───────────────────────────────────────────────────────────────────
create table if not exists trips (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  destination  text not null,
  start_date   date not null,
  end_date     date not null,
  budget       numeric,
  created_by   uuid references profiles(id) on delete set null,
  invite_code  text unique not null,
  created_at   timestamptz default now()
);

create index if not exists trips_invite_code_idx on trips(invite_code);

-- ─── Trip Members ─────────────────────────────────────────────────────────────
create table if not exists trip_members (
  id         uuid primary key default uuid_generate_v4(),
  trip_id    uuid not null references trips(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  joined_at  timestamptz default now(),
  unique(trip_id, user_id)
);

create index if not exists trip_members_trip_idx on trip_members(trip_id);
create index if not exists trip_members_user_idx on trip_members(user_id);

-- ─── Activities ──────────────────────────────────────────────────────────────
create table if not exists activities (
  id          uuid primary key default uuid_generate_v4(),
  trip_id     uuid not null references trips(id) on delete cascade,
  name        text not null,
  datetime    timestamptz,
  lat         numeric,
  lng         numeric,
  address     text,
  notes       text,
  cost        numeric,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz default now()
);

create index if not exists activities_trip_idx on activities(trip_id);

-- ─── Activity Votes ───────────────────────────────────────────────────────────
create table if not exists activity_votes (
  id           uuid primary key default uuid_generate_v4(),
  activity_id  uuid not null references activities(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  vote_value   integer not null check (vote_value between 1 and 3),
  created_at   timestamptz default now(),
  unique(activity_id, user_id)
);

create index if not exists votes_activity_idx on activity_votes(activity_id);

-- ─── Expenses ────────────────────────────────────────────────────────────────
create table if not exists expenses (
  id            uuid primary key default uuid_generate_v4(),
  trip_id       uuid not null references trips(id) on delete cascade,
  description   text not null,
  amount        numeric not null check (amount > 0),
  paid_by       uuid not null references profiles(id) on delete cascade,
  split_among   uuid[] not null default '{}',
  created_at    timestamptz default now()
);

create index if not exists expenses_trip_idx on expenses(trip_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table profiles      enable row level security;
alter table trips         enable row level security;
alter table trip_members  enable row level security;
alter table activities    enable row level security;
alter table activity_votes enable row level security;
alter table expenses      enable row level security;

-- Is the current user a member of a given trip?
create or replace function is_trip_member(p_trip_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from trip_members
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$;

-- profiles: users can read all profiles, only update their own
create policy "Profiles are public to read"     on profiles for select using (true);
create policy "Users can update own profile"    on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"    on profiles for insert with check (auth.uid() = id);

-- trips: only members can see a trip
create policy "Members can view trip"       on trips for select using (is_trip_member(id));
create policy "Authenticated users create"  on trips for insert with check (auth.uid() is not null);
create policy "Owners can update trip"      on trips for update using (auth.uid() = created_by);
create policy "Owners can delete trip"      on trips for delete using (auth.uid() = created_by);

-- trip_members
create policy "Members can view membership"  on trip_members for select using (is_trip_member(trip_id));
create policy "Can join trip"                on trip_members for insert with check (auth.uid() = user_id);
create policy "Owners can remove members"    on trip_members for delete using (
  auth.uid() = user_id or
  exists (select 1 from trips where id = trip_id and created_by = auth.uid())
);

-- activities
create policy "Trip members view activities"    on activities for select using (is_trip_member(trip_id));
create policy "Trip members add activities"     on activities for insert with check (is_trip_member(trip_id) and auth.uid() = created_by);
create policy "Creator can update activity"     on activities for update using (auth.uid() = created_by);
create policy "Creator can delete activity"     on activities for delete using (auth.uid() = created_by);

-- activity_votes
create policy "Trip members view votes"    on activity_votes for select using (
  is_trip_member((select trip_id from activities where id = activity_id))
);
create policy "Trip members cast votes"    on activity_votes for insert with check (
  auth.uid() = user_id and
  is_trip_member((select trip_id from activities where id = activity_id))
);
create policy "Users update own vote"      on activity_votes for update using (auth.uid() = user_id);
create policy "Users delete own vote"      on activity_votes for delete using (auth.uid() = user_id);

-- expenses
create policy "Trip members view expenses"   on expenses for select using (is_trip_member(trip_id));
create policy "Trip members add expenses"    on expenses for insert with check (is_trip_member(trip_id));
create policy "Expense creator can delete"   on expenses for delete using (auth.uid() = paid_by);

-- ─── Enable Realtime ─────────────────────────────────────────────────────────
-- Run in Supabase Dashboard → Database → Replication → select tables below:
-- activities, activity_votes, expenses, trip_members

-- Or run this in the SQL editor:
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table activities, activity_votes, expenses, trip_members;
commit;
