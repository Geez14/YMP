create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null default 'standard' check (role in ('admin', 'standard', 'premium')),
  upload_limit integer default null,
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
  status text not null default 'queued' check (status in ('queued', 'compressing', 'ready', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, role)
  values (new.id, new.email, 'standard')
  on conflict (user_id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email
  where user_id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute function public.handle_auth_user_updated();

insert into public.profiles (user_id, email, role)
select u.id, u.email, 'standard'
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null;

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();

  -- Ensure upload_limit matches role semantics:
  -- premium => 50, admin => unlimited (NULL), standard => NULL
  if new.role = 'premium' then
    new.upload_limit = 50;
  elsif new.role = 'admin' then
    new.upload_limit = NULL;
  elsif new.role = 'standard' then
    new.upload_limit = NULL;
  end if;

  return new;
end;
$$;

drop trigger if exists set_profile_updated_at_trigger on public.profiles;
create trigger set_profile_updated_at_trigger
before update on public.profiles
for each row execute function public.set_profile_updated_at();

create or replace function public.set_song_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_song_updated_at_trigger on public.songs;
create trigger set_song_updated_at_trigger
before update on public.songs
for each row execute function public.set_song_updated_at();

alter table public.profiles enable row level security;
alter table public.songs enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Songs are viewable by owner" on public.songs;
create policy "Songs are viewable by owner"
  on public.songs
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Songs are insertable by owner" on public.songs;
create policy "Songs are insertable by owner"
  on public.songs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Songs are deletable by owner" on public.songs;
create policy "Songs are deletable by owner"
  on public.songs
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Songs are updatable by owner" on public.songs;
create policy "Songs are updatable by owner"
  on public.songs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger to enforce per-user upload limits (premium: 50, admin: unlimited/null)
create or replace function public.check_song_upload_limit()
returns trigger
language plpgsql
as $$
declare
  usr_limit integer;
  current_count integer;
  usr_role text;
begin
  select role, upload_limit into usr_role, usr_limit from public.profiles where user_id = new.user_id;

  -- If user is admin, allow unlimited uploads
  if usr_role = 'admin' then
    return new;
  end if;

  -- If upload_limit is null, allow unlimited
  if usr_limit is null then
    return new;
  end if;

  select count(*) into current_count from public.songs where user_id = new.user_id;

  if current_count >= usr_limit then
    raise exception 'upload limit reached for user % (limit %)', new.user_id, usr_limit;
  end if;

  return new;
end;
$$;

drop trigger if exists check_song_upload_limit_trigger on public.songs;
create trigger check_song_upload_limit_trigger
  before insert on public.songs
  for each row execute function public.check_song_upload_limit();

-- Storage assumptions:
-- 1) Bucket named "music" exists and is private.
-- 2) Direct browser access remains blocked; server routes use service role key.
