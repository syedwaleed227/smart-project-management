import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SectionTitle, StatusBadge, PriorityBadge, EmptyState } from "@/components/ui";
import { fmtDate, isOverdue } from "@/lib/format";
import { serviceLabel } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await getCurrentUser();
  const tasks = await prisma.task.findMany({
    where: { assigneeId: user!.id, status: { not: "DONE" } },
    include: { engagement: { include: { client: true } } },
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
  });

  return (
    <div className="space-y-6">
      <SectionTitle title="My Tasks" subtitle={`Work assigned to ${user!.name}`} />
      {tasks.length === 0 ? (
        <EmptyState>🎉 You have no open tasks.</EmptyState>
      ) : (
        <div className="card divide-y divide-slate-100">
          {tasks.map((t) => (
            <Link key={t.id} href={`/engagements/${t.engagementId}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {t.aiGenerated && <span title="AI generated">🤖</span>}
                  <span className="truncate text-sm font-medium">{t.title}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {t.engagement.client.name} · {serviceLabel(t.engagement.serviceLine)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <PriorityBadge value={t.priority} />
                <StatusBadge value={t.status} />
                <span className={`text-xs ${t.dueDate && isOverdue(t.dueDate) ? "font-medium text-red-600" : "text-slate-500"}`}>
                  {fmtDate(t.dueDate)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
