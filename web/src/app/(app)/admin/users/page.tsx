import { redirect } from "next/navigation";
import { requireUser, isAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge, Empty, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

interface UserRow {
  id: string;
  name: string;
  email: string;
  status: string;
}

export default async function UsersAdminPage() {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/");

  const supabase = createSupabaseServerClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, name, email, status")
    .order("name");

  // Roles per user (two simple queries, joined in memory).
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("user_id, roles(name)");
  const rolesByUser = new Map<string, string[]>();
  (roleRows ?? []).forEach((r) => {
    const rel = r.roles as { name: string } | { name: string }[] | null;
    const name = Array.isArray(rel) ? rel[0]?.name : rel?.name;
    if (!name) return;
    const list = rolesByUser.get(r.user_id) ?? [];
    list.push(name);
    rolesByUser.set(r.user_id, list);
  });

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        subtitle="People with access and their assigned roles."
      />
      {users && users.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Roles</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(users as UserRow[]).map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-5 py-3 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(rolesByUser.get(u.id) ?? []).map((r) => (
                        <Badge key={r} tone="blue">
                          {r}
                        </Badge>
                      ))}
                      {!(rolesByUser.get(u.id) ?? []).length && (
                        <span className="text-xs text-slate-400">No role</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{u.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty message="No users yet." />
      )}
    </div>
  );
}
