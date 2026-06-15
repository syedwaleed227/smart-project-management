import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { date, titleCase } from "@/lib/format";
import { updateTaskStatus } from "./actions";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

const COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "in_review", label: "In Review" },
  { key: "done", label: "Done" },
];

const NEXT: Record<string, string> = {
  todo: "in_progress",
  in_progress: "in_review",
  in_review: "done",
  blocked: "in_progress",
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { mine?: string };
}) {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  const mineOnly = searchParams.mine !== "0";

  let query = supabase
    .from("tasks")
    .select("id, title, status, priority, due_date, assignee_id, project_id")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (mineOnly) query = query.eq("assignee_id", user.id);

  const { data: tasks } = await query;
  const byStatus = (s: string) =>
    (tasks as Task[] | null)?.filter((t) => t.status === s) ?? [];

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Kanban board across your projects."
        action={
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
            <a
              href="/tasks?mine=1"
              className={`rounded-md px-3 py-1 ${mineOnly ? "bg-brand-50 text-brand-700" : "text-slate-500"}`}
            >
              My tasks
            </a>
            <a
              href="/tasks?mine=0"
              className={`rounded-md px-3 py-1 ${!mineOnly ? "bg-brand-50 text-brand-700" : "text-slate-500"}`}
            >
              All visible
            </a>
          </div>
        }
      />

      {tasks && tasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className="rounded-xl bg-slate-100/60 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-slate-600">
                  {col.label}
                </span>
                <span className="rounded-full bg-white px-2 text-xs text-slate-400">
                  {byStatus(col.key).length}
                </span>
              </div>
              <div className="space-y-2">
                {byStatus(col.key).map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {t.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge>{t.priority}</Badge>
                      <span className="text-xs text-slate-400">
                        {date(t.due_date)}
                      </span>
                    </div>
                    {NEXT[t.status] && (
                      <form action={updateTaskStatus} className="mt-2">
                        <input type="hidden" name="id" value={t.id} />
                        <input
                          type="hidden"
                          name="project_id"
                          value={t.project_id}
                        />
                        <input
                          type="hidden"
                          name="status"
                          value={NEXT[t.status]}
                        />
                        <button className="w-full rounded-md border border-slate-200 py-1 text-xs text-slate-600 hover:bg-slate-50">
                          Move to {titleCase(NEXT[t.status])}
                        </button>
                      </form>
                    )}
                  </div>
                ))}
                {byStatus(col.key).length === 0 && (
                  <p className="px-1 py-4 text-center text-xs text-slate-400">
                    Nothing here
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty message="No tasks to show." />
      )}
    </div>
  );
}
