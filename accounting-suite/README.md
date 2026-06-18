# Smart Accounting Suite

An **AI-powered, self-hosted practice-management platform** for accounting firms that deliver:

- **Bookkeeping** & **Accounting / Financial Statements**
- **Audit & Assurance**
- **Corporate Tax** — registration, filing, deregistration
- **VAT** — registration, filing, deregistration
- **Legal & Corporate Services**

It helps a firm run client work efficiently and collaboratively: every engagement is
auto-scaffolded with a task plan (AI-generated when an API key is present, otherwise from
built-in best-practice playbooks), a compliance calendar tracks statutory deadlines, and an
AI co-pilot answers questions grounded in your live data.

> **Data stays on your hardware.** The database is a local **PostgreSQL** instance
> (Docker compose included). Point `DATABASE_URL` at any Postgres on your physical
> server — nothing is stored in the cloud. AI is optional and degrades gracefully,
> so the app runs fully offline / air-gapped without an API key.

## Tech stack

| Layer | Choice |
|-------|--------|
| Web | Next.js 14 (App Router) + React + TypeScript |
| Styling | Tailwind CSS |
| Database | **Local PostgreSQL** via Prisma ORM |
| Auth | Cookie sessions (bcrypt), no external IdP |
| AI | Anthropic Claude (optional) with offline fallback |

## Quick start

```bash
cd accounting-suite

# 1. Install dependencies
npm install

# 2. Start the local PostgreSQL database (self-hosted, Docker)
npm run db:up          # or point DATABASE_URL at your own Postgres server

# 3. Configure environment
cp .env.example .env   # edit if needed; add ANTHROPIC_API_KEY to enable live AI

# 4. Create schema + demo data
npm run setup          # prisma generate + db push + seed

# 5. Run the app
npm run dev            # http://localhost:3000
```

### Demo logins (password `password123`)

| Email | Role |
|-------|------|
| partner@firm.com | Managing Partner |
| manager@firm.com | Engagement Manager |
| accountant@firm.com | Senior Accountant |
| auditor@firm.com | Audit Senior |
| tax@firm.com | Tax Consultant |
| legal@firm.com | Legal Counsel |

## Self-hosting the database on a physical server

The included `docker-compose.yml` runs PostgreSQL 16 with a persistent volume on
the host. To use a dedicated server instead, install PostgreSQL there and set:

```
DATABASE_URL="postgresql://USER:PASSWORD@SERVER_IP:5432/accounting_suite?schema=public"
```

then run `npm run db:push && npm run db:seed`. All firm data lives only in that database.

## Enabling the AI co-pilot

Set `ANTHROPIC_API_KEY` in `.env` (and optionally `AI_MODEL`). With a key:

- New engagements get an **AI-generated, tailored task plan**.
- The **AI Co-pilot** page answers questions using a live snapshot of your firm.

Without a key, the app uses deterministic playbooks and a data-summary fallback —
every feature still works.

## Key features

- 📊 **Dashboard** — KPIs, AI insights, upcoming deadlines, active engagements.
- 🏢 **Clients** — companies with TRN, jurisdiction, fiscal year, risk rating.
- 📁 **Engagements** — one per client/service line, with status workflow, fees and progress.
- ✅ **Tasks** — collaborative Kanban board per engagement + personal task list.
- 📅 **Compliance Calendar** — VAT / corporate tax / audit / licensing deadlines with countdowns.
- 🤖 **AI Co-pilot** — grounded in your data; planning, prioritisation, risk-spotting.
- 👥 **Team** — live workload across staff.
- 🔔 **Notifications** & activity trails for collaboration and audit.

## Project structure

```
accounting-suite/
├── docker-compose.yml        # local PostgreSQL
├── prisma/
│   ├── schema.prisma         # full domain model
│   └── seed.ts               # demo firm data
└── src/
    ├── lib/                  # db, auth, ai, domain playbooks, insights
    ├── components/           # shared UI
    └── app/
        ├── login/
        ├── api/assistant/    # AI co-pilot endpoint
        └── (app)/            # dashboard, clients, engagements, tasks,
                              # compliance, assistant, team, notifications
```
