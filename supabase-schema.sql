-- Crisis Copilot Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

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

create policy "Public access emergencies" on emergencies for all using (true) with check (true);
create policy "Public access missing_persons" on missing_persons for all using (true) with check (true);
create policy "Public access dispatched_units" on dispatched_units for all using (true) with check (true);
create policy "Public access dispatch_log" on dispatch_log for all using (true) with check (true);

-- Enable realtime
alter publication supabase_realtime add table emergencies;
alter publication supabase_realtime add table dispatched_units;

-- Create storage bucket for media
insert into storage.buckets (id, name, public) values ('emergency-media', 'emergency-media', true)
on conflict (id) do nothing;

create policy "Public upload emergency-media" on storage.objects for insert with check (bucket_id = 'emergency-media');
create policy "Public read emergency-media" on storage.objects for select using (bucket_id = 'emergency-media');

-- Indexes for performance
create index if not exists idx_emergencies_status on emergencies(status);
create index if not exists idx_emergencies_severity on emergencies(severity);
create index if not exists idx_emergencies_created_at on emergencies(created_at desc);
create index if not exists idx_missing_persons_status on missing_persons(status);
create index if not exists idx_dispatched_units_emergency on dispatched_units(emergency_id);
