-- =============================================================================
-- 0009  Bootstrap: make the first registered user a Super Admin
-- =============================================================================
-- Replaces app.handle_new_user so that, in addition to creating the profile
-- row, the very first user to sign up is granted the Super Admin role. This
-- makes a fresh deployment usable immediately (that user can then assign roles
-- to everyone else). Subsequent signups get no role until one is assigned.
-- =============================================================================

create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_first boolean;
  v_role_id uuid;
begin
  insert into public.users (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;

  -- Was this the first profile created?
  select count(*) = 1 into v_is_first from public.users;

  if v_is_first then
    select id into v_role_id from public.roles where name = 'Super Admin';
    if v_role_id is not null then
      insert into public.user_roles (user_id, role_id)
      values (new.id, v_role_id)
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;
