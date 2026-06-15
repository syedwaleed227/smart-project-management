# 5. Finance Module

A project- and department-aware finance layer. Every financial record can trace to a **project, department, vendor, or client**, and sensitive actions flow through [approvals](07-approval-workflows.md) with a full [audit trail](14-audit-and-security.md).

## Budgeting
- **Project budget planning** — line items by category (labor, materials, services); versioned; requires budget approval; baseline locked after approval.
- **Department budgets** — annual/quarterly allocations per cost center; project budgets roll up into department budgets.
- **Budget vs actual** tracked continuously; **auto budget alerts** at configurable thresholds (e.g., 80%, 100%).

## Spending requests
- **Expense requests** — submitted by employees/PMs, linked to project/department, with receipts; routed by amount.
- **Purchase requests (PR)** → **Purchase Orders (PO)** — procurement flow; PR approved → PO issued to vendor.
- **Reimbursements** — employee out-of-pocket claims with receipts.
- **Petty cash** — small-cash ledger per department/custodian with top-up and reconciliation.
- **Advance payments** — to vendors or to employees, later reconciled against invoices/expenses.

## Receivables & payables
- **Vendor payments** — against approved invoices/POs; track method, due date, status.
- **Client invoices** — generated from project/milestones; sent via [client portal](18-pages-and-screens.md); track sent/paid/overdue.
- **Payment status** — Draft, Pending, Approved, Scheduled, Paid, Overdue, Cancelled.
- **Due payments** — payables and receivables due/overdue, with reminders.

## Reporting & control
- **Profit and loss** — per project, department, or company; period-based.
- **Cash flow** — inflows (client payments) vs outflows (vendor payments, payroll, expenses).
- **Tax fields** — tax type, rate, tax-inclusive/exclusive, tax ID, on invoices/expenses; supports VAT/GST/sales tax.
- **Payroll connection** — integrate or import payroll so salary cost allocates to departments/projects (labor cost in profitability).
- **Financial approvals** — every payment/invoice/budget above threshold is approval-gated.
- **Audit trail** — immutable log of all financial create/edit/approve/reject actions.
- **Finance reports** — see [Dashboards & Reporting](12-dashboards-and-reporting.md).

## How finance connects to the rest of the system

```
Client ──invoices──▶ Project ──budget──▶ Department budget
  ▲                    │                      │
  │ payments           │ expenses/POs         │ rolls up
  │                    ▼                      ▼
Receivables        Vendor ◀──payments── Payables ──▶ Cash flow / P&L
```

- **Project ↔ Finance:** budgets, expenses, invoices, profitability all reference `project_id`.
- **Department ↔ Finance:** budgets and spend roll up to `department_id`/cost center.
- **Vendor ↔ Finance:** POs, vendor invoices, and payments reference `vendor_id`.
- **Client ↔ Finance:** invoices, advances, and receipts reference `client_id`.
- **Approvals ↔ Finance:** thresholds and routing determine who signs off.

## Key fields (selected)
- **Budget:** `id, scope(project/dept), scope_id, version, total, currency, status, approved_by, baseline_at`.
- **BudgetLine:** `id, budget_id, category, description, planned_amount, actual_amount`.
- **Expense:** `id, project_id, department_id, requester_id, amount, tax, category, status, approval_id, receipt_doc_id`.
- **Invoice:** `id, type(client/vendor), client_id/vendor_id, project_id, amount, tax, due_date, status, issued_at, paid_at`.
- **Payment:** `id, invoice_id, amount, method, status, scheduled_at, paid_at, approved_by`.
