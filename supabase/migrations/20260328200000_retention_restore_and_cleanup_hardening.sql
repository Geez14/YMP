create index if not exists idx_songs_content_hash_created_at
  on public.songs (content_hash, created_at desc);

create index if not exists idx_song_access_song_user
  on public.song_access (song_id, user_id);

create index if not exists idx_song_retention_song_state
  on public.song_retention (song_id, cleanup_state);

create or replace function public.clear_song_retention_on_access_insert()
returns trigger
language plpgsql
as $$
begin
  delete from public.song_retention
  where song_id = new.song_id;

  return new;
end;
$$;

drop trigger if exists clear_song_retention_on_access_insert_trigger on public.song_access;
create trigger clear_song_retention_on_access_insert_trigger
after insert on public.song_access
for each row execute function public.clear_song_retention_on_access_insert();

create or replace function public.run_song_cleanup()
returns integer
language plpgsql
as $$
declare
  deleted_rows integer := 0;
begin
  with due as (
    select sr.song_id
    from public.song_retention sr
    where sr.cleanup_state = 'pending'
      and sr.cleanup_after <= now()
    limit 500
  ),
  deleted as (
    delete from public.songs s
    using due d
    where s.id = d.song_id
      and not exists (
        select 1
        from public.song_access sa
        where sa.song_id = s.id
      )
    returning s.id
  )
  update public.song_retention sr
  set
    cleanup_state = 'completed',
    last_cleanup_attempt_at = now(),
    cleanup_attempt_count = sr.cleanup_attempt_count + 1,
    last_error = null
  where sr.song_id in (select id from deleted);

  get diagnostics deleted_rows = row_count;

  update public.song_retention sr
  set
    cleanup_state = 'completed',
    last_cleanup_attempt_at = now(),
    cleanup_attempt_count = sr.cleanup_attempt_count + 1,
    last_error = null
  where sr.cleanup_state = 'pending'
    and sr.cleanup_after <= now()
    and not exists (
      select 1
      from public.songs s
      where s.id = sr.song_id
    );

  update public.song_retention sr
  set
    cleanup_state = 'failed',
    last_cleanup_attempt_at = now(),
    cleanup_attempt_count = sr.cleanup_attempt_count + 1,
    last_error = 'song still referenced by at least one user'
  where sr.cleanup_state = 'pending'
    and sr.cleanup_after <= now()
    and exists (
      select 1
      from public.songs s
      where s.id = sr.song_id
    )
    and exists (
      select 1
      from public.song_access sa
      where sa.song_id = sr.song_id
    );

  return deleted_rows;
end;
$$;

update public.song_retention sr
set cleanup_state = 'completed',
    updated_at = now(),
    last_cleanup_attempt_at = now(),
    last_error = null
where not exists (
  select 1
  from public.songs s
  where s.id = sr.song_id
);
