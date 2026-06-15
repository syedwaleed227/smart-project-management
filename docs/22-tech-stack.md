# 22. Technical Recommendation

A pragmatic, scalable stack that a small team can build on and grow.

## Frontend (Web)
- **Framework:** Next.js (React) + TypeScript — SSR/SEO, fast, great ecosystem.
- **UI:** Tailwind CSS + a component library (shadcn/ui or MUI).
- **State/data:** TanStack Query for server state; Zustand/Redux for UI state.
- **Charts:** Recharts / ECharts for dashboards.
- **Boards/calendar:** dnd-kit (Kanban), FullCalendar (meetings).

## Mobile
- **React Native (Expo)** — share types/logic with the web, single team.
- Push via Firebase Cloud Messaging / APNs.

## Backend
- **Option A (recommended):** Node.js + **NestJS** (TypeScript) — structured, modular, fits RBAC/workflow domain; or
- **Option B:** Python + **Django/DRF** or **FastAPI** — strong for finance/reporting and AI integration.
- **API:** Supabase auto-generates a REST + Realtime API directly from the schema (PostgREST) — good for straightforward CRUD. Put complex/finance/approval logic behind a thin **NestJS/FastAPI** service (or Supabase Edge Functions) that uses the service-role key. REST (OpenAPI) primary; GraphQL optional.
- **Auth:** **Supabase Auth** — JWT + refresh tokens, 2FA (MFA/TOTP), later SSO via OAuth/SAML. JWT `auth.uid()` + role/department claims drive RLS.
- **Background jobs:** `pg_cron` + `pgmq` in Supabase, or an external queue (BullMQ/Redis, Celery) for reminders, escalations, reports, notifications.

## Database & storage — **Supabase**
We use **Supabase** as the data platform. It is managed **PostgreSQL** plus a set of services that map directly onto this system's needs:

- **Primary DB:** Supabase Postgres — relational integrity is essential for finance + approvals + audit. Use migrations (Supabase CLI) for schema in `supabase/migrations`.
- **Row Level Security (RLS):** enforce **RBAC + department scoping at the database layer** — policies keep users to their department/owned rows even if the API is bypassed. This is a major win for the permissions matrix.
- **Auth:** **Supabase Auth** — email/password, **2FA (MFA/TOTP)**, and social/SSO providers (OAuth) later. Issues JWTs that carry the user id used by RLS policies (`auth.uid()`); store role/department claims for policy checks.
- **Storage:** **Supabase Storage** (S3-compatible) for all documents/attachments, with bucket policies tied to the same RLS model; encrypted at rest.
- **Realtime:** **Supabase Realtime** for live dashboards, notification badges, Kanban updates — replaces a separate WebSocket layer for most needs.
- **Edge Functions:** **Supabase Edge Functions** (Deno) for server-side logic that must run with elevated rights (approval routing, notification fan-out, scheduled jobs via `pg_cron`).
- **Search:** Postgres full-text + **`pgvector`** (built into Supabase) for smart/semantic search later.
- **Cache/queue:** Redis (Upstash) or `pgmq`/`pg_cron` in Postgres for reminders, escalations, and report jobs.
- **Audit logs:** append-only table with Postgres triggers capturing old→new values automatically (+ optional archival).

> **Why Supabase fits:** it collapses Postgres, auth+2FA, file storage, realtime, and DB-level access control into one managed platform — ideal for an MVP team while still being standard Postgres you can scale or self-host later.

## Cloud & infra
- **Hosting:** AWS / GCP / Azure (or Vercel for the Next.js frontend + managed backend).
- **Containers:** Docker; orchestrate with ECS/Kubernetes as you scale.
- **CI/CD:** GitHub Actions → automated tests, build, deploy.
- **IaC:** Terraform.
- **Monitoring:** Sentry (errors), Prometheus/Grafana or Datadog (metrics/logs).
- **Backups:** automated DB snapshots + tested restores; point-in-time recovery.

## Notifications
- **Email:** SendGrid / Amazon SES / Postmark.
- **SMS/WhatsApp:** Twilio / Meta WhatsApp Business API.
- **Slack/Teams:** native app integrations / incoming webhooks.
- **In-app/push:** WebSockets (Socket.IO/Pusher) + FCM/APNs for mobile.

## AI integration
- **Anthropic Claude API** — use the latest models (e.g., **Claude Opus 4.8** for deep reasoning/summaries, **Claude Sonnet 4.6** for high-volume/low-latency tasks).
- Use for: meeting/project summaries, anomaly explanations, smart search, NL→report.
- Patterns: server-side calls with permission-scoped context, prompt-caching for repeated context, tool-use for structured outputs, and a human-in-the-loop gate before any financial/risk action.
- Vector store (pgvector / Pinecone) for semantic search over documents.

## Security & compliance baseline
- TLS everywhere; AES-256 at rest; secrets in a vault (AWS Secrets Manager).
- RBAC + department scoping enforced server-side; rate limiting; audit logging.
- Aim for SOC 2 / ISO 27001 readiness as you scale (see [Future](21-future-version.md)).

## Summary table
| Layer | Recommendation |
|-------|----------------|
| Web | Next.js + TypeScript + Tailwind |
| Mobile | React Native (Expo) |
| Backend | NestJS (Node/TS) or FastAPI/Django (Python) |
| Database | **Supabase** (managed Postgres) + RLS + Realtime |
| Auth | **Supabase Auth** (JWT, 2FA/MFA, OAuth/SSO later) |
| Files | **Supabase Storage** (S3-compatible) |
| Search | Postgres FTS → `pgvector` (in Supabase) |
| Server logic | NestJS/FastAPI service + Supabase Edge Functions |
| Notifications | SES/SendGrid + Twilio + Slack + FCM |
| AI | Anthropic Claude API (Opus 4.8 / Sonnet 4.6) |
| Cloud | Supabase Cloud (or self-host) + Vercel + GitHub Actions |
