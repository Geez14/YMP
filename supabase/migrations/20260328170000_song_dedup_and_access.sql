alter table if exists public.songs
  add column if not exists content_hash text;

update public.songs
set content_hash = md5(file_path)
where content_hash is null;

alter table if exists public.songs
  alter column content_hash set not null;

alter table if exists public.songs
  drop constraint if exists songs_content_hash_key;

alter table if exists public.songs
  add constraint songs_content_hash_key unique (content_hash);

create table if not exists public.song_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, song_id)
);

insert into public.song_access (user_id, song_id)
select distinct s.user_id, s.id
from public.songs s
left join public.song_access sa
  on sa.user_id = s.user_id and sa.song_id = s.id
where sa.song_id is null;

create index if not exists idx_song_access_song_id on public.song_access (song_id);
create index if not exists idx_song_access_user_created on public.song_access (user_id, created_at desc);

alter table public.song_access enable row level security;

drop policy if exists "Song access is viewable by owner" on public.song_access;
create policy "Song access is viewable by owner"
  on public.song_access
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Song access is insertable by owner" on public.song_access;
create policy "Song access is insertable by owner"
  on public.song_access
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Song access is deletable by owner" on public.song_access;
create policy "Song access is deletable by owner"
  on public.song_access
  for delete
  to authenticated
  using (auth.uid() = user_id);

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
  from public.song_access
  where user_id = new.user_id;

  if current_count >= effective_limit then
    raise exception 'upload limit reached for user % (limit %)', new.user_id, effective_limit;
  end if;

  return new;
end;
$$;
