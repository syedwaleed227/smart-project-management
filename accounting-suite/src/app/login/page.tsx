import { redirect } from "next/navigation";
import { getCurrentUser, authenticate, createSession } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const user = await authenticate(email, password);
  if (!user) redirect("/login?error=1");
  await createSession(user.id);
  redirect("/dashboard");
}

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            SA
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Smart Accounting Suite</h1>
          <p className="mt-1 text-sm text-slate-500">AI-powered practice management · self-hosted</p>
        </div>
        <form action={login} className="card space-y-4 p-6">
          {searchParams.error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Invalid email or password.</div>
          )}
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required defaultValue="partner@firm.com" className="input" />
          </div>
          <div>
            <label className="label">Password</label>
            <input name="password" type="password" required defaultValue="password123" className="input" />
          </div>
          <button className="btn-primary w-full">Sign in</button>
          <p className="text-center text-xs text-slate-400">
            Demo: partner@firm.com · manager@firm.com · accountant@firm.com · auditor@firm.com · tax@firm.com ·
            legal@firm.com — password <span className="font-mono">password123</span>
          </p>
        </form>
      </div>
    </div>
  );
}
