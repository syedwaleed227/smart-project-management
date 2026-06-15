-- =============================================================================
-- 0006  Relationships, collaboration, governance & cross-cutting tables
-- =============================================================================
-- clients, vendors, contacts, contracts, meetings (+attendees, agenda, actions),
-- workflows, approvals (+steps), documents (+versions, permissions),
-- notifications (+preferences), attendance, leaves, performance, comments,
-- audit_logs. Also wires up the deferred FKs from earlier migrations.
-- =============================================================================

-- ---- Clients & vendors ------------------------------------------------------
create table public.clients (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  industry           text,
  account_manager_id uuid references public.users(id) on delete set null,
  tax_id             text,
  billing_details    jsonb,
  risk_rating        text default 'low' check (risk_rating in ('low','medium','high')),
  status             text not null default 'active' check (status in ('prospect','pending_approval','active','inactive')),
  created_by         uuid references public.users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.vendors (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text,
  bank_details jsonb,
  tax_id       text,
  risk_rating  text default 'low' check (risk_rating in ('low','medium','high')),
  status       text not null default 'active' check (status in ('pending_approval','active','blocked','inactive')),
  created_by   uuid references public.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Contacts double as the portal-login mapping: user_id links an external login
-- to the client/vendor they represent (used by RLS portal helpers).
create table public.contacts (
  id           uuid primary key default gen_random_uuid(),
  party_type   text not null check (party_type in ('client','vendor')),
  party_id     uuid not null,
  user_id      uuid references public.users(id) on delete set null,
  name         text not null,
  email        text,
  phone        text,
  portal_access boolean not null default false,
  created_at   timestamptz not null default now()
);

create table public.contracts (
  id          uuid primary key default gen_random_uuid(),
  party_type  text not null check (party_type in ('client','vendor')),
  party_id    uuid not null,
  title       text,
  start_date  date,
  end_date    date,
  value       numeric(14,2),
  status      text not null default 'draft'
              check (status in ('draft','pending_approval','active','expired','terminated')),
  document_id uuid,            -- FK added after documents below
  created_by  uuid references public.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---- Deferred FKs from projects/finance now that clients/vendors exist ------
alter table public.projects          add constraint fk_projects_client  foreign key (client_id) references public.clients(id) on delete set null;
alter table public.purchase_requests add constraint fk_pr_vendor         foreign key (vendor_id) references public.vendors(id) on delete set null;
alter table public.purchase_orders   add constraint fk_po_vendor         foreign key (vendor_id) references public.vendors(id) on delete set null;
alter table public.invoices          add constraint fk_invoices_client   foreign key (client_id) references public.clients(id) on delete set null;
alter table public.invoices          add constraint fk_invoices_vendor   foreign key (vendor_id) references public.vendors(id) on delete set null;

-- ---- Meetings ---------------------------------------------------------------
create table public.meetings (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  type          text not null default 'internal'
                check (type in ('internal','client','department','project_review','finance_review','approval')),
  organizer_id  uuid references public.users(id) on delete set null,
  project_id    uuid references public.projects(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  client_id     uuid references public.clients(id) on delete set null,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  recurrence    jsonb,
  location      text,
  status        text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.meeting_attendees (
  id         uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id    uuid references public.users(id) on delete cascade,
  email      text,
  rsvp       text default 'invited' check (rsvp in ('invited','accepted','declined','tentative')),
  check (user_id is not null or email is not null)
);
create unique index uq_meeting_attendee_user  on public.meeting_attendees (meeting_id, user_id) where user_id is not null;
create unique index uq_meeting_attendee_email on public.meeting_attendees (meeting_id, email)   where email is not null;

create table public.agenda_items (
  id         uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  position   integer not null default 0,
  topic      text not null,
  owner_id   uuid references public.users(id) on delete set null,
  minutes    text
);

create table public.action_items (
  id             uuid primary key default gen_random_uuid(),
  meeting_id     uuid not null references public.meetings(id) on delete cascade,
  title          text not null,
  assignee_id    uuid references public.users(id) on delete set null,
  due_date       date,
  status         text not null default 'open' check (status in ('open','done')),
  linked_task_id uuid references public.tasks(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- ---- Approval engine --------------------------------------------------------
create table public.workflows (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,                 -- 'expense','budget','invoice',...
  name        text not null,
  conditions  jsonb not null default '[]'::jsonb,
  steps       jsonb not null default '[]'::jsonb,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.approvals (
  id            uuid primary key default gen_random_uuid(),
  entity_type   text not null,
  entity_id     uuid not null,
  workflow_id   uuid references public.workflows(id) on delete set null,
  status        text not null default 'pending'
                check (status in ('pending','approved','rejected','cancelled')),
  current_step  integer not null default 1,
  requested_by  uuid references public.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.approval_steps (
  id           uuid primary key default gen_random_uuid(),
  approval_id  uuid not null references public.approvals(id) on delete cascade,
  position     integer not null,
  type         text not null default 'sequential' check (type in ('sequential','parallel')),
  approver_ref jsonb not null,               -- {kind:'role'|'user'|'manager', value:...}
  status       text not null default 'pending' check (status in ('pending','approved','rejected','skipped')),
  decided_by   uuid references public.users(id),
  decision     text,
  reason       text,
  sla_hours    integer,
  escalate_to  jsonb,
  decided_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- Now that approvals exist, wire up the deferred FKs on finance requests.
alter table public.expenses          add constraint fk_expenses_approval foreign key (approval_id) references public.approvals(id) on delete set null;
alter table public.purchase_requests add constraint fk_pr_approval       foreign key (approval_id) references public.approvals(id) on delete set null;
alter table public.reimbursements    add constraint fk_reimb_approval    foreign key (approval_id) references public.approvals(id) on delete set null;

-- ---- Documents --------------------------------------------------------------
create table public.documents (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  category           text not null default 'project',
  entity_type        text,                   -- polymorphic link: 'project','expense',...
  entity_id          uuid,
  current_version_id uuid,
  visibility         text not null default 'internal'
                     check (visibility in ('internal','client_shared','vendor_shared','restricted')),
  uploaded_by        uuid references public.users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.document_versions (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_no  integer not null,
  file_url    text not null,                 -- Supabase Storage object path
  size_bytes  bigint,
  checksum    text,
  uploaded_by uuid references public.users(id),
  uploaded_at timestamptz not null default now(),
  unique (document_id, version_no)
);

alter table public.documents add constraint fk_documents_current_version
  foreign key (current_version_id) references public.document_versions(id) on delete set null;

create table public.document_permissions (
  document_id  uuid not null references public.documents(id) on delete cascade,
  principal    text not null,                -- 'role:Finance Manager' | 'dept:<uuid>' | 'user:<uuid>'
  can_view     boolean not null default true,
  can_download boolean not null default false,
  can_edit     boolean not null default false,
  primary key (document_id, principal)
);

-- Deferred FKs that point at documents.
alter table public.expenses  add constraint fk_expenses_receipt foreign key (receipt_doc_id) references public.documents(id) on delete set null;
alter table public.contracts add constraint fk_contracts_doc    foreign key (document_id)    references public.documents(id) on delete set null;

-- ---- Generic comments (polymorphic) ----------------------------------------
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id   uuid not null,
  author_id   uuid references public.users(id) on delete set null,
  body        text not null,
  parent_id   uuid references public.comments(id) on delete cascade,
  internal_only boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---- Notifications ----------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        text not null,
  entity_type text,
  entity_id   uuid,
  channel     text not null default 'in_app'
              check (channel in ('in_app','email','sms','whatsapp','slack')),
  message     text,
  read_at     timestamptz,
  sent_at     timestamptz,
  status      text not null default 'queued' check (status in ('queued','sent','failed')),
  created_at  timestamptz not null default now()
);

create table public.notification_preferences (
  user_id        uuid not null references public.users(id) on delete cascade,
  event_category text not null,
  channels       text[] not null default array['in_app']::text[],
  digest         text default 'off' check (digest in ('off','daily','weekly')),
  primary key (user_id, event_category)
);

-- ---- HR: attendance, leaves, performance -----------------------------------
create table public.attendance (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  work_date   date not null,
  check_in    timestamptz,
  check_out   timestamptz,
  mode        text default 'onsite' check (mode in ('onsite','remote')),
  unique (employee_id, work_date)
);

create table public.leaves (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  type        text not null,
  start_date  date not null,
  end_date    date not null,
  days        numeric(4,1),
  status      text not null default 'pending_approval'
              check (status in ('draft','pending_approval','approved','rejected','cancelled')),
  approval_id uuid references public.approvals(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.performance (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  period      text,
  goals       jsonb,
  rating      numeric(3,1),
  reviewer_id uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---- Audit log (append-only) ------------------------------------------------
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid,
  action      text not null,                 -- create | update | delete
  entity_type text not null,
  entity_id   uuid,
  old_values  jsonb,
  new_values  jsonb,
  ip          inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- External portal mapping helpers (defined here now that contacts exists):
-- return the client/vendor ids the current portal user represents.
create or replace function app.current_client_ids()
returns uuid[]
language sql stable security definer set search_path = public, app
as $$
  select coalesce(array_agg(distinct party_id), array[]::uuid[])
  from public.contacts
  where user_id = auth.uid() and party_type = 'client';
$$;

create or replace function app.current_vendor_ids()
returns uuid[]
language sql stable security definer set search_path = public, app
as $$
  select coalesce(array_agg(distinct party_id), array[]::uuid[])
  from public.contacts
  where user_id = auth.uid() and party_type = 'vendor';
$$;

create index on public.contacts (party_type, party_id);
create index on public.contacts (user_id);
create index on public.meetings (project_id);
create index on public.approvals (entity_type, entity_id);
create index on public.approval_steps (approval_id);
create index on public.documents (entity_type, entity_id);
create index on public.comments (entity_type, entity_id);
create index on public.notifications (user_id, read_at);
create index on public.audit_logs (entity_type, entity_id);
create index on public.audit_logs (actor_id, created_at);

create trigger trg_clients_updated   before update on public.clients   for each row execute function app.set_updated_at();
create trigger trg_vendors_updated   before update on public.vendors   for each row execute function app.set_updated_at();
create trigger trg_contracts_updated before update on public.contracts for each row execute function app.set_updated_at();
create trigger trg_meetings_updated  before update on public.meetings  for each row execute function app.set_updated_at();
create trigger trg_workflows_updated before update on public.workflows for each row execute function app.set_updated_at();
create trigger trg_approvals_updated before update on public.approvals for each row execute function app.set_updated_at();
create trigger trg_documents_updated before update on public.documents for each row execute function app.set_updated_at();
create trigger trg_leaves_updated    before update on public.leaves    for each row execute function app.set_updated_at();
