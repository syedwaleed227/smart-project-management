-- =============================================================================
-- 0003  RLS helper functions
-- =============================================================================
-- These run as SECURITY DEFINER (owned by the migration role) so that reads of
-- user_roles / employees / contacts inside them BYPASS RLS. That prevents
-- infinite recursion when RLS policies on those same tables call these helpers.
-- =============================================================================

-- All role names for the current user.
create or replace function app.current_user_roles()
returns text[]
language sql
stable
security definer
set search_path = public, app
as $$
  select coalesce(array_agg(distinct r.name), array[]::text[])
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = auth.uid();
$$;

create or replace function app.has_role(p_role text)
returns boolean language sql stable as $$
  select p_role = any(app.current_user_roles());
$$;

create or replace function app.has_any_role(p_roles text[])
returns boolean language sql stable as $$
  select app.current_user_roles() && p_roles;
$$;

create or replace function app.is_super_admin() returns boolean language sql stable as $$
  select app.has_role('Super Admin');
$$;

create or replace function app.is_auditor() returns boolean language sql stable as $$
  select app.has_role('Auditor');
$$;

create or replace function app.is_finance() returns boolean language sql stable as $$
  select app.has_any_role(array['Super Admin','Finance Manager']);
$$;

create or replace function app.is_hr() returns boolean language sql stable as $$
  select app.has_any_role(array['Super Admin','HR Manager']);
$$;

-- Any internal staff member (i.e. not an external client/vendor portal user).
create or replace function app.is_staff() returns boolean language sql stable as $$
  select app.has_any_role(array[
    'Super Admin','Company Owner','CEO','Project Manager','Finance Manager',
    'HR Manager','Department Head','Team Lead','Employee','Auditor','Approver'
  ]);
$$;

-- Users who can manage/approve across scopes.
create or replace function app.is_manager() returns boolean language sql stable as $$
  select app.has_any_role(array[
    'Super Admin','Company Owner','CEO','Project Manager','Finance Manager',
    'HR Manager','Department Head','Team Lead'
  ]);
$$;

-- Departments the current user belongs to (via roles or employee record).
create or replace function app.current_user_departments()
returns uuid[]
language sql
stable
security definer
set search_path = public, app
as $$
  select coalesce(array_agg(distinct d), array[]::uuid[])
  from (
    select department_id as d from public.user_roles where user_id = auth.uid() and department_id is not null
    union
    select department_id     from public.employees  where user_id = auth.uid() and department_id is not null
  ) s
  where d is not null;
$$;

create or replace function app.in_department(p_department_id uuid)
returns boolean language sql stable as $$
  select p_department_id is not null
     and p_department_id = any(app.current_user_departments());
$$;

-- NOTE: the external-portal helpers app.current_client_ids() and
-- app.current_vendor_ids() are defined in 0006_governance.sql, because they
-- read public.contacts, which is created in that migration.
