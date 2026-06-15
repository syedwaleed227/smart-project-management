-- =============================================================================
-- 0008  Row Level Security: enable + policies
-- =============================================================================
-- Strategy:
--   * Every table has RLS enabled.
--   * A base loop grants Super Admin full access and Auditor read access on all
--     application tables (audit_logs handled separately to stay append-only).
--   * Table-specific policies then add role/department/ownership/portal scoping.
-- Policies are PERMISSIVE (OR'd together). This is a sound, secure-by-default
-- starting point; amount-threshold checks and fine-grained portal document
-- sharing are enforced in the application/Edge-Function layer.
-- =============================================================================

-- ---- Base privileges --------------------------------------------------------
-- Hosted Supabase configures these grants automatically; we declare them too so
-- the schema behaves identically on self-hosted / plain Postgres. RLS policies
-- (below) are what actually constrain row visibility — these grants only let the
-- `authenticated` role reach the tables at all.
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

-- ---- Auto-create a profile row when an auth user is created -----------------
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- ---- Scoping helpers used by policies ---------------------------------------
create or replace function app.can_see_project(p uuid)
returns boolean language sql stable security definer set search_path = public, app as $$
  select exists (
    select 1 from public.projects pr
    where pr.id = p and (
         app.is_manager()
      or pr.owner_id = auth.uid()
      or app.in_department(pr.department_id)
      or exists (select 1 from public.project_members m where m.project_id = p and m.user_id = auth.uid())
      or pr.client_id = any(app.current_client_ids())
    )
  );
$$;

create or replace function app.is_my_employee(e uuid)
returns boolean language sql stable security definer set search_path = public, app as $$
  select exists (select 1 from public.employees emp where emp.id = e and emp.user_id = auth.uid());
$$;

-- ---- Base policies for all application tables -------------------------------
do $$
declare
  t text;
  all_tables text[] := array[
    'users','roles','permissions','role_permissions','user_roles','departments','employees',
    'projects','project_members','milestones','tasks','task_dependencies','time_logs','risks','issues',
    'budgets','budget_lines','expenses','purchase_requests','purchase_orders','invoices','payments',
    'reimbursements','petty_cash',
    'clients','vendors','contacts','contracts',
    'meetings','meeting_attendees','agenda_items','action_items',
    'workflows','approvals','approval_steps',
    'documents','document_versions','document_permissions','comments',
    'notifications','notification_preferences','attendance','leaves','performance'
  ];
begin
  foreach t in array all_tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$create policy "%1$s_superadmin" on public.%1$s for all to authenticated
                       using (app.is_super_admin()) with check (app.is_super_admin());$f$, t);
    execute format($f$create policy "%1$s_auditor_read" on public.%1$s for select to authenticated
                       using (app.is_auditor());$f$, t);
  end loop;
end;
$$;

-- audit_logs: append-only. Readable by Super Admin / Auditor / Finance. Inserts
-- happen via the SECURITY DEFINER audit trigger (which bypasses RLS); no
-- update/delete policies exist, so the trail cannot be altered through the API.
alter table public.audit_logs enable row level security;
create policy "audit_logs_read" on public.audit_logs for select to authenticated
  using (app.is_super_admin() or app.is_auditor() or app.is_finance());

-- =============================================================================
-- Identity & org
-- =============================================================================
create policy users_self_or_staff_read on public.users for select to authenticated
  using (id = auth.uid() or app.is_staff());
create policy users_update_self on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy users_hr_manage on public.users for all to authenticated
  using (app.is_hr()) with check (app.is_hr());

create policy roles_read on public.roles for select to authenticated using (app.is_staff());
create policy permissions_read on public.permissions for select to authenticated using (app.is_staff());
create policy role_permissions_read on public.role_permissions for select to authenticated using (app.is_staff());

create policy user_roles_read on public.user_roles for select to authenticated
  using (user_id = auth.uid() or app.is_staff());
create policy user_roles_hr_manage on public.user_roles for all to authenticated
  using (app.is_hr()) with check (app.is_hr());

create policy departments_read on public.departments for select to authenticated using (app.is_staff());
create policy departments_manage on public.departments for all to authenticated
  using (app.is_manager()) with check (app.is_manager());

create policy employees_read on public.employees for select to authenticated
  using (user_id = auth.uid() or app.is_hr() or app.is_manager());
create policy employees_hr_manage on public.employees for all to authenticated
  using (app.is_hr()) with check (app.is_hr());

-- =============================================================================
-- Projects & work
-- =============================================================================
create policy projects_read on public.projects for select to authenticated
  using (app.can_see_project(id));
create policy projects_create on public.projects for insert to authenticated
  with check (app.is_manager());
create policy projects_update on public.projects for update to authenticated
  using (owner_id = auth.uid() or app.is_manager() or app.in_department(department_id))
  with check (owner_id = auth.uid() or app.is_manager() or app.in_department(department_id));

create policy project_members_read on public.project_members for select to authenticated
  using (app.can_see_project(project_id));
create policy project_members_manage on public.project_members for all to authenticated
  using (app.is_manager()) with check (app.is_manager());

create policy milestones_read on public.milestones for select to authenticated
  using (app.can_see_project(project_id));
create policy milestones_manage on public.milestones for all to authenticated
  using (app.can_see_project(project_id) and app.is_staff())
  with check (app.can_see_project(project_id) and app.is_staff());

create policy tasks_read on public.tasks for select to authenticated
  using (assignee_id = auth.uid() or app.can_see_project(project_id));
create policy tasks_manage on public.tasks for all to authenticated
  using (assignee_id = auth.uid() or (app.is_staff() and app.can_see_project(project_id)))
  with check (app.is_staff() and app.can_see_project(project_id));

create policy task_deps_read on public.task_dependencies for select to authenticated
  using (exists (select 1 from public.tasks tk where tk.id = task_id and app.can_see_project(tk.project_id)));
create policy task_deps_manage on public.task_dependencies for all to authenticated
  using (app.is_staff()) with check (app.is_staff());

create policy time_logs_read on public.time_logs for select to authenticated
  using (user_id = auth.uid() or app.is_manager()
         or exists (select 1 from public.tasks tk where tk.id = task_id and app.can_see_project(tk.project_id)));
create policy time_logs_own_write on public.time_logs for insert to authenticated
  with check (user_id = auth.uid());
create policy time_logs_own_update on public.time_logs for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy risks_read on public.risks for select to authenticated using (app.can_see_project(project_id));
create policy risks_manage on public.risks for all to authenticated
  using (app.is_staff() and app.can_see_project(project_id))
  with check (app.is_staff() and app.can_see_project(project_id));
create policy issues_read on public.issues for select to authenticated using (app.can_see_project(project_id));
create policy issues_manage on public.issues for all to authenticated
  using (app.is_staff() and app.can_see_project(project_id))
  with check (app.is_staff() and app.can_see_project(project_id));

-- =============================================================================
-- Finance
-- =============================================================================
create policy budgets_read on public.budgets for select to authenticated
  using (app.is_finance() or app.is_manager()
         or (scope = 'project' and app.can_see_project(scope_id)));
create policy budgets_manage on public.budgets for all to authenticated
  using (app.is_finance() or app.is_manager())
  with check (app.is_finance() or app.is_manager());

create policy budget_lines_read on public.budget_lines for select to authenticated
  using (exists (select 1 from public.budgets b where b.id = budget_id
                 and (app.is_finance() or app.is_manager()
                      or (b.scope = 'project' and app.can_see_project(b.scope_id)))));
create policy budget_lines_manage on public.budget_lines for all to authenticated
  using (app.is_finance() or app.is_manager())
  with check (app.is_finance() or app.is_manager());

create policy expenses_read on public.expenses for select to authenticated
  using (requester_id = auth.uid() or app.is_finance() or app.is_manager() or app.in_department(department_id));
create policy expenses_create on public.expenses for insert to authenticated
  with check (app.is_staff() and (requester_id = auth.uid() or app.is_manager()));
create policy expenses_update on public.expenses for update to authenticated
  using (app.is_finance() or app.is_manager() or (requester_id = auth.uid() and status = 'draft'))
  with check (app.is_finance() or app.is_manager() or (requester_id = auth.uid() and status = 'draft'));

create policy pr_read on public.purchase_requests for select to authenticated
  using (created_by = auth.uid() or app.is_finance() or app.is_manager() or app.in_department(department_id));
create policy pr_manage on public.purchase_requests for all to authenticated
  using (app.is_finance() or app.is_manager() or created_by = auth.uid())
  with check (app.is_finance() or app.is_manager() or created_by = auth.uid());

create policy po_read on public.purchase_orders for select to authenticated
  using (app.is_finance() or app.is_manager() or vendor_id = any(app.current_vendor_ids()));
create policy po_manage on public.purchase_orders for all to authenticated
  using (app.is_finance() or app.is_manager()) with check (app.is_finance() or app.is_manager());

create policy invoices_read on public.invoices for select to authenticated
  using (app.is_finance() or app.is_manager()
         or client_id = any(app.current_client_ids())
         or vendor_id = any(app.current_vendor_ids()));
create policy invoices_vendor_submit on public.invoices for insert to authenticated
  with check (app.is_finance() or app.is_manager()
              or (type = 'vendor' and vendor_id = any(app.current_vendor_ids())));
create policy invoices_finance_manage on public.invoices for update to authenticated
  using (app.is_finance() or app.is_manager()) with check (app.is_finance() or app.is_manager());

create policy payments_read on public.payments for select to authenticated
  using (app.is_finance() or app.is_manager()
         or exists (select 1 from public.invoices i where i.id = invoice_id
                    and (i.client_id = any(app.current_client_ids()) or i.vendor_id = any(app.current_vendor_ids()))));
create policy payments_manage on public.payments for all to authenticated
  using (app.is_finance()) with check (app.is_finance());

create policy reimb_read on public.reimbursements for select to authenticated
  using (requester_id = auth.uid() or app.is_finance() or app.is_manager());
create policy reimb_write on public.reimbursements for insert to authenticated
  with check (requester_id = auth.uid() or app.is_finance());
create policy reimb_update on public.reimbursements for update to authenticated
  using (app.is_finance() or (requester_id = auth.uid() and status = 'draft'))
  with check (app.is_finance() or (requester_id = auth.uid() and status = 'draft'));

create policy petty_cash_read on public.petty_cash for select to authenticated
  using (app.is_finance() or custodian_id = auth.uid() or app.in_department(department_id));
create policy petty_cash_manage on public.petty_cash for all to authenticated
  using (app.is_finance() or custodian_id = auth.uid())
  with check (app.is_finance() or custodian_id = auth.uid());

-- =============================================================================
-- Clients, vendors, contacts, contracts
-- =============================================================================
create policy clients_read on public.clients for select to authenticated
  using (app.is_staff() or id = any(app.current_client_ids()));
create policy clients_manage on public.clients for all to authenticated
  using (app.is_manager()) with check (app.is_manager());

create policy vendors_read on public.vendors for select to authenticated
  using (app.is_staff() or id = any(app.current_vendor_ids()));
create policy vendors_manage on public.vendors for all to authenticated
  using (app.is_manager()) with check (app.is_manager());

create policy contacts_read on public.contacts for select to authenticated
  using (app.is_staff() or user_id = auth.uid()
         or (party_type = 'client' and party_id = any(app.current_client_ids()))
         or (party_type = 'vendor' and party_id = any(app.current_vendor_ids())));
create policy contacts_manage on public.contacts for all to authenticated
  using (app.is_manager()) with check (app.is_manager());

create policy contracts_read on public.contracts for select to authenticated
  using (app.is_staff()
         or (party_type = 'client' and party_id = any(app.current_client_ids()))
         or (party_type = 'vendor' and party_id = any(app.current_vendor_ids())));
create policy contracts_manage on public.contracts for all to authenticated
  using (app.is_manager()) with check (app.is_manager());

-- =============================================================================
-- Meetings
-- =============================================================================
create policy meetings_read on public.meetings for select to authenticated
  using (organizer_id = auth.uid() or app.is_manager()
         or (project_id is not null and app.can_see_project(project_id))
         or app.in_department(department_id)
         or client_id = any(app.current_client_ids())
         or exists (select 1 from public.meeting_attendees a where a.meeting_id = id and a.user_id = auth.uid()));
create policy meetings_manage on public.meetings for all to authenticated
  using (organizer_id = auth.uid() or app.is_manager())
  with check (app.is_staff());

create policy meeting_attendees_read on public.meeting_attendees for select to authenticated
  using (user_id = auth.uid() or app.is_staff());
create policy meeting_attendees_manage on public.meeting_attendees for all to authenticated
  using (app.is_staff()) with check (app.is_staff());
create policy agenda_read on public.agenda_items for select to authenticated using (app.is_staff());
create policy agenda_manage on public.agenda_items for all to authenticated using (app.is_staff()) with check (app.is_staff());
create policy actions_read on public.action_items for select to authenticated
  using (assignee_id = auth.uid() or app.is_staff());
create policy actions_manage on public.action_items for all to authenticated using (app.is_staff()) with check (app.is_staff());

-- =============================================================================
-- Approval engine
-- =============================================================================
create policy workflows_read on public.workflows for select to authenticated using (app.is_staff());
-- (workflow create/edit limited to Super Admin via base policy.)

create policy approvals_read on public.approvals for select to authenticated
  using (requested_by = auth.uid() or app.is_staff());
create policy approvals_manage on public.approvals for all to authenticated
  using (app.is_staff()) with check (app.is_staff());
create policy approval_steps_read on public.approval_steps for select to authenticated using (app.is_staff());
create policy approval_steps_manage on public.approval_steps for all to authenticated
  using (app.is_staff()) with check (app.is_staff());

-- =============================================================================
-- Documents & comments
-- =============================================================================
create policy documents_read on public.documents for select to authenticated
  using (uploaded_by = auth.uid()
         or (visibility = 'internal' and app.is_staff())
         or (visibility = 'restricted' and (app.is_finance() or app.is_manager()))
         or visibility in ('client_shared','vendor_shared'));  -- portal link narrowed in app layer
create policy documents_manage on public.documents for all to authenticated
  using (uploaded_by = auth.uid() or app.is_manager() or app.is_finance())
  with check (app.is_staff());
create policy doc_versions_read on public.document_versions for select to authenticated
  using (exists (select 1 from public.documents d where d.id = document_id));
create policy doc_versions_manage on public.document_versions for all to authenticated
  using (app.is_staff()) with check (app.is_staff());
create policy doc_perms_read on public.document_permissions for select to authenticated using (app.is_staff());
create policy doc_perms_manage on public.document_permissions for all to authenticated using (app.is_manager()) with check (app.is_manager());

create policy comments_read on public.comments for select to authenticated
  using (author_id = auth.uid() or (app.is_staff()) or (internal_only = false));
create policy comments_write on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy comments_update_own on public.comments for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- =============================================================================
-- Notifications & preferences (strictly per-user)
-- =============================================================================
create policy notifications_own on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_own_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_prefs_own on public.notification_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============================================================================
-- HR: attendance, leaves, performance
-- =============================================================================
create policy attendance_read on public.attendance for select to authenticated
  using (app.is_hr() or app.is_manager() or app.is_my_employee(employee_id));
create policy attendance_write on public.attendance for all to authenticated
  using (app.is_hr() or app.is_my_employee(employee_id))
  with check (app.is_hr() or app.is_my_employee(employee_id));

create policy leaves_read on public.leaves for select to authenticated
  using (app.is_hr() or app.is_manager() or app.is_my_employee(employee_id));
create policy leaves_submit on public.leaves for insert to authenticated
  with check (app.is_hr() or app.is_my_employee(employee_id));
create policy leaves_update on public.leaves for update to authenticated
  using (app.is_hr() or app.is_manager() or (app.is_my_employee(employee_id) and status = 'draft'))
  with check (app.is_hr() or app.is_manager() or (app.is_my_employee(employee_id) and status = 'draft'));

create policy performance_read on public.performance for select to authenticated
  using (app.is_hr() or app.is_manager() or app.is_my_employee(employee_id));
create policy performance_manage on public.performance for all to authenticated
  using (app.is_hr() or app.is_manager()) with check (app.is_hr() or app.is_manager());
