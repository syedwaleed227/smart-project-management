-- =============================================================================
-- 0002  Identity & organization
-- =============================================================================
-- users (public profile, 1:1 with auth.users), roles, permissions,
-- role_permissions, user_roles (role scoped to a department), departments,
-- employees.
-- =============================================================================

-- Public profile row. id == auth.users.id. Credentials / 2FA live in Supabase
-- Auth (auth.users), NOT here.
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text unique not null,
  phone       text,
  status      text not null default 'active'
              check (status in ('active','invited','suspended','disabled')),
  last_login  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  description text,
  is_system   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.permissions (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,        -- e.g. 'project.create', 'expense.approve'
  description text
);

create table public.role_permissions (
  role_id       uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Departments (self-referencing hierarchy). head_user_id added after users exists.
create table public.departments (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  code            text unique,
  type            text not null default 'custom',   -- finance/hr/operations/.../custom
  parent_id       uuid references public.departments(id) on delete set null,
  head_user_id    uuid references public.users(id) on delete set null,
  cost_center     text,
  default_budget  numeric(14,2) default 0,
  currency        text not null default 'USD',
  approval_thresholds jsonb not null default '{}'::jsonb,
  status          text not null default 'active' check (status in ('active','archived')),
  created_by      uuid references public.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- A user holds a role, optionally scoped to one department.
create table public.user_roles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  role_id       uuid not null references public.roles(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  created_by    uuid references public.users(id),
  created_at    timestamptz not null default now(),
  unique (user_id, role_id, department_id)
);

create table public.employees (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique not null references public.users(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  designation   text,
  manager_id    uuid references public.employees(id) on delete set null,
  join_date     date,
  status        text not null default 'active'
                check (status in ('active','on_leave','terminated')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on public.user_roles (user_id);
create index on public.user_roles (department_id);
create index on public.employees (department_id);

create trigger trg_users_updated       before update on public.users       for each row execute function app.set_updated_at();
create trigger trg_departments_updated before update on public.departments for each row execute function app.set_updated_at();
create trigger trg_employees_updated   before update on public.employees   for each row execute function app.set_updated_at();
