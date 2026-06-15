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
- **API:** REST (OpenAPI) primary; GraphQL optional for complex dashboards.
- **Auth:** JWT + refresh tokens, 2FA (TOTP), later SSO via OAuth/SAML (Auth0/Keycloak).
- **Background jobs:** queue (BullMQ/Redis or Celery) for reminders, escalations, reports, notifications.

## Database & storage
- **Primary DB:** **PostgreSQL** — relational integrity is essential for finance + approvals + audit.
- **Cache/queue:** Redis.
- **Search:** PostgreSQL full-text for MVP; Elasticsearch/OpenSearch later for smart search.
- **File storage:** S3-compatible object storage (AWS S3 / Cloudflare R2 / MinIO), encrypted at rest.
- **Audit logs:** append-only table (+ optional WORM/archival).

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
| Database | PostgreSQL + Redis |
| Files | S3-compatible storage |
| Search | Postgres FTS → OpenSearch/pgvector |
| Notifications | SES/SendGrid + Twilio + Slack + FCM |
| AI | Anthropic Claude API (Opus 4.8 / Sonnet 4.6) |
| Cloud | AWS/GCP + Docker + GitHub Actions + Terraform |
