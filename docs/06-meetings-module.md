# 6. Meeting Schedule Module

Meetings tie into projects, departments, finance reviews, and approvals, and produce **minutes**, **action items**, and **follow-up tasks**.

## Meeting creation
- Any user with permission creates a meeting: title, type, date/time, duration, location/link, organizer, attendees, agenda, related entity (project/department/client).
- Optional **meeting approval** when policy requires (e.g., client-facing or budgeted meetings).

## Meeting types
| Type | Linked to | Typical attendees |
|------|-----------|-------------------|
| **Internal** | Team/department | Staff |
| **Client** | Client + project | PM, client contacts |
| **Department** | Department | Dept members |
| **Project review** | Project | PM, team, stakeholders |
| **Finance review** | Finance/dept | Finance Mgr, Heads |
| **Approval meeting** | Approval item | Approvers |

## Scheduling features
- **Recurring meetings** — daily/weekly/monthly/custom with end condition.
- **Agenda** — ordered items with owner and time-box.
- **Attendees** — internal users + external (clients/vendors via email); RSVP status.
- **Reminders** — configurable (e.g., 1 day, 1 hour before) via in-app/email/SMS/WhatsApp/Slack.
- **Calendar view** — day/week/month; filter by type/project/department; integrates with Google/Outlook calendars (later version).

## During & after the meeting
- **Meeting minutes** — structured notes per agenda item; can be AI-summarized (see [Automation](15-automation-and-ai.md)).
- **Action items** — assignee, due date, status; tracked to completion.
- **Follow-up tasks** — action items can be converted into project tasks in one click.
- **Attachments** — slides, documents, recordings.

## Notifications
- Invites, updates, cancellations, reminders, and "minutes published" alerts. See [Notifications](11-notifications.md).

## Key fields
`Meeting(id, title, type, organizer_id, project_id, department_id, client_id, start, end, recurrence, location, status)`,
`Attendee(meeting_id, user_id/email, rsvp)`, `AgendaItem(meeting_id, order, topic, owner, minutes)`, `ActionItem(meeting_id, title, assignee_id, due, status, linked_task_id)`.
