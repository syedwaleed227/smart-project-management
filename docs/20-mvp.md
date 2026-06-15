# 20. MVP Version

Goal: a usable, sellable first release that delivers the core value — **organized projects + tasks, basic approvals, basic finance tracking, and role-based dashboards** — without the heavy AI/advanced features.

## MVP scope (build first)

### Foundation
- **Supabase Auth** + **2FA (MFA/TOTP)**, password reset.
- **RBAC** with core roles enforced via **Supabase Row Level Security**: Super Admin, CEO, PM, Finance Manager, Department Head, Team Lead, Employee. (Client/Vendor portals → Phase 2.)
- **Departments** (built-in templates, basic create/assign).
- **Audit log** via Postgres triggers (create/edit/approve on key entities) — important from day one.

### Projects & tasks
- Project CRUD: name, department, owner, dates, status, priority, category.
- Milestones + tasks/subtasks, assignment, status, due dates, comments, attachments.
- **Kanban + List views**, My Tasks, Overdue, basic time logs.
- Progress rollup (weighted milestones/tasks).

### Approvals (single + multi-level)
- Configurable workflow engine for the **most-needed flows**: expense, budget, project completion, leave.
- Single-level and sequential multi-level; comments; rejection reasons; resubmission; approval history.
- **Approval Center** unified queue.

### Finance (essentials)
- Project budgets (line items) + budget approval.
- Expense requests + approval + receipts.
- Client invoices (basic) + payment status (manual mark-paid).
- Budget vs actual + budget alerts.

### Meetings (basic)
- Create meetings, attendees, agenda, minutes, action items → tasks.
- Calendar view; in-app + email reminders.

### Notifications
- In-app + **email** for: task assigned, deadline, overdue, approval pending/accepted/rejected, budget exceeded, meeting reminder.

### Dashboards & reports
- Role dashboards: CEO, PM, Finance, Department Head, Employee.
- Core reports: project progress, budget vs actual, task completion, approval pending, expense.

### Tech baseline
- Web app (responsive) on Next.js + a thin backend service, with **Supabase** (Postgres + Auth + Storage + Realtime + RLS) as the data platform. See [Tech Stack](22-tech-stack.md).

## Explicitly deferred from MVP
Client & vendor portals · purchase orders / petty cash / payroll integration · WhatsApp/SMS/Slack channels · all AI features · Gantt/critical path · advanced conditional/parallel approvals + auto-escalation · mobile apps · SSO. (See [Future Version](21-future-version.md).)

## Suggested MVP timeline (rough)
| Phase | Weeks | Output |
|-------|-------|--------|
| 1 | 1–4 | Auth, RBAC, departments, audit, project/task core |
| 2 | 5–8 | Approval engine, expenses, budgets, approval center |
| 3 | 9–11 | Meetings, notifications (in-app/email), invoices |
| 4 | 12–14 | Dashboards, core reports, polish, UAT |
