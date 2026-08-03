-- Run this in Supabase SQL Editor (Project -> SQL Editor -> New query)

-- Profiles: one row per signed-up user, linked to Supabase auth
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text not null,
  email text not null,
  age_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Partnerships: links a user to their accountability partner
-- partner_user_id is null until the invited partner actually creates an account
create table partnerships (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade not null,
  partner_name text not null,
  partner_email text not null,
  partner_user_id uuid references profiles(id) on delete set null,
  status text not null default 'invited', -- invited | accepted
  consent_self boolean not null default false,
  consent_partner boolean not null default false,
  created_at timestamptz not null default now()
);

-- Flagged events: created when detection fires, deleted permanently once partner reviews
create table flagged_events (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid references partnerships(id) on delete cascade not null,
  owner_id uuid references profiles(id) on delete cascade not null,
  storage_path text not null,      -- path in the 'flagged-images' storage bucket
  search_term text,
  domain text,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table partnerships enable row level security;
alter table flagged_events enable row level security;

create policy "users read own profile" on profiles
  for select using (auth.uid() = id);

create policy "users update own profile" on profiles
  for update using (auth.uid() = id);

create policy "owner reads own partnerships" on partnerships
  for select using (auth.uid() = owner_id or auth.uid() = partner_user_id);

create policy "owner creates partnerships" on partnerships
  for insert with check (auth.uid() = owner_id);

create policy "partner reads own flagged events" on flagged_events
  for select using (
    auth.uid() = owner_id
    or auth.uid() in (
      select partner_user_id from partnerships where id = partnership_id
    )
  );

-- Storage bucket for flagged images (private, not publicly readable)
insert into storage.buckets (id, name, public)
values ('flagged-images', 'flagged-images', false)
on conflict (id) do nothing;

create policy "only edge functions manage flagged images"
  on storage.objects for all
  using (bucket_id = 'flagged-images' and auth.role() = 'service_role');
