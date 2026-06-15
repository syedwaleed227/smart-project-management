# 3. Department Management

Departments are the **organizational backbone**. They scope access, route approvals, own budgets, and group people and projects.

## Built-in department templates

| Department | Typical responsibilities in SPMS |
|------------|----------------------------------|
| **Finance** | Budgets, expenses, invoices, payments, P&L, financial approvals |
| **HR** | Employees, attendance, leave, hiring, performance |
| **Operations** | Delivery, process, cross-team coordination |
| **Sales** | Client acquisition, deals, client-linked projects |
| **Marketing** | Campaigns, marketing projects/budgets |
| **Procurement** | Purchase requests, vendor management, POs |
| **Legal** | Contracts, compliance, legal document review/approval |
| **IT** | Systems, access, internal IT projects |
| **Admin** | Facilities, petty cash, general administration |
| **Project Teams** | Cross-functional delivery teams attached to projects |
| **Custom** | Any org-specific unit (e.g., R&D, QA, Support) |

## How departments work

### Creation
- Created by **Super Admin** or **CEO** (or delegated to HR/Admin).
- Fields: name, code, type/template, parent department (for hierarchy), department head, default budget, cost center, approval thresholds, status.
- Supports **nested sub-departments** (e.g., Marketing → Digital, Brand).

### Assigning users
- Each user has a **primary department** and may have **secondary memberships**.
- Within a department a user has a **department role** (Head, Lead, Member).
- Assignment changes are logged in the audit trail and can require HR approval.

### Linking with projects
- A project has an **owning department** and any number of **contributing departments**.
- Tasks inherit department context for access and reporting.
- Department budgets and project budgets are linked so spend rolls up both ways.

### Inclusion in approval workflows
- Each department defines **approval thresholds** (e.g., expenses up to $1,000 approved by Head; above goes to Finance + CEO).
- Workflows can be **department-specific** (Legal approves contracts, Procurement approves vendors, Finance approves payments).
- Routing rules reference department, role, and amount conditions. See [Approval Workflows](07-approval-workflows.md).

## Department record (key fields)
`id, name, code, type, parent_id, head_user_id, cost_center, default_budget, currency, approval_thresholds (json), status, created_by, created_at`.
