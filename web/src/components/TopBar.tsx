import Link from "next/link";
import { signOut } from "@/lib/actions/auth";

export function TopBar({
  title,
  unread = 0,
}: {
  title: string;
  unread?: number;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          className="relative rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Notifications
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
        <form action={signOut}>
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
