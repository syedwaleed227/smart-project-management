import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SectionTitle, Avatar } from "@/components/ui";
import { titleCase } from "@/lib/format";
import { createUser, resetUserPassword, updateUserRole, toggleUserActive } from "../../actions";

export const dynamic = "force-dynamic";

const ROLES = ["PARTNER", "MANAGER", "ACCOUNTANT", "AUDITOR", "TAX_AGENT", "LEGAL", "CLIENT"];

const MESSAGES: Record<string, { text: string; ok: boolean }> = {
  created: { text: "User created.", ok: true },
  reset: { text: "Password reset.", ok: true },
  updated: { text: "User updated.", ok: true },
  invalid: { text: "Please fill all fields; password must be at least 8 characters.", ok: false },
  exists: { text: "A user with that email already exists.", ok: false },
  short: { text: "Password must be at least 8 characters.", ok: false },
  self: { text: "You can't deactivate your own account.", ok: false },
  lastpartner: { text: "You can't deactivate the last active Partner.", ok: false },
};

export default async function UsersAdminPage({ searchParams }: { searchParams: { ok?: string; error?: string } }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!["PARTNER", "MANAGER"].includes(me.role)) redirect("/dashboard");

  const users = await prisma.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  const msgKey = searchParams.ok ?? searchParams.error;
  const msg = msgKey ? MESSAGES[msgKey] : null;

  return (
    <div className="space-y-6">
      <SectionTitle title="User Administration" subtitle="Create staff accounts, set roles and reset passwords. Required before going live." />

      {msg && (
        <div className={`rounded-lg px-4 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Add user */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Add staff member</h2>
          <form action={createUser} className="space-y-3">
            <div>
              <label className="label">Full name *</label>
              <input name="name" required className="input" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input name="email" type="email" required className="input" />
            </div>
            <div>
              <label className="label">Job title</label>
              <input name="title" className="input" placeholder="e.g. Senior Accountant" />
            </div>
            <div>
              <label className="label">Role *</label>
              <select name="role" className="input" defaultValue="ACCOUNTANT">
                {ROLES.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Temporary password *</label>
              <input name="password" type="text" required minLength={8} className="input" placeholder="min 8 characters" />
              <p className="mt-1 text-xs text-slate-400">Share it with the person; they can change it under “My Account”.</p>
            </div>
            <button className="btn-primary w-full">Create user</button>
          </form>
        </div>

        {/* User list */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Existing users</h2>
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className={`rounded-lg border p-3 ${u.active ? "border-slate-200" : "border-slate-200 bg-slate-50 opacity-70"}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} color={u.avatarColor} />
                    <div>
                      <div className="text-sm font-medium">
                        {u.name} {!u.active && <span className="text-xs text-red-500">(deactivated)</span>}
                        {u.id === me.id && <span className="text-xs text-slate-400"> · you</span>}
                      </div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={updateUserRole.bind(null, u.id)} className="flex items-center gap-1">
                      <select name="role" defaultValue={u.role} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs">
                        {ROLES.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
                      </select>
                      <button className="rounded-md bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200">Set role</button>
                    </form>
                    <form action={toggleUserActive.bind(null, u.id)}>
                      <button className={`rounded-md px-2 py-1 text-xs ${u.active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                        {u.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
                  </div>
                </div>
                <form action={resetUserPassword.bind(null, u.id)} className="mt-2 flex items-center gap-2">
                  <input name="password" type="text" minLength={8} placeholder="New password (min 8)" className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs" />
                  <button className="rounded-md bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200">Reset password</button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Before going public:</strong> create your real staff accounts above, then <em>deactivate</em> all the demo
        accounts (partner@firm.com, manager@firm.com, etc.) so the public link can’t be accessed with the demo password.
      </div>
    </div>
  );
}
