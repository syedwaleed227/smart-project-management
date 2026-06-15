import Link from "next/link";
import { requireUser, isManager } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { date } from "@/lib/format";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();

  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, name, code, category, status, priority, progress_pct, deadline",
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Everything you have access to across departments."
        action={
          isManager(user) ? (
            <Link
              href="/projects/new"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              + New project
            </Link>
          ) : undefined
        }
      />

      {projects && projects.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Progress</th>
                <th className="px-5 py-3 font-medium">Deadline</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(projects as Project[]).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-medium text-slate-800 hover:text-brand-600"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-slate-400">{p.code ?? "—"}</div>
                  </td>
                  <td className="px-5 py-3 capitalize text-slate-600">
                    {p.category}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{p.priority}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${p.progress_pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">
                        {Math.round(p.progress_pct)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{date(p.deadline)}</td>
                  <td className="px-5 py-3">
                    <Badge>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty message="No projects yet. Create your first project to get started." />
      )}
    </div>
  );
}
