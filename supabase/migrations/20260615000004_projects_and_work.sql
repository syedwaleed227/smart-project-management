-- =============================================================================
-- 0004  Projects & work management
-- =============================================================================
-- projects, project_members, milestones, tasks, task_dependencies, time_logs,
-- risks, issues. (Generic comments live in the governance migration.)
-- =============================================================================

create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  code          text unique,
  category      text not null default 'internal',
  status        text not null default 'draft'
                check (status in ('draft','pending_approval','active','on_hold','at_risk','completed','closed','cancelled')),
  priority      text not null default 'medium' check (priority in ('low','medium','high','critical')),
  department_id uuid references public.departments(id) on delete set null,
  owner_id      uuid references public.users(id) on delete set null,
  client_id     uuid,   -- FK added in governance migration (clients created there)
  start_date    date,
  deadline      date,
  actual_end    date,
  progress_pct  numeric(5,2) not null default 0 check (progress_pct between 0 and 100),
  health        text default 'green' check (health in ('green','amber','red')),
  description   text,
  created_by    uuid references public.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.project_members (
  project_id     uuid not null references public.projects(id) on delete cascade,
  user_id        uuid not null references public.users(id) on delete cascade,
  role_in_project text not null default 'member',
  created_at     timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.milestones (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  due_date    date,
  weight      numeric(5,2) not null default 0,
  status      text not null default 'pending' check (status in ('pending','in_progress','done')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  milestone_id    uuid references public.milestones(id) on delete set null,
  parent_task_id  uuid references public.tasks(id) on delete cascade,
  title           text not null,
  description     text,
  status          text not null default 'todo'
                  check (status in ('todo','in_progress','blocked','in_review','done')),
  priority        text not null default 'medium' check (priority in ('low','medium','high','critical')),
  assignee_id     uuid references public.users(id) on delete set null,
  estimate_hours  numeric(7,2),
  due_date        date,
  approval_required boolean not null default false,
  created_by      uuid references public.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.task_dependencies (
  task_id            uuid not null references public.tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks(id) on delete cascade,
  type               text not null default 'finish_to_start',
  primary key (task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id)
);

create table public.time_logs (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  minutes    integer not null check (minutes > 0),
  logged_at  date not null default current_date,
  note       text,
  created_at timestamptz not null default now()
);

create table public.risks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  likelihood  text check (likelihood in ('low','medium','high')),
  impact      text check (impact in ('low','medium','high')),
  owner_id    uuid references public.users(id) on delete set null,
  mitigation  text,
  status      text not null default 'open' check (status in ('open','mitigating','closed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.issues (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  severity    text check (severity in ('low','medium','high','critical')),
  owner_id    uuid references public.users(id) on delete set null,
  status      text not null default 'open' check (status in ('open','in_progress','resolved')),
  resolution  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index on public.projects (department_id);
create index on public.projects (owner_id);
create index on public.projects (client_id);
create index on public.tasks (project_id);
create index on public.tasks (assignee_id);
create index on public.tasks (status);
create index on public.time_logs (task_id);

create trigger trg_projects_updated   before update on public.projects   for each row execute function app.set_updated_at();
create trigger trg_milestones_updated before update on public.milestones for each row execute function app.set_updated_at();
create trigger trg_tasks_updated      before update on public.tasks      for each row execute function app.set_updated_at();
create trigger trg_risks_updated      before update on public.risks      for each row execute function app.set_updated_at();
create trigger trg_issues_updated     before update on public.issues     for each row execute function app.set_updated_at();
