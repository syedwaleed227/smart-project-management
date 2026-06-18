import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SectionTitle, Avatar } from "@/components/ui";
import { titleCase } from "@/lib/format";
import { changeMyPassword } from "../actions";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  short: "New password must be at least 8 characters.",
  match: "The two new passwords don't match.",
  current: "Your current password is incorrect.",
};

export default async function AccountPage({ searchParams }: { searchParams: { ok?: string; error?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <SectionTitle title="My Account" subtitle="Your profile and password" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} color={user.avatarColor} />
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-slate-400">{user.title ?? titleCase(user.role)}</div>
            </div>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-400">Email</dt><dd>{user.email}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Role</dt><dd>{titleCase(user.role)}</dd></div>
          </dl>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Change password</h2>
          {searchParams.ok && <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Password updated.</div>}
          {searchParams.error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{ERRORS[searchParams.error] ?? "Something went wrong."}</div>}
          <form action={changeMyPassword} className="max-w-md space-y-3">
            <div>
              <label className="label">Current password</label>
              <input name="current" type="password" required className="input" />
            </div>
            <div>
              <label className="label">New password</label>
              <input name="next" type="password" required minLength={8} className="input" placeholder="min 8 characters" />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input name="confirm" type="password" required minLength={8} className="input" />
            </div>
            <button className="btn-primary">Update password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
