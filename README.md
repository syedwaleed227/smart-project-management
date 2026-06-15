# Smart Project Management System (SPMS)

A complete plan for a multi-department, SaaS-style project, finance, and operations platform.

This repository documents the full product blueprint so that a **developer**, a **UI/UX designer**, and a **business owner** can all understand the system and start planning the product.

## Repository layout

| Path | What it is |
|------|-----------|
| [`docs/`](docs) | The full product blueprint (23 sections) |
| [`supabase/`](supabase) | Runnable database: migrations, RLS, audit trigger, seed |
| [`web/`](web) | The application — Next.js 14 + TypeScript + Tailwind + Supabase |

To run the app: apply the database (`supabase db reset`) then start the web app
(`cd web && npm install && npm run dev`). See [`web/README.md`](web/README.md).

## Documents

| Document | Purpose |
|----------|---------|
| [`docs/01-system-overview.md`](docs/01-system-overview.md) | What the system is, the problem it solves, who uses it |
| [`docs/02-users-and-roles.md`](docs/02-users-and-roles.md) | All user roles and what each can do |
| [`docs/03-departments.md`](docs/03-departments.md) | Department setup and linkage |
| [`docs/04-project-module.md`](docs/04-project-module.md) | Project management features |
| [`docs/05-finance-module.md`](docs/05-finance-module.md) | Complete finance structure |
| [`docs/06-meetings-module.md`](docs/06-meetings-module.md) | Meeting scheduling and minutes |
| [`docs/07-approval-workflows.md`](docs/07-approval-workflows.md) | Flexible approval engine |
| [`docs/08-task-management.md`](docs/08-task-management.md) | Task and work management |
| [`docs/09-clients-and-vendors.md`](docs/09-clients-and-vendors.md) | Client and vendor management |
| [`docs/10-hr-module.md`](docs/10-hr-module.md) | HR and employee management |
| [`docs/11-notifications.md`](docs/11-notifications.md) | Notifications and alerts |
| [`docs/12-dashboards-and-reporting.md`](docs/12-dashboards-and-reporting.md) | Dashboards and reports |
| [`docs/13-documents.md`](docs/13-documents.md) | Document and file management |
| [`docs/14-audit-and-security.md`](docs/14-audit-and-security.md) | Audit trail and security |
| [`docs/15-automation-and-ai.md`](docs/15-automation-and-ai.md) | Automation and smart features |
| [`docs/16-database-structure.md`](docs/16-database-structure.md) | Database tables and relationships |
| [`docs/17-user-flow.md`](docs/17-user-flow.md) | End-to-end user flow |
| [`docs/18-pages-and-screens.md`](docs/18-pages-and-screens.md) | All screens |
| [`docs/19-permissions-matrix.md`](docs/19-permissions-matrix.md) | Role permissions matrix |
| [`docs/20-mvp.md`](docs/20-mvp.md) | MVP scope to build first |
| [`docs/21-future-version.md`](docs/21-future-version.md) | Advanced features for later |
| [`docs/22-tech-stack.md`](docs/22-tech-stack.md) | Technical recommendations |

## Quick Summary

The **Smart Project Management System (SPMS)** is a centralized SaaS platform that lets a company run its projects, finances, meetings, approvals, departments, and people from one place — with strict role-based access, multi-level approval workflows, full audit trails, and AI-assisted automation.

- **Core value:** accountability, financial control, and visibility across departments.
- **Primary users:** CEO/Owner, Project Managers, Finance, HR, Department Heads, Team Leads, Employees, plus external Clients, Vendors, and Auditors.
- **Data platform:** [Supabase](docs/22-tech-stack.md) (managed PostgreSQL + Auth/2FA + Storage + Realtime), with Row Level Security enforcing role and department access at the database layer.
- **Build order:** Start with the [MVP](docs/20-mvp.md) (auth, projects, tasks, basic approvals, simple finance, dashboards), then layer on the [future features](docs/21-future-version.md).
