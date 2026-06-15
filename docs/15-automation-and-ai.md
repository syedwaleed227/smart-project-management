# 15. Automation and Smart Features

Two layers: **rule-based automation** (reliable, deterministic) and **AI features** (assistive, with human-in-the-loop for anything financial or risky).

## Rule-based automation
- **Auto task reminders** — before due, on due, after overdue.
- **Auto approval escalation** — SLA breach → escalate + notify.
- **Auto budget alerts** — threshold breaches (80%/100%/over) notify PM + Finance.
- **Auto invoice/payment reminders** — due/overdue receivables & payables.
- **Auto status rollups** — task → milestone → project progress.
- **Recurring meetings & reports** — scheduled generation and delivery.

## AI-assisted features
| Feature | What it does | Guardrail |
|---------|--------------|-----------|
| **AI meeting summaries** | Summarize minutes, extract action items into tasks. | User reviews before publish. |
| **AI project summaries** | Plain-language status from tasks/finance/risks. | Read-only assist. |
| **AI risk detection** | Flag at-risk projects (slipping milestones, budget burn). | Suggests, PM confirms. |
| **AI finance anomaly detection** | Spot unusual expenses/duplicate invoices/odd patterns. | Flags for Finance review. |
| **AI workload suggestions** | Recommend assignees by capacity/skill. | Suggestion only. |
| **AI deadline prediction** | Forecast completion from velocity/dependencies. | Advisory. |
| **Smart search** | Natural-language search across projects, docs, finance. | Respects permissions. |
| **Smart report generation** | "Show Q2 profitability by department" → report. | Respects scope. |

## Implementation notes
- Use the latest **Claude** models (e.g., Claude Opus 4.8 / Sonnet 4.6) via the Anthropic API for summarization, extraction, anomaly explanation, and natural-language search/reporting.
- Keep AI **out of the approval decision path** — it can recommend and explain, but a human approves money and risk.
- Log AI suggestions and whether they were accepted (for audit + model improvement).
- Respect RBAC/department scope when feeding context to models; never leak data across tenants.
