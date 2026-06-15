import { signOut } from "@/lib/actions/auth";

export function TopBar({ title }: { title: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      <form action={signOut}>
        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Sign out
        </button>
      </form>
    </header>
  );
}
