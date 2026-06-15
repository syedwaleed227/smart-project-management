# 17. User Flow

End-to-end flow of running a project from creation to closure, showing how modules connect.

## Happy-path flow

```
1. Create project          PM fills project form (name, dept, client, dates, category).
                           → If policy requires: project-creation approval → Dept Head approves.
                           → Project becomes Active.

2. Assign team members     PM adds project members (Leads, Employees) with roles.
                           → Each assignee notified.

3. Create budget           PM/Finance build budget line items.
                           → Submit budget for approval.

4. Budget approval         Routes by amount: Dept Head → Finance Manager (→ CEO if large).
                           → Approved budget becomes baseline; budget-vs-actual tracking starts.

5. Create tasks            PM/Leads break work into milestones, tasks, subtasks; set
                           dependencies, estimates, due dates; assign owners.
                           → Assignees notified; work begins; time logged.

6. Schedule meetings       PM schedules project review / client meetings (recurring optional).
                           → Attendees invited; reminders sent.

7. Record meeting minutes  During/after meeting, minutes captured; action items created.
                           → Action items converted to follow-up tasks (optionally AI-summarized).

8. Create expenses         Team submits expense/purchase requests with receipts, linked to project.

9. Department approvals    Expenses/purchases route through approval workflow (by amount/dept).
                           → Approved → recorded as actual spend → budget-vs-actual updates.
                           → Budget alert fires if threshold crossed.

10. Track progress         Task/milestone completion rolls up to project progress & health.
                           → Dashboards/reports update; risks/issues logged; client updates posted.
                           → Invoices issued to client at milestones; payments tracked.

11. Close the project      PM submits project-completion approval.
                           → Dept Head approves; Client signs off (if client project).
                           → Final profitability computed (revenue − cost).
                           → Project locked to editing; documents/audit retained.
```

## What happens behind every step
- **Notifications** fire on assignment, submission, approval, reminders, breaches.
- **Audit log** records who did what, when, and old→new values.
- **Permissions** gate every action by role + department scope.
- **Finance** stays linked: budget → expenses → invoices → profitability.
