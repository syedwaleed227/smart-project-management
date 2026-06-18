import Link from "next/link";
import { prisma } from "@/lib/db";
import { SectionTitle, StatusBadge, EmptyState } from "@/components/ui";
import { createClient } from "../actions";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { engagements: true, deadlines: true } } },
  });

  return (
    <div className="space-y-6">
      <SectionTitle title="Clients" subtitle="Companies the firm provides services to" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          {clients.length === 0 ? (
            <EmptyState>No clients yet. Add your first client.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-2">Client</th>
                    <th>Industry</th>
                    <th>TRN</th>
                    <th>Risk</th>
                    <th>Engagements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2.5">
                        <Link href={`/engagements?client=${c.id}`} className="font-medium text-brand-600 hover:underline">
                          {c.name}
                        </Link>
                        <div className="text-xs text-slate-400">{c.contactEmail ?? c.jurisdiction}</div>
                      </td>
                      <td>{c.industry ?? "—"}</td>
                      <td className="font-mono text-xs">{c.trn ?? "—"}</td>
                      <td><StatusBadge value={c.riskLevel} /></td>
                      <td>{c._count.engagements}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Add client</h2>
          <form action={createClient} className="space-y-3">
            <div>
              <label className="label">Name *</label>
              <input name="name" required className="input" placeholder="Acme Trading LLC" />
            </div>
            <div>
              <label className="label">Legal name</label>
              <input name="legalName" className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Industry</label>
                <input name="industry" className="input" />
              </div>
              <div>
                <label className="label">Jurisdiction</label>
                <input name="jurisdiction" defaultValue="UAE" className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">TRN</label>
                <input name="trn" className="input" />
              </div>
              <div>
                <label className="label">FY end (MM-DD)</label>
                <input name="fiscalYearEnd" placeholder="12-31" className="input" />
              </div>
            </div>
            <div>
              <label className="label">Contact name</label>
              <input name="contactName" className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Contact email</label>
                <input name="contactEmail" type="email" className="input" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input name="contactPhone" className="input" />
              </div>
            </div>
            <div>
              <label className="label">Risk level</label>
              <select name="riskLevel" className="input">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <button className="btn-primary w-full">Add client</button>
          </form>
        </div>
      </div>
    </div>
  );
}
