-- ============================================================
-- Wedding Planner SaaS — Full Database Schema
-- Run this in Supabase SQL Editor (in order)
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  plan_tier     text not null default 'free' check (plan_tier in ('free', 'basic', 'pro')),
  plan_expires_at timestamptz,
  stripe_customer_id text,
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- EVENTS
-- ============================================================
create table public.events (
  id                  uuid primary key default uuid_generate_v4(),
  owner_id            uuid not null references public.profiles(id) on delete cascade,
  name                text not null,
  date                date,
  venue               text,
  guest_count_target  int,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Members can view events"
  on public.events for select
  using (
    auth.uid() = owner_id or
    exists (
      select 1 from public.event_members
      where event_members.event_id = events.id
        and event_members.user_id = auth.uid()
    )
  );

create policy "Owner can insert events"
  on public.events for insert
  with check (auth.uid() = owner_id);

create policy "Owner and editors can update events"
  on public.events for update
  using (
    auth.uid() = owner_id or
    exists (
      select 1 from public.event_members
      where event_members.event_id = events.id
        and event_members.user_id = auth.uid()
        and event_members.role in ('owner', 'editor')
    )
  );

create policy "Owner can delete events"
  on public.events for delete
  using (auth.uid() = owner_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- EVENT MEMBERS (collaboration)
-- ============================================================
create table public.event_members (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'viewer' check (role in ('owner', 'editor', 'viewer')),
  created_at  timestamptz not null default now(),
  unique(event_id, user_id)
);

alter table public.event_members enable row level security;

create policy "Members can view event_members"
  on public.event_members for select
  using (
    exists (
      select 1 from public.events
      where events.id = event_members.event_id
        and (events.owner_id = auth.uid() or exists (
          select 1 from public.event_members em2
          where em2.event_id = event_members.event_id
            and em2.user_id = auth.uid()
        ))
    )
  );

create policy "Owner can manage members"
  on public.event_members for all
  using (
    exists (
      select 1 from public.events
      where events.id = event_members.event_id
        and events.owner_id = auth.uid()
    )
  );

-- ============================================================
-- TABLES
-- ============================================================
create table public.tables (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references public.events(id) on delete cascade,
  name        text not null,
  capacity    int not null default 8,
  position_x  float not null default 0,
  position_y  float not null default 0,
  shape       text not null default 'round' check (shape in ('round', 'rectangular')),
  notes       text,
  created_at  timestamptz not null default now()
);

alter table public.tables enable row level security;

create policy "Members can view tables"
  on public.tables for select
  using (
    exists (
      select 1 from public.events
      where events.id = tables.event_id
        and (events.owner_id = auth.uid() or exists (
          select 1 from public.event_members
          where event_members.event_id = tables.event_id
            and event_members.user_id = auth.uid()
        ))
    )
  );

create policy "Editors and owners can modify tables"
  on public.tables for all
  using (
    exists (
      select 1 from public.events
      where events.id = tables.event_id
        and (events.owner_id = auth.uid() or exists (
          select 1 from public.event_members
          where event_members.event_id = tables.event_id
            and event_members.user_id = auth.uid()
            and event_members.role in ('owner', 'editor')
        ))
    )
  );

-- ============================================================
-- GUESTS
-- ============================================================
create table public.guests (
  id                   uuid primary key default uuid_generate_v4(),
  event_id             uuid not null references public.events(id) on delete cascade,
  name                 text not null,
  email                text,
  phone                text,
  category             text not null default 'friends' check (category in ('family', 'friends', 'coworkers', 'kids')),
  rsvp_status          text not null default 'pending' check (rsvp_status in ('pending', 'confirmed', 'declined')),
  has_plus_one         boolean not null default false,
  plus_one_name        text,
  plus_one_confirmed   boolean not null default false,
  dietary              text,
  notes                text,
  table_id             uuid references public.tables(id) on delete set null,
  seat_number          int,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.guests enable row level security;

create policy "Members can view guests"
  on public.guests for select
  using (
    exists (
      select 1 from public.events
      where events.id = guests.event_id
        and (events.owner_id = auth.uid() or exists (
          select 1 from public.event_members
          where event_members.event_id = guests.event_id
            and event_members.user_id = auth.uid()
        ))
    )
  );

create policy "Editors and owners can modify guests"
  on public.guests for all
  using (
    exists (
      select 1 from public.events
      where events.id = guests.event_id
        and (events.owner_id = auth.uid() or exists (
          select 1 from public.event_members
          where event_members.event_id = guests.event_id
            and event_members.user_id = auth.uid()
            and event_members.role in ('owner', 'editor')
        ))
    )
  );

create trigger guests_updated_at
  before update on public.guests
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
create table public.activity_log (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  action      text not null,
  payload     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

alter table public.activity_log enable row level security;

create policy "Members can view activity"
  on public.activity_log for select
  using (
    exists (
      select 1 from public.events
      where events.id = activity_log.event_id
        and (events.owner_id = auth.uid() or exists (
          select 1 from public.event_members
          where event_members.event_id = activity_log.event_id
            and event_members.user_id = auth.uid()
        ))
    )
  );

create policy "Members can insert activity"
  on public.activity_log for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.events
      where events.id = activity_log.event_id
        and (events.owner_id = auth.uid() or exists (
          select 1 from public.event_members
          where event_members.event_id = activity_log.event_id
            and event_members.user_id = auth.uid()
        ))
    )
  );

-- ============================================================
-- RSVP RESPONSES (public — no auth required)
-- ============================================================
create table public.rsvp_responses (
  id              uuid primary key default uuid_generate_v4(),
  event_id        uuid not null references public.events(id) on delete cascade,
  token           text not null unique default encode(gen_random_bytes(16), 'hex'),
  guest_name      text not null,
  attending       boolean not null,
  plus_one_count  int not null default 0,
  menu_choice     text,
  allergies       text,
  message         text,
  submitted_at    timestamptz not null default now()
);

alter table public.rsvp_responses enable row level security;

-- Public can insert RSVP responses (via token validation in API)
create policy "Public can insert rsvp"
  on public.rsvp_responses for insert
  with check (true);

create policy "Event members can view rsvp responses"
  on public.rsvp_responses for select
  using (
    exists (
      select 1 from public.events
      where events.id = rsvp_responses.event_id
        and (events.owner_id = auth.uid() or exists (
          select 1 from public.event_members
          where event_members.event_id = rsvp_responses.event_id
            and event_members.user_id = auth.uid()
        ))
    )
  );

-- ============================================================
-- QR CODES
-- ============================================================
create table public.qr_codes (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references public.events(id) on delete cascade,
  guest_id    uuid references public.guests(id) on delete cascade,
  type        text not null check (type in ('invitation', 'checkin')),
  token       text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at  timestamptz not null default now()
);

alter table public.qr_codes enable row level security;

create policy "Members can manage qr codes"
  on public.qr_codes for all
  using (
    exists (
      select 1 from public.events
      where events.id = qr_codes.event_id
        and (events.owner_id = auth.uid() or exists (
          select 1 from public.event_members
          where event_members.event_id = qr_codes.event_id
            and event_members.user_id = auth.uid()
        ))
    )
  );

-- ============================================================
-- INVITE LINKS (for collaboration)
-- ============================================================
create table public.invite_links (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references public.events(id) on delete cascade,
  role        text not null default 'editor' check (role in ('editor', 'viewer')),
  token       text not null unique default encode(gen_random_bytes(12), 'hex'),
  created_by  uuid not null references public.profiles(id) on delete cascade,
  uses        int not null default 0,
  max_uses    int,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.invite_links enable row level security;

create policy "Owner can manage invite links"
  on public.invite_links for all
  using (
    exists (
      select 1 from public.events
      where events.id = invite_links.event_id
        and events.owner_id = auth.uid()
    )
  );

-- Public can read invite links to join (validated in API)
create policy "Public can read invite links"
  on public.invite_links for select
  using (true);

-- ============================================================
-- REALTIME — enable publication for tables
-- ============================================================
alter publication supabase_realtime add table public.guests;
alter publication supabase_realtime add table public.tables;
alter publication supabase_realtime add table public.activity_log;
alter publication supabase_realtime add table public.rsvp_responses;
