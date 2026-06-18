import { prisma } from "@/lib/db";
import { SectionTitle, Avatar } from "@/components/ui";
import { titleCase } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const users = await prisma.user.findMany({
    where: { role: { not: "CLIENT" } },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { assignedTasks: true, managedEngagements: true } },
    },
  });

  // workload: open tasks per user
  const open = await prisma.task.groupBy({
    by: ["assigneeId"],
    where: { status: { not: "DONE" } },
    _count: { _all: true },
  });
  const openMap = new Map(open.map((o) => [o.assigneeId, o._count._all]));

  return (
    <div className="space-y-6">
      <SectionTitle title="Team" subtitle="Firm staff and live workload" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <div key={u.id} className="card p-5">
            <div className="flex items-center gap-3">
              <Avatar name={u.name} color={u.avatarColor} />
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-slate-400">{u.title ?? titleCase(u.role)}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-slate-50 py-2">
                <div className="text-lg font-semibold">{openMap.get(u.id) ?? 0}</div>
                <div className="text-[11px] text-slate-400">Open tasks</div>
              </div>
              <div className="rounded-lg bg-slate-50 py-2">
                <div className="text-lg font-semibold">{u._count.managedEngagements}</div>
                <div className="text-[11px] text-slate-400">Manages</div>
              </div>
              <div className="rounded-lg bg-slate-50 py-2">
                <div className="text-lg font-semibold">{u._count.assignedTasks}</div>
                <div className="text-[11px] text-slate-400">Total tasks</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">{u.email}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
