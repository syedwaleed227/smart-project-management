import Link from "next/link";
import { prisma } from "@/lib/db";
import { dashboardMetrics, generateInsights } from "@/lib/insights";
import { Metric, StatusBadge, ProgressBar, SectionTitle } from "@/components/ui";
import { serviceLabel } from "@/lib/domain";
import { fmtDate, daysUntil } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [metrics, insights, upcoming, engagements] = await Promise.all([
    dashboardMetrics(),
    generateInsights(),
    prisma.complianceDeadline.findMany({
      where: { status: { notIn: ["SUBMITTED", "CLOSED"] } },
      include: { client: true },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
    prisma.engagement.findMany({
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
      include: { client: true, manager: true },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-6">
      <SectionTitle title="Dashboard" subtitle="Firm-wide overview of work, deadlines and AI insights" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Active clients" value={metrics.activeClients} />
        <Metric label="Open engagements" value={metrics.openEngagements} />
        <Metric label="Open tasks" value={metrics.openTasks} accent={metrics.overdueTasks ? "text-orange-600" : undefined} />
        <Metric label="Overdue deadlines" value={metrics.overdueDeadlines} accent={metrics.overdueDeadlines ? "text-red-600" : "text-emerald-600"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* AI insights */}
        <div className="card p-5 lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <span>🤖</span>
            <h2 className="font-semibold">AI Insights</h2>
          </div>
          <ul className="space-y-2 text-sm">
            {insights.map((i, idx) => (
              <li key={idx} className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
                {i}
              </li>
            ))}
          </ul>
          <Link href="/assistant" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
            Ask the AI co-pilot →
          </Link>
        </div>

        {/* Upcoming deadlines */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Upcoming statutory deadlines</h2>
            <Link href="/compliance" className="text-sm text-brand-600 hover:underline">
              Calendar →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {upcoming.map((d) => {
              const du = daysUntil(d.dueDate);
              return (
                <div key={d.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm font-medium">{d.title}</div>
                    <div className="text-xs text-slate-500">{d.client.name} · {fmtDate(d.dueDate)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${du !== null && du < 0 ? "text-red-600" : du !== null && du <= 7 ? "text-orange-600" : "text-slate-500"}`}>
                      {du !== null && du < 0 ? `${Math.abs(du)}d overdue` : `${du}d`}
                    </span>
                    <StatusBadge value={d.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active engagements */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Active engagements</h2>
          <Link href="/engagements" className="text-sm text-brand-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Reference</th>
                <th>Client</th>
                <th>Service</th>
                <th>Status</th>
                <th>Due</th>
                <th className="w-40">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {engagements.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="py-2.5">
                    <Link href={`/engagements/${e.id}`} className="font-medium text-brand-600 hover:underline">
                      {e.reference}
                    </Link>
                  </td>
                  <td>{e.client.name}</td>
                  <td>{serviceLabel(e.serviceLine)}</td>
                  <td><StatusBadge value={e.status} /></td>
                  <td>{fmtDate(e.dueDate)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={e.progress} />
                      <span className="text-xs text-slate-500">{e.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
