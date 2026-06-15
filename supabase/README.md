# Supabase Schema — Smart Project Management System

This folder contains the runnable database schema for SPMS, implemented on
**Supabase (managed PostgreSQL)** with **Row Level Security** enforcing the
role + department access model from [`docs/19-permissions-matrix.md`](../docs/19-permissions-matrix.md).

## Layout

```
supabase/
├── migrations/
│   ├── 20260615000001_extensions.sql        Extensions, app schema, updated_at fn
│   ├── 20260615000002_identity_and_org.sql  users, roles, departments, employees
│   ├── 20260615000003_helpers.sql           RLS helper functions (SECURITY DEFINER)
│   ├── 20260615000004_projects_and_work.sql projects, tasks, milestones, time logs
│   ├── 20260615000005_finance.sql           budgets, expenses, invoices, payments
│   ├── 20260615000006_governance.sql        clients/vendors, meetings, approvals,
│   │                                        documents, notifications, HR, audit_logs
│   ├── 20260615000007_audit_trigger.sql     generic who/what/when/old→new audit
│   ├── 20260615000008_rls.sql               enable RLS + all policies + auth hooks
│   ├── 20260615000009_bootstrap_first_admin.sql  first signup → Super Admin
│   └── 20260615000010_workflow_and_notifications.sql  approval engine + notifications
├── functions/
│   └── notify-dispatch/index.ts             Edge Function: external-channel delivery
└── seed.sql                                 roles, permissions, departments, workflows
```

Migrations are ordered and idempotent where practical. They assume a standard
Supabase project (the `auth` schema and `auth.uid()` already exist).

## Run locally

```bash
# 1. Install the Supabase CLI, then start the local stack
supabase start

# 2. Apply migrations (and seed) to the local database
supabase db reset            # runs all migrations + seed.sql

# Or apply migrations only:
supabase migration up
```

## Deploy to a hosted project

```bash
supabase link --project-ref <your-project-ref>
supabase db push             # applies migrations to the linked project
# seed.sql is for local/dev; run it manually in prod only if you want the
# template roles/departments/workflows.
```

## Key design points

- **Profiles vs auth:** `public.users` is a 1:1 profile of `auth.users`. A trigger
  (`app.handle_new_user`) auto-creates the profile on signup. Credentials and
  2FA live in Supabase Auth, never in `public.users`.
- **RLS everywhere:** every table has RLS on. Helper functions in the private
  `app` schema (`is_super_admin`, `is_finance`, `in_department`,
  `can_see_project`, `current_client_ids`, …) are `SECURITY DEFINER` so they can
  read `user_roles`/`employees`/`contacts` without recursing through RLS.
- **Audit trail:** `app.audit_trigger` writes immutable `create/update/delete`
  records (with old→new JSON) for finance, approvals, projects, HR and more.
  `audit_logs` has no update/delete policies — the trail can't be tampered with
  via the API.
- **External portals:** a `contacts.user_id` links a client/vendor login to the
  client/vendor it represents; `current_client_ids()` / `current_vendor_ids()`
  scope portal access to only their own projects, invoices, and documents.

## Approval workflow engine (migration 0010)

Implemented in the database so it is transactional and testable. Two RPCs are
exposed to the app via PostgREST:

- **`start_approval(entity_type, entity_id, amount, department_id)`** — picks the
  most specific matching active workflow (via `app.workflow_matches` on
  `workflows.conditions`), creates the `approvals` row and its `approval_steps`,
  and notifies the first approvers. Falls back to a single Department-Head step
  if nothing matches.
- **`decide_approval_step(approval_id, decision, reason)`** — authorizes the
  caller against the current step's `approver_ref` (role / specific user /
  requester's manager), records the decision, handles **parallel quorum** and
  **sequential advancement**, applies the outcome to the linked entity
  (expense/leave/budget/PR/invoice), and fires accept/reject notifications.

## Notifications

- `app.notify(...)` writes an in-app notification (status `sent`).
- Triggers: **task assigned** (`tasks`), **budget exceeded** (`expenses` when
  approved spend ≥ approved project budget). The workflow engine emits
  **approval pending / accepted / rejected**.
- External channels (email/SMS/WhatsApp/Slack) are delivered by the
  `notify-dispatch` Edge Function on a `pg_cron` schedule.

## Where to refine next

- **Fine-grained document sharing** for `client_shared` / `vendor_shared` files
  (narrow to the specific linked client/vendor in the app layer).
- **Auto-escalation** on SLA breach (`approval_steps.sla_hours` / `escalate_to`
  are stored; wire a `pg_cron` job to escalate and re-notify).
- **Per-user channel preferences** (`notification_preferences`) to enqueue email
  rows in addition to in-app.
