// Domain types mirroring the Supabase schema in /supabase/migrations.
// Kept hand-written (rather than generated) so the app is self-contained.

export type ProjectStatus =
  | "draft"
  | "pending_approval"
  | "active"
  | "on_hold"
  | "at_risk"
  | "completed"
  | "closed"
  | "cancelled";

export type Priority = "low" | "medium" | "high" | "critical";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "in_review"
  | "done";

export type ExpenseStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "paid";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
}

export interface Department {
  id: string;
  name: string;
  code: string | null;
  type: string;
  head_user_id: string | null;
  status: string;
}

export interface Project {
  id: string;
  name: string;
  code: string | null;
  category: string;
  status: ProjectStatus;
  priority: Priority;
  department_id: string | null;
  owner_id: string | null;
  client_id: string | null;
  start_date: string | null;
  deadline: string | null;
  progress_pct: number;
  health: "green" | "amber" | "red" | null;
  description: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  milestone_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  assignee_id: string | null;
  estimate_hours: number | null;
  due_date: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  project_id: string | null;
  department_id: string | null;
  requester_id: string;
  amount: number;
  tax: number;
  category: string | null;
  description: string | null;
  status: ExpenseStatus;
  approval_id: string | null;
  created_at: string;
}

export interface Approval {
  id: string;
  entity_type: string;
  entity_id: string;
  workflow_id: string | null;
  status: ApprovalStatus;
  current_step: number;
  requested_by: string | null;
  created_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  type: string;
  organizer_id: string | null;
  project_id: string | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
}

export type RoleName =
  | "Super Admin"
  | "Company Owner"
  | "CEO"
  | "Project Manager"
  | "Finance Manager"
  | "HR Manager"
  | "Department Head"
  | "Team Lead"
  | "Employee"
  | "Client"
  | "Vendor"
  | "Auditor"
  | "Approver";

export interface SessionUser extends UserProfile {
  roles: RoleName[];
}
