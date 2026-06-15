# 8. Task and Work Management

Where day-to-day execution happens. Tasks live under projects but are surfaced through personal and team views.

## Views
| View | Purpose |
|------|---------|
| **Task dashboard** | Summary of all tasks by status/priority/due. |
| **My tasks** | Everything assigned to the current user. |
| **Team tasks** | Tasks for a Lead's/Head's team. |
| **Overdue tasks** | Past-due, highlighted for action. |
| **Priority tasks** | High/Critical items first. |
| **Workload view** | Per-person capacity vs assigned hours; spot over/under-load. |
| **Kanban board** | Drag columns (To Do → In Progress → Review → Done). |
| **List view** | Sortable/filterable table. |
| **Calendar view** | Tasks by due date. |

## Task features
- **Status** — To Do, In Progress, Blocked, In Review, Done (configurable per project).
- **Priority** — Low, Medium, High, Critical.
- **Task approval** — optional review/approval step before "Done" (e.g., Lead signs off).
- **Comments** — threaded with @mentions → notifications.
- **File attachments** — versioned, permission-controlled.
- **Time logs** — manual or timer; feeds project time tracking and labor cost.
- **Dependencies & subtasks** — see [Project Module](04-project-module.md).

## How it connects
- Tasks roll up to **milestones** and **project progress**.
- Time logs roll up to **project cost / profitability**.
- Action items from **meetings** can become tasks.
- Overdue/assigned/mention events drive **notifications**.

## Key fields
`Task(id, project_id, milestone_id, title, status, priority, assignee_id, estimate_hours, due_date, parent_task_id, approval_required, created_by)`,
`TimeLog(id, task_id, user_id, minutes, logged_at, note)`.
