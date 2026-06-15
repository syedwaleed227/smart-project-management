import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, Badge, Empty, PageHeader } from "@/components/ui";
import { titleCase } from "@/lib/format";
import type { Meeting } from "@/lib/types";

export const dynamic = "force-dynamic";

function fmt(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function MeetingsPage() {
  await requireUser();
  const supabase = createSupabaseServerClient();

  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, type, starts_at, ends_at, status, project_id")
    .gte("starts_at", new Date(Date.now() - 86400000).toISOString())
    .order("starts_at", { ascending: true });

  return (
    <div>
      <PageHeader title="Meetings" subtitle="Upcoming meetings you're part of." />
      {meetings && meetings.length > 0 ? (
        <div className="space-y-3">
          {(meetings as Meeting[]).map((m) => (
            <Card key={m.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{m.title}</p>
                  <p className="text-xs text-slate-400">{fmt(m.starts_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="blue">{titleCase(m.type)}</Badge>
                  <Badge>{m.status}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty message="No upcoming meetings scheduled." />
      )}
    </div>
  );
}
