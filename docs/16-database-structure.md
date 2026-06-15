# 16. Database Structure

Relational core on **Supabase (managed PostgreSQL)**. `id` is UUID/PK; timestamps (`created_at`, `updated_at`, `created_by`) on all tables. Designed multi-tenant-ready via an optional `tenant_id` (company) on every table.

## Supabase conventions
- **Identity:** Supabase manages the auth identity in `auth.users`. Our **`users`** table here is a public **profile** row keyed `id = auth.users.id` (1:1), holding name, phone, status, etc. App data references `users.id`.
- **Row Level Security (RLS):** enabled on every table. Policies use `auth.uid()` plus the user's role/department (read from `user_roles`/JWT claims) to enforce the [permissions matrix](19-permissions-matrix.md) at the DB layer — e.g., an Employee only sees rows in their department or rows they own; Finance sees financial tables; external Client/Vendor portals are restricted to their linked rows.
- **Audit:** a generic Postgres **trigger** on important tables writes old→new diffs into `audit_logs` automatically, so the trail can't be bypassed by the API.
- **Migrations:** schema lives in `supabase/migrations` (Supabase CLI). Storage buckets (documents) follow the same RLS-style policies.
- **Realtime:** subscribe to changes on `tasks`, `notifications`, `approvals` for live dashboards/badges.

## Core tables / collections

### Identity & org
- **users** (profile; `id` = `auth.users.id`) `(id, name, email, phone, status, last_login)` — credentials, 2FA/MFA, and sessions are handled by **Supabase Auth** in `auth.users`, not stored here.
- **roles** `(id, name, description, is_system)`
- **permissions** `(id, key, description)`
- **role_permissions** `(role_id, permission_id)`
- **user_roles** `(user_id, role_id, department_id nullable)` — role scoped to a department
- **departments** `(id, name, code, type, parent_id, head_user_id, cost_center, default_budget, status)`
- **employees** `(id, user_id, department_id, designation, manager_id, join_date, status)`

### Projects & work
- **projects** `(id, name, code, category, status, priority, department_id, owner_id, client_id, start_date, deadline, actual_end, progress_pct, health)`
- **project_members** `(project_id, user_id, role_in_project)`
- **milestones** `(id, project_id, name, due_date, weight, status)`
- **tasks** `(id, project_id, milestone_id, parent_task_id, title, status, priority, assignee_id, estimate_hours, due_date, approval_required)`
- **task_dependencies** `(task_id, depends_on_task_id, type)`
- **time_logs** `(id, task_id, user_id, minutes, logged_at, note)`
- **comments** `(id, entity_type, entity_id, author_id, body, parent_id, created_at)`
- **risks** `(id, project_id, title, likelihood, impact, owner_id, mitigation, status)`
- **issues** `(id, project_id, title, severity, owner_id, status, resolution)`

### Finance
- **budgets** `(id, scope, scope_id, version, total, currency, status, approved_by, baseline_at)`
- **budget_lines** `(id, budget_id, category, description, planned_amount, actual_amount)`
- **expenses** `(id, project_id, department_id, requester_id, amount, tax, category, status, approval_id, receipt_doc_id)`
- **purchase_requests** `(id, department_id, project_id, vendor_id, amount, status, approval_id)`
- **purchase_orders** `(id, pr_id, vendor_id, amount, status, issued_at)`
- **invoices** `(id, type, client_id, vendor_id, project_id, amount, tax, due_date, status, issued_at, paid_at)`
- **payments** `(id, invoice_id, amount, method, status, scheduled_at, paid_at, approved_by)`
- **reimbursements / advances / petty_cash** `(... requester_id, amount, status, approval_id ...)`

### Relationships, collaboration, governance
- **vendors** `(id, name, category, bank_details, tax_id, risk_rating, status)`
- **clients** `(id, name, account_manager_id, tax_id, risk_rating, status)`
- **contacts** `(id, party_type, party_id, name, email, phone, portal_access)`
- **contracts** `(id, party_type, party_id, start, end, value, status, document_id)`
- **meetings** `(id, title, type, organizer_id, project_id, department_id, client_id, start, end, recurrence, status)`
- **meeting_attendees** `(meeting_id, user_id/email, rsvp)`
- **agenda_items** `(id, meeting_id, order, topic, owner, minutes)`
- **action_items** `(id, meeting_id, title, assignee_id, due, status, linked_task_id)`
- **approvals** `(id, entity_type, entity_id, workflow_id, status, current_step, requested_by, created_at)`
- **approval_steps** `(id, approval_id, order, type, approver_ref, status, decided_by, decision, reason, decided_at, sla_hours, escalate_to)`
- **workflows** `(id, entity_type, conditions json, steps json, active)`
- **documents** `(id, name, category, entity_type, entity_id, current_version_id, visibility, uploaded_by)`
- **document_versions** `(id, document_id, version_no, file_url, checksum, uploaded_by, uploaded_at)`
- **notifications** `(id, user_id, type, entity_type, entity_id, channel, message, read_at, sent_at)`
- **audit_logs** `(id, actor_id, action, entity_type, entity_id, old_values, new_values, ip, created_at)`
- **attendance / leaves / performance** — HR tables (see [HR module](10-hr-module.md)).

## Key relationships (ER summary)
```
users ─< user_roles >─ roles ─< role_permissions >─ permissions
users ─1:1─ employees ─*─ departments
departments ─< projects ─< tasks ─< time_logs
projects ─< milestones ─< tasks
projects ─1─ budgets ─< budget_lines
projects ─< expenses, invoices, risks, issues, meetings, documents
clients ─< projects, invoices, contracts, contacts
vendors ─< purchase_orders, invoices, contracts, contacts
invoices ─< payments
approvals ─< approval_steps ; approvals ─*─ workflows
ANY entity ─< comments, documents, notifications, audit_logs (polymorphic entity_type+entity_id)
```

> **Implementation note:** This relational model is implemented directly as Supabase Postgres tables with RLS policies per table — the strong consistency that finance/approvals/audit need comes for free. (A NoSQL/MongoDB port is possible but not recommended here, since it would give up the DB-level access control and referential integrity Supabase provides.)
