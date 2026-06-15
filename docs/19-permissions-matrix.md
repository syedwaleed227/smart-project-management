# 19. Permissions Matrix

Legend: **F**=Full (view/create/edit) · **V**=View only · **A**=Approve/Reject · **S**=Submit/own-records only · **—**=No access · **(d)**=limited to own department/scope.

| Module / Action | Super Admin | CEO/Owner | Project Mgr | Finance Mgr | HR Mgr | Dept Head | Team Lead | Employee | Client | Vendor | Auditor |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Users & Roles** | F | V | — | — | V(d) | V(d) | — | — | — | — | V |
| **Departments** | F | F | V | V | F | F(d) | V(d) | — | — | — | V |
| **Projects** | F | V | F(d) | V | — | F(d) | V(d) | V(own) | V(own) | V(linked) | V |
| **Project approval** | A | A | S | — | — | A(d) | — | — | — | — | — |
| **Tasks** | F | V | F(d) | — | — | F(d) | F(team) | S(own) | — | — | V |
| **Task approval** | A | — | A | — | — | A(d) | A(team) | — | — | — | — |
| **Budgets** | F | A | S(d) | F | — | S(d) | — | — | — | — | V |
| **Budget approval** | A | A | — | A | — | A(d) | — | — | — | — | — |
| **Expenses** | F | V | S(d) | F | — | A(d) | S | S(own) | — | — | V |
| **Expense approval** | A | A | A(limit) | A | — | A(d) | A(limit) | — | — | — | — |
| **Purchases / PO** | F | V | S | A | — | A(d) | — | S(own) | — | V(own) | V |
| **Invoices** | F | V | V(d) | F | — | V(d) | — | — | V(own) | S(own) | V |
| **Payments** | F | A | — | F/A | — | — | — | — | V(own) | V(own) | V |
| **Vendors** | F | V | V | F | — | V(d) | — | — | — | F(own) | V |
| **Clients** | F | V | F(d) | V | — | V(d) | — | — | F(own) | — | V |
| **Meetings** | F | F | F(d) | F(fin) | F(hr) | F(d) | F(team) | V(invited) | V(own) | V(own) | V |
| **Meeting minutes** | F | V | F(d) | F | F | F(d) | F(team) | V | V(shared) | — | V |
| **Approvals (act)** | A | A | A(scope) | A(scope) | A(scope) | A(d) | A(scope) | — | A(own) | — | — |
| **HR / Employees** | F | V | — | — | F | V(d) | V(team) | V(own) | — | — | V |
| **Leave / Attendance** | F | V | — | — | F/A | A(d) | A(team) | S(own) | — | — | V |
| **Documents** | F | V | F(d) | F(fin) | F(hr) | F(d) | F(team) | V(linked) | V(shared) | V(shared) | V |
| **Reports** | F | F | F(d) | F(fin) | F(hr) | F(d) | V(team) | V(own) | V(own) | V(own) | F |
| **Notifications (own)** | F | F | F | F | F | F | F | F | F | F | F |
| **Audit logs** | F | V | — | V(fin) | — | — | — | — | — | — | F |
| **Settings / Workflows** | F | V | — | V(fin) | V(hr) | — | — | — | — | — | V |
| **Export data** | F | F | V(d) | F(fin) | V(hr) | V(d) | — | — | — | — | V |

> Thresholds (e.g., "A(limit)") are configured per department in [Approval Workflows](07-approval-workflows.md). Custom roles are composed from the same capability + scope catalog.
