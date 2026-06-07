-- Crisis Copilot Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles & Roles ────────────────────────────────────────
-- Each authenticated user gets a profile row holding their role and account status.
-- role:   'dispatcher' (command center) or 'volunteer' (community helper)
-- status: 'active' (can sign in) or 'suspended' (blocked by the app)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  email text,
  role text not null default 'volunteer' check (role in ('dispatcher', 'volunteer')),
  status text not null default 'active' check (status in ('active', 'suspended'))
);

-- Auto-create a profile when a new auth user signs up.
-- New signups default to the 'volunteer' role with 'active' status.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, status)
  values (new.id, new.email, 'volunteer', 'active')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table profiles enable row level security;

-- Helper: check whether the current user is a dispatcher WITHOUT triggering
-- recursive RLS evaluation on the profiles table. security definer makes it
-- run with the function owner's privileges, bypassing RLS inside the function.
create or replace function public.is_dispatcher()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'dispatcher'
  );
$$;

-- A user can read and update their own profile.
drop policy if exists "Users read own profile" on profiles;
create policy "Users read own profile" on profiles
  for select using (auth.uid() = id);
drop policy if exists "Users update own profile" on profiles;
create policy "Users update own profile" on profiles
  for update using (auth.uid() = id);

-- Dispatchers can read and update ALL profiles (needed for volunteer management).
drop policy if exists "Dispatchers read all profiles" on profiles;
create policy "Dispatchers read all profiles" on profiles
  for select using (public.is_dispatcher());
drop policy if exists "Dispatchers update all profiles" on profiles;
create policy "Dispatchers update all profiles" on profiles
  for update using (public.is_dispatcher());

-- Emergencies table
create table if not exists emergencies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  status text not null default 'new' check (status in ('new', 'triaging', 'dispatched', 'resolved')),
  severity int check (severity between 1 and 5),
  category text check (category in ('fire', 'medical', 'crime', 'natural_disaster', 'other')),
  description text,
  location_lat float8,
  location_lng float8,
  location_address text,
  audio_url text,
  image_url text,
  translated_text text,
  threat_assessment jsonb default '{}',
  first_aid_instructions text,
  reporter_phone text,
  reporter_language text,
  tags jsonb default '{}'
);

-- Missing persons table
create table if not exists missing_persons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  emergency_id uuid references emergencies(id) on delete set null,
  name text,
  estimated_age text,
  gender text,
  description text,
  clothing_description text,
  last_seen_location text,
  last_seen_time timestamptz,
  image_url text,
  extracted_tags jsonb default '{}',
  status text not null default 'active' check (status in ('active', 'found', 'closed')),
  reporter_name text,
  reporter_contact text
);

-- Dispatched units table
create table if not exists dispatched_units (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  emergency_id uuid references emergencies(id) on delete cascade,
  unit_type text not null check (unit_type in ('police', 'fire', 'ambulance', 'search_rescue')),
  unit_id text,
  status text not null default 'dispatched' check (status in ('dispatched', 'en_route', 'on_scene', 'completed')),
  eta_minutes int,
  notes text
);

-- Dispatch log table
create table if not exists dispatch_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  emergency_id uuid references emergencies(id) on delete cascade,
  action text not null,
  details jsonb default '{}',
  performed_by text not null check (performed_by in ('ai', 'dispatcher'))
);

-- Enable Row Level Security (public access for hackathon demo)
alter table emergencies enable row level security;
alter table missing_persons enable row level security;
alter table dispatched_units enable row level security;
alter table dispatch_log enable row level security;

drop policy if exists "Public access emergencies" on emergencies;
create policy "Public access emergencies" on emergencies for all using (true) with check (true);
drop policy if exists "Public access missing_persons" on missing_persons;
create policy "Public access missing_persons" on missing_persons for all using (true) with check (true);
drop policy if exists "Public access dispatched_units" on dispatched_units;
create policy "Public access dispatched_units" on dispatched_units for all using (true) with check (true);
drop policy if exists "Public access dispatch_log" on dispatch_log;
create policy "Public access dispatch_log" on dispatch_log for all using (true) with check (true);

-- Enable realtime (guarded — adding a table already in the publication errors)
do $$
begin
  alter publication supabase_realtime add table emergencies;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table dispatched_units;
exception when duplicate_object then null;
end $$;

-- Create storage bucket for media
insert into storage.buckets (id, name, public) values ('emergency-media', 'emergency-media', true)
on conflict (id) do nothing;

drop policy if exists "Public upload emergency-media" on storage.objects;
create policy "Public upload emergency-media" on storage.objects for insert with check (bucket_id = 'emergency-media');
drop policy if exists "Public read emergency-media" on storage.objects;
create policy "Public read emergency-media" on storage.objects for select using (bucket_id = 'emergency-media');

-- Indexes for performance
create index if not exists idx_emergencies_status on emergencies(status);
create index if not exists idx_emergencies_severity on emergencies(severity);
create index if not exists idx_emergencies_created_at on emergencies(created_at desc);
create index if not exists idx_missing_persons_status on missing_persons(status);
create index if not exists idx_dispatched_units_emergency on dispatched_units(emergency_id);
create index if not exists idx_profiles_role on profiles(role);

-- ─── Auth setup notes (manual steps) ─────────────────────────
-- 1. In Supabase Dashboard → Authentication → Providers → Email,
--    disable "Confirm email" so accounts can sign in immediately (demo).
-- 2. Create a dispatcher account: sign up a user (Dashboard → Authentication → Users,
--    or via the app), then promote them to dispatcher:
--      update profiles set role = 'dispatcher' where email = 'dispatcher@example.com';
-- 3. For secure server-side volunteer management, set SUPABASE_SERVICE_ROLE_KEY in .env.
--    Without it the server falls back to the publishable key (reads work; profile
--    writes require the dispatcher's own session/RLS).
