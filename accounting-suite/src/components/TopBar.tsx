import Link from "next/link";
import { Avatar } from "./ui";
import { aiEnabled } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { logout } from "@/app/(app)/actions";
import type { User } from "@prisma/client";

export async function TopBar({ user }: { user: User }) {
  const unread = await prisma.notification.count({ where: { userId: user.id, read: false } });
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span
          className={`badge ${aiEnabled() ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
          title={aiEnabled() ? "Anthropic API key detected" : "Offline mode — set ANTHROPIC_API_KEY for live AI"}
        >
          {aiEnabled() ? "🤖 AI online" : "🤖 AI offline"}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/notifications" className="relative text-slate-500 hover:text-slate-800">
          🔔
          {unread > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <Avatar name={user.name} color={user.avatarColor} />
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium leading-tight">{user.name}</div>
            <div className="text-xs text-slate-400">{user.title ?? user.role}</div>
          </div>
        </div>
        <form action={logout}>
          <button className="text-sm text-slate-400 hover:text-slate-700">Sign out</button>
        </form>
      </div>
    </header>
  );
}
