import Link from "next/link";
import { requireUser, isManager } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, StatCard, Badge, Empty, PageHeader } from "@/components/ui";
import { money, date } from "@/lib/format";
import type { Project, Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();

  // All queries run under the user's RLS scope.
  const [{ count: activeProjects }, { count: openTasks }, { count: pendingApprovals }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .neq("status", "done"),
      supabase
        .from("approvals")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  const { data: pendingExpenses } = await supabase
    .from("expenses")
    .select("amount")
    .eq("status", "pending_approval");
  const pendingExpenseTotal = (pendingExpenses ?? []).reduce(
    (sum, e) => sum + Number(e.amount ?? 0),
    0,
  );

  const { data: recentProjects } = await supabase
    .from("projects")
    .select("id, name, code, status, priority, progress_pct, deadline")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: myTasks } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date, project_id")
    .eq("assignee_id", user.id)
    .neq("status", "done")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(6);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        subtitle={
          isManager(user)
            ? "Here's how your organization is tracking."
            : "Here's what's on your plate."
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active projects" value={activeProjects ?? 0} />
        <StatCard label="Open tasks" value={openTasks ?? 0} />
        <StatCard label="Pending approvals" value={pendingApprovals ?? 0} />
        <StatCard
          label="Expenses awaiting"
          value={money(pendingExpenseTotal)}
          hint="Pending approval"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Recent projects"
          action={
            <Link href="/projects" className="text-xs font-medium text-brand-600">
              View all
            </Link>
          }
        >
          {recentProjects && recentProjects.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {(recentProjects as Project[]).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <Link
                      href={`/projects/${p.id}`}
                      className="text-sm font-medium text-slate-800 hover:text-brand-600"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {p.code ?? "—"} · due {date(p.deadline)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {Math.round(p.progress_pct)}%
                    </span>
                    <Badge>{p.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty message="No projects visible to you yet." />
          )}
        </Card>

        <Card
          title="My open tasks"
          action={
            <Link href="/tasks" className="text-xs font-medium text-brand-600">
              View all
            </Link>
          }
        >
          {myTasks && myTasks.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {(myTasks as Task[]).map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.title}</p>
                    <p className="text-xs text-slate-400">due {date(t.due_date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{t.priority}</Badge>
                    <Badge>{t.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty message="You have no open tasks. 🎉" />
          )}
        </Card>
      </div>
    </div>
  );
}
