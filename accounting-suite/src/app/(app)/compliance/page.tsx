import { prisma } from "@/lib/db";
import { SectionTitle, StatusBadge, EmptyState } from "@/components/ui";
import { fmtDate, daysUntil } from "@/lib/format";
import { titleCase } from "@/lib/format";
import { DeadlineControl } from "./DeadlineControl";

export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const deadlines = await prisma.complianceDeadline.findMany({
    include: { client: true },
    orderBy: { dueDate: "asc" },
  });

  const open = deadlines.filter((d) => !["SUBMITTED", "CLOSED"].includes(d.status));
  const overdue = open.filter((d) => (daysUntil(d.dueDate) ?? 0) < 0);
  const soon = open.filter((d) => { const x = daysUntil(d.dueDate) ?? 99; return x >= 0 && x <= 7; });

  return (
    <div className="space-y-6">
      <SectionTitle title="Compliance Calendar" subtitle="Statutory VAT, corporate tax, audit and licensing deadlines" />

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-sm text-slate-500">Overdue</div>
          <div className="mt-2 text-3xl font-semibold text-red-600">{overdue.length}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">Due within 7 days</div>
          <div className="mt-2 text-3xl font-semibold text-orange-600">{soon.length}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">Open total</div>
          <div className="mt-2 text-3xl font-semibold">{open.length}</div>
        </div>
      </div>

      <div className="card p-5">
        {deadlines.length === 0 ? (
          <EmptyState>No deadlines tracked.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2">Obligation</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Due</th>
                  <th>Countdown</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deadlines.map((d) => {
                  const du = daysUntil(d.dueDate);
                  const isOpen = !["SUBMITTED", "CLOSED"].includes(d.status);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-medium">{d.title}</td>
                      <td>{d.client.name}</td>
                      <td>{titleCase(d.kind)}</td>
                      <td>{d.periodLabel ?? "—"}</td>
                      <td>{fmtDate(d.dueDate)}</td>
                      <td>
                        {isOpen ? (
                          <span className={du !== null && du < 0 ? "font-medium text-red-600" : du !== null && du <= 7 ? "font-medium text-orange-600" : "text-slate-500"}>
                            {du !== null && du < 0 ? `${Math.abs(du)}d overdue` : `${du}d`}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td><StatusBadge value={d.status} /></td>
                      <td><DeadlineControl id={d.id} current={d.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
