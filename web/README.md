# SPMS Web App

The Smart Project Management System frontend — **Next.js 14 (App Router) +
TypeScript + Tailwind + Supabase**. It connects directly to the Supabase
schema in [`../supabase`](../supabase) and relies on Row Level Security, so the
UI shows each user only what their role and department allow.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router, Server Components + Server Actions) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Data / Auth | Supabase (`@supabase/ssr` cookie-based sessions) |

## Setup

```bash
cd web
cp .env.example .env.local          # fill in your Supabase URL + anon key
npm install
npm run dev                         # http://localhost:3000
```

Apply the database first (see [`../supabase/README.md`](../supabase/README.md)):

```bash
supabase start && supabase db reset
```

The **first account you sign up** is automatically granted **Super Admin**
(see migration `0009`), so you can immediately assign roles to everyone else.

## What's implemented

- **Auth** — email/password sign-up & sign-in, session via cookies, route
  protection in `middleware.ts`, sign-out.
- **Role-aware shell** — sidebar/nav adapts to the user's roles
  (`src/lib/auth.ts`).
- **Dashboard** — live counts (active projects, open tasks, pending approvals,
  pending expense total), recent projects, my open tasks.
- **Projects** — list, create (Server Action), detail with overview, tasks
  (inline add + status advance) and recent expenses.
- **Tasks** — Kanban board (My tasks / All visible) with status transitions.
- **Expenses** — list, submit; amounts over the threshold auto-open an
  approval record.
- **Approval Center** — pending queue with approve/reject + reason; updates the
  linked entity and writes an approval-step history row.
- **Meetings** — upcoming meetings list.
- **Finance** (Finance/Admin) — receivables, payables, spend, invoices.
- **Admin** — departments and users/roles views (Super Admin only).

## Project structure

```
web/
├── middleware.ts                  Session refresh + auth redirects
└── src/
    ├── app/
    │   ├── login/                 Public auth screen
    │   └── (app)/                 Authenticated shell + all modules
    │       ├── layout.tsx         Sidebar + top bar (role-aware nav)
    │       ├── page.tsx           Dashboard
    │       ├── projects/          list · new · [id] · actions
    │       ├── tasks/             Kanban board · actions
    │       ├── expenses/          list · new · actions
    │       ├── approvals/         Approval center · actions
    │       ├── meetings/          Upcoming meetings
    │       ├── finance/           Finance overview
    │       └── admin/             departments · users
    ├── components/                Sidebar, TopBar, UI primitives
    └── lib/
        ├── supabase/              server / browser / middleware clients
        ├── auth.ts                getSessionUser, role helpers
        ├── types.ts               Domain types
        └── actions/auth.ts        signOut
```

## Notes

- All data pages are `force-dynamic` and query Supabase as the logged-in user,
  so **RLS is the security boundary** — the UI never bypasses it.
- Approval threshold routing is a simplified client-side rule for now; the full
  workflow engine (conditions, multi-step, escalation) belongs in Supabase Edge
  Functions per the [docs](../docs/07-approval-workflows.md).
- Pinned to Next.js 14.2.35 (latest patched 14.x). Moving to Next 16 clears the
  remaining transitive dev advisories but is a separate migration.
