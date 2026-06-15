import { redirect } from "next/navigation";
import { requireUser, isAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { titleCase } from "@/lib/format";
import type { Department } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DepartmentsAdminPage() {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/");

  const supabase = createSupabaseServerClient();
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, code, type, head_user_id, status")
    .order("name");

  return (
    <div>
      <PageHeader title="Departments" subtitle="Organizational units and their scope." />
      {departments && departments.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(departments as Department[]).map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{d.name}</td>
                  <td className="px-5 py-3 text-slate-600">{d.code ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{titleCase(d.type)}</td>
                  <td className="px-5 py-3">
                    <Badge>{d.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty message="No departments. Run the seed or create one." />
      )}
    </div>
  );
}
