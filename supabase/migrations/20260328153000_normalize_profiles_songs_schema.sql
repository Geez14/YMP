create table if not exists public.role_catalog (
  role text primary key,
  default_upload_limit integer,
  is_unlimited boolean not null default false,
  can_manage_all_songs boolean not null default false,
  created_at timestamptz not null default now(),
  constraint role_catalog_limit_check check (
    (is_unlimited = true and default_upload_limit is null)
    or (is_unlimited = false and default_upload_limit is not null and default_upload_limit > 0)
  )
);

insert into public.role_catalog (role, default_upload_limit, is_unlimited, can_manage_all_songs)
values
  ('standard', 10, false, false),
  ('premium', 50, false, false),
  ('admin', null, true, true)
on conflict (role) do update
set
  default_upload_limit = excluded.default_upload_limit,
  is_unlimited = excluded.is_unlimited,
  can_manage_all_songs = excluded.can_manage_all_songs;

create table if not exists public.song_status_catalog (
  status text primary key,
  is_terminal boolean not null default false,
  sort_order smallint not null unique,
  created_at timestamptz not null default now()
);

insert into public.song_status_catalog (status, is_terminal, sort_order)
values
  ('queued', false, 1),
  ('compressing', false, 2),
  ('ready', true, 3),
  ('failed', true, 4)
on conflict (status) do update
set
  is_terminal = excluded.is_terminal,
  sort_order = excluded.sort_order;

create table if not exists public.mime_type_catalog (
  mime_type text primary key,
  media_family text not null default 'audio' check (media_family in ('audio', 'other')),
  is_streamable boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.mime_type_catalog (mime_type, media_family, is_streamable)
values
  ('audio/mpeg', 'audio', true),
  ('audio/mp4', 'audio', true),
  ('audio/x-m4a', 'audio', true),
  ('audio/aac', 'audio', true),
  ('audio/ogg', 'audio', true),
  ('audio/wav', 'audio', true),
  ('audio/flac', 'audio', true)
on conflict (mime_type) do nothing;

insert into public.mime_type_catalog (mime_type, media_family, is_streamable)
select distinct s.mime_type, 'audio', true
from public.songs s
left join public.mime_type_catalog m on m.mime_type = s.mime_type
where m.mime_type is null;

alter table if exists public.profiles
  drop constraint if exists profiles_role_check;

alter table if exists public.profiles
  drop constraint if exists profiles_role_fk;

alter table if exists public.profiles
  add constraint profiles_role_fk
  foreign key (role)
  references public.role_catalog(role)
  on update cascade;

alter table if exists public.songs
  drop constraint if exists songs_status_check;

alter table if exists public.songs
  drop constraint if exists songs_status_fk;

alter table if exists public.songs
  add constraint songs_status_fk
  foreign key (status)
  references public.song_status_catalog(status)
  on update cascade;

alter table if exists public.songs
  drop constraint if exists songs_mime_type_fk;

alter table if exists public.songs
  add constraint songs_mime_type_fk
  foreign key (mime_type)
  references public.mime_type_catalog(mime_type)
  on update cascade;

alter table if exists public.songs
  drop constraint if exists songs_title_nonempty_check;

alter table if exists public.songs
  add constraint songs_title_nonempty_check
  check (length(btrim(title)) > 0);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_songs_user_status_created_at on public.songs (user_id, status, created_at desc);
create index if not exists idx_songs_status_created_at on public.songs (status, created_at desc);

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
declare
  role_default_limit integer;
  role_unlimited boolean;
begin
  new.updated_at = now();

  select rc.default_upload_limit, rc.is_unlimited
    into role_default_limit, role_unlimited
  from public.role_catalog rc
  where rc.role = new.role;

  if not found then
    raise exception 'Unknown role: %', new.role;
  end if;

  if role_unlimited then
    new.upload_limit = null;
  elsif new.upload_limit is null then
    new.upload_limit = role_default_limit;
  end if;

  return new;
end;
$$;

drop trigger if exists set_profile_updated_at_trigger on public.profiles;
create trigger set_profile_updated_at_trigger
before insert or update on public.profiles
for each row execute function public.set_profile_updated_at();

update public.profiles p
set upload_limit = case
  when rc.is_unlimited then null
  else coalesce(p.upload_limit, rc.default_upload_limit)
end
from public.role_catalog rc
where rc.role = p.role;

create or replace function public.check_song_upload_limit()
returns trigger
language plpgsql
as $$
declare
  explicit_limit integer;
  role_default_limit integer;
  role_unlimited boolean;
  effective_limit integer;
  current_count integer;
begin
  select p.upload_limit, rc.default_upload_limit, rc.is_unlimited
    into explicit_limit, role_default_limit, role_unlimited
  from public.profiles p
  join public.role_catalog rc on rc.role = p.role
  where p.user_id = new.user_id;

  if not found then
    raise exception 'profile not found for user %', new.user_id;
  end if;

  if role_unlimited then
    return new;
  end if;

  effective_limit = coalesce(explicit_limit, role_default_limit);

  if effective_limit is null then
    return new;
  end if;

  select count(*) into current_count
  from public.songs
  where user_id = new.user_id;

  if current_count >= effective_limit then
    raise exception 'upload limit reached for user % (limit %)', new.user_id, effective_limit;
  end if;

  return new;
end;
$$;
