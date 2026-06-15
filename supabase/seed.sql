-- =============================================================================
-- Seed data: system roles, permission catalog, department templates,
-- and an example approval workflow. Safe to run repeatedly (idempotent).
-- =============================================================================

-- ---- Roles ------------------------------------------------------------------
insert into public.roles (name, description, is_system) values
  ('Super Admin',    'Full system access',                         true),
  ('Company Owner',  'Owner-level read across the company',        true),
  ('CEO',            'Executive oversight and high-value approvals',true),
  ('Project Manager','Plans and runs projects',                    true),
  ('Finance Manager','Owns budgets, invoices, payments, P&L',      true),
  ('HR Manager',     'Owns employees, attendance, leave, hiring',  true),
  ('Department Head','Manages a department and its approvals',      true),
  ('Team Lead',      'Manages a team and its tasks',               true),
  ('Employee',       'Executes assigned work',                     true),
  ('Client',         'External client portal user',                true),
  ('Vendor',         'External vendor portal user',                true),
  ('Auditor',        'Read-only audit and compliance',             true),
  ('Approver',       'Workflow approval capability',               true)
on conflict (name) do nothing;

-- ---- Permission catalog -----------------------------------------------------
insert into public.permissions (key, description) values
  ('project.create','Create projects'),
  ('project.approve','Approve project creation/completion'),
  ('task.manage','Create and edit tasks'),
  ('task.approve','Approve task completion'),
  ('budget.manage','Create and edit budgets'),
  ('budget.approve','Approve budgets'),
  ('expense.create','Submit expenses'),
  ('expense.approve','Approve expenses'),
  ('purchase.approve','Approve purchases'),
  ('invoice.manage','Create and manage invoices'),
  ('payment.approve','Approve payments'),
  ('vendor.approve','Approve vendor onboarding'),
  ('leave.approve','Approve leave requests'),
  ('hiring.approve','Approve hiring requests'),
  ('contract.approve','Approve contracts'),
  ('report.view','View reports'),
  ('audit.view','View audit logs'),
  ('settings.manage','Manage system settings'),
  ('user.manage','Manage users and roles')
on conflict (key) do nothing;

-- ---- Department templates ---------------------------------------------------
insert into public.departments (name, code, type) values
  ('Finance',      'FIN', 'finance'),
  ('Human Resources','HR', 'hr'),
  ('Operations',   'OPS', 'operations'),
  ('Sales',        'SAL', 'sales'),
  ('Marketing',    'MKT', 'marketing'),
  ('Procurement',  'PRC', 'procurement'),
  ('Legal',        'LEG', 'legal'),
  ('IT',           'IT',  'it'),
  ('Admin',        'ADM', 'admin')
on conflict (code) do nothing;

-- ---- Example approval workflow: expense routing by amount -------------------
insert into public.workflows (entity_type, name, conditions, steps, active)
select 'expense', 'Expense > $1,000 → Dept Head then Finance',
  '[{"field":"amount","op":">","value":1000}]'::jsonb,
  '[{"position":1,"type":"sequential","approver_ref":{"kind":"role","value":"Department Head"},"sla_hours":24,"escalate_to":{"kind":"role","value":"CEO"}},
    {"position":2,"type":"sequential","approver_ref":{"kind":"role","value":"Finance Manager"},"sla_hours":48}]'::jsonb,
  true
where not exists (select 1 from public.workflows where name = 'Expense > $1,000 → Dept Head then Finance');

insert into public.workflows (entity_type, name, conditions, steps, active)
select 'leave', 'Leave → Team Lead then HR',
  '[]'::jsonb,
  '[{"position":1,"type":"sequential","approver_ref":{"kind":"role","value":"Team Lead"},"sla_hours":24},
    {"position":2,"type":"sequential","approver_ref":{"kind":"role","value":"HR Manager"},"sla_hours":48}]'::jsonb,
  true
where not exists (select 1 from public.workflows where name = 'Leave → Team Lead then HR');
