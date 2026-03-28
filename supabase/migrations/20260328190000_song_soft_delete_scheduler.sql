create table if not exists public.cleanup_state_catalog (
  state text primary key,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.cleanup_state_catalog (state, is_terminal)
values
  ('pending', false),
  ('completed', true),
  ('failed', true)
on conflict (state) do update
set is_terminal = excluded.is_terminal;

create table if not exists public.song_retention (
  song_id uuid primary key references public.songs(id) on delete cascade,
  marked_removable_at timestamptz not null,
  cleanup_after timestamptz not null,
  cleanup_state text not null references public.cleanup_state_catalog(state),
  last_cleanup_attempt_at timestamptz,
  cleanup_attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_song_retention_due
  on public.song_retention (cleanup_state, cleanup_after);

create or replace function public.set_song_retention_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_song_retention_updated_at_trigger on public.song_retention;
create trigger set_song_retention_updated_at_trigger
before update on public.song_retention
for each row execute function public.set_song_retention_updated_at();

alter table public.song_retention enable row level security;

drop policy if exists "Song retention hidden from clients" on public.song_retention;
create policy "Song retention hidden from clients"
  on public.song_retention
  for all
  to authenticated
  using (false)
  with check (false);

create or replace function public.mark_song_removable(
  p_song_id uuid,
  p_delay interval default interval '5 hours'
)
returns void
language plpgsql
as $$
begin
  insert into public.song_retention (
    song_id,
    marked_removable_at,
    cleanup_after,
    cleanup_state,
    cleanup_attempt_count
  )
  values (
    p_song_id,
    now(),
    now() + p_delay,
    'pending',
    0
  )
  on conflict (song_id) do update
  set
    marked_removable_at = excluded.marked_removable_at,
    cleanup_after = excluded.cleanup_after,
    cleanup_state = 'pending',
    last_error = null;
end;
$$;

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
      and not exists (
        select 1
        from public.song_access sa
        where sa.song_id = sr.song_id
      )
    limit 500
  ), deleted as (
    delete from public.songs s
    using due d
    where s.id = d.song_id
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
    cleanup_state = 'failed',
    last_cleanup_attempt_at = now(),
    cleanup_attempt_count = sr.cleanup_attempt_count + 1,
    last_error = 'song still referenced by at least one user'
  where sr.cleanup_state = 'pending'
    and sr.cleanup_after <= now()
    and exists (
      select 1
      from public.song_access sa
      where sa.song_id = sr.song_id
    );

  return deleted_rows;
end;
$$;

do $do$
begin
  begin
    create extension if not exists pg_cron;
  exception
    when others then
      raise notice 'pg_cron extension not available: %', sqlerrm;
  end;

  if exists (
    select 1 from pg_extension where extname = 'pg_cron'
  ) then
    if not exists (
      select 1
      from cron.job
      where jobname = 'cleanup-soft-deleted-songs-every-5-hours'
    ) then
      perform cron.schedule(
        'cleanup-soft-deleted-songs-every-5-hours',
        '0 */5 * * *',
        $job$select public.run_song_cleanup();$job$
      );
    end if;
  end if;
end;
$do$;

create or replace function public.get_song_cleanup_schedule()
returns table (
  job_id bigint,
  job_name text,
  schedule text,
  command text,
  active boolean
)
language plpgsql
as $fn$
begin
  if not exists (
    select 1 from pg_extension where extname = 'pg_cron'
  ) then
    return;
  end if;

  return query execute $sql$
    select
      j.jobid::bigint,
      j.jobname,
      j.schedule,
      j.command,
      j.active
    from cron.job j
    where j.jobname = 'cleanup-soft-deleted-songs-every-5-hours'
  $sql$;
end;
$fn$;

create or replace function public.set_song_cleanup_schedule(p_schedule text)
returns void
language plpgsql
as $fn$
declare
  existing_job_id bigint;
begin
  if p_schedule is null or btrim(p_schedule) = '' then
    raise exception 'schedule cannot be empty';
  end if;

  if not exists (
    select 1 from pg_extension where extname = 'pg_cron'
  ) then
    raise exception 'pg_cron extension is not available in this database';
  end if;

  for existing_job_id in
    select j.jobid::bigint
    from cron.job j
    where j.jobname = 'cleanup-soft-deleted-songs-every-5-hours'
  loop
    perform cron.unschedule(existing_job_id::integer);
  end loop;

  perform cron.schedule(
    'cleanup-soft-deleted-songs-every-5-hours',
    p_schedule,
    $job$select public.run_song_cleanup();$job$
  );
end;
$fn$;