# 10. HR and Employee Management

Manages people, their access, capacity, and performance — feeding workload, payroll cost, and approvals.

## Features
- **Employee profiles** — personal/contact info, joining date, manager, status, emergency contact.
- **Departments & designations** — primary/secondary departments, job title/grade.
- **Attendance** — check-in/out, remote/onsite, timesheets; integrates with time logs.
- **Leave requests** — types (annual, sick, unpaid…), balances, **leave approval** workflow (Lead → HR).
- **Employee documents** — contracts, IDs, certificates (permissioned, see [Documents](13-documents.md)).
- **Role & permissions** — assign system roles + department scope (changes audited).
- **Workload tracking** — assigned hours vs capacity across projects/tasks.
- **Performance tracking** — goals/KPIs, reviews, ratings, history.
- **Assigned projects & tasks** — what each employee is working on.

## How it connects
- **Projects/Tasks:** assignments and time logs drive workload and labor cost.
- **Finance:** payroll cost allocates to departments/projects for profitability.
- **Approvals:** leave and hiring route through workflows.
- **Security:** role/permission changes are logged.

## Key fields
`Employee(id, user_id, department_id, designation, manager_id, join_date, status)`,
`Attendance(id, employee_id, date, check_in, check_out, mode)`,
`Leave(id, employee_id, type, start, end, days, status, approval_id)`,
`Performance(id, employee_id, period, goals, rating, reviewer_id)`.
