# 11. Notifications and Alerts

A unified notification service: every significant event emits an event that is delivered through one or more channels based on user preferences and admin policy.

## Notification events
| Event | Recipients |
|-------|-----------|
| New task assigned | Assignee |
| Deadline approaching | Assignee, PM |
| Task overdue | Assignee, Lead, PM |
| Approval pending | Approver(s) |
| Approval accepted | Submitter |
| Approval rejected | Submitter |
| Meeting reminder | Attendees |
| Budget exceeded | PM, Finance, Dept Head |
| Expense submitted | Approver |
| Invoice due | Finance, Client/Vendor |
| Payment overdue | Finance, Client/Vendor |
| Project status changed | Stakeholders |
| Comment mention (@) | Mentioned user |
| Document uploaded | Subscribers of entity |

## Channels
- **In-app** (always; notification center + badge).
- **Email** (default for important events).
- **SMS** (urgent: overdue payment, escalation).
- **WhatsApp** (reminders, client/vendor updates).
- **Slack / Microsoft Teams** (team channels).

## Controls
- **Per-user preferences** — choose channels per event category; quiet hours.
- **Admin policy** — force-on for critical events (e.g., approvals, budget breach).
- **Digest mode** — daily/weekly summary instead of per-event.
- **Escalation hooks** — unread/unactioned approvals trigger reminders then escalation.

## Key fields
`Notification(id, user_id, type, entity_type, entity_id, channel, message, read_at, sent_at, status)`,
`NotificationPreference(user_id, event_category, channels[], digest)`.
