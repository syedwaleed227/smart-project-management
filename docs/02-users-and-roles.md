# 2. Main Users and Roles

Roles are **assignable** (a user can hold more than one) and combine with **department scope** (e.g., "Finance Manager of Finance dept"). Permissions = Role capabilities ∩ Department scope. See the [Permissions Matrix](19-permissions-matrix.md).

Legend for actions: **V**=View, **C**=Create, **E**=Edit, **A**=Approve, **R**=Reject, **Rep**=Report.

## Super Admin
- **Scope:** Entire system, all tenants/settings.
- **V/C/E:** Everything — users, roles, departments, system config, integrations, workflows.
- **A/R:** Can override any approval (with audit).
- **Rep:** All reports + system/security logs.
- **Note:** Cannot be deleted by others; actions fully logged. Typically platform/IT only.

## Company Owner / CEO
- **V:** All projects, finance, departments, reports, dashboards (company-wide read).
- **C/E:** High-level config, strategic projects; usually delegates day-to-day.
- **A/R:** Final approver for high-value items (large budgets, contracts, hiring).
- **Rep:** Executive dashboards, profitability, cash flow, department performance.

## Project Manager (PM)
- **V:** Their projects fully; related finance (budget vs actual), team workloads.
- **C/E:** Projects, milestones, tasks, assignments, risks, issues, project budgets (draft), client updates.
- **A/R:** Task completion, project-level expense requests (up to a limit), project completion submission.
- **Rep:** Project progress, budget vs actual, team workload, risk/issue reports.

## Finance Manager
- **V:** All financial records, budgets, invoices, payments, payroll links, P&L, cash flow.
- **C/E:** Budgets, invoices, vendor payments, reimbursements, petty cash, tax fields.
- **A/R:** Expense, purchase, invoice, advance, reimbursement approvals (per thresholds).
- **Rep:** Finance reports, budget vs actual, profitability, expense, audit (financial).

## HR Manager
- **V:** Employee profiles, departments, attendance, leave, performance, workload.
- **C/E:** Employee records, designations, attendance, leave policies, documents.
- **A/R:** Leave approvals, hiring requests, onboarding/offboarding.
- **Rep:** Headcount, attendance, leave, workload, performance reports.

## Department Head
- **V:** Everything within their department — projects, tasks, budget, staff, approvals.
- **C/E:** Department settings, sub-teams, department budget (draft), assign staff.
- **A/R:** Department-scoped approvals (expenses, purchases, leave within dept) per thresholds.
- **Rep:** Department performance, budget, workload, approval status.

## Team Lead
- **V:** Their team's tasks, projects they're on, team workload.
- **C/E:** Tasks/subtasks, assignments within team, time-log review.
- **A/R:** Task approvals, small expense pre-approvals (route up if over limit).
- **Rep:** Team task completion, workload.

## Employee
- **V:** Own profile, assigned projects/tasks, own time logs, own requests, relevant documents.
- **C/E:** Own tasks status, comments, time logs, expense/leave/reimbursement requests (own).
- **A/R:** None (submitter, not approver).
- **Rep:** Personal workload and task reports.

## Client (external)
- **V:** Only their own projects' progress, shared milestones/updates, their invoices, shared documents, their meetings.
- **C/E:** Comments on client updates, approve client-facing deliverables/milestones, raise requests.
- **A/R:** Approve/reject deliverables and client-side sign-offs only.
- **Rep:** Their project status and invoice/payment history.

## Vendor (external)
- **V:** Their POs, contracts, submitted invoices, payment status, shared documents.
- **C/E:** Submit invoices, upload delivery docs, update contact info.
- **A/R:** None internally.
- **Rep:** Their invoice/payment history.

## Auditor
- **V:** Read-only across assigned scope — records, approvals, audit trails, financials.
- **C/E:** None (may add audit notes/flags).
- **A/R:** None.
- **Rep:** Audit reports, compliance, full activity/audit logs.

## Approver (functional role)
- A capability assigned to any user as a step in a workflow (not a standalone job title).
- **V:** The specific request and its context.
- **A/R:** Approve/reject with mandatory comments; can request changes.
- **Rep:** Pending-approval and approval-history reports for their queue.

> **Custom roles:** Super Admin can create custom roles by selecting from the capability + scope catalog, so the list above is a starting template, not a hard limit.
