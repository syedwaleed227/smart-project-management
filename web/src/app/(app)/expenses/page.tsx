import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { money, date } from "@/lib/format";
import type { Expense } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  await requireUser();
  const supabase = createSupabaseServerClient();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, amount, tax, category, description, status, created_at, project_id")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Expenses you submitted or can review."
        action={
          <Link
            href="/expenses/new"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            + Submit expense
          </Link>
        }
      />

      {expenses && expenses.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(expenses as Expense[]).map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-600">
                    {date(e.created_at)}
                  </td>
                  <td className="px-5 py-3 capitalize text-slate-600">
                    {e.category ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {e.description ?? "—"}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {money(Number(e.amount) + Number(e.tax))}
                  </td>
                  <td className="px-5 py-3">
                    <Badge>{e.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty message="No expenses yet." />
      )}
    </div>
  );
}
