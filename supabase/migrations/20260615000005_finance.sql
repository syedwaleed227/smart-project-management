-- =============================================================================
-- 0005  Finance
-- =============================================================================
-- budgets, budget_lines, expenses, purchase_requests, purchase_orders,
-- invoices, payments, reimbursements, advances, petty_cash.
-- (clients/vendors are created in the governance migration; FKs added there.)
-- =============================================================================

create table public.budgets (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null check (scope in ('project','department')),
  scope_id    uuid not null,            -- project_id or department_id depending on scope
  version     integer not null default 1,
  total       numeric(14,2) not null default 0,
  currency    text not null default 'USD',
  status      text not null default 'draft'
              check (status in ('draft','pending_approval','approved','rejected','baselined')),
  approved_by uuid references public.users(id),
  baseline_at timestamptz,
  created_by  uuid references public.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (scope, scope_id, version)
);

create table public.budget_lines (
  id             uuid primary key default gen_random_uuid(),
  budget_id      uuid not null references public.budgets(id) on delete cascade,
  category       text not null,
  description    text,
  planned_amount numeric(14,2) not null default 0,
  actual_amount  numeric(14,2) not null default 0,
  created_at     timestamptz not null default now()
);

create table public.expenses (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references public.projects(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  requester_id  uuid not null references public.users(id),
  amount        numeric(14,2) not null check (amount >= 0),
  tax           numeric(14,2) not null default 0,
  category      text,
  description   text,
  status        text not null default 'draft'
                check (status in ('draft','pending_approval','approved','rejected','paid')),
  approval_id   uuid,            -- FK added in governance migration (approvals)
  receipt_doc_id uuid,           -- FK added in governance migration (documents)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.purchase_requests (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete set null,
  project_id    uuid references public.projects(id) on delete set null,
  vendor_id     uuid,            -- FK added in governance migration (vendors)
  amount        numeric(14,2) not null check (amount >= 0),
  description   text,
  status        text not null default 'draft'
                check (status in ('draft','pending_approval','approved','rejected','ordered')),
  approval_id   uuid,
  created_by    uuid references public.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.purchase_orders (
  id         uuid primary key default gen_random_uuid(),
  pr_id      uuid references public.purchase_requests(id) on delete set null,
  vendor_id  uuid,              -- FK added in governance migration (vendors)
  amount     numeric(14,2) not null check (amount >= 0),
  status     text not null default 'issued' check (status in ('issued','partial','received','closed','cancelled')),
  issued_at  timestamptz not null default now(),
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('client','vendor')),
  client_id  uuid,              -- FK added in governance migration
  vendor_id  uuid,              -- FK added in governance migration
  project_id uuid references public.projects(id) on delete set null,
  amount     numeric(14,2) not null check (amount >= 0),
  tax        numeric(14,2) not null default 0,
  currency   text not null default 'USD',
  due_date   date,
  status     text not null default 'draft'
             check (status in ('draft','pending_approval','approved','sent','paid','overdue','cancelled')),
  issued_at  timestamptz,
  paid_at    timestamptz,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((type = 'client' and client_id is not null) or (type = 'vendor' and vendor_id is not null))
);

create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  amount       numeric(14,2) not null check (amount >= 0),
  method       text,
  status       text not null default 'pending'
               check (status in ('pending','approved','scheduled','paid','cancelled')),
  scheduled_at date,
  paid_at      timestamptz,
  approved_by  uuid references public.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Employee out-of-pocket claims, vendor/employee advances, and petty cash share
-- a common request shape.
create table public.reimbursements (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.users(id),
  project_id    uuid references public.projects(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  amount        numeric(14,2) not null check (amount >= 0),
  description   text,
  status        text not null default 'pending_approval'
                check (status in ('draft','pending_approval','approved','rejected','paid')),
  approval_id   uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.petty_cash (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete set null,
  custodian_id  uuid references public.users(id),
  entry_type    text not null check (entry_type in ('topup','spend','reconcile')),
  amount        numeric(14,2) not null,
  balance_after numeric(14,2),
  description   text,
  created_at    timestamptz not null default now()
);

create index on public.budgets (scope, scope_id);
create index on public.expenses (project_id);
create index on public.expenses (department_id);
create index on public.expenses (status);
create index on public.invoices (client_id);
create index on public.invoices (vendor_id);
create index on public.invoices (status);
create index on public.payments (invoice_id);

create trigger trg_budgets_updated   before update on public.budgets   for each row execute function app.set_updated_at();
create trigger trg_expenses_updated  before update on public.expenses  for each row execute function app.set_updated_at();
create trigger trg_pr_updated        before update on public.purchase_requests for each row execute function app.set_updated_at();
create trigger trg_po_updated        before update on public.purchase_orders   for each row execute function app.set_updated_at();
create trigger trg_invoices_updated  before update on public.invoices  for each row execute function app.set_updated_at();
create trigger trg_payments_updated  before update on public.payments  for each row execute function app.set_updated_at();
create trigger trg_reimb_updated     before update on public.reimbursements for each row execute function app.set_updated_at();
