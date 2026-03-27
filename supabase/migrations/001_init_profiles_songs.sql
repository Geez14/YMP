create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'standard' check (role in ('admin', 'standard')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  file_path text not null unique,
  file_size_bytes integer not null check (file_size_bytes >= 0),
  mime_type text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profile_updated_at_trigger on public.profiles;
create trigger set_profile_updated_at_trigger
before update on public.profiles
for each row execute function public.set_profile_updated_at();

alter table public.profiles enable row level security;
alter table public.songs enable row level security;

create policy if not exists "Profiles are viewable by owner"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "Profiles are updatable by owner"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Songs are viewable by owner"
  on public.songs
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "Songs are insertable by owner"
  on public.songs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy if not exists "Songs are deletable by owner"
  on public.songs
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Storage assumptions:
-- 1) Bucket named "music" exists and is private.
-- 2) Direct browser access remains blocked; server routes use service role key.
