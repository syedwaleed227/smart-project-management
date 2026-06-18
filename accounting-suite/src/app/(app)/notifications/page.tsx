import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SectionTitle, EmptyState } from "@/components/ui";
import { fromNow, titleCase } from "@/lib/format";
import { markAllNotificationsRead } from "../actions";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const items = await prisma.notification.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Notifications"
        action={
          <form action={markAllNotificationsRead}>
            <button className="btn-ghost">Mark all read</button>
          </form>
        }
      />
      {items.length === 0 ? (
        <EmptyState>No notifications.</EmptyState>
      ) : (
        <div className="card divide-y divide-slate-100">
          {items.map((n) => (
            <Link key={n.id} href={n.link ?? "#"} className={`block px-5 py-3 hover:bg-slate-50 ${n.read ? "" : "bg-brand-50/40"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{n.title}</span>
                <span className="text-xs text-slate-400">{titleCase(n.type)} · {fromNow(n.createdAt)}</span>
              </div>
              {n.body && <p className="text-sm text-slate-500">{n.body}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
