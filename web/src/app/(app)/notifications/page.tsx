import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { titleCase } from "@/lib/format";
import { markAllRead, markRead } from "./actions";
import type { Notification } from "@/lib/types";

export const dynamic = "force-dynamic";

function ago(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default async function NotificationsPage() {
  await requireUser();
  const supabase = createSupabaseServerClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, entity_type, entity_id, message, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const hasUnread = (notifications ?? []).some((n) => !n.read_at);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notifications"
        subtitle="Activity that needs your attention."
        action={
          hasUnread ? (
            <form action={markAllRead}>
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Mark all read
              </button>
            </form>
          ) : undefined
        }
      />

      {notifications && notifications.length > 0 ? (
        <ul className="space-y-2">
          {(notifications as Notification[]).map((n) => (
            <li
              key={n.id}
              className={`flex items-start justify-between gap-3 rounded-xl border p-4 ${
                n.read_at
                  ? "border-slate-200 bg-white"
                  : "border-brand-200 bg-brand-50"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone="blue">{titleCase(n.type)}</Badge>
                  <span className="text-xs text-slate-400">
                    {ago(n.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{n.message}</p>
              </div>
              {!n.read_at && (
                <form action={markRead}>
                  <input type="hidden" name="id" value={n.id} />
                  <button className="shrink-0 text-xs font-medium text-brand-600 hover:underline">
                    Mark read
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Empty message="No notifications yet." />
      )}
    </div>
  );
}
