import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, Badge, Empty, PageHeader, StatCard } from "@/components/ui";
import { money, date } from "@/lib/format";
import { createTask, updateTaskStatus } from "../../tasks/actions";
import type { Project, Task, Expense } from "@/lib/types";

export const dynamic = "force-dynamic";

const NEXT_STATUS: Record<string, string> = {
  todo: "in_progress",
  in_progress: "in_review",
  in_review: "done",
  blocked: "in_progress",
  done: "done",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireUser();
  const supabase = createSupabaseServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!project) notFound();
  const p = project as Project;

  const [{ data: tasks }, { data: expenses }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, assignee_id, project_id")
      .eq("project_id", p.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select("id, amount, category, status, created_at")
      .eq("project_id", p.id)
      .order("created_at", { ascending: false }),
  ]);

  const spend = (expenses ?? [])
    .filter((e) => ["approved", "paid"].includes(e.status))
    .reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <PageHeader
        title={p.name}
        subtitle={`${p.code ?? "—"} · ${p.category}`}
        action={
          <Link href="/projects" className="text-sm text-brand-600">
            ← Back to projects
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Status" value={<Badge>{p.status}</Badge>} />
        <StatCard label="Priority" value={<Badge>{p.priority}</Badge>} />
        <StatCard label="Progress" value={`${Math.round(p.progress_pct)}%`} />
        <StatCard label="Approved spend" value={money(spend)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Tasks">
            {tasks && tasks.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {(tasks as Task[]).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {t.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        due {date(t.due_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{t.priority}</Badge>
                      <Badge>{t.status}</Badge>
                      {t.status !== "done" && (
                        <form action={updateTaskStatus}>
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="project_id" value={p.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={NEXT_STATUS[t.status]}
                          />
                          <button className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                            Advance →
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty message="No tasks yet." />
            )}

            <form
              action={createTask}
              className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4"
            >
              <input type="hidden" name="project_id" value={p.id} />
              <input
                name="title"
                placeholder="New task title"
                required
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                name="priority"
                defaultValue="medium"
                className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <input
                type="date"
                name="due_date"
                className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
              />
              <button className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600">
                Add task
              </button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Overview">
            <dl className="space-y-3 text-sm">
              <Row label="Start" value={date(p.start_date)} />
              <Row label="Deadline" value={date(p.deadline)} />
              <Row label="Health" value={<Badge>{p.health ?? "green"}</Badge>} />
            </dl>
            {p.description && (
              <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
                {p.description}
              </p>
            )}
          </Card>

          <Card title="Recent expenses">
            {expenses && expenses.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {(expenses as Expense[]).slice(0, 6).map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-slate-700">
                      {money(e.amount)}
                    </span>
                    <Badge>{e.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty message="No expenses recorded." />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  );
}
