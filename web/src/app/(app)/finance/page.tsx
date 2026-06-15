import { redirect } from "next/navigation";
import { requireUser, isFinance } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, StatCard, Badge, Empty, PageHeader } from "@/components/ui";
import { money, date } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const user = await requireUser();
  if (!isFinance(user)) redirect("/");

  const supabase = createSupabaseServerClient();

  const [{ data: invoices }, { data: expenses }] = await Promise.all([
    supabase.from("invoices").select("type, amount, tax, status, due_date, created_at"),
    supabase.from("expenses").select("amount, tax, status"),
  ]);

  const clientInvoiced = (invoices ?? [])
    .filter((i) => i.type === "client")
    .reduce((s, i) => s + Number(i.amount) + Number(i.tax), 0);
  const receivable = (invoices ?? [])
    .filter((i) => i.type === "client" && !["paid", "cancelled"].includes(i.status))
    .reduce((s, i) => s + Number(i.amount) + Number(i.tax), 0);
  const payable = (invoices ?? [])
    .filter((i) => i.type === "vendor" && !["paid", "cancelled"].includes(i.status))
    .reduce((s, i) => s + Number(i.amount) + Number(i.tax), 0);
  const approvedExpense = (expenses ?? [])
    .filter((e) => ["approved", "paid"].includes(e.status))
    .reduce((s, e) => s + Number(e.amount) + Number(e.tax), 0);

  return (
    <div>
      <PageHeader
        title="Finance"
        subtitle="Receivables, payables and spend at a glance."
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Client invoiced" value={money(clientInvoiced)} />
        <StatCard label="Receivable" value={money(receivable)} hint="Outstanding" />
        <StatCard label="Payable" value={money(payable)} hint="To vendors" />
        <StatCard label="Approved spend" value={money(approvedExpense)} />
      </div>

      <Card title="Invoices">
        {invoices && invoices.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 font-medium">Amount</th>
                <th className="py-2 font-medium">Due</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((i, idx) => (
                <tr key={idx}>
                  <td className="py-2 capitalize text-slate-600">{i.type}</td>
                  <td className="py-2 font-medium text-slate-800">
                    {money(Number(i.amount) + Number(i.tax))}
                  </td>
                  <td className="py-2 text-slate-600">{date(i.due_date)}</td>
                  <td className="py-2">
                    <Badge>{i.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty message="No invoices yet." />
        )}
      </Card>
    </div>
  );
}
