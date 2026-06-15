# 7. Approval Workflow System

A single, configurable **approval engine** powers every sign-off in the system. Workflows are defined per **entity type** and can be department-, amount-, project-, or role-conditional.

## Supported approval types
Project creation · Budget · Expense · Purchase (PR/PO) · Vendor onboarding · Invoice · Leave · Hiring · Contract · Project completion · Any department-specific approval.

## Workflow capabilities

| Capability | Description |
|------------|-------------|
| **Single-level** | One approver decides. |
| **Multi-level** | Several stages, each must pass. |
| **Sequential** | Approvers act in order; next is notified only after the previous approves. |
| **Parallel** | Multiple approvers at once; configure quorum (all / any-N). |
| **Conditional** | Route by amount, department, project, role, or custom field (e.g., > $10k adds CEO). |
| **Auto-escalation** | If no response within SLA, escalate to backup/next level and notify. |
| **Comments** | Approvers must/can add comments at each step. |
| **Rejection reasons** | Mandatory reason on reject. |
| **Resubmission** | Submitter edits and resubmits; restarts or resumes per config. |
| **Approval history** | Full timeline of every step, actor, decision, time. |
| **Digital approval record** | Tamper-evident record (who/when/decision), exportable for audit. |

## How a workflow is defined
```
Workflow {
  entity_type: "expense",
  conditions: [ { field: "amount", op: ">", value: 1000 } ],
  steps: [
    { order: 1, type: "sequential", approver: role("DepartmentHead"), sla_hours: 24, escalate_to: role("CEO") },
    { order: 2, type: "parallel", approvers: [role("FinanceManager")], quorum: "all", sla_hours: 48 }
  ]
}
```
- Multiple workflows per entity type; the engine picks the first whose **conditions** match.
- Approvers can be a **specific user, a role, a role-within-department, or the requester's manager**.

## Lifecycle
```
Draft ─submit▶ Pending ─(step approvals)─▶ Approved ─▶ (entity activated/paid)
              │                          
              ├─ Rejected (reason) ─▶ Submitter edits ─▶ Resubmit
              └─ SLA breach ─▶ Auto-escalate ─▶ next approver
```

## Example routings
- **Expense ≤ $1,000:** Team Lead → done.
- **Expense $1,001–$10,000:** Department Head → Finance Manager (sequential).
- **Expense > $10,000:** Department Head → Finance Manager → CEO.
- **Contract:** Legal (review) ∥ Finance (cost) → CEO (sign).
- **Leave:** Team Lead → HR Manager.
- **Project completion:** PM submit → Department Head → Client sign-off (if client project).

## Cross-module integration
- The **Approval Center** ([screen](18-pages-and-screens.md)) aggregates every pending item for a user.
- Approvals emit **notifications** at submit/approve/reject/escalate.
- Every decision writes to the **audit trail**.
