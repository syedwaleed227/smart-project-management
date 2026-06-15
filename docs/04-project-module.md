# 4. Project Management Module

The core module. Everything (tasks, finance, meetings, documents, approvals) can attach to a project.

## Project creation
- Created by PM, Department Head, or above.
- Required: name, code, owning department, PM/owner, client (optional), start date, deadline, category, priority, description.
- A new project can require **project-creation approval** before becoming active (see [Approvals](07-approval-workflows.md)).

## Core attributes

| Attribute | Options / Notes |
|-----------|-----------------|
| **Categories** | Internal, Client, R&D, Maintenance, Marketing, Custom |
| **Status** | Draft → Pending Approval → Active → On Hold → At Risk → Completed → Closed → Cancelled |
| **Priority** | Low, Medium, High, Critical |
| **Dates** | Start date, deadline, actual completion date, baseline vs actual |

## Structure

### Milestones
- Named checkpoints with target date, weight (% of project), status, and linked deliverables.
- Drive **progress tracking** (weighted completion).

### Tasks and subtasks
- Tasks belong to a project (and optionally a milestone). Subtasks nest under tasks.
- Fields: title, description, assignee(s), status, priority, estimate, due date, dependencies, attachments, comments, time logs.

### Task assignment
- Assign to one owner + optional collaborators; auto-notifies assignee.
- Workload-aware suggestions (see [Automation](15-automation-and-ai.md)).

### Task dependencies
- Finish-to-Start (default), plus Start-to-Start, Finish-to-Finish.
- Blocked tasks are flagged; Gantt/critical-path supported in later version.

## Tracking
- **Time tracking:** start/stop timer or manual logs per task; rolls up to project.
- **Progress tracking:** auto from weighted milestones/tasks, with manual override + reason (logged).

## Collaboration
- **Attachments** on project/tasks (versioned, see [Documents](13-documents.md)).
- **Comments** (threaded, @mentions trigger notifications).
- **Internal notes** — visible only to internal team, never to client.
- **Client updates** — curated, client-visible progress posts.

## Finance on the project
- **Project budget** — planned by line item/category; needs budget approval.
- **Project expenses** — linked spend; rolls into budget vs actual.
- **Project profitability** — revenue (invoices) − costs (expenses + allocated labor).
- All finance detail in the [Finance Module](05-finance-module.md).

## Governance
- **Project risks** — register with likelihood × impact, owner, mitigation, status.
- **Project issues** — active problems with severity, owner, resolution.
- **Project completion approval** — PM submits for sign-off; routes to Department Head / CEO / Client as configured; closes the project and locks editing.

## Project record (key fields)
`id, name, code, category, status, priority, department_id, owner_id, client_id, start_date, deadline, actual_end, budget_id, progress_pct, health, created_by, created_at`.
