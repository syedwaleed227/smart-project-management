import { requireUser, isManager } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, Badge, Empty, PageHeader } from "@/components/ui";
import { date, money, titleCase } from "@/lib/format";
import { decideApproval } from "./actions";
import type { Approval } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();

  const { data: approvals } = await supabase
    .from("approvals")
    .select("id, entity_type, entity_id, status, current_step, requested_by, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  // Hydrate linked expense amounts for context.
  const expenseIds = (approvals ?? [])
    .filter((a) => a.entity_type === "expense")
    .map((a) => a.entity_id);
  const amounts = new Map<string, number>();
  if (expenseIds.length) {
    const { data: exp } = await supabase
      .from("expenses")
      .select("id, amount, tax")
      .in("id", expenseIds);
    (exp ?? []).forEach((e) =>
      amounts.set(e.id, Number(e.amount) + Number(e.tax)),
    );
  }

  const canDecide = isManager(user);

  return (
    <div>
      <PageHeader
        title="Approval center"
        subtitle="Requests waiting on a decision."
      />

      {approvals && approvals.length > 0 ? (
        <div className="space-y-3">
          {(approvals as Approval[]).map((a) => (
            <Card key={a.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="blue">{titleCase(a.entity_type)}</Badge>
                    <Badge>{a.status}</Badge>
                    <span className="text-xs text-slate-400">
                      Step {a.current_step}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    {a.entity_type === "expense" && amounts.has(a.entity_id)
                      ? `Expense for ${money(amounts.get(a.entity_id))}`
                      : `${titleCase(a.entity_type)} request`}
                  </p>
                  <p className="text-xs text-slate-400">
                    Submitted {date(a.created_at)}
                  </p>
                </div>

                {canDecide ? (
                  <div className="flex items-center gap-2">
                    <form action={decideApproval} className="flex items-center gap-2">
                      <input type="hidden" name="approval_id" value={a.id} />
                      <input
                        name="reason"
                        placeholder="Comment / reason"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                      />
                      <button
                        name="decision"
                        value="approved"
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
                      >
                        Approve
                      </button>
                      <button
                        name="decision"
                        value="rejected"
                        className="rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-600"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">
                    Awaiting an approver
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty message="Nothing pending approval. You're all caught up." />
      )}
    </div>
  );
}
