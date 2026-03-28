alter table if exists public.profiles
  add column if not exists email text;

alter table if exists public.profiles
  add column if not exists upload_limit integer default null;

alter table if exists public.profiles
  drop constraint if exists profiles_role_check;

alter table if exists public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'standard', 'premium'));

alter table if exists public.songs
  add column if not exists status text not null default 'queued';

alter table if exists public.songs
  add column if not exists error_message text;

alter table if exists public.songs
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.songs
  drop constraint if exists songs_status_check;

alter table if exists public.songs
  add constraint songs_status_check
  check (status in ('queued', 'compressing', 'ready', 'failed'));

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

  if new.role = 'premium' then
    new.upload_limit = 50;
  elsif new.role = 'admin' then
    new.upload_limit = null;
  elsif new.role = 'standard' then
    new.upload_limit = null;
  end if;

  return new;
end;
$$;

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

drop policy if exists "Songs are updatable by owner" on public.songs;
create policy "Songs are updatable by owner"
  on public.songs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
