# 1. System Overview

## What it is

The **Smart Project Management System (SPMS)** is a centralized, web- and mobile-based SaaS platform that unifies how an organization runs **projects, finances, meetings, approvals, departments, people, and reporting**. Instead of juggling spreadsheets, email chains, chat apps, and separate accounting tools, every operation flows through one system with a single source of truth.

## The problem it solves

Mid-size and growing organizations typically struggle with:

- **Fragmented tools** — projects in one app, money in another, approvals over email, meeting notes in documents.
- **No accountability** — unclear who created, edited, approved, or rejected something.
- **Weak financial control** — budgets exceeded silently, expenses untracked, no link between project spend and profitability.
- **Slow approvals** — requests stuck in inboxes with no escalation.
- **Poor visibility** — leadership cannot see real-time project health, cash flow, or department performance.
- **Compliance/audit gaps** — no reliable trail of who did what and when.

SPMS solves these by enforcing **role-based access**, **multi-level approval workflows**, **project-linked finance**, **full audit trails**, and **AI-assisted automation**.

## Who uses it

| Audience | Why they use it |
|----------|-----------------|
| **Leadership (CEO/Owner)** | Real-time visibility into projects, finance, and department performance |
| **Project Managers** | Plan, assign, track tasks, milestones, budgets, and risks |
| **Finance team** | Control budgets, approve expenses, manage invoices and payments, run P&L |
| **HR team** | Manage employees, attendance, leave, performance, and permissions |
| **Department Heads & Team Leads** | Manage their teams' work and approvals |
| **Employees** | See assigned work, log time, submit requests |
| **External Clients** | View their project progress, invoices, and meetings via a portal |
| **External Vendors** | Submit invoices, view POs and payment status |
| **Auditors** | Read-only review of records and trails |

## Design principles

1. **Single source of truth** — one record per entity, referenced everywhere.
2. **Everything is approvable** — any sensitive action can be routed through a workflow.
3. **Everything is auditable** — immutable logs of who/what/when/old→new.
4. **Least privilege** — users see and do only what their role and department allow.
5. **Finance is project-aware** — every cost can trace back to a project, department, vendor, or client.
6. **Automation first** — reminders, escalations, and alerts reduce manual chasing.
7. **Multi-tenant ready** — built so it can serve one company now and many later.
