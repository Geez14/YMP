-- Ensure upload limits follow role defaults when roles change, without hardcoding per client.
-- This keeps explicit overrides intact (only adjusts when the role changes and the limit was not explicitly set).

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
declare
  role_default_limit integer;
  role_unlimited boolean;
  role_changed boolean := TG_OP = 'UPDATE' and new.role is distinct from old.role;
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
  elsif role_changed and (new.upload_limit is null or new.upload_limit = old.upload_limit) then
    -- Role changed and no explicit limit provided in the update, align to the new role default
    new.upload_limit = role_default_limit;
  elsif new.upload_limit is null then
    -- Insert path or updates that omitted the limit
    new.upload_limit = role_default_limit;
  end if;

  return new;
end;
$$;

drop trigger if exists set_profile_updated_at_trigger on public.profiles;
create trigger set_profile_updated_at_trigger
before insert or update on public.profiles
for each row execute function public.set_profile_updated_at();

-- Backfill existing profiles: keep explicit overrides, reset mismatched/too-low limits to the role default, and null for unlimited roles.
update public.profiles p
set upload_limit = case
  when rc.is_unlimited then null
  else rc.default_upload_limit
end
from public.role_catalog rc
where rc.role = p.role
  and (
    p.upload_limit is null
    or (rc.is_unlimited = true and p.upload_limit is not null)
    or (rc.is_unlimited = false and p.upload_limit < rc.default_upload_limit)
  );
